from django.contrib.auth import get_user_model
from rest_framework import permissions

User = get_user_model()


class IsPatientUser(permissions.BasePermission):
    """
    Allows access only to authenticated patients.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.PATIENT
        )


class IsStaffUser(permissions.BasePermission):
    """
    Allows access to staff or admin users.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.role in (User.Role.STAFF, User.Role.ADMIN)
                or request.user.is_staff
            )
        )


class IsAppointmentOwner(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an appointment to access it.
    """

    def has_object_permission(self, request, view, obj):
        return bool(request.user and request.user.is_authenticated and obj.patient_id == request.user.id)
