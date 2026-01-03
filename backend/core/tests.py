from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import Appointment, Doctor

User = get_user_model()


class RBACTests(TestCase):
    """Test Role-Based Access Control for appointments"""

    def setUp(self):
        self.client = APIClient()

        # Create test users
        self.patient1 = User.objects.create_user(
            email="patient1@test.com",
            password="TestPass123!",
            role=User.Role.PATIENT
        )
        self.patient2 = User.objects.create_user(
            email="patient2@test.com",
            password="TestPass123!",
            role=User.Role.PATIENT
        )
        self.staff = User.objects.create_user(
            email="staff@test.com",
            password="TestPass123!",
            role=User.Role.STAFF
        )

        # Create test appointments
        self.appointment1 = Appointment.objects.create(
            patient=self.patient1,
            requested_start="2026-01-15T10:00:00Z",
            reason="Checkup",
            patient_notes="Morning preferred"
        )
        self.appointment2 = Appointment.objects.create(
            patient=self.patient2,
            requested_start="2026-01-16T14:00:00Z",
            reason="Follow-up",
            patient_notes="Afternoon preferred"
        )

    def _get_token(self, email, password):
        """Helper to get JWT access token"""
        response = self.client.post('/api/auth/login/', {
            'email': email,
            'password': password
        })
        return response.data['access']

    def test_patient_can_only_list_own_appointments(self):
        """Test that patients can only see their own appointments"""
        token = self._get_token('patient1@test.com', 'TestPass123!')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.get('/api/appointments/my/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.appointment1.id)

    def test_patient_cannot_get_another_patients_appointment(self):
        """Test that patients cannot retrieve other patients' appointments"""
        token = self._get_token('patient1@test.com', 'TestPass123!')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # Try to access patient2's appointment
        response = self.client.get(f'/api/appointments/{self.appointment2.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patient_can_get_own_appointment(self):
        """Test that patients can retrieve their own appointments"""
        token = self._get_token('patient1@test.com', 'TestPass123!')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.get(f'/api/appointments/{self.appointment1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.appointment1.id)

    def test_staff_can_list_all_appointments(self):
        """Test that staff can see all appointments"""
        token = self._get_token('staff@test.com', 'TestPass123!')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.get('/api/staff/appointments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Staff endpoint is now paginated
        results = response.data.get('results', response.data)
        
        # Check that at least our test appointments are returned
        self.assertGreaterEqual(len(results), 2)
        appointment_ids = [item['id'] for item in results]
        self.assertIn(self.appointment1.id, appointment_ids)
        self.assertIn(self.appointment2.id, appointment_ids)

    def test_staff_can_patch_appointment_status(self):
        """Test that staff can update appointment status"""
        token = self._get_token('staff@test.com', 'TestPass123!')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.patch(
            f'/api/staff/appointments/{self.appointment1.id}/',
            {
                'status': 'CONFIRMED',
                'scheduled_start': '2026-01-15T10:30:00Z',
                'staff_notes': 'Confirmed by staff'
            }
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'CONFIRMED')

    def test_patient_cannot_access_staff_endpoints(self):
        """Test that patients cannot access staff-only endpoints"""
        token = self._get_token('patient1@test.com', 'TestPass123!')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # Try to list all appointments (staff endpoint)
        response = self.client.get('/api/staff/appointments/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Try to patch appointment (staff endpoint)
        response = self.client.patch(
            f'/api/staff/appointments/{self.appointment1.id}/',
            {'status': 'CONFIRMED'}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_can_filter_appointments_by_status(self):
        """Test that staff can filter appointments by status"""
        token = self._get_token('staff@test.com', 'TestPass123!')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # Update one appointment to CONFIRMED
        self.appointment1.status = Appointment.Status.CONFIRMED
        self.appointment1.save()

        # Filter by CONFIRMED - should at least have appointment1
        response = self.client.get('/api/staff/appointments/?status=CONFIRMED')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Staff endpoint is now paginated
        results = response.data.get('results', response.data)
        
        appointment_ids = [item['id'] for item in results]
        self.assertIn(self.appointment1.id, appointment_ids)
        # Verify all returned appointments have CONFIRMED status
        for appointment in results:
            self.assertEqual(appointment['status'], 'CONFIRMED')

    def test_unauthenticated_cannot_access_appointments(self):
        """Test that unauthenticated users cannot access appointment endpoints"""
        response = self.client.get('/api/appointments/my/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.get('/api/staff/appointments/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AppointmentCreationTests(TestCase):
    """Test appointment creation security and behavior"""

    def setUp(self):
        self.client = APIClient()

        # Create test users
        self.patient1 = User.objects.create_user(
            email="patient1@test.com",
            password="TestPass123!",
            role=User.Role.PATIENT
        )
        self.patient2 = User.objects.create_user(
            email="patient2@test.com",
            password="TestPass123!",
            role=User.Role.PATIENT
        )

    def _get_token(self, email, password):
        """Helper to get JWT access token"""
        response = self.client.post('/api/auth/login/', {
            'email': email,
            'password': password
        })
        return response.data['access']

    def test_appointment_creation_assigns_patient_from_token(self):
        """Test that appointment creation uses the authenticated user as patient"""
        token = self._get_token('patient1@test.com', 'TestPass123!')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.post('/api/appointments/', {
            'requested_start': '2026-01-20T10:00:00Z',
            'reason': 'Annual checkup',
            'patient_notes': 'First time patient'
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Check patient_email instead of patient ID
        self.assertEqual(response.data['patient_email'], self.patient1.email)
        
        # Verify the appointment exists in the database with correct patient
        appointment = Appointment.objects.get(id=response.data['id'])
        self.assertEqual(appointment.patient.id, self.patient1.id)

    def test_appointment_creation_ignores_patient_field_if_sent(self):
        """Test that patient field is ignored if sent - token determines the patient"""
        token = self._get_token('patient1@test.com', 'TestPass123!')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # Try to create appointment for patient2 while authenticated as patient1
        response = self.client.post('/api/appointments/', {
            'requested_start': '2026-01-20T11:00:00Z',
            'reason': 'Checkup',
            'patient_notes': 'Test notes',
            'patient': self.patient2.id  # This should be ignored
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # The appointment should be assigned to patient1 (from token), not patient2
        self.assertEqual(response.data['patient_email'], self.patient1.email)
        
        appointment = Appointment.objects.get(id=response.data['id'])
        self.assertEqual(appointment.patient.id, self.patient1.id)
        self.assertNotEqual(appointment.patient.id, self.patient2.id)

    def test_patient_cannot_create_appointment_for_another_patient(self):
        """Verify that patients cannot create appointments for other patients"""
        token = self._get_token('patient1@test.com', 'TestPass123!')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # Even if explicitly trying to set another patient ID
        response = self.client.post('/api/appointments/', {
            'requested_start': '2026-01-20T12:00:00Z',
            'reason': 'Follow-up',
            'patient': self.patient2.id
        })

        # Should succeed but create for patient1
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['patient_email'], self.patient1.email)

    def test_unauthenticated_cannot_create_appointment(self):
        """Test that unauthenticated users cannot create appointments"""
        response = self.client.post('/api/appointments/', {
            'requested_start': '2026-01-20T13:00:00Z',
            'reason': 'Test'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
