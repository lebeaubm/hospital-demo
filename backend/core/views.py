from django.db.models import Q
from django.utils.dateparse import parse_datetime
from rest_framework import generics, permissions
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Appointment, Doctor, PatientProfile, StaffProfile
from .permissions import IsAppointmentOwner, IsPatientUser, IsStaffUser
from .serializers import (
    AppointmentSerializer,
    DoctorSerializer,
    PatientProfileSerializer,
    RegisterSerializer,
    StaffAppointmentUpdateSerializer,
    StaffProfileSerializer,
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
        serializer.save(
            patient=self.request.user,
            status=Appointment.Status.REQUESTED,
            scheduled_start=None,
            staff_notes="",
        )


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
