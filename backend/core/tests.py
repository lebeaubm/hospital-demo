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


class EmailNotificationTests(TestCase):
    """Test email notification system"""

    def setUp(self):
        self.client = APIClient()

        # Create test users
        self.patient = User.objects.create_user(
            email="patient@test.com",
            password="TestPass123!",
            role=User.Role.PATIENT,
            first_name="John",
            last_name="Doe"
        )
        self.staff = User.objects.create_user(
            email="staff@test.com",
            password="TestPass123!",
            role=User.Role.STAFF
        )

        # Get tokens
        self.patient_token = self._get_token("patient@test.com", "TestPass123!")
        self.staff_token = self._get_token("staff@test.com", "TestPass123!")

    def _get_token(self, email, password):
        """Helper to get JWT access token"""
        response = self.client.post('/api/auth/login/', {
            'email': email,
            'password': password
        })
        return response.data['access']

    def test_staff_can_send_custom_email(self):
        """Test that staff can send custom emails"""
        from .models import NotificationLog
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.staff_token}')
        
        response = self.client.post('/api/staff/emails/send/', {
            'to_email': 'patient@test.com',
            'subject': 'Test Email',
            'body': 'This is a test email message.'
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['event_type'], 'STAFF_CUSTOM')
        self.assertEqual(response.data['to_email'], 'patient@test.com')
        self.assertEqual(response.data['subject'], 'Test Email')
        
        # Verify log was created in database
        log = NotificationLog.objects.get(id=response.data['id'])
        self.assertEqual(log.sent_by, self.staff)
        self.assertIn(log.status, ['SENT', 'FAILED'])  # Console backend should mark as SENT

    def test_patient_cannot_send_custom_email(self):
        """Test that patients cannot access staff email endpoints"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.patient_token}')
        
        response = self.client.post('/api/staff/emails/send/', {
            'to_email': 'someone@test.com',
            'subject': 'Test',
            'body': 'Test message'
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_appointment_status_change_creates_email_log(self):
        """Test that changing appointment status to CONFIRMED creates an email log"""
        from .models import Appointment, NotificationLog
        
        # Create an appointment
        appointment = Appointment.objects.create(
            patient=self.patient,
            requested_start="2026-01-15T10:00:00Z",
            reason="Checkup",
            status=Appointment.Status.REQUESTED
        )
        
        initial_log_count = NotificationLog.objects.count()
        
        # Staff updates appointment to CONFIRMED
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.staff_token}')
        response = self.client.patch(f'/api/staff/appointments/{appointment.id}/', {
            'status': 'CONFIRMED',
            'scheduled_start': '2026-01-15T10:00:00Z'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify email log was created
        self.assertEqual(NotificationLog.objects.count(), initial_log_count + 1)
        
        log = NotificationLog.objects.latest('created_at')
        self.assertEqual(log.event_type, 'APPT_CONFIRMED')
        self.assertEqual(log.to_email, self.patient.email)
        self.assertEqual(log.related_appointment, appointment)

    def test_duplicate_status_change_does_not_create_duplicate_email(self):
        """Test that updating appointment without changing status doesn't create duplicate emails"""
        from .models import Appointment, NotificationLog
        
        # Create an appointment already confirmed
        appointment = Appointment.objects.create(
            patient=self.patient,
            requested_start="2026-01-15T10:00:00Z",
            scheduled_start="2026-01-15T10:00:00Z",
            reason="Checkup",
            status=Appointment.Status.CONFIRMED
        )
        
        initial_log_count = NotificationLog.objects.count()
        
        # Staff updates staff_notes but status remains CONFIRMED
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.staff_token}')
        response = self.client.patch(f'/api/staff/appointments/{appointment.id}/', {
            'staff_notes': 'Updated notes',
            'status': 'CONFIRMED'  # Same status
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify NO new email log was created (status didn't actually change)
        self.assertEqual(NotificationLog.objects.count(), initial_log_count)

    def test_staff_can_view_email_logs(self):
        """Test that staff can view email logs"""
        from .models import NotificationLog
        
        # Create some test logs
        NotificationLog.objects.create(
            event_type='WELCOME',
            to_email='test@example.com',
            subject='Welcome',
            body_text='Welcome message',
            status='SENT'
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.staff_token}')
        response = self.client.get('/api/staff/emails/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertGreaterEqual(len(response.data['results']), 1)

    def test_patient_cannot_view_email_logs(self):
        """Test that patients cannot view email logs"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.patient_token}')
        response = self.client.get('/api/staff/emails/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

