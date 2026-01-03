from django.urls import path

from .views import (
    DoctorDetailView,
    DoctorListView,
    LoginView,
    RefreshView,
    RegisterView,
)

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/refresh/", RefreshView.as_view(), name="token_refresh"),
    path("doctors/", DoctorListView.as_view(), name="doctor_list"),
    path("doctors/<int:pk>/", DoctorDetailView.as_view(), name="doctor_detail"),
]
