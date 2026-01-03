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


class MedicalRecordsTests(TestCase):
    """Test Medical Records system with staff-controlled visibility"""

    def setUp(self):
        from io import BytesIO
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        self.client = APIClient()

        # Create test users
        self.patient1 = User.objects.create_user(
            email="patient1@test.com",
            password="TestPass123!",
            role=User.Role.PATIENT,
            first_name="John",
            last_name="Doe"
        )
        self.patient2 = User.objects.create_user(
            email="patient2@test.com",
            password="TestPass123!",
            role=User.Role.PATIENT,
            first_name="Jane",
            last_name="Smith"
        )
        self.staff = User.objects.create_user(
            email="staff@test.com",
            password="TestPass123!",
            role=User.Role.STAFF,
            first_name="Dr.",
            last_name="Staff"
        )
        self.admin = User.objects.create_user(
            email="admin@test.com",
            password="TestPass123!",
            role=User.Role.ADMIN,
            first_name="Admin",
            last_name="User"
        )

        # Create patient profiles
        from .models import PatientProfile
        self.patient1_profile = PatientProfile.objects.create(
            user=self.patient1,
            phone_number="555-0001"
        )
        self.patient2_profile = PatientProfile.objects.create(
            user=self.patient2,
            phone_number="555-0002"
        )

        # Get tokens
        self.patient1_token = self._get_token("patient1@test.com", "TestPass123!")
        self.patient2_token = self._get_token("patient2@test.com", "TestPass123!")
        self.staff_token = self._get_token("staff@test.com", "TestPass123!")
        self.admin_token = self._get_token("admin@test.com", "TestPass123!")

    def _get_token(self, email, password):
        """Helper to get JWT access token"""
        response = self.client.post('/api/auth/login/', {
            'email': email,
            'password': password
        })
        return response.data.get('access')

    def test_patient_can_view_own_record(self):
        """Test that patient can view their own medical record"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.patient1_token}')
        response = self.client.get('/api/records/me/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('patient_email', response.data)
        self.assertEqual(response.data['patient_email'], 'patient1@test.com')

    def test_patient_cannot_see_staff_only_notes(self):
        """Test that patient cannot see STAFF_ONLY notes"""
        from .models import MedicalRecord, MedicalNote
        
        # Create medical record with notes
        record = MedicalRecord.objects.create(patient=self.patient1_profile)
        
        # Create STAFF_ONLY note
        MedicalNote.objects.create(
            record=record,
            author=self.staff,
            content="Confidential staff note",
            visibility=MedicalNote.Visibility.STAFF_ONLY
        )
        
        # Create SHARED note
        MedicalNote.objects.create(
            record=record,
            author=self.staff,
            content="Shared note with patient",
            visibility=MedicalNote.Visibility.SHARED_WITH_PATIENT
        )
        
        # Patient views their record
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.patient1_token}')
        response = self.client.get('/api/records/me/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notes = response.data['notes']
        self.assertEqual(len(notes), 1)  # Only shared note visible
        self.assertEqual(notes[0]['content'], "Shared note with patient")

    def test_staff_can_see_all_notes(self):
        """Test that staff can see all notes including STAFF_ONLY"""
        from .models import MedicalRecord, MedicalNote
        
        record = MedicalRecord.objects.create(patient=self.patient1_profile)
        
        MedicalNote.objects.create(
            record=record,
            author=self.staff,
            content="Staff only note",
            visibility=MedicalNote.Visibility.STAFF_ONLY
        )
        
        MedicalNote.objects.create(
            record=record,
            author=self.staff,
            content="Shared note",
            visibility=MedicalNote.Visibility.SHARED_WITH_PATIENT
        )
        
        # Staff views patient record
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.staff_token}')
        response = self.client.get(f'/api/staff/patients/{self.patient1.id}/record/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notes = response.data['notes']
        self.assertEqual(len(notes), 2)  # Staff sees all notes

    def test_staff_toggle_note_visibility(self):
        """Test staff toggling note visibility to SHARED_WITH_PATIENT"""
        from .models import MedicalRecord, MedicalNote
        
        record = MedicalRecord.objects.create(patient=self.patient1_profile)
        note = MedicalNote.objects.create(
            record=record,
            author=self.staff,
            content="Initially staff only",
            visibility=MedicalNote.Visibility.STAFF_ONLY
        )
        
        # Patient cannot see it initially
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.patient1_token}')
        response = self.client.get('/api/records/me/')
        self.assertEqual(len(response.data['notes']), 0)
        
        # Staff toggles to SHARED_WITH_PATIENT
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.staff_token}')
        response = self.client.patch(f'/api/staff/notes/{note.id}/', {
            'visibility': 'SHARED_WITH_PATIENT'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['visibility'], 'SHARED_WITH_PATIENT')
        self.assertIsNotNone(response.data['shared_at'])
        
        # Patient can now see it
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.patient1_token}')
        response = self.client.get('/api/records/me/')
        self.assertEqual(len(response.data['notes']), 1)
        self.assertEqual(response.data['notes'][0]['content'], "Initially staff only")

    def test_patient_can_upload_document(self):
        """Test patient can upload a document to their own record"""
        from io import BytesIO
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        # Create a test PDF file
        pdf_content = b'%PDF-1.4 test content'
        pdf_file = SimpleUploadedFile("test.pdf", pdf_content, content_type="application/pdf")
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.patient1_token}')
        response = self.client.post('/api/records/me/documents/', {
            'file': pdf_file,
            'category': 'LAB_RESULT'
        }, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['category'], 'LAB_RESULT')
        self.assertEqual(response.data['visibility'], 'PATIENT_AND_STAFF')
        self.assertEqual(response.data['original_name'], 'test.pdf')

    def test_patient_cannot_download_another_patients_document(self):
        """Test patient cannot download another patient's document"""
        from .models import MedicalRecord, MedicalDocument
        from io import BytesIO
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        # Create document for patient2
        record2 = MedicalRecord.objects.create(patient=self.patient2_profile)
        pdf_file = SimpleUploadedFile("test2.pdf", b'%PDF content', content_type="application/pdf")
        
        doc = MedicalDocument.objects.create(
            record=record2,
            uploaded_by=self.patient2,
            category='LAB_RESULT',
            visibility='PATIENT_AND_STAFF',
            file=pdf_file,
            original_name='test2.pdf',
            mime_type='application/pdf',
            size_bytes=100
        )
        
        # Patient1 tries to download patient2's document
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.patient1_token}')
        response = self.client.get(f'/api/documents/{doc.id}/download/')
        
        # Should return 404 to avoid leaking existence
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patient_cannot_see_staff_only_documents(self):
        """Test patient cannot see STAFF_ONLY documents"""
        from .models import MedicalRecord, MedicalDocument
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        record = MedicalRecord.objects.create(patient=self.patient1_profile)
        
        # Staff uploads STAFF_ONLY document
        pdf_file = SimpleUploadedFile("staff_doc.pdf", b'%PDF content', content_type="application/pdf")
        doc = MedicalDocument.objects.create(
            record=record,
            uploaded_by=self.staff,
            category='LAB_RESULT',
            visibility='STAFF_ONLY',
            file=pdf_file,
            original_name='staff_doc.pdf',
            mime_type='application/pdf',
            size_bytes=100
        )
        
        # Patient views their record
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.patient1_token}')
        response = self.client.get('/api/records/me/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['documents']), 0)  # Staff only doc not visible
        
        # Patient tries to download directly
        response = self.client.get(f'/api/documents/{doc.id}/download/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_staff_can_download_any_document(self):
        """Test staff can download any document including STAFF_ONLY"""
        from .models import MedicalRecord, MedicalDocument
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        record = MedicalRecord.objects.create(patient=self.patient1_profile)
        pdf_file = SimpleUploadedFile("staff_doc.pdf", b'%PDF content', content_type="application/pdf")
        
        doc = MedicalDocument.objects.create(
            record=record,
            uploaded_by=self.staff,
            category='LAB_RESULT',
            visibility='STAFF_ONLY',
            file=pdf_file,
            original_name='staff_doc.pdf',
            mime_type='application/pdf',
            size_bytes=100
        )
        
        # Staff can download
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.staff_token}')
        response = self.client.get(f'/api/documents/{doc.id}/download/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')

    def test_patient_cannot_delete_document(self):
        """Test patient cannot delete a document (no endpoint available)"""
        from .models import MedicalRecord, MedicalDocument
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        record = MedicalRecord.objects.create(patient=self.patient1_profile)
        pdf_file = SimpleUploadedFile("patient_doc.pdf", b'%PDF content', content_type="application/pdf")
        
        doc = MedicalDocument.objects.create(
            record=record,
            uploaded_by=self.patient1,
            category='OTHER',
            visibility='PATIENT_AND_STAFF',
            file=pdf_file,
            original_name='patient_doc.pdf',
            mime_type='application/pdf',
            size_bytes=100
        )
        
        # Patient tries to delete (endpoint is staff-only)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.patient1_token}')
        response = self.client.delete(f'/api/staff/documents/{doc.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Verify document still exists
        from .models import MedicalDocument
        self.assertTrue(MedicalDocument.objects.filter(id=doc.id).exists())

    def test_staff_can_delete_document(self):
        """Test staff can delete a document"""
        from .models import MedicalRecord, MedicalDocument
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        record = MedicalRecord.objects.create(patient=self.patient1_profile)
        pdf_file = SimpleUploadedFile("delete_test.pdf", b'%PDF content', content_type="application/pdf")
        
        doc = MedicalDocument.objects.create(
            record=record,
            uploaded_by=self.patient1,
            category='OTHER',
            visibility='PATIENT_AND_STAFF',
            file=pdf_file,
            original_name='delete_test.pdf',
            mime_type='application/pdf',
            size_bytes=100
        )
        
        doc_id = doc.id
        
        # Staff deletes document
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.staff_token}')
        response = self.client.delete(f'/api/staff/documents/{doc_id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify document no longer exists
        from .models import MedicalDocument
        self.assertFalse(MedicalDocument.objects.filter(id=doc_id).exists())

    def test_admin_has_full_access(self):
        """Test admin has same permissions as staff"""
        from .models import MedicalRecord
        
        record = MedicalRecord.objects.create(patient=self.patient1_profile)
        
        # Admin can view patient record
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        response = self.client.get(f'/api/staff/patients/{self.patient1.id}/record/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

