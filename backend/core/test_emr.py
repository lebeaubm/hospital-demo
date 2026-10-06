import uuid

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .models import DemoEMRNote, DemoEMRPatient, User


class DemoEMRTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.staff = User.objects.create_user(email="emr.staff@example.test", role="STAFF", first_name="Nurse", last_name="Example")
        cls.other = User.objects.create_user(email="emr.other@example.test", role="STAFF", first_name="Other")
        cls.admin = User.objects.create_user(email="emr.admin@example.test", role="ADMIN", first_name="Admin")
        cls.patient_user = User.objects.create_user(email="emr.patient@example.test", role="PATIENT")
        cls.patient = DemoEMRPatient.objects.get(chart_number="EMR-001")
        cls.second = DemoEMRPatient.objects.get(chart_number="EMR-002")

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.staff)
        self.url = f"/api/staff/demo-emr/patients/{self.patient.id}/notes/"

    def payload(self, **changes):
        return {"client_id": str(uuid.uuid4()), "visit_at": timezone.now().isoformat(), "assessment": "Sample assessment.", "interventions": "Sample care provided.", "response": "Sample response.", "plan": "Sample next steps.", "vitals": {"pulse": 72, "pain": 0}, "completed_tasks": self.patient.care_plan[:1], "status": "DRAFT", **changes}

    def create(self, **changes):
        response = self.client.post(self.url, self.payload(**changes), format="json")
        self.assertEqual(response.status_code, 201, response.data)
        return response.data

    def test_only_staff_and_admin_can_access(self):
        for account in (None, self.patient_user):
            self.client.force_authenticate(account)
            response = self.client.get("/api/staff/demo-emr/patients/")
            self.assertIn(response.status_code, (401, 403))
            self.assertIn(self.client.post(self.url, self.payload(), format="json").status_code, (401, 403))
        for account in (self.staff, self.admin):
            self.client.force_authenticate(account)
            self.assertEqual(self.client.get("/api/staff/demo-emr/patients/").status_code, 200)

    def test_patient_staff_flag_does_not_grant_role_access(self):
        self.patient_user.is_staff = True
        self.patient_user.save()
        self.client.force_authenticate(self.patient_user)
        self.assertEqual(self.client.get("/api/staff/demo-emr/patients/").status_code, 403)

    def test_seeded_patients_are_separate_and_have_chart_history(self):
        response = self.client.get("/api/staff/demo-emr/patients/")
        self.assertEqual({row["chart_number"] for row in response.data}, {"EMR-001", "EMR-002", "EMR-003"})
        self.assertNotIn("email", response.data[0])
        chart = self.client.get(f"/api/staff/demo-emr/patients/{self.patient.id}/")
        self.assertEqual(chart.data["notes"][0]["status"], "FINAL")
        self.assertEqual(chart["Cache-Control"], "private, no-store")

    def test_draft_is_persisted_with_author_and_zero_pain(self):
        note = self.create()
        saved = DemoEMRNote.objects.get(pk=note["id"])
        self.assertEqual(saved.author, self.staff)
        self.assertEqual(saved.author_name, "Nurse Example")
        self.assertEqual(saved.vitals["pain"], 0)
        self.assertIsNone(saved.finalized_at)
        chart = self.client.get(f"/api/staff/demo-emr/patients/{self.patient.id}/")
        self.assertIn(note["id"], [row["id"] for row in chart.data["notes"]])

    def test_retrying_same_create_does_not_duplicate_note(self):
        data = self.payload()
        first = self.client.post(self.url, data, format="json")
        second = self.client.post(self.url, data, format="json")
        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.data["id"], second.data["id"])
        self.assertEqual(DemoEMRNote.objects.filter(client_id=data["client_id"]).count(), 1)
        changed = self.client.post(self.url, {**data, "assessment": "Different"}, format="json")
        self.assertEqual(changed.status_code, 409)

    def test_create_requires_note_reference_and_cannot_spoof_author(self):
        data = self.payload()
        del data["client_id"]
        self.assertEqual(self.client.post(self.url, data, format="json").status_code, 400)
        note = self.create(author=self.other.id, author_name="Forged", finalized_by_name="Forged")
        self.assertEqual(note["author"], self.staff.id)
        self.assertEqual(note["author_name"], "Nurse Example")
        self.assertEqual(note["finalized_by_name"], "")

    def test_draft_can_be_edited_and_revision_changes(self):
        note = self.create()
        response = self.client.patch(f"/api/staff/demo-emr/notes/{note['id']}/", {**note, "assessment": "Updated"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["revision"], 2)
        self.assertEqual(response.data["assessment"], "Updated")

    def test_stale_or_missing_revision_does_not_overwrite(self):
        note = self.create()
        endpoint = f"/api/staff/demo-emr/notes/{note['id']}/"
        self.assertEqual(self.client.patch(endpoint, {**note, "plan": "New plan"}, format="json").status_code, 200)
        self.assertEqual(self.client.patch(endpoint, {**note, "plan": "Stale plan"}, format="json").status_code, 409)
        saved = DemoEMRNote.objects.get(pk=note["id"])
        self.assertEqual(saved.plan, "New plan")
        del note["revision"]
        self.assertEqual(self.client.patch(endpoint, note, format="json").status_code, 409)

    def test_other_staff_cannot_edit_draft_but_admin_can(self):
        note = self.create()
        endpoint = f"/api/staff/demo-emr/notes/{note['id']}/"
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.patch(endpoint, note, format="json").status_code, 403)
        self.client.force_authenticate(self.admin)
        result = self.client.patch(endpoint, {**note, "status": "FINAL"}, format="json")
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.data["finalized_by"], self.admin.id)
        self.assertEqual(result.data["author"], self.staff.id)

    def test_finalized_note_is_locked_and_keeps_timestamps(self):
        note = self.create(status="FINAL")
        saved = DemoEMRNote.objects.get(pk=note["id"])
        self.assertIsNotNone(saved.finalized_at)
        endpoint = f"/api/staff/demo-emr/notes/{note['id']}/"
        for account in (self.staff, self.admin):
            self.client.force_authenticate(account)
            self.assertEqual(self.client.patch(endpoint, {**note, "status": "DRAFT", "assessment": "Overwrite"}, format="json").status_code, 409)
        saved.refresh_from_db()
        self.assertEqual(saved.assessment, "Sample assessment.")
        self.assertEqual(saved.revision, 1)

    def test_finalization_requires_assessment(self):
        self.assertEqual(self.client.post(self.url, self.payload(assessment="  ", status="FINAL"), format="json").status_code, 400)
        note = self.create(assessment="")
        self.assertEqual(self.client.patch(f"/api/staff/demo-emr/notes/{note['id']}/", {**note, "status": "FINAL"}, format="json").status_code, 400)

    def test_amendment_preserves_original_note(self):
        original = self.create(status="FINAL")
        amendment = self.create(amendment_of=original["id"], assessment="Additional observation.", status="FINAL")
        self.assertEqual(amendment["amendment_of"], original["id"])
        self.assertEqual(DemoEMRNote.objects.get(pk=original["id"]).assessment, "Sample assessment.")

    def test_amendment_must_reference_final_note_on_same_chart(self):
        draft = self.create()
        self.assertEqual(self.client.post(self.url, self.payload(amendment_of=draft["id"]), format="json").status_code, 404)
        final = self.create(status="FINAL")
        other_url = f"/api/staff/demo-emr/patients/{self.second.id}/notes/"
        self.assertEqual(self.client.post(other_url, self.payload(amendment_of=final["id"], completed_tasks=[]), format="json").status_code, 404)

    def test_invalid_vitals_and_tasks_are_rejected(self):
        for vitals in ({"pulse": True}, {"pulse": "fast"}, {"oxygen": 101}, {"unknown": 12}, [72], {"temperature": -1}):
            self.assertEqual(self.client.post(self.url, self.payload(vitals=vitals), format="json").status_code, 400)
        for tasks in (["Unknown task"], [self.patient.care_plan[0]] * 2):
            self.assertEqual(self.client.post(self.url, self.payload(completed_tasks=tasks), format="json").status_code, 400)

    def test_unknown_patient_and_note_return_not_found(self):
        self.assertEqual(self.client.get("/api/staff/demo-emr/patients/999999/").status_code, 404)
        self.assertEqual(self.client.patch("/api/staff/demo-emr/notes/999999/", self.payload(), format="json").status_code, 404)

    def test_draft_reference_and_amendment_parent_cannot_change(self):
        final = self.create(status="FINAL")
        draft = self.create(amendment_of=final["id"])
        endpoint = f"/api/staff/demo-emr/notes/{draft['id']}/"
        self.assertEqual(self.client.patch(endpoint, {**draft, "amendment_of": None}, format="json").status_code, 400)
        self.assertEqual(self.client.patch(endpoint, {**draft, "client_id": str(uuid.uuid4())}, format="json").status_code, 400)
