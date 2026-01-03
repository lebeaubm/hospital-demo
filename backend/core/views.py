from django.utils.dateparse import parse_datetime
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Appointment, Doctor, PatientProfile
from .permissions import IsAppointmentOwner, IsPatientUser, IsStaffUser
from .serializers import (
    AppointmentSerializer,
    DoctorSerializer,
    PatientProfileSerializer,
    RegisterSerializer,
    StaffAppointmentUpdateSerializer,
)


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


class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]


class DoctorListView(generics.ListAPIView):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [permissions.AllowAny]


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


class StaffAppointmentListView(generics.ListAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]

    def get_queryset(self):
        qs = Appointment.objects.select_related("patient").all()
        status_param = self.request.query_params.get("status")
        patient_email = self.request.query_params.get("patient_email")
        scheduled_after = self.request.query_params.get("scheduled_after")
        scheduled_before = self.request.query_params.get("scheduled_before")

        if status_param:
            qs = qs.filter(status=status_param.upper())
        if patient_email:
            qs = qs.filter(patient__email__iexact=patient_email)

        if scheduled_after:
            parsed = parse_datetime(scheduled_after)
            if parsed:
                qs = qs.filter(scheduled_start__gte=parsed)
        if scheduled_before:
            parsed = parse_datetime(scheduled_before)
            if parsed:
                qs = qs.filter(scheduled_start__lte=parsed)
        return qs.order_by("-created_at")


class StaffAppointmentUpdateView(generics.UpdateAPIView):
    serializer_class = StaffAppointmentUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]
    queryset = Appointment.objects.all()
    http_method_names = ["patch"]
