from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import PatientProfile, StaffProfile


User = get_user_model()


class AdminUserRoleTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="role-admin@example.invalid", role=User.Role.ADMIN, is_staff=True
        )
        self.patient = User.objects.create_user(
            email="role-patient@example.invalid", role=User.Role.PATIENT
        )
        self.staff = User.objects.create_user(
            email="role-staff@example.invalid", role=User.Role.STAFF, is_staff=True
        )
        self.owner = User.objects.create_user(
            email="role-owner@example.invalid", role=User.Role.OWNER, is_staff=True
        )
        self.client.force_authenticate(self.admin)

    def update_role(self, user, role):
        return self.client.patch(
            f"/api/admin/users/{user.pk}/role/", {"role": role}, format="json"
        )

    def test_admin_can_promote_patient_to_owner(self):
        response = self.update_role(self.patient, User.Role.OWNER)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.patient.refresh_from_db()
        self.assertEqual(self.patient.role, User.Role.OWNER)
        self.assertTrue(self.patient.is_staff)
        self.assertFalse(self.patient.is_superuser)
        self.assertTrue(StaffProfile.objects.filter(user=self.patient).exists())
        self.assertEqual(response.data["role"], User.Role.OWNER)

    def test_admin_can_promote_staff_to_owner(self):
        response = self.update_role(self.staff, User.Role.OWNER)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.staff.refresh_from_db()
        self.assertEqual(self.staff.role, User.Role.OWNER)
        self.assertTrue(self.staff.is_staff)

    def test_admin_can_demote_owner_to_staff(self):
        response = self.update_role(self.owner, User.Role.STAFF)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.owner.refresh_from_db()
        self.assertEqual(self.owner.role, User.Role.STAFF)
        self.assertTrue(self.owner.is_staff)

    def test_admin_can_demote_owner_to_patient(self):
        response = self.update_role(self.owner, User.Role.PATIENT)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.owner.refresh_from_db()
        self.assertEqual(self.owner.role, User.Role.PATIENT)
        self.assertFalse(self.owner.is_staff)
        self.assertTrue(PatientProfile.objects.filter(user=self.owner).exists())

    def test_non_admin_users_cannot_assign_owner_role(self):
        for user in (self.patient, self.staff, self.owner):
            with self.subTest(role=user.role):
                self.client.force_authenticate(user)
                response = self.update_role(self.patient, User.Role.OWNER)
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
                self.patient.refresh_from_db()
                self.assertEqual(self.patient.role, User.Role.PATIENT)

    def test_admin_account_role_is_protected(self):
        response = self.update_role(self.admin, User.Role.OWNER)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.admin.refresh_from_db()
        self.assertEqual(self.admin.role, User.Role.ADMIN)

    def test_unknown_role_is_rejected(self):
        response = self.update_role(self.patient, "UNKNOWN")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.patient.refresh_from_db()
        self.assertEqual(self.patient.role, User.Role.PATIENT)

    def test_unauthenticated_user_cannot_assign_owner_role(self):
        self.client.force_authenticate(None)
        response = self.update_role(self.patient, User.Role.OWNER)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
