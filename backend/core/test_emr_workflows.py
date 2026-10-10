import uuid
from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .models import DemoEMRAssessment, DemoEMRNote, DemoEMRPatient, DemoEMRTask, DemoEMRVisit, User


class DemoEMRWorkflowTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.staff = User.objects.create_user(email="workflow.nurse@example.test", role="STAFF", first_name="Sample", last_name="Nurse")
        cls.admin = User.objects.create_user(email="workflow.admin@example.test", role="ADMIN", first_name="Sample", last_name="Admin")
        cls.patient_user = User.objects.create_user(email="workflow.patient@example.test", role="PATIENT", is_staff=True)
        cls.patient = DemoEMRPatient.objects.get(chart_number="EMR-001")
        cls.other = DemoEMRPatient.objects.get(chart_number="EMR-002")

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.staff)
        self.base = "/api/staff/demo-emr/"

    def post(self, path, data):
        return self.client.post(self.base + path, data, format="json")

    def patient_data(self, **changes):
        return {"client_id": str(uuid.uuid4()), "full_name": "Fictional Morgan", "date_of_birth": "1960-02-14", "primary_condition": "Sample home health support", "allergies": [], "medications": [], "care_plan": ["Record vital signs"], "history": "Fictional chart.", **changes}

    def visit_data(self, **changes):
        return {"client_id": str(uuid.uuid4()), "patient": self.patient.id, "purpose": "Sample visit", "scheduled_start": timezone.now().isoformat(), "assigned_to": self.staff.id, **changes}

    def task_data(self, **changes):
        return {"client_id": str(uuid.uuid4()), "patient": self.patient.id, "title": "Sample task", "assigned_to": self.staff.id, **changes}

    def assessment_data(self, **changes):
        return {"client_id": str(uuid.uuid4()), "observed_at": timezone.now().isoformat(), "findings": {"mobility": "Needs assistance", "pain": 0}, "notes": "Sample observation.", **changes}

    def patch(self, path, data):
        return self.client.patch(self.base + path, data, format="json")

    def status(self, kind, record, status):
        return self.patch(f"{kind}/{record['id']}/", {"status": status, "revision": record["revision"]})

    def remove_patient(self):
        return self.patch(f"patients/{self.patient.id}/status/", {"is_active": False, "revision": self.patient.revision})

    def test_new_routes_require_staff_or_admin_role(self):
        for person in (None, self.patient_user):
            self.client.force_authenticate(person)
            for path in ("dashboard/", "patients/?include_removed=true"):
                self.assertIn(self.client.get(self.base + path).status_code, (401, 403))
            for path, payload in (("patients/", self.patient_data()), ("visits/", self.visit_data()), ("tasks/", self.task_data()), (f"patients/{self.patient.id}/assessments/", self.assessment_data())):
                self.assertIn(self.post(path, payload).status_code, (401, 403))
            self.assertIn(self.remove_patient().status_code, (401, 403))
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.post("patients/", self.patient_data()).status_code, 201)
        self.assertEqual(self.client.get(self.base + "dashboard/").status_code, 200)

    def test_add_patient_assigns_chart_number_without_creating_account(self):
        accounts = User.objects.count()
        result = self.post("patients/", self.patient_data(chart_number="Forged", is_active=False, revision=99))
        self.assertEqual(result.status_code, 201, result.data)
        self.assertTrue(result.data["chart_number"].startswith("EMR-"))
        self.assertNotEqual(result.data["chart_number"], "Forged")
        self.assertTrue(result.data["is_active"])
        self.assertEqual(result.data["revision"], 1)
        self.assertEqual(User.objects.count(), accounts)
        self.assertEqual(self.client.get(self.base + f"patients/{result.data['id']}/").data["notes"], [])

    def test_patient_creation_is_idempotent_and_validated(self):
        payload = self.patient_data(care_plan=["Record vital signs", "Record vital signs"])
        first = self.post("patients/", payload)
        second = self.post("patients/", payload)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.data["id"], second.data["id"])
        self.assertEqual(first.data["care_plan"], ["Record vital signs"])
        self.assertEqual(self.post("patients/", {**payload, "full_name": "Changed"}).status_code, 409)
        for data in (self.patient_data(full_name=" "), self.patient_data(date_of_birth=(timezone.localdate() + timedelta(days=1)).isoformat()), self.patient_data(date_of_birth="invalid"), self.patient_data(care_plan=["x"] * 21)):
            self.assertEqual(self.post("patients/", data).status_code, 400)

    def test_remove_keeps_chart_history_and_restore_returns_work(self):
        before = self.client.get(self.base + "dashboard/").data
        note_count = DemoEMRNote.objects.filter(patient=self.patient).count()
        result = self.remove_patient()
        self.assertEqual(result.status_code, 200)
        self.assertFalse(result.data["is_active"])
        self.assertEqual(result.data["removed_by_name"], "Sample Nurse")
        self.assertIsNotNone(result.data["removed_at"])
        self.assertNotIn(self.patient.id, [row["id"] for row in self.client.get(self.base + "patients/").data])
        self.assertIn(self.patient.id, [row["id"] for row in self.client.get(self.base + "patients/?include_removed=true").data])
        chart = self.client.get(self.base + f"patients/{self.patient.id}/").data
        self.assertEqual(len(chart["notes"]), note_count)
        self.assertTrue(chart["assessments"])
        hidden = self.client.get(self.base + "dashboard/").data
        self.assertFalse(any(row["patient"] == self.patient.id for row in hidden["visits"] + hidden["tasks"]))
        restored = self.patch(f"patients/{self.patient.id}/status/", {"is_active": True, "revision": result.data["revision"]})
        self.assertEqual(restored.status_code, 200)
        self.assertIsNone(restored.data["removed_at"])
        after = self.client.get(self.base + "dashboard/").data
        self.assertEqual(len(after["visits"]), len(before["visits"]))
        self.assertEqual(len(after["tasks"]), len(before["tasks"]))

    def test_stale_remove_is_rejected_and_no_permanent_delete_exists(self):
        self.assertEqual(self.remove_patient().status_code, 200)
        self.assertEqual(self.remove_patient().status_code, 409)
        self.assertEqual(self.client.delete(self.base + f"patients/{self.patient.id}/").status_code, 405)
        self.assertTrue(DemoEMRPatient.objects.filter(pk=self.patient.id).exists())

    def test_removed_patient_cannot_receive_entries_or_work_updates(self):
        visit = self.post("visits/", self.visit_data()).data
        task = self.post("tasks/", self.task_data()).data
        draft = self.post(f"patients/{self.patient.id}/notes/", {"client_id": str(uuid.uuid4()), "visit_at": timezone.now().isoformat()}).data
        self.remove_patient()
        self.assertEqual(self.post(f"patients/{self.patient.id}/assessments/", self.assessment_data()).status_code, 409)
        self.assertEqual(self.post(f"patients/{self.patient.id}/notes/", {"client_id": str(uuid.uuid4()), "visit_at": timezone.now().isoformat()}).status_code, 409)
        self.assertEqual(self.patch(f"notes/{draft['id']}/", {**draft, "assessment": "Changed"}).status_code, 409)
        self.assertEqual(self.post("visits/", self.visit_data()).status_code, 400)
        self.assertEqual(self.post("tasks/", self.task_data()).status_code, 400)
        self.assertEqual(self.status("visits", visit, "IN_PROGRESS").status_code, 409)
        self.assertEqual(self.status("tasks", task, "DONE").status_code, 409)

    def test_assessment_records_author_time_and_zero_pain(self):
        path = f"patients/{self.patient.id}/assessments/"
        payload = self.assessment_data(author_name="Forged")
        first = self.post(path, payload)
        self.assertEqual(first.status_code, 201, first.data)
        self.assertEqual(first.data["author_name"], "Sample Nurse")
        self.assertEqual(first.data["findings"]["pain"], 0)
        second = self.post(path, payload)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(second.data["id"], first.data["id"])
        chart = self.client.get(self.base + f"patients/{self.patient.id}/").data
        self.assertIn(first.data["id"], [row["id"] for row in chart["assessments"]])
        self.assertEqual(self.client.patch(self.base + path, first.data, format="json").status_code, 405)

    def test_invalid_assessments_do_not_create_records(self):
        path = f"patients/{self.patient.id}/assessments/"
        count = DemoEMRAssessment.objects.count()
        for findings in ({"pain": True}, {"pain": -1}, {"pain": 11}, {"pain": "zero"}, {"mobility": "Unknown"}, {"unknown": "yes"}, []):
            self.assertEqual(self.post(path, self.assessment_data(findings=findings)).status_code, 400)
        self.assertEqual(self.post(path, self.assessment_data(findings={}, notes=" ")).status_code, 400)
        self.assertEqual(DemoEMRAssessment.objects.count(), count)
        self.assertEqual(self.post(path, self.assessment_data(findings={}, notes="Narrative observation.")).status_code, 201)

    def test_dashboard_has_seeded_examples_and_only_staff_names(self):
        response = self.client.get(self.base + "dashboard/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Cache-Control"], "private, no-store")
        self.assertTrue(response.data["visits"])
        self.assertTrue(response.data["tasks"])
        self.assertTrue(all(set(row) == {"id", "name"} for row in response.data["staff"]))
        self.assertNotIn(self.patient_user.id, [row["id"] for row in response.data["staff"]])

    def test_visit_and_task_creates_are_idempotent_and_cannot_spoof_status(self):
        for path, payload in (("visits/", self.visit_data(status="COMPLETED", created_by_name="Forged", assigned_name="Forged")), ("tasks/", self.task_data(status="DONE", completed_by_name="Forged", created_by_name="Forged"))):
            first = self.post(path, payload)
            self.assertEqual(first.status_code, 201, first.data)
            self.assertEqual(first.data["status"], "SCHEDULED" if path == "visits/" else "OPEN")
            self.assertEqual(first.data["assigned_name"], "Sample Nurse")
            self.assertEqual(first.data["created_by_name"], "Sample Nurse")
            self.assertEqual(self.post(path, payload).data["id"], first.data["id"])
            changed = {**payload, "purpose" if path == "visits/" else "title": "Changed"}
            self.assertEqual(self.post(path, changed).status_code, 409)

    def test_assignments_and_task_links_are_validated(self):
        for path, data in (("visits/", self.visit_data(assigned_to=self.patient_user.id)), ("tasks/", self.task_data(assigned_to=self.patient_user.id)), ("visits/", self.visit_data(purpose=" ")), ("tasks/", self.task_data(title=" ")), ("visits/", self.visit_data(scheduled_start="invalid")), ("tasks/", self.task_data(priority="URGENT"))):
            self.assertEqual(self.post(path, data).status_code, 400)
        visit = self.post("visits/", self.visit_data()).data
        self.assertEqual(self.post("tasks/", self.task_data(visit=visit["id"], patient=self.other.id)).status_code, 400)
        cancelled = self.status("visits", visit, "CANCELLED").data
        self.assertEqual(self.post("tasks/", self.task_data(visit=cancelled["id"])).status_code, 400)

    def test_visit_workflow_requires_open_tasks_to_be_completed(self):
        visit = self.post("visits/", self.visit_data()).data
        task = self.post("tasks/", self.task_data(visit=visit["id"])).data
        self.assertEqual(self.status("visits", visit, "COMPLETED").status_code, 409)
        started = self.status("visits", visit, "IN_PROGRESS").data
        self.assertEqual(self.status("visits", started, "COMPLETED").status_code, 409)
        done = self.status("tasks", task, "DONE").data
        self.assertEqual(done["completed_by_name"], "Sample Nurse")
        self.assertIsNotNone(done["completed_at"])
        finished = self.status("visits", started, "COMPLETED")
        self.assertEqual(finished.status_code, 200)
        self.assertIsNotNone(finished.data["completed_at"])
        self.assertEqual(self.status("tasks", done, "OPEN").status_code, 409)
        reopened = self.status("visits", finished.data, "IN_PROGRESS")
        self.assertEqual(reopened.status_code, 200)
        self.assertEqual(self.status("tasks", done, "OPEN").status_code, 200)

    def test_work_status_uses_revisions_and_can_be_reopened(self):
        visit = self.post("visits/", self.visit_data()).data
        cancelled = self.status("visits", visit, "CANCELLED").data
        self.assertEqual(self.status("visits", visit, "IN_PROGRESS").status_code, 409)
        self.assertEqual(self.status("visits", cancelled, "SCHEDULED").status_code, 200)
        task = self.post("tasks/", self.task_data()).data
        done = self.status("tasks", task, "DONE").data
        self.assertEqual(self.status("tasks", task, "OPEN").status_code, 409)
        opened = self.status("tasks", done, "OPEN").data
        self.assertIsNone(opened["completed_at"])
        self.assertEqual(opened["completed_by_name"], "")
        self.assertEqual(self.patch(f"tasks/{task['id']}/", {"status": "DONE"}).status_code, 400)

    def test_patient_and_work_status_changes_reject_unknown_records(self):
        self.assertEqual(self.patch("patients/999999/status/", {"is_active": False, "revision": 1}).status_code, 404)
        self.assertEqual(self.patch("visits/999999/", {"status": "COMPLETED", "revision": 1}).status_code, 404)
        self.assertEqual(self.patch("tasks/999999/", {"status": "DONE", "revision": 1}).status_code, 404)
