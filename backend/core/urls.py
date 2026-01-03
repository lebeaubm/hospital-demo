from django.urls import path

from .views import (
    APIRootView,
    AppointmentCreateView,
    AppointmentDetailView,
    DoctorDetailView,
    DoctorListView,
    LoginView,
    MyAppointmentListView,
    PatientMeView,
    RefreshView,
    RegisterView,
    StaffAppointmentListView,
    StaffAppointmentUpdateView,
    StaffEmailLogDetailView,
    StaffEmailLogListView,
    StaffMeView,
    StaffSendEmailView,
)

urlpatterns = [
    path("", APIRootView.as_view(), name="api_root"),
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/refresh/", RefreshView.as_view(), name="token_refresh"),
    path("doctors/", DoctorListView.as_view(), name="doctor_list"),
    path("doctors/<int:pk>/", DoctorDetailView.as_view(), name="doctor_detail"),
    path("patients/me/", PatientMeView.as_view(), name="patient_me"),
    path("staff/me/", StaffMeView.as_view(), name="staff_me"),
    path("appointments/", AppointmentCreateView.as_view(), name="appointment_create"),
    path("appointments/my/", MyAppointmentListView.as_view(), name="appointment_list"),
    path("appointments/<int:pk>/", AppointmentDetailView.as_view(), name="appointment_detail"),
    path("staff/appointments/", StaffAppointmentListView.as_view(), name="staff_appointment_list"),
    path(
        "staff/appointments/<int:pk>/",
        StaffAppointmentUpdateView.as_view(),
        name="staff_appointment_update",
    ),
    path("staff/emails/", StaffEmailLogListView.as_view(), name="staff_email_log_list"),
    path("staff/emails/<int:pk>/", StaffEmailLogDetailView.as_view(), name="staff_email_log_detail"),
    path("staff/emails/send/", StaffSendEmailView.as_view(), name="staff_send_email"),
]
