from django.db.models import Q
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import generics, permissions, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import (
    Appointment,
    Doctor,
    MedicalDocument,
    MedicalNote,
    MedicalRecord,
    NotificationLog,
    PatientProfile,
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
from .permissions import IsAppointmentOwner, IsPatientUser, IsStaffUser
from .serializers import (
    AppointmentSerializer,
    DoctorSerializer,
    MedicalDocumentSerializer,
    MedicalDocumentUploadSerializer,
    MedicalNoteSerializer,
    MedicalNoteVisibilitySerializer,
    MedicalRecordSerializer,
    NotificationLogSerializer,
    PatientProfileSerializer,
    RegisterSerializer,
    StaffAppointmentUpdateSerializer,
    StaffProfileSerializer,
    StaffSendEmailSerializer,
)
from .serializers_jwt import CustomTokenObtainPairSerializer


class APIRootView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            "status": "✅ IT'S WORKING!",
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


class AppointmentCreateView(generics.CreateAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatientUser]

    def perform_create(self, serializer):
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
