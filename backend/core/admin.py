from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

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


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ("email",)
    list_display = ("email", "role", "is_staff", "is_active")
    search_fields = ("email",)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "role")}),
        (
            "Permissions",
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        ("Important dates", {"fields": ("last_login",)}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2", "role", "is_staff", "is_active"),
            },
        ),
    )


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ("name", "specialty", "years_experience")
    search_fields = ("name", "specialty")


@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "phone_number", "date_of_birth", "insurance_provider")
    search_fields = ("user__email", "phone_number", "insurance_provider")
    autocomplete_fields = ("user",)


@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "department", "position", "phone_number", "office_location")
    search_fields = ("user__email", "department", "position")
    autocomplete_fields = ("user",)


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "status", "requested_start", "scheduled_start")
    list_filter = ("status",)
    search_fields = ("patient__email", "reason")
    autocomplete_fields = ("patient",)


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ("id", "event_type", "to_email", "status", "sent_by", "created_at")
    list_filter = ("event_type", "status", "created_at")
    search_fields = ("to_email", "subject", "body_text")
    readonly_fields = ("created_at", "updated_at")
    autocomplete_fields = ("sent_by", "related_appointment")
    date_hierarchy = "created_at"
    
    fieldsets = (
        ("Email Details", {
            "fields": ("event_type", "to_email", "cc_emails", "subject", "body_text")
        }),
        ("Status & Tracking", {
            "fields": ("status", "error", "sent_by", "related_appointment")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        }),
    )


@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "created_at", "updated_at")
    search_fields = ("patient__user__email", "patient__user__first_name", "patient__user__last_name")
    autocomplete_fields = ("patient",)
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Patient", {
            "fields": ("patient",)
        }),
        ("Medical Information", {
            "fields": ("history_text", "allergies_text", "medications_text")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        }),
    )


@admin.register(MedicalNote)
class MedicalNoteAdmin(admin.ModelAdmin):
    list_display = ("id", "record", "author", "note_type", "visibility", "created_at")
    list_filter = ("note_type", "visibility", "created_at")
    search_fields = ("record__patient__user__email", "author__email", "content")
    autocomplete_fields = ("record", "author", "shared_by")
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Note Details", {
            "fields": ("record", "author", "note_type", "content")
        }),
        ("Visibility & Sharing", {
            "fields": ("visibility", "shared_at", "shared_by")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        }),
    )


@admin.register(MedicalDocument)
class MedicalDocumentAdmin(admin.ModelAdmin):
    list_display = ("id", "original_name", "category", "visibility", "uploaded_by", "size_bytes", "created_at")
    list_filter = ("category", "visibility", "created_at")
    search_fields = ("record__patient__user__email", "uploaded_by__email", "original_name")
    autocomplete_fields = ("record", "uploaded_by")
    readonly_fields = ("original_name", "mime_type", "size_bytes", "created_at", "updated_at")

    fieldsets = (
        ("Document Details", {
            "fields": ("record", "uploaded_by", "category", "visibility")
        }),
        ("File Information", {
            "fields": ("file", "original_name", "mime_type", "size_bytes")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        }),
    )
