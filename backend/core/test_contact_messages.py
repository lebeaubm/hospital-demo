from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import ContactMessage


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    CACHES={"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}},
)
class ContactMessageTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.payload = {
            "full_name": "Demo Visitor",
            "email": "visitor@example.com",
            "subject": "Sample message",
            "message": "This is made-up information for checking the demo inbox.",
        }

    def user(self, role):
        User = get_user_model()
        return User.objects.create_user(email=f"contact-{role.lower()}@example.com", role=role)

    def test_public_submission_ignores_stale_auth_and_forces_demo_defaults(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer expired-demo-token")
        response = self.client.post(
            "/api/contact/messages/",
            {**self.payload, "is_demo": False, "status": "REVIEWED"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(set(response.data), {"message"})
        saved = ContactMessage.objects.get()
        self.assertEqual(saved.full_name, self.payload["full_name"])
        self.assertEqual(saved.message, self.payload["message"])
        self.assertEqual(saved.status, ContactMessage.Status.NEW)
        self.assertTrue(saved.is_demo)
        self.assertIsNotNone(saved.created_at)
        self.assertEqual(len(mail.outbox), 0)

    def test_required_fields_email_and_length_limits(self):
        invalid_values = {
            "full_name": ["", " " * 2, "x" * 256],
            "email": ["", "not-an-email", "x" * 255 + "@example.com"],
            "subject": ["", "x" * 201],
            "message": ["", "x" * 5001],
        }
        for field, values in invalid_values.items():
            for value in values:
                with self.subTest(field=field, length=len(value)):
                    cache.clear()
                    response = self.client.post(
                        "/api/contact/messages/", {**self.payload, field: value}, format="json",
                    )
                    self.assertEqual(response.status_code, 400)
                    self.assertIn(field, response.data)
        response = self.client.post("/api/contact/messages/", {}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(set(response.data), set(self.payload))
        self.assertEqual(ContactMessage.objects.count(), 0)

    def test_public_submission_is_limited_to_ten_per_hour(self):
        for _ in range(10):
            self.assertEqual(self.client.post("/api/contact/messages/", self.payload, format="json").status_code, 201)
        self.assertEqual(self.client.post("/api/contact/messages/", self.payload, format="json").status_code, 429)
        self.assertEqual(ContactMessage.objects.count(), 10)

    def test_only_admin_can_list_read_or_update_messages(self):
        message = ContactMessage.objects.create(**self.payload)
        detail_url = f"/api/admin/contact-messages/{message.pk}/"
        for role in (None, "PATIENT", "STAFF"):
            self.client.force_authenticate(user=self.user(role) if role else None)
            for method, url, payload in (
                ("get", "/api/admin/contact-messages/", None),
                ("get", detail_url, None),
                ("patch", detail_url, {"status": "REVIEWED"}),
            ):
                with self.subTest(role=role, method=method):
                    response = getattr(self.client, method)(url, payload, format="json")
                    self.assertEqual(response.status_code, 401 if role is None else 403)
                    self.assertEqual(response["Cache-Control"], "private, no-store")
        message.refresh_from_db()
        self.assertEqual(message.status, ContactMessage.Status.NEW)

    def test_admin_status_updates_only_leave_message_and_demo_flag_unchanged(self):
        message = ContactMessage.objects.create(**self.payload)
        self.client.force_authenticate(user=self.user("ADMIN"))
        detail_url = f"/api/admin/contact-messages/{message.pk}/"
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Cache-Control"], "private, no-store")
        response = self.client.patch(
            detail_url, {"status": "REVIEWED", "message": "Changed", "is_demo": False}, format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Cache-Control"], "private, no-store")
        message.refresh_from_db()
        self.assertEqual(message.status, ContactMessage.Status.REVIEWED)
        self.assertEqual(message.message, self.payload["message"])
        self.assertTrue(message.is_demo)
        self.assertEqual(self.client.patch(detail_url, {"status": "INVALID"}, format="json").status_code, 400)
        self.assertEqual(self.client.delete(detail_url).status_code, 405)

    def test_admin_inbox_filters_status_and_paginates(self):
        ContactMessage.objects.create(**self.payload)
        reviewed = ContactMessage.objects.create(**self.payload, status=ContactMessage.Status.REVIEWED)
        self.client.force_authenticate(user=self.user("ADMIN"))
        response = self.client.get("/api/admin/contact-messages/", {"status": "REVIEWED", "page_size": 1})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Cache-Control"], "private, no-store")
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], reviewed.pk)
        response = self.client.get("/api/admin/contact-messages/", {"page_size": 1})
        self.assertEqual(response.data["count"], 2)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertIsNotNone(response.data["next"])
