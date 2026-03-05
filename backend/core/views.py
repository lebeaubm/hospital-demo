from django.db.models import Q
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, serializers, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import (
    Appointment,
    Bill,
    BillableService,
    BillLineItem,
    BillPayment,
    Doctor,
    FamilyMember,
    JobApplication,
    LabOrder,
    LabResult,
    LabResultValue,
    LabTest,
    MedicalDocument,
    MedicalNote,
    MedicalRecord,
    Message,
    MessageAttachment,
    MessageThread,
    NotificationLog,
    PatientProfile,
    Pharmacy,
    Prescription,
    PrescriptionRefill,
    StaffProfile,
    User,
)
from .notifications import (
    send_appointment_canceled_notification,
    send_appointment_completed_notification,
    send_appointment_confirmed_notification,
    send_appointment_requested_notification,
    send_email_notification,
    send_welcome_email,
)
from .defaults import ensure_patient_default_data
from .permissions import IsAdminUser, IsAppointmentOwner, IsPatientUser, IsStaffUser
from .serializers import (
    AppointmentSerializer,
    AdminUserListItemSerializer,
    AdminUserRoleUpdateRequestSerializer,
    BillLineItemSerializer,
    BillPaymentSerializer,
    BillSerializer,
    BillableServiceSerializer,
    StaffBillWriteSerializer,
    DoctorSerializer,
    FamilyMemberSerializer,
    JobApplicationAdminSerializer,
    JobApplicationCreateSerializer,
    LabOrderSerializer,
    LabResultSerializer,
    LabResultValueSerializer,
    LabTestSerializer,
    MedicalDocumentSerializer,
    MedicalDocumentUploadSerializer,
    MedicalNoteSerializer,
    MedicalNoteVisibilitySerializer,
    MedicalRecordSerializer,
    MessageSerializer,
    MessageThreadDetailSerializer,
    MessageThreadSerializer,
    NotificationLogSerializer,
    PatientProfileSerializer,
    PharmacySerializer,
    PrescriptionRefillSerializer,
    PrescriptionSerializer,
    RegisterSerializer,
    StaffAppointmentUpdateSerializer,
    StaffPatientListItemSerializer,
    StaffProfileSerializer,
    StaffSendEmailSerializer,
    StaffUserListItemSerializer,
)
from .serializers_jwt import CustomTokenObtainPairSerializer


@extend_schema(exclude=True)
class APIRootView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            "status": " IT'S WORKING!",
            "message": "Hospital Demo API",
            "version": "1.0",
            "available_endpoints": {
                "auth": {
                    "register": "/api/auth/register/",
                    "login": "/api/auth/login/",
                    "refresh": "/api/auth/refresh/"
                },
                "patients": {
                    "me": "/api/patients/me/"
                },
                "doctors": {
                    "list": "/api/doctors/",
                    "detail": "/api/doctors/{id}/"
                },
                "appointments": {
                    "create": "/api/appointments/",
                    "mine": "/api/appointments/my/",
                    "detail": "/api/appointments/{id}/",
                    "staff_list": "/api/staff/appointments/",
                    "staff_update": "/api/staff/appointments/{id}/"
                },
                "documentation": "/api/docs/"
            }
        })


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        if user.role == user.Role.PATIENT:
            ensure_patient_default_data(user)
        # Send welcome email to newly registered patient (only for PATIENT role)
        if user.role == user.Role.PATIENT:
            send_welcome_email(user)


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]


class DoctorPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class DoctorListView(generics.ListAPIView):
    serializer_class = DoctorSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = DoctorPagination

    def get_queryset(self):
        queryset = Doctor.objects.all().order_by('name')
        
        # Text search across name and specialty
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(specialty__icontains=search)
            )
        
        # Exact specialty filter
        specialty = self.request.query_params.get('specialty', None)
        if specialty:
            queryset = queryset.filter(specialty__iexact=specialty)
        
        # Exact location filter
        location = self.request.query_params.get('location', None)
        if location:
            queryset = queryset.filter(location__icontains=location)
        
        return queryset


class DoctorDetailView(generics.RetrieveAPIView):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [permissions.AllowAny]


class PatientMeView(generics.RetrieveUpdateAPIView):
    serializer_class = PatientProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatientUser]

    def get_object(self):
        profile, _ = PatientProfile.objects.get_or_create(user=self.request.user)
        return profile


class StaffMeView(generics.RetrieveUpdateAPIView):
    serializer_class = StaffProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]

    def get_object(self):
        profile, _ = StaffProfile.objects.get_or_create(user=self.request.user)
        return profile


class StaffPatientListView(generics.ListAPIView):
    """
    GET /api/staff/patients/
    List all patient users (for staff to create lab orders etc).
    """
    serializer_class = StaffPatientListItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]

    def list(self, request, *args, **kwargs):
        patients = User.objects.filter(role=User.Role.PATIENT).values(
            'id', 'first_name', 'last_name', 'email'
        )
        data = [
            {
                'id': p['id'],
                'name': f"{p['first_name']} {p['last_name']}".strip() or p['email'],
                'email': p['email'],
            }
            for p in patients
        ]
        return Response(data)


class StaffUserListView(generics.ListAPIView):
    """
    GET /api/staff-users/
    List all staff/admin users (for patients to select who to message).
    """
    serializer_class = StaffUserListItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        staff_users = User.objects.filter(
            role__in=[User.Role.STAFF, User.Role.ADMIN]
        ).values('id', 'first_name', 'last_name', 'role')
        data = [
            {
                'id': u['id'],
                'name': f"{u['first_name']} {u['last_name']}".strip() or f"Staff #{u['id']}",
                'role': u['role'],
            }
            for u in staff_users
        ]
        return Response(data)


class AppointmentCreateView(generics.CreateAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatientUser]

    def perform_create(self, serializer):
        # Validate that the chosen doctor is accessible to this patient
        doctor = serializer.validated_data.get('doctor')
        if doctor:
            user = self.request.user
            try:
                profile = user.patient_profile
                assigned_ids = set(profile.assigned_doctors.values_list('id', flat=True))
            except PatientProfile.DoesNotExist:
                assigned_ids = set()
            accessible_ids = set(
                Doctor.objects.filter(is_accessible_to_all=True).values_list('id', flat=True)
            )
            if doctor.id not in assigned_ids | accessible_ids:
                raise serializers.ValidationError(
                    {'doctor': 'You are not assigned to this doctor.'}
                )
        appointment = serializer.save(
            patient=self.request.user,
            status=Appointment.Status.REQUESTED,
            scheduled_start=None,
            staff_notes="",
        )
        # Notify staff about the new appointment request
        send_appointment_requested_notification(appointment)


class MyAppointmentListView(generics.ListAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatientUser]

    def get_queryset(self):
        ensure_patient_default_data(self.request.user)
        return Appointment.objects.filter(patient=self.request.user).order_by("-created_at")


class AppointmentDetailView(generics.RetrieveAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatientUser, IsAppointmentOwner]

    def get_queryset(self):
        return Appointment.objects.filter(patient=self.request.user)


class AppointmentPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class StaffAppointmentListView(generics.ListAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]
    pagination_class = AppointmentPagination

    def get_queryset(self):
        qs = Appointment.objects.select_related("patient", "doctor").all()
        
        # Status filter
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param.upper())
        
        # Doctor filter
        doctor_id = self.request.query_params.get("doctor")
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        
        # Date range filter (using requested_start)
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        
        if date_from:
            try:
                from datetime import datetime
                date_obj = datetime.strptime(date_from, "%Y-%m-%d")
                qs = qs.filter(requested_start__date__gte=date_obj.date())
            except ValueError:
                pass
        
        if date_to:
            try:
                from datetime import datetime
                date_obj = datetime.strptime(date_to, "%Y-%m-%d")
                qs = qs.filter(requested_start__date__lte=date_obj.date())
            except ValueError:
                pass
        
        # Legacy filters (keep for backward compatibility)
        patient_email = self.request.query_params.get("patient_email")
        if patient_email:
            qs = qs.filter(patient__email__iexact=patient_email)
        
        return qs.order_by("-created_at")


class StaffAppointmentUpdateView(generics.UpdateAPIView):
    serializer_class = StaffAppointmentUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]
    queryset = Appointment.objects.all()
    http_method_names = ["patch"]

    def perform_update(self, serializer):
        # Get the original status before update
        original_status = self.get_object().status
        
        # Save the updated appointment
        appointment = serializer.save()
        
        # Only send notifications if status actually changed
        new_status = appointment.status
        if original_status != new_status:
            if new_status == Appointment.Status.CONFIRMED:
                send_appointment_confirmed_notification(appointment)
            elif new_status == Appointment.Status.COMPLETED:
                send_appointment_completed_notification(appointment)
            elif new_status == Appointment.Status.CANCELED:
                send_appointment_canceled_notification(appointment)


class EmailLogPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class StaffEmailLogListView(generics.ListAPIView):
    """List all email notification logs (staff/admin only)."""
    serializer_class = NotificationLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]
    pagination_class = EmailLogPagination

    def get_queryset(self):
        from django.db.models import Q
        
        qs = NotificationLog.objects.select_related("sent_by", "related_appointment").all()
        
        # Role-based filtering: Staff can only see their own emails + system emails
        # Admins can see all emails
        if self.request.user.role == self.request.user.Role.STAFF:
            # Staff can see: emails they sent OR system-generated emails (sent_by is null)
            qs = qs.filter(Q(sent_by=self.request.user) | Q(sent_by__isnull=True))
        # If user is ADMIN, no additional filtering - they see all emails
        
        # Filter by event_type
        event_type = self.request.query_params.get("event_type")
        if event_type:
            qs = qs.filter(event_type=event_type.upper())
        
        # Filter by status
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param.upper())
        
        # Filter by to_email
        to_email = self.request.query_params.get("to_email")
        if to_email:
            qs = qs.filter(to_email__icontains=to_email)
        
        # Filter by date range
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        
        if date_from:
            try:
                from datetime import datetime
                date_obj = datetime.strptime(date_from, "%Y-%m-%d")
                qs = qs.filter(created_at__date__gte=date_obj.date())
            except ValueError:
                pass
        
        if date_to:
            try:
                from datetime import datetime
                date_obj = datetime.strptime(date_to, "%Y-%m-%d")
                qs = qs.filter(created_at__date__lte=date_obj.date())
            except ValueError:
                pass
        
        return qs.order_by("-created_at")


class StaffEmailLogDetailView(generics.RetrieveAPIView):
    """Retrieve a specific email log entry (staff/admin only)."""
    serializer_class = NotificationLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]
    
    def get_queryset(self):
        from django.db.models import Q
        
        qs = NotificationLog.objects.all()
        
        # Role-based filtering: Staff can only see their own emails + system emails
        # Admins can see all emails
        if self.request.user.role == self.request.user.Role.STAFF:
            qs = qs.filter(Q(sent_by=self.request.user) | Q(sent_by__isnull=True))
        
        return qs


class StaffSendEmailView(APIView):
    """Allow staff/admin to send custom emails (staff/admin only)."""
    serializer_class = StaffSendEmailSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]

    def post(self, request):
        serializer = StaffSendEmailSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Get related appointment if provided
        related_appointment = None
        if data.get("appointment_id"):
            related_appointment = Appointment.objects.get(id=data["appointment_id"])
        
        # Send the email using notification service
        log = send_email_notification(
            event_type=NotificationLog.EventType.STAFF_CUSTOM,
            to_email=data["to_email"],
            subject=data["subject"],
            body_text=data["body"],
            cc_emails=data.get("cc", []),
            sent_by=request.user,
            related_appointment=related_appointment,
        )
        
        # Return the created log entry
        return Response(
            NotificationLogSerializer(log).data,
            status=status.HTTP_201_CREATED
        )


# Medical Records Views

class PatientMedicalRecordView(APIView):
    """
    Patient endpoint to view their own medical record.
    GET /api/records/me/
    Returns: record summary + shared notes + visible documents
    """
    serializer_class = MedicalRecordSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatientUser]

    def get(self, request):
        """Get patient's own medical record."""
        try:
            patient_profile = request.user.patient_profile
        except PatientProfile.DoesNotExist:
            return Response(
                {"error": "Patient profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get or create medical record
        record, created = MedicalRecord.objects.get_or_create(patient=patient_profile)

        serializer = MedicalRecordSerializer(record, context={"request": request})
        return Response(serializer.data)


class PatientDocumentUploadView(APIView):
    """
    Patient endpoint to upload documents to their own record.
    POST /api/records/me/documents/
    """
    serializer_class = MedicalDocumentUploadSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatientUser]

    def post(self, request):
        """Upload a document to patient's own record."""
        try:
            patient_profile = request.user.patient_profile
        except PatientProfile.DoesNotExist:
            return Response(
                {"error": "Patient profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get or create medical record
        record, created = MedicalRecord.objects.get_or_create(patient=patient_profile)

        serializer = MedicalDocumentUploadSerializer(data=request.data)
        if serializer.is_valid():
            # Patient uploads default to PATIENT_AND_STAFF visibility
            document = serializer.save(
                record=record,
                uploaded_by=request.user,
                visibility=MedicalDocument.Visibility.PATIENT_AND_STAFF
            )
            return Response(
                MedicalDocumentSerializer(document, context={"request": request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StaffPatientRecordView(APIView):
    """
    Staff endpoint to view a patient's full medical record.
    GET /api/staff/patients/<patient_id>/record/
    Returns: full record with all notes and documents
    """
    serializer_class = MedicalRecordSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]

    def get(self, request, patient_id):
        """Get full medical record for a patient."""
        try:
            patient_user = User.objects.get(id=patient_id, role=User.Role.PATIENT)
            patient_profile = patient_user.patient_profile
        except (User.DoesNotExist, PatientProfile.DoesNotExist):
            return Response(
                {"error": "Patient not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get or create medical record
        record, created = MedicalRecord.objects.get_or_create(patient=patient_profile)

        serializer = MedicalRecordSerializer(record, context={"request": request})
        return Response(serializer.data)

    def patch(self, request, patient_id):
        """Update medical record summary fields."""
        try:
            patient_user = User.objects.get(id=patient_id, role=User.Role.PATIENT)
            patient_profile = patient_user.patient_profile
        except (User.DoesNotExist, PatientProfile.DoesNotExist):
            return Response(
                {"error": "Patient not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        record, created = MedicalRecord.objects.get_or_create(patient=patient_profile)

        serializer = MedicalRecordSerializer(
            record,
            data=request.data,
            partial=True,
            context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StaffPatientNotesView(APIView):
    """
    Staff endpoint to add notes to a patient's record.
    POST /api/staff/patients/<patient_id>/notes/
    """
    serializer_class = MedicalNoteSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]

    def post(self, request, patient_id):
        """Create a new note for a patient."""
        try:
            patient_user = User.objects.get(id=patient_id, role=User.Role.PATIENT)
            patient_profile = patient_user.patient_profile
        except (User.DoesNotExist, PatientProfile.DoesNotExist):
            return Response(
                {"error": "Patient not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        record, created = MedicalRecord.objects.get_or_create(patient=patient_profile)

        serializer = MedicalNoteSerializer(data=request.data)
        if serializer.is_valid():
            note = serializer.save(
                record=record,
                author=request.user
            )
            return Response(
                MedicalNoteSerializer(note, context={"request": request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StaffNoteVisibilityView(APIView):
    """
    Staff endpoint to toggle note visibility.
    PATCH /api/staff/notes/<note_id>/
    """
    serializer_class = MedicalNoteVisibilitySerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]

    def patch(self, request, note_id):
        """Update note visibility."""
        try:
            note = MedicalNote.objects.get(id=note_id)
        except MedicalNote.DoesNotExist:
            return Response(
                {"error": "Note not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = MedicalNoteVisibilitySerializer(data=request.data)
        if serializer.is_valid():
            new_visibility = serializer.validated_data["visibility"]
            note.visibility = new_visibility

            # Track when note is shared with patient
            if new_visibility == MedicalNote.Visibility.SHARED_WITH_PATIENT:
                if not note.shared_at:
                    note.shared_at = timezone.now()
                    note.shared_by = request.user

            note.save()
            return Response(
                MedicalNoteSerializer(note, context={"request": request}).data
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StaffPatientDocumentsView(APIView):
    """
    Staff endpoint to upload documents to a patient's record.
    POST /api/staff/patients/<patient_id>/documents/
    """
    serializer_class = MedicalDocumentUploadSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]

    def post(self, request, patient_id):
        """Upload a document to a patient's record."""
        try:
            patient_user = User.objects.get(id=patient_id, role=User.Role.PATIENT)
            patient_profile = patient_user.patient_profile
        except (User.DoesNotExist, PatientProfile.DoesNotExist):
            return Response(
                {"error": "Patient not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        record, created = MedicalRecord.objects.get_or_create(patient=patient_profile)

        serializer = MedicalDocumentUploadSerializer(data=request.data)
        if serializer.is_valid():
            # Staff can specify visibility (defaults to PATIENT_AND_STAFF)
            visibility = request.data.get(
                "visibility",
                MedicalDocument.Visibility.STAFF_ONLY
            )
            document = serializer.save(
                record=record,
                uploaded_by=request.user,
                visibility=visibility
            )
            return Response(
                MedicalDocumentSerializer(document, context={"request": request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StaffDocumentDeleteView(APIView):
    """
    Staff endpoint to delete a document.
    DELETE /api/staff/documents/<document_id>/
    """
    serializer_class = MedicalDocumentSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]

    def delete(self, request, document_id):
        """Delete a document (staff/admin only)."""
        try:
            document = MedicalDocument.objects.get(id=document_id)
        except MedicalDocument.DoesNotExist:
            return Response(
                {"error": "Document not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        document.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DocumentDownloadView(APIView):
    """
    Secure document download endpoint.
    GET /api/documents/<document_id>/download/
    Checks permissions before serving file.
    """
    serializer_class = MedicalDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, document_id):
        """Download a document with permission checks."""
        try:
            document = MedicalDocument.objects.select_related(
                "record__patient__user"
            ).get(id=document_id)
        except MedicalDocument.DoesNotExist:
            # Return 404 to avoid leaking existence
            raise Http404("Document not found")

        user = request.user

        # Staff/Admin can download any document
        if user.role in (User.Role.STAFF, User.Role.ADMIN):
            pass  # Allow access
        # Patient can only download documents from their own record
        elif user.role == User.Role.PATIENT:
            # Check if document belongs to this patient's record
            if document.record.patient.user != user:
                raise Http404("Document not found")
            # Check visibility
            if document.visibility != MedicalDocument.Visibility.PATIENT_AND_STAFF:
                raise Http404("Document not found")
        else:
            raise Http404("Document not found")

        # Serve the file
        try:
            response = FileResponse(
                document.file.open("rb"),
                content_type=document.mime_type
            )
            response["Content-Disposition"] = f'attachment; filename="{document.original_name}"'
            return response
        except FileNotFoundError:
            return Response(
                {"error": "File not found on server"},
                status=status.HTTP_404_NOT_FOUND
            )


# ==================== PRESCRIPTION VIEWS ====================

class PharmacyListView(generics.ListAPIView):
    """
    GET /api/pharmacies/
    List all active pharmacies.
    """
    queryset = Pharmacy.objects.filter(is_active=True)
    serializer_class = PharmacySerializer
    permission_classes = [permissions.IsAuthenticated]


class PatientPrescriptionListView(generics.ListAPIView):
    """
    GET /api/prescriptions/me/
    List patient's own prescriptions.
    """
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatientUser]

    def get_queryset(self):
        ensure_patient_default_data(self.request.user)
        return Prescription.objects.filter(patient=self.request.user).select_related(
            "prescribed_by", "pharmacy"
        )


class PatientPrescriptionDetailView(generics.RetrieveAPIView):
    """
    GET /api/prescriptions/<id>/
    View prescription details (patient owns or staff).
    """
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in (User.Role.STAFF, User.Role.ADMIN):
            return Prescription.objects.all()
        return Prescription.objects.filter(patient=user)


class PrescriptionRefillCreateView(generics.CreateAPIView):
    """
    POST /api/prescriptions/<prescription_id>/refill/
    Request a prescription refill.
    """
    serializer_class = PrescriptionRefillSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatientUser]

    def perform_create(self, serializer):
        prescription_id = self.kwargs.get("prescription_id")
        prescription = get_object_or_404(
            Prescription, id=prescription_id, patient=self.request.user
        )
        
        # Check if refill is allowed
        if prescription.refills_remaining <= 0:
            raise serializers.ValidationError(
                {"error": "No refills remaining"}
            )
        
        if prescription.status != Prescription.Status.ACTIVE:
            raise serializers.ValidationError(
                {"error": "Prescription is not active"}
            )
        
        serializer.save(
            prescription=prescription,
            requested_by=self.request.user,
            status=PrescriptionRefill.Status.REQUESTED
        )


class PatientRefillListView(generics.ListAPIView):
    """
    GET /api/prescriptions/refills/me/
    List patient's refill requests.
    """
    serializer_class = PrescriptionRefillSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatientUser]

    def get_queryset(self):
        return PrescriptionRefill.objects.filter(
            requested_by=self.request.user
        ).select_related("prescription", "pharmacy", "processed_by")


class StaffPrescriptionListView(generics.ListAPIView):
    """
    GET /api/staff/prescriptions/
    List all prescriptions (staff view).
    """
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]
    queryset = Prescription.objects.select_related("patient", "prescribed_by", "pharmacy")


class StaffPrescriptionCreateView(generics.CreateAPIView):
    """
    POST /api/staff/prescriptions/
    Create a new prescription (staff only).
    """
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]

    def perform_create(self, serializer):
        serializer.save(prescribed_by=self.request.user)


class StaffPrescriptionUpdateView(generics.UpdateAPIView):
    """
    PATCH /api/staff/prescriptions/<id>/
    Update prescription (staff only).
    """
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]
    queryset = Prescription.objects.all()


class StaffRefillListView(generics.ListAPIView):
    """
    GET /api/staff/refills/
    List all refill requests (staff view).
    """
    serializer_class = PrescriptionRefillSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]
    
    def get_queryset(self):
        queryset = PrescriptionRefill.objects.select_related(
            "prescription", "requested_by", "pharmacy", "processed_by"
        )
        # Filter by status if provided
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset


class StaffRefillUpdateView(generics.UpdateAPIView):
    """
    PATCH /api/staff/refills/<id>/
    Update refill request status (staff only).
    """
    serializer_class = PrescriptionRefillSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]
    queryset = PrescriptionRefill.objects.all()

    def perform_update(self, serializer):
        refill = self.get_object()
        new_status = serializer.validated_data.get("status", refill.status)
        
        # If approving, decrement refills_remaining
        if new_status == PrescriptionRefill.Status.APPROVED and refill.status != PrescriptionRefill.Status.APPROVED:
            prescription = refill.prescription
            if prescription.refills_remaining > 0:
                prescription.refills_remaining -= 1
                prescription.save()
        
        serializer.save(processed_by=self.request.user, processed_at=timezone.now())


# ==================== MESSAGING VIEWS ====================

class PatientMessageThreadListView(generics.ListAPIView):
    """
    GET /api/messages/threads/
    List patient's message threads.
    """
    serializer_class = MessageThreadSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatientUser]

    def get_queryset(self):
        return MessageThread.objects.filter(
            patient=self.request.user
        ).select_related("staff")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class PatientMessageThreadCreateView(generics.CreateAPIView):
    """
    POST /api/messages/threads/create/
    Create a new message thread.
    """
    serializer_class = MessageThreadSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatientUser]

    def perform_create(self, serializer):
        staff_id = self.request.data.get('staff')
        staff_user = None
        if staff_id:
            staff_user = get_object_or_404(
                User,
                id=staff_id,
                role__in=[User.Role.STAFF, User.Role.ADMIN]
            )
        serializer.save(
            patient=self.request.user,
            staff=staff_user,
            last_message_at=timezone.now()
        )


class MessageThreadDetailView(generics.RetrieveAPIView):
    """
    GET /api/messages/threads/<id>/
    View thread with all messages.
    """
    serializer_class = MessageThreadDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in (User.Role.STAFF, User.Role.ADMIN):
            return MessageThread.objects.all()
        return MessageThread.objects.filter(patient=user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Mark messages as read for the current user
        Message.objects.filter(
            thread=instance, is_read=False
        ).exclude(sender=request.user).update(is_read=True, read_at=timezone.now())
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class MessageCreateView(generics.CreateAPIView):
    """
    POST /api/messages/threads/<thread_id>/messages/
    Send a message in a thread.
    """
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        thread_id = self.kwargs.get("thread_id")
        thread = get_object_or_404(MessageThread, id=thread_id)
        
        # Check permissions
        user = self.request.user
        if user.role == User.Role.PATIENT and thread.patient != user:
            raise serializers.ValidationError(
                {"error": "You can only message in your own threads"}
            )
        
        serializer.save(thread=thread, sender=user)
        thread.last_message_at = timezone.now()
        thread.save()


class StaffMessageThreadListView(generics.ListAPIView):
    """
    GET /api/staff/messages/threads/
    List all message threads (staff view).
    """
    serializer_class = MessageThreadSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]
    queryset = MessageThread.objects.select_related("patient", "staff")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class StaffMessageThreadUpdateView(generics.UpdateAPIView):
    """
    PATCH /api/staff/messages/threads/<id>/
    Update thread (assign staff, change status).
    """
    serializer_class = MessageThreadSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]
    queryset = MessageThread.objects.all()


# ==================== LAB RESULTS VIEWS ====================

class LabTestListView(generics.ListAPIView):
    """
    GET /api/lab-tests/
    List all active lab tests.
    """
    queryset = LabTest.objects.filter(is_active=True)
    serializer_class = LabTestSerializer
    permission_classes = [permissions.IsAuthenticated]


class PatientLabOrderListView(generics.ListAPIView):
    """
    GET /api/lab-orders/me/
    List patient's lab orders.
    """
    serializer_class = LabOrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatientUser]

    def get_queryset(self):
        ensure_patient_default_data(self.request.user)
        return LabOrder.objects.filter(patient=self.request.user).select_related(
            "test", "ordered_by"
        ).prefetch_related("result__values")


class PatientLabOrderDetailView(generics.RetrieveAPIView):
    """
    GET /api/lab-orders/<id>/
    View lab order details with results.
    """
    serializer_class = LabOrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in (User.Role.STAFF, User.Role.ADMIN):
            return LabOrder.objects.all()
        return LabOrder.objects.filter(patient=user)


class StaffLabOrderListView(generics.ListAPIView):
    """
    GET /api/staff/lab-orders/
    List all lab orders (staff view).
    """
    serializer_class = LabOrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]
    queryset = LabOrder.objects.select_related("patient", "test", "ordered_by")


class StaffLabOrderCreateView(generics.CreateAPIView):
    """
    POST /api/staff/lab-orders/
    Create a lab order (staff only).
    """
    serializer_class = LabOrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]

    def perform_create(self, serializer):
        test_name = serializer.validated_data.pop("test_name_input", "").strip()
        if not test_name:
            raise serializers.ValidationError({"test_name_input": "A test name is required."})
        lab_test, _ = LabTest.objects.get_or_create(
            name__iexact=test_name,
            defaults={"name": test_name, "category": LabTest.Category.OTHER},
        )
        serializer.save(ordered_by=self.request.user, test=lab_test)


class StaffLabOrderUpdateView(generics.UpdateAPIView):
    """
    PATCH /api/staff/lab-orders/<id>/
    Update lab order status (staff only).
    """
    serializer_class = LabOrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]
    queryset = LabOrder.objects.all()


class StaffLabResultCreateView(generics.CreateAPIView):
    """
    POST /api/staff/lab-results/
    Create lab result (staff only).
    """
    serializer_class = LabResultSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]

    def perform_create(self, serializer):
        serializer.save(reviewed_by=self.request.user)


class StaffLabResultUpdateView(generics.UpdateAPIView):
    """
    PATCH /api/staff/lab-results/<id>/
    Update lab result (staff only).
    """
    serializer_class = LabResultSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]
    queryset = LabResult.objects.all()


class StaffLabResultValueCreateView(generics.CreateAPIView):
    """
    POST /api/staff/lab-results/<result_id>/values/
    Add values to a lab result.
    """
    serializer_class = LabResultValueSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]

    def perform_create(self, serializer):
        result_id = self.kwargs.get("result_id")
        result = get_object_or_404(LabResult, id=result_id)
        serializer.save(result=result)


# ==================== BILLING VIEWS ====================

class BillableServiceListView(generics.ListAPIView):
    """
    GET /api/billable-services/
    List all active billable services.
    """
    queryset = BillableService.objects.filter(is_active=True)
    serializer_class = BillableServiceSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]


class PatientBillListView(generics.ListAPIView):
    """
    GET /api/bills/me/
    List patient's bills.
    """
    serializer_class = BillSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatientUser]

    def get_queryset(self):
        ensure_patient_default_data(self.request.user)
        return Bill.objects.filter(patient=self.request.user).prefetch_related(
            "line_items__service", "payments"
        )


class PatientBillDetailView(generics.RetrieveAPIView):
    """
    GET /api/bills/<id>/
    View bill details.
    """
    serializer_class = BillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in (User.Role.STAFF, User.Role.ADMIN):
            return Bill.objects.all()
        return Bill.objects.filter(patient=user)


class StaffBillListView(generics.ListAPIView):
    """
    GET /api/staff/bills/
    List all bills (staff view).
    """
    serializer_class = BillSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]
    queryset = Bill.objects.select_related("patient", "related_appointment")


class StaffBillCreateView(generics.CreateAPIView):
    """
    POST /api/staff/bills/create/
    Create a new bill (staff only).
    """
    serializer_class = StaffBillWriteSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        bill = serializer.save()  # bill_number auto-generated by Bill.save()
        # Set balance_due equal to patient_responsibility on creation
        if bill.patient_responsibility:
            bill.balance_due = bill.patient_responsibility
            bill.save(update_fields=["balance_due"])
        return Response(
            BillSerializer(bill).data,
            status=status.HTTP_201_CREATED
        )


class StaffBillUpdateView(generics.UpdateAPIView):
    """
    PATCH /api/staff/bills/<id>/
    Update bill (staff only).
    """
    serializer_class = StaffBillWriteSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]
    queryset = Bill.objects.all()
    http_method_names = ["patch"]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        bill = serializer.save()
        return Response(BillSerializer(bill).data)


class StaffBillLineItemCreateView(generics.CreateAPIView):
    """
    POST /api/staff/bills/<bill_id>/line-items/
    Add line item to a bill.
    """
    serializer_class = BillLineItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]

    def perform_create(self, serializer):
        bill_id = self.kwargs.get("bill_id")
        bill = get_object_or_404(Bill, id=bill_id)
        serializer.save(bill=bill)
        # Recalculate bill totals
        bill.calculate_totals()


class BillPaymentCreateView(generics.CreateAPIView):
    """
    POST /api/bills/<bill_id>/payments/
    Record a payment for a bill.
    """
    serializer_class = BillPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        from rest_framework.exceptions import PermissionDenied
        bill_id = self.kwargs.get("bill_id")
        bill = get_object_or_404(Bill, id=bill_id)

        # Check if patient owns bill or if staff
        user = self.request.user
        if user.role == User.Role.PATIENT and bill.patient != user:
            raise PermissionDenied("You can only pay your own bills.")

        transaction_id = ""
        stripe_pm_id = self.request.data.get("stripe_payment_method_id")

        if stripe_pm_id:
            # ── Real Stripe charge ─────────────────────────────────────────
            import stripe as stripe_lib
            from django.conf import settings
            if not settings.STRIPE_SECRET_KEY:
                raise serializers.ValidationError(
                    {"error": "Stripe is not configured on this server."}
                )
            stripe_lib.api_key = settings.STRIPE_SECRET_KEY
            amount_dollars = float(self.request.data.get("amount", 0))
            try:
                intent = stripe_lib.PaymentIntent.create(
                    amount=int(round(amount_dollars * 100)),  # cents
                    currency=settings.STRIPE_CURRENCY,
                    payment_method=stripe_pm_id,
                    confirm=True,
                    automatic_payment_methods={
                        "enabled": True,
                        "allow_redirects": "never",
                    },
                )
                transaction_id = intent.id
            except stripe_lib.error.CardError as e:
                raise serializers.ValidationError({"error": e.user_message})
            except stripe_lib.error.StripeError as e:
                raise serializers.ValidationError({"error": str(e)})
        # ── Demo mode: no Stripe call, just record ─────────────────────────

        payment = serializer.save(bill=bill, transaction_id=transaction_id)

        # Update bill totals
        bill.amount_paid += payment.amount
        bill.balance_due = bill.patient_responsibility - bill.amount_paid
        if bill.balance_due <= 0:
            bill.status = Bill.Status.PAID
        elif bill.amount_paid > 0:
            bill.status = Bill.Status.PARTIALLY_PAID
        bill.save()


# ==================== FAMILY MANAGEMENT VIEWS ====================

class PatientFamilyMemberListView(generics.ListAPIView):
    """
    GET /api/family-members/
    List patient's family members.
    """
    serializer_class = FamilyMemberSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatientUser]

    def get_queryset(self):
        return FamilyMember.objects.filter(
            primary_account=self.request.user
        ).select_related("member_user")


class PatientFamilyMemberCreateView(generics.CreateAPIView):
    """
    POST /api/family-members/
    Add a family member.
    """
    serializer_class = FamilyMemberSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatientUser]

    def perform_create(self, serializer):
        serializer.save(primary_account=self.request.user)


class PatientFamilyMemberDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PATCH/DELETE /api/family-members/<id>/
    Manage family member.
    """
    serializer_class = FamilyMemberSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatientUser]

    def get_queryset(self):
        return FamilyMember.objects.filter(primary_account=self.request.user)


class PatientMyDoctorsView(generics.ListAPIView):
    """
    GET /api/my-doctors/
    Returns the authenticated patient's assigned doctors plus any doctors
    marked is_accessible_to_all (e.g. Dr. Admin).
    """
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatientUser]

    def get_queryset(self):
        user = self.request.user
        # Doctors directly assigned to this patient
        try:
            profile = user.patient_profile
            assigned = profile.assigned_doctors.all()
        except PatientProfile.DoesNotExist:
            assigned = Doctor.objects.none()
        # Union with globally accessible doctors
        accessible = Doctor.objects.filter(is_accessible_to_all=True)
        return (assigned | accessible).distinct().order_by('name')


class StaffPatientAssignedDoctorsView(APIView):
    """
    GET  /api/staff/patients/<patient_id>/assigned-doctors/  — list assigned
    POST /api/staff/patients/<patient_id>/assigned-doctors/  — assign {doctor_id}
    """
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]

    def _get_profile(self, patient_id):
        patient = get_object_or_404(User, id=patient_id, role=User.Role.PATIENT)
        profile, _ = PatientProfile.objects.get_or_create(user=patient)
        return profile

    def get(self, request, patient_id):
        profile = self._get_profile(patient_id)
        doctors = profile.assigned_doctors.all().order_by('name')
        return Response(DoctorSerializer(doctors, many=True).data)

    def post(self, request, patient_id):
        profile = self._get_profile(patient_id)
        doctor_id = request.data.get('doctor_id')
        doctor = get_object_or_404(Doctor, id=doctor_id)
        profile.assigned_doctors.add(doctor)
        return Response({'status': 'assigned', 'doctor': DoctorSerializer(doctor).data},
                        status=status.HTTP_200_OK)


class StaffPatientRemoveAssignedDoctorView(APIView):
    """
    DELETE /api/staff/patients/<patient_id>/assigned-doctors/<doctor_id>/
    """
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]

    def delete(self, request, patient_id, doctor_id):
        patient = get_object_or_404(User, id=patient_id, role=User.Role.PATIENT)
        profile, _ = PatientProfile.objects.get_or_create(user=patient)
        doctor = get_object_or_404(Doctor, id=doctor_id)
        profile.assigned_doctors.remove(doctor)
        return Response({'status': 'removed'}, status=status.HTTP_200_OK)


class StaffAllDoctorsView(generics.ListAPIView):
    """
    GET /api/staff/all-doctors/
    Full list of doctors for staff to pick from when assigning.
    """
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]
    queryset = Doctor.objects.all().order_by('name')


class StaffFamilyMemberListView(generics.ListAPIView):
    """
    GET /api/staff/family-members/
    List all family member relationships (staff view).
    """
    serializer_class = FamilyMemberSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]
    queryset = FamilyMember.objects.select_related("primary_account", "member_user")


class CareerApplicationCreateView(generics.CreateAPIView):
    """
    POST /api/careers/applications/
    Public endpoint for submitting career applications with resume upload.
    """
    serializer_class = JobApplicationCreateSerializer
    permission_classes = [permissions.AllowAny]


class AdminJobApplicationListView(generics.ListAPIView):
    """
    GET /api/admin/applications/
    List all job applications (admin only).
    """
    serializer_class = JobApplicationAdminSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    queryset = JobApplication.objects.all().order_by("-created_at")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class AdminJobApplicationDeleteView(APIView):
    """
    DELETE /api/admin/applications/<application_id>/
    Delete a job application (admin only).
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def delete(self, request, application_id):
        application = get_object_or_404(JobApplication, id=application_id)
        application.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminJobApplicationResumeDownloadView(APIView):
    """
    GET /api/admin/applications/<application_id>/resume/
    Download applicant resume file (admin only).
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request, application_id):
        application = get_object_or_404(JobApplication, id=application_id)
        if not application.resume:
            raise Http404("Resume file not found")

        response = FileResponse(application.resume.open("rb"), as_attachment=True)
        response["Content-Disposition"] = f'attachment; filename="{application.resume.name.split('/')[-1]}"'
        return response


# ==================== ADMIN VIEWS ====================

class AdminUserListView(APIView):
    """
    GET /api/admin/users/
    List all non-admin users with their roles.
    """
    serializer_class = AdminUserListItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request):
        users = User.objects.exclude(role=User.Role.ADMIN).order_by("last_name", "first_name", "email")
        data = [
            {
                "id": u.id,
                "email": u.email,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "role": u.role,
                "date_joined": u.date_joined,
            }
            for u in users
        ]
        return Response(data)


class AdminUserRoleUpdateView(APIView):
    """
    PATCH /api/admin/users/<user_id>/role/
    Promote a patient to staff or demote a staff member to patient.
    """
    serializer_class = AdminUserRoleUpdateRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def patch(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if user.role == User.Role.ADMIN:
            return Response({"error": "Cannot change the role of an admin account."}, status=status.HTTP_400_BAD_REQUEST)

        new_role = request.data.get("role")
        if new_role not in (User.Role.PATIENT, User.Role.STAFF):
            return Response({"error": "Invalid role. Must be PATIENT or STAFF."}, status=status.HTTP_400_BAD_REQUEST)

        user.role = new_role
        if new_role == User.Role.STAFF:
            user.is_staff = True
            StaffProfile.objects.get_or_create(user=user)
        else:
            user.is_staff = False
            PatientProfile.objects.get_or_create(user=user)

        user.save()

        return Response({
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
        })

