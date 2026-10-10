from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import (
    Appointment,
    Bill,
    BillableService,
    BillLineItem,
    BillPayment,
    Doctor,
    FamilyMember,
    Invoice,
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
    Payment,
    Pharmacy,
    Prescription,
    PrescriptionRefill,
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


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "amount", "currency", "status", "paid_at", "created_at")
    list_filter = ("status", "currency", "paid_at", "created_at")
    search_fields = ("patient__email", "stripe_checkout_session_id", "stripe_payment_intent_id")
    readonly_fields = ("stripe_checkout_session_id", "stripe_payment_intent_id", "receipt_url", "paid_at", "created_at", "updated_at")
    autocomplete_fields = ("patient", "appointment")

    fieldsets = (
        ("Payment Details", {
            "fields": ("patient", "appointment", "amount", "currency", "status")
        }),
        ("Stripe Information", {
            "fields": ("stripe_checkout_session_id", "stripe_payment_intent_id", "receipt_url")
        }),
        ("Timestamps", {
            "fields": ("paid_at", "created_at", "updated_at")
        }),
    )


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("id", "invoice_number", "payment", "generated_at")
    list_filter = ("generated_at",)
    search_fields = ("invoice_number", "payment__patient__email")
    readonly_fields = ("invoice_number", "generated_at")
    autocomplete_fields = ("payment",)

    fieldsets = (
        ("Invoice Details", {
            "fields": ("payment", "invoice_number", "pdf_file")
        }),
        ("Timestamps", {
            "fields": ("generated_at",)
        }),
    )


# ==================== PRESCRIPTION ADMIN ====================

@admin.register(Pharmacy)
class PharmacyAdmin(admin.ModelAdmin):
    list_display = ("name", "city", "state", "phone_number", "is_active")
    list_filter = ("state", "is_active")
    search_fields = ("name", "city", "address", "phone_number")


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "medication_name", "dosage", "status", "refills_remaining", "prescribed_date")
    list_filter = ("status", "prescribed_date")
    search_fields = ("patient__email", "medication_name", "prescribed_by__email")
    autocomplete_fields = ("patient", "prescribed_by", "pharmacy")
    readonly_fields = ("prescribed_date", "created_at", "updated_at")

    fieldsets = (
        ("Patient & Provider", {
            "fields": ("patient", "prescribed_by")
        }),
        ("Medication Details", {
            "fields": ("medication_name", "dosage", "quantity", "instructions")
        }),
        ("Refills & Status", {
            "fields": ("refills_allowed", "refills_remaining", "status")
        }),
        ("Pharmacy & Dates", {
            "fields": ("pharmacy", "prescribed_date", "expiration_date")
        }),
        ("Additional Info", {
            "fields": ("notes",)
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        }),
    )


@admin.register(PrescriptionRefill)
class PrescriptionRefillAdmin(admin.ModelAdmin):
    list_display = ("id", "prescription", "requested_by", "status", "requested_at", "processed_at")
    list_filter = ("status", "requested_at", "processed_at")
    search_fields = ("prescription__medication_name", "requested_by__email", "processed_by__email")
    autocomplete_fields = ("prescription", "requested_by", "pharmacy", "processed_by")
    readonly_fields = ("requested_at",)


# ==================== MESSAGING ADMIN ====================

@admin.register(MessageThread)
class MessageThreadAdmin(admin.ModelAdmin):
    list_display = ("id", "subject", "patient", "staff", "status", "last_message_at", "created_at")
    list_filter = ("status", "created_at", "last_message_at")
    search_fields = ("subject", "patient__email", "staff__email")
    autocomplete_fields = ("patient", "staff")
    readonly_fields = ("created_at", "updated_at", "last_message_at")


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "thread", "sender", "is_read", "created_at")
    list_filter = ("is_read", "created_at")
    search_fields = ("thread__subject", "sender__email", "content")
    autocomplete_fields = ("thread", "sender")
    readonly_fields = ("created_at", "read_at")


@admin.register(MessageAttachment)
class MessageAttachmentAdmin(admin.ModelAdmin):
    list_display = ("id", "message", "original_name", "size_bytes", "created_at")
    search_fields = ("original_name", "message__thread__subject")
    autocomplete_fields = ("message",)
    readonly_fields = ("original_name", "mime_type", "size_bytes", "created_at")


# ==================== LAB RESULTS ADMIN ====================

@admin.register(LabTest)
class LabTestAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "typical_turnaround_days", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("name", "description")


@admin.register(LabOrder)
class LabOrderAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "test", "status", "priority", "ordered_date", "collection_date")
    list_filter = ("status", "priority", "ordered_date", "collection_date")
    search_fields = ("patient__email", "test__name", "ordered_by__email")
    autocomplete_fields = ("patient", "ordered_by", "test")
    readonly_fields = ("ordered_date", "created_at", "updated_at")


@admin.register(LabResult)
class LabResultAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "result_date", "status", "is_critical", "reviewed_by")
    list_filter = ("status", "is_critical", "result_date")
    search_fields = ("order__patient__email", "order__test__name", "reviewed_by__email")
    autocomplete_fields = ("order", "reviewed_by")
    readonly_fields = ("created_at", "updated_at")


@admin.register(LabResultValue)
class LabResultValueAdmin(admin.ModelAdmin):
    list_display = ("id", "result", "parameter_name", "value", "unit", "is_abnormal", "flag")
    list_filter = ("is_abnormal", "flag")
    search_fields = ("parameter_name", "result__order__test__name")
    autocomplete_fields = ("result",)


# ==================== BILLING ADMIN ====================

@admin.register(BillableService)
class BillableServiceAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "category", "default_price", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("code", "name", "description")


class BillLineItemInline(admin.TabularInline):
    model = BillLineItem
    extra = 1
    autocomplete_fields = ("service",)


class BillPaymentInline(admin.TabularInline):
    model = BillPayment
    extra = 0
    readonly_fields = ("payment_date", "created_at")


@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = ("bill_number", "patient", "status", "patient_responsibility", "balance_due", "bill_date", "due_date")
    list_filter = ("status", "bill_date", "due_date")
    search_fields = ("bill_number", "patient__email")
    autocomplete_fields = ("patient", "related_appointment")
    readonly_fields = ("bill_number", "bill_date", "created_at", "updated_at")
    inlines = [BillLineItemInline, BillPaymentInline]

    fieldsets = (
        ("Basic Information", {
            "fields": ("patient", "bill_number", "related_appointment", "status")
        }),
        ("Amounts", {
            "fields": ("subtotal", "tax", "insurance_covered", "patient_responsibility", "amount_paid", "balance_due")
        }),
        ("Dates", {
            "fields": ("bill_date", "due_date")
        }),
        ("Additional Info", {
            "fields": ("notes",)
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        }),
    )


@admin.register(BillLineItem)
class BillLineItemAdmin(admin.ModelAdmin):
    list_display = ("id", "bill", "service", "description", "quantity", "unit_price", "total", "service_date")
    list_filter = ("service_date",)
    search_fields = ("bill__bill_number", "service__name", "description")
    autocomplete_fields = ("bill", "service")


@admin.register(BillPayment)
class BillPaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "bill", "amount", "payment_method", "payment_date")
    list_filter = ("payment_method", "payment_date")
    search_fields = ("bill__bill_number", "transaction_id")
    autocomplete_fields = ("bill",)
    readonly_fields = ("payment_date", "created_at")


# ==================== FAMILY MANAGEMENT ADMIN ====================

@admin.register(FamilyMember)
class FamilyMemberAdmin(admin.ModelAdmin):
    list_display = ("id", "primary_account", "get_member_name", "relationship", "is_active")
    list_filter = ("relationship", "is_active", "created_at")
    search_fields = ("primary_account__email", "member_user__email", "first_name", "last_name")
    autocomplete_fields = ("primary_account", "member_user")
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Account Information", {
            "fields": ("primary_account", "member_user")
        }),
        ("Personal Information", {
            "fields": ("first_name", "last_name", "date_of_birth", "relationship")
        }),
        ("Permissions", {
            "fields": ("can_view_appointments", "can_manage_appointments", "can_view_medical_records", "can_view_messages")
        }),
        ("Status", {
            "fields": ("is_active",)
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        }),
    )

    def get_member_name(self, obj):
        """Display the member's full name."""
        return obj.get_full_name()
    get_member_name.short_description = "Member Name"

