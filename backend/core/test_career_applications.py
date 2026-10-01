import copy
import json
import tempfile

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import JobApplication
from .serializers import DEMO_APPLICATION_LOCKED_FIELDS, DEMO_APPLICATION_MASK
from .views import admin_application_queryset


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"],
    CACHES={"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}},
)
class CareerApplicationTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    @staticmethod
    def application_answers():
        answers = {
            "personal": {
                "full_name": "Demo Applicant", "address": "123 Example Street", "city": "Corona",
                "state": "CA", "phone_number": "555-0100", "email": "applicant@example.com",
                "position": "Registered Nurse", "date_available": "2026-10-15", "desired_pay": "",
                "pay_type": "Hour", "employment_desired": "Full Time",
            },
            "availability": {
                "days": {day: {"available": False, "start": "", "end": ""} for day in (
                    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
                )},
                "days_preference": False, "nights_preference": False,
            },
            "employment_eligibility": {
                "legally_eligible": "Yes", "previously_employed": "No", "previous_start_date": "",
                "previous_end_date": "", "driver_license": "",
            },
            "education": {
                "high_school": {"name": "", "city_state": "", "from": "", "to": "", "graduated": "", "diploma": ""},
                "college": {"name": "", "city_state": "", "from": "", "to": "", "graduated": "", "diploma": ""},
                "other_education_1": {"name": "", "city_state": "", "from": "", "to": "", "degree": ""},
                "other_education_2": {"name": "", "city_state": "", "from": "", "to": "", "degree": ""},
            },
            "employers": [{"name": "", "address": "", "email": "", "secondary_email": "", "phone": "", "job_title": "",
                           "responsibilities": "", "from": "", "to": "", "reason_for_leaving": ""} for _ in range(3)],
            "references": [{"name": "", "company": "", "email": "", "relationship": "", "title": "", "phone": ""} for _ in range(3)],
            "additional": {"additional_information": "Demo application", "background_check_consent": "", "drug_test_consent": ""},
            "certification": {"signature": "Demo Applicant", "printed_name": "Demo Applicant", "date": "2026-09-30", "accepted": True},
        }
        answers["demo"] = True
        answers["military"] = {}
        for section, fields in DEMO_APPLICATION_LOCKED_FIELDS.items():
            sections = answers[section] if section == "employers" else [answers[section]]
            for target in sections:
                target.update({field: DEMO_APPLICATION_MASK for field in fields})
        answers["additional"]["race_categories"] = [DEMO_APPLICATION_MASK]
        return answers

    def submit(self, answers=None, resume=None):
        answers = answers or self.application_answers()
        payload = {key: answers["personal"][key] for key in ("full_name", "email", "phone_number", "position")}
        payload["application_data"] = answers
        if resume:
            payload["application_data"] = json.dumps(answers)
            payload["resume"] = resume
            return self.client.post("/api/careers/applications/", payload, format="multipart")
        return self.client.post("/api/careers/applications/", payload, format="json")

    def admin_user(self):
        User = get_user_model()
        return User.objects.create_user(email="admin@example.com", password="TestPass123!", role=User.Role.ADMIN)

    def test_demo_submission_persists_only_fixed_sensitive_placeholders(self):
        answers = self.application_answers()
        response = self.submit(answers)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(set(response.data), {"message"})
        application = JobApplication.objects.get()
        self.assertEqual(application.application_data, answers)
        self.assertEqual(application.ssn_encrypted, "")
        self.assertIsNone(application.resume_content)
        self.assertIsNotNone(application.submitted_at)
        self.assertEqual(application.cover_letter, "Demo application")
        for field in ("ssn", "date_of_birth"):
            self.assertEqual(application.application_data["personal"][field], DEMO_APPLICATION_MASK)
        self.assertTrue(application.application_data["demo"])
        self.assertEqual(application.application_data["additional"]["race_categories"], [DEMO_APPLICATION_MASK])

    def test_missing_locked_answers_are_canonicalized_to_fixed_placeholders(self):
        answers = self.application_answers()
        del answers["demo"]
        del answers["military"]
        for section, fields in DEMO_APPLICATION_LOCKED_FIELDS.items():
            if section == "military":
                continue
            sections = answers[section] if section == "employers" else [answers[section]]
            for target in sections:
                for field in fields:
                    target.pop(field)
        del answers["additional"]["race_categories"]
        self.assertEqual(self.submit(answers).status_code, 201)
        application = JobApplication.objects.get()
        self.assertEqual(application.application_data, self.application_answers())
        self.assertEqual(application.ssn_encrypted, "")

    def test_entirely_blank_editable_form_can_be_submitted_with_unchecked_certification(self):
        answers = self.application_answers()
        for section in ("personal", "employment_eligibility", "additional"):
            locked = DEMO_APPLICATION_LOCKED_FIELDS[section] | {"race_categories"}
            for field in answers[section]:
                if field not in locked:
                    answers[section][field] = ""
        for school in answers["education"].values():
            school.update({field: "" for field in school})
        for section in ("employers", "references"):
            locked = DEMO_APPLICATION_LOCKED_FIELDS.get(section, set())
            for entry in answers[section]:
                entry.update({field: "" for field in entry if field not in locked})
        answers["certification"] = {"signature": "", "printed_name": "", "date": "", "accepted": False}
        response = self.submit(answers)
        self.assertEqual(response.status_code, 201)
        application = JobApplication.objects.get()
        self.assertEqual(application.application_data, answers)
        for field in ("full_name", "email", "phone_number", "position", "cover_letter", "ssn_encrypted"):
            self.assertEqual(getattr(application, field), "")
        self.assertFalse(application.application_data["certification"]["accepted"])

    def test_minimal_structured_payload_without_top_level_contacts_can_be_submitted(self):
        answers = {
            "personal": {},
            "availability": self.application_answers()["availability"],
            "employment_eligibility": {},
            "education": {},
            "employers": [{}, {}, {}],
            "references": [{}, {}, {}],
            "additional": {},
            "certification": {},
        }
        response = self.client.post("/api/careers/applications/", {"application_data": answers}, format="json")
        self.assertEqual(response.status_code, 201)
        application = JobApplication.objects.get()
        self.assertEqual(application.full_name, "")
        self.assertEqual(application.email, "")
        self.assertTrue(application.application_data["demo"])
        self.assertEqual(application.application_data["personal"]["ssn"], DEMO_APPLICATION_MASK)
        self.assertFalse(application.application_data["certification"]["accepted"])

    def test_stale_bearer_token_does_not_block_anonymous_submission(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer expired-demo-token")
        self.assertEqual(self.submit().status_code, 201)
        self.assertEqual(JobApplication.objects.count(), 1)

    def test_optional_history_education_and_references_can_be_blank(self):
        answers = self.application_answers()
        answers["education"] = {}
        answers["employers"] = [{}, {}, {}]
        answers["references"] = [{}, {}, {}]
        self.assertEqual(self.submit(answers).status_code, 201)

    def test_real_sensitive_values_or_unsupported_nested_fields_are_rejected(self):
        cases = [
            ("personal", "ssn", "000-00-0000"),
            ("personal", "date_of_birth", "2000-01-01"),
            ("employment_eligibility", "felony_conviction", "No"),
            ("employment_eligibility", "driver_license_number", "DEMO"),
            ("additional", "disability", "Prefer not to answer"),
            ("additional", "hispanic_latino", "No"),
            ("additional", "race_categories", ["Demo"]),
            ("employers", "starting_pay", "1"),
            ("references", "ssn", "000-00-0000"),
            ("education", "date_of_birth", "2000-01-01"),
            ("root", "military", {"veteran": "Yes"}),
        ]
        for section, field, value in cases:
            with self.subTest(section=section, field=field):
                cache.clear()
                answers = self.application_answers()
                target = answers if section == "root" else answers[section]
                if isinstance(target, list):
                    target = target[0]
                if section == "education":
                    target = target["college"]
                target[field] = value
                self.assertEqual(self.submit(answers).status_code, 400)
        self.assertEqual(JobApplication.objects.count(), 0)

    def test_supplied_answers_types_choices_dates_and_nested_shapes_are_validated(self):
        changes = [
            ("personal", "address", []),
            ("personal", "employment_desired", "Contract"),
            ("personal", "date_available", "2026-02-30"),
            ("personal", "desired_pay", "-1"),
            ("employment_eligibility", "legally_eligible", "Maybe"),
            ("certification", "accepted", "true"),
            ("certification", "signature", []),
            ("certification", "date", "2026-09-31"),
            ("availability", "days_preference", "false"),
            ("root", "employers", [None, {}, {}]),
            ("root", "references", [{}, {}]),
            ("root", "education", []),
            ("root", "demo", False),
            ("root", "demo", "true"),
            ("additional", "background_check_consent", "Maybe"),
        ]
        for section, field, value in changes:
            with self.subTest(section=section, field=field):
                cache.clear()
                answers = self.application_answers()
                target = answers if section == "root" else answers[section]
                target[field] = value
                self.assertEqual(self.submit(answers).status_code, 400)
        self.assertEqual(JobApplication.objects.count(), 0)

    def test_optional_nonblank_history_fields_still_require_valid_values(self):
        for change in ("email", "date_range", "time"):
            with self.subTest(change=change):
                answers = self.application_answers()
                if change == "email":
                    answers["references"][0]["email"] = "invalid"
                elif change == "date_range":
                    answers["employers"][0].update({"from": "2026-10-15", "to": "2026-09-30"})
                else:
                    answers["availability"]["days"]["Monday"].update({"available": True, "start": "29:00"})
                self.assertEqual(self.submit(answers).status_code, 400)

    def test_employer_secondary_email_is_validated_and_preserved_for_admin_review(self):
        answers = self.application_answers()
        answers["employers"][1].update({"email": "primary@example.com", "secondary_email": "secondary@example.com", "phone": "555-0100"})
        self.assertEqual(self.submit(answers).status_code, 201)
        application = JobApplication.objects.get()
        self.assertEqual(application.application_data["employers"][1]["secondary_email"], "secondary@example.com")
        self.assertEqual(application.application_data["employers"][0]["secondary_email"], "")
        self.client.force_authenticate(user=self.admin_user())
        response = self.client.get(f"/api/admin/applications/{application.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["application_data"]["employers"][1]["secondary_email"], "secondary@example.com")
        self.assertEqual(response.data["application_data"]["employers"][1]["phone"], "555-0100")
        self.client.force_authenticate(user=None)
        for value in ("invalid", "x" * 250 + "@example.com", []):
            with self.subTest(value_type=type(value).__name__, length=len(value)):
                cache.clear()
                invalid_answers = self.application_answers()
                invalid_answers["employers"][1]["secondary_email"] = value
                self.assertEqual(self.submit(invalid_answers).status_code, 400)
        self.assertEqual(JobApplication.objects.count(), 1)

    def test_resume_content_persists_and_only_admin_can_download_it(self):
        content = b"%PDF-1.7\nDemo resume\n"
        resume = SimpleUploadedFile("resume.pdf", content, content_type="application/pdf")
        self.assertEqual(self.submit(resume=resume).status_code, 201)
        application = JobApplication.objects.get()
        self.assertEqual(bytes(application.resume_content), content)
        self.assertEqual(application.resume_original_filename, "resume.pdf")
        self.assertFalse(application.resume)
        url = f"/api/admin/applications/{application.id}/resume/"
        self.assertEqual(self.client.get(url).status_code, 401)
        self.client.force_authenticate(user=self.admin_user())
        response = self.client.get(url + "?download=1")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, content)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertIn("attachment", response["Content-Disposition"])
        self.assertIn("no-store", response["Cache-Control"])

    def test_invalid_resume_type_content_and_size_are_rejected(self):
        cases = [
            ("resume.txt", b"not an accepted type"),
            ("resume.pdf", b"not a PDF"),
            ("resume.pdf", b"%PDF-" + b"x" * (10 * 1024 * 1024)),
        ]
        for filename, content in cases:
            with self.subTest(filename=filename, size=len(content)):
                resume = SimpleUploadedFile(filename, content)
                self.assertEqual(self.submit(resume=resume).status_code, 400)
        self.assertEqual(JobApplication.objects.count(), 0)

    def test_patient_and_staff_cannot_review_update_or_download_applications(self):
        application = JobApplication.objects.create(full_name="Demo Applicant", email="applicant@example.com", position="Nurse")
        User = get_user_model()
        for role in (User.Role.PATIENT, User.Role.STAFF):
            with self.subTest(role=role):
                user = User.objects.create_user(email=f"career-{role.lower()}@example.com", password="TestPass123!", role=role)
                self.client.force_authenticate(user=user)
                for url in ("/api/admin/applications/", f"/api/admin/applications/{application.id}/", f"/api/admin/applications/{application.id}/resume/"):
                    response = self.client.get(url)
                    self.assertEqual(response.status_code, 403)
                    self.assertIn("no-store", response["Cache-Control"])
                self.assertEqual(self.client.patch(f"/api/admin/applications/{application.id}/", {"status": "HIRED"}, format="json").status_code, 403)
        application.refresh_from_db()
        self.assertEqual(application.status, "NEW")

    def test_admin_metadata_does_not_fetch_blobs_or_expose_legacy_sensitive_answers(self):
        answers = self.application_answers()
        legacy_answers = copy.deepcopy(answers)
        legacy_answers["personal"].update({"ssn": "000-00-0000", "date_of_birth": "2000-01-01"})
        legacy_answers["employment_eligibility"].update({"driver_license_number": "DEMO", "felony_conviction": "No"})
        legacy_answers["additional"].update({"race_categories": ["Demo"], "disability": "Demo"})
        legacy_answers["employers"][0]["starting_pay"] = "1"
        legacy_answers["military"] = {"veteran": "Yes"}
        content = b"%PDF-1.7\nDemo resume\n"
        application = JobApplication.objects.create(
            full_name="Demo Applicant", email="applicant@example.com", position="Nurse",
            application_data=legacy_answers, ssn_encrypted="opaque-legacy-encrypted-value",
            resume_content=content, resume_original_filename="resume.pdf",
        )
        JobApplication.objects.create(full_name="No Resume", email="other@example.com", position="Nurse")
        metadata = admin_application_queryset().get(id=application.id)
        self.assertTrue({"resume_content", "ssn_encrypted"}.issubset(metadata.get_deferred_fields()))
        self.assertTrue(metadata.has_resume_file)
        self.client.force_authenticate(user=self.admin_user())
        with self.assertNumQueries(2):
            listing = self.client.get("/api/admin/applications/")
        self.assertEqual(listing.status_code, 200)
        self.assertEqual(listing.data["count"], 2)
        self.assertEqual({row["id"]: row["has_resume"] for row in listing.data["results"]}, {application.id: True, application.id + 1: False})
        self.assertIn("no-store", listing["Cache-Control"])
        with self.assertNumQueries(1):
            detail = self.client.get(f"/api/admin/applications/{application.id}/")
        self.assertEqual(detail.status_code, 200)
        self.assertNotIn("ssn", detail.data)
        self.assertEqual(detail.data["application_data"], answers)
        self.assertIn("no-store", detail["Cache-Control"])
        response = self.client.patch(f"/api/admin/applications/{application.id}/", {"status": "REVIEWING"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["has_resume"])
        self.assertNotIn("ssn", response.data)
        self.assertIn("no-store", response["Cache-Control"])
        application.refresh_from_db()
        self.assertEqual(application.status, "REVIEWING")
        self.assertEqual(application.application_data, legacy_answers)
        self.assertEqual(application.ssn_encrypted, "opaque-legacy-encrypted-value")
        self.assertEqual(bytes(application.resume_content), content)

    def test_legacy_file_resume_remains_downloadable_without_migrating_it(self):
        content = b"%PDF-1.7\nLegacy demo resume\n"
        with tempfile.TemporaryDirectory() as media_directory, override_settings(MEDIA_ROOT=media_directory):
            application = JobApplication.objects.create(
                full_name="Legacy Applicant", email="legacy@example.com", position="Nurse",
                resume=SimpleUploadedFile("legacy.pdf", content, content_type="application/pdf"),
            )
            self.client.force_authenticate(user=self.admin_user())
            listing = self.client.get("/api/admin/applications/")
            self.assertTrue(listing.data["results"][0]["has_resume"])
            response = self.client.get(f"/api/admin/applications/{application.id}/resume/")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(b"".join(response.streaming_content), content)
            self.assertIn("no-store", response["Cache-Control"])
            response.close()
