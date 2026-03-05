from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from .models import (
    Appointment,
    Bill,
    BillableService,
    BillLineItem,
    BillPayment,
    Doctor,
    FamilyMember,
    Invoice,
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
    Payment,
    Pharmacy,
    Prescription,
    PrescriptionRefill,
    StaffProfile,
)

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("id", "email", "password", "first_name", "last_name")

    def create(self, validated_data):
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)


class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = ("id", "name", "specialty", "bio", "years_experience", "location", "is_accessible_to_all")


class PatientProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    first_name = serializers.CharField(
        source="user.first_name", required=False, allow_blank=True, allow_null=True
    )
    last_name = serializers.CharField(
        source="user.last_name", required=False, allow_blank=True, allow_null=True
    )

    class Meta:
        model = PatientProfile
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "date_of_birth",
            "phone_number",
            "address",
            "emergency_contact_name",
            "emergency_contact_phone",
            "insurance_provider",
            "insurance_policy_number",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "email", "created_at", "updated_at")

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        if user_data:
            for attr, value in user_data.items():
                setattr(instance.user, attr, value)
            instance.user.save(
                update_fields=[field for field in user_data.keys()]
            )
        return super().update(instance, validated_data)


class StaffProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    first_name = serializers.CharField(
        source="user.first_name", required=False, allow_blank=True, allow_null=True
    )
    last_name = serializers.CharField(
        source="user.last_name", required=False, allow_blank=True, allow_null=True
    )

    class Meta:
        model = StaffProfile
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "department",
            "position",
            "phone_number",
            "office_location",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "email", "created_at", "updated_at")

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        if user_data:
            for attr, value in user_data.items():
                setattr(instance.user, attr, value)
            instance.user.save(
                update_fields=[field for field in user_data.keys()]
            )
        return super().update(instance, validated_data)


class StaffPatientListItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    email = serializers.EmailField()


class StaffUserListItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    role = serializers.CharField()


class AdminUserListItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    email = serializers.EmailField()
    first_name = serializers.CharField(allow_blank=True, required=False)
    last_name = serializers.CharField(allow_blank=True, required=False)
    role = serializers.CharField()
    date_joined = serializers.DateTimeField()


class AdminUserRoleUpdateRequestSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=[User.Role.PATIENT, User.Role.STAFF])


class JobApplicationCreateSerializer(serializers.ModelSerializer):
    resume = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = JobApplication
        fields = (
            "id",
            "full_name",
            "email",
            "phone_number",
            "position",
            "cover_letter",
            "resume",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate_resume(self, value):
        allowed_extensions = [".pdf", ".doc", ".docx"]
        file_ext = f".{value.name.lower().split('.')[-1]}"
        if file_ext not in allowed_extensions:
            raise serializers.ValidationError(
                f"Resume file type not allowed. Allowed types: {', '.join(allowed_extensions)}"
            )

        max_size = 10 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("Resume file exceeds maximum size of 10MB.")

        return value


class JobApplicationAdminSerializer(serializers.ModelSerializer):
    resume_download_url = serializers.SerializerMethodField()

    class Meta:
        model = JobApplication
        fields = (
            "id",
            "full_name",
            "email",
            "phone_number",
            "position",
            "cover_letter",
            "resume_download_url",
            "created_at",
        )

    def get_resume_download_url(self, obj):
        if not obj.resume:
            return None
        request = self.context.get("request")
        relative_url = f"/api/admin/applications/{obj.id}/resume/"
        if request:
            return request.build_absolute_uri(relative_url)
        return relative_url


class AppointmentSerializer(serializers.ModelSerializer):
    patient_email = serializers.EmailField(source="patient.email", read_only=True)
    patient_name = serializers.SerializerMethodField()
    patient_id = serializers.IntegerField(source="patient.id", read_only=True)
    doctor_id = serializers.IntegerField(source="doctor.id", read_only=True, allow_null=True)
    doctor_name = serializers.CharField(source="doctor.name", read_only=True, allow_null=True)
    doctor_specialty = serializers.CharField(source="doctor.specialty", read_only=True, allow_null=True)

    class Meta:
        model = Appointment
        fields = (
            "id",
            "patient_id",
            "patient_email",
            "patient_name",
            "doctor",
            "doctor_id",
            "doctor_name",
            "doctor_specialty",
            "status",
            "requested_start",
            "scheduled_start",
            "reason",
            "patient_notes",
            "staff_notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "patient_id",
            "patient_email",
            "patient_name",
            "doctor_id",
            "doctor_name",
            "doctor_specialty",
            "status",
            "scheduled_start",
            "staff_notes",
            "created_at",
            "updated_at",
        )

    def get_patient_name(self, obj) -> str:
        full_name = f"{obj.patient.first_name} {obj.patient.last_name}".strip()
        return full_name or obj.patient.email


class StaffAppointmentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ("status", "scheduled_start", "staff_notes", "doctor")


class NotificationLogSerializer(serializers.ModelSerializer):
    """Serializer for NotificationLog model (read-only for staff)."""
    sent_by_email = serializers.EmailField(source="sent_by.email", read_only=True, allow_null=True)
    related_appointment_id = serializers.IntegerField(source="related_appointment.id", read_only=True, allow_null=True)
    
    class Meta:
        model = NotificationLog
        fields = (
            "id",
            "event_type",
            "to_email",
            "cc_emails",
            "subject",
            "body_text",
            "status",
            "error",
            "sent_by_email",
            "related_appointment_id",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class StaffSendEmailSerializer(serializers.Serializer):
    """Serializer for staff sending custom emails."""
    to_email = serializers.EmailField(required=True)
    subject = serializers.CharField(required=True, max_length=255)
    body = serializers.CharField(required=True, max_length=5000)
    appointment_id = serializers.IntegerField(required=False, allow_null=True)
    cc = serializers.ListField(
        child=serializers.EmailField(),
        required=False,
        allow_empty=True,
    )
    
    def validate_appointment_id(self, value):
        """Validate that the appointment exists if provided."""
        if value is not None:
            if not Appointment.objects.filter(id=value).exists():
                raise serializers.ValidationError(f"Appointment with id {value} does not exist.")
        return value


# Medical Records Serializers

class MedicalNoteSerializer(serializers.ModelSerializer):
    """Serializer for medical notes."""
    author_name = serializers.SerializerMethodField()
    shared_by_name = serializers.SerializerMethodField()

    class Meta:
        model = MedicalNote
        fields = (
            "id",
            "note_type",
            "content",
            "visibility",
            "author_name",
            "shared_at",
            "shared_by_name",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "author_name",
            "shared_at",
            "shared_by_name",
            "created_at",
            "updated_at",
        )

    def get_author_name(self, obj) -> str:
        if obj.author:
            return obj.author.get_full_name()
        return "Unknown"

    def get_shared_by_name(self, obj) -> str | None:
        if obj.shared_by:
            return obj.shared_by.get_full_name()
        return None


class MedicalNoteVisibilitySerializer(serializers.Serializer):
    """Serializer for toggling note visibility."""
    visibility = serializers.ChoiceField(choices=MedicalNote.Visibility.choices)


class MedicalDocumentSerializer(serializers.ModelSerializer):
    """Serializer for medical documents."""
    uploaded_by_name = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = MedicalDocument
        fields = (
            "id",
            "category",
            "visibility",
            "original_name",
            "mime_type",
            "size_bytes",
            "uploaded_by_name",
            "download_url",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "original_name",
            "mime_type",
            "size_bytes",
            "uploaded_by_name",
            "download_url",
            "created_at",
            "updated_at",
        )

    def get_uploaded_by_name(self, obj) -> str:
        if obj.uploaded_by:
            return obj.uploaded_by.get_full_name()
        return "Unknown"

    def get_download_url(self, obj) -> str:
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(f"/api/documents/{obj.id}/download/")
        return f"/api/documents/{obj.id}/download/"


class MedicalDocumentUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading medical documents."""
    file = serializers.FileField(required=True)

    class Meta:
        model = MedicalDocument
        fields = ("category", "visibility", "file")

    def validate_file(self, value):
        """Validate file type and size."""
        # Check file extension
        allowed_extensions = [".pdf", ".png", ".jpg", ".jpeg"]
        file_ext = value.name.lower().split(".")[-1]
        if f".{file_ext}" not in allowed_extensions:
            raise serializers.ValidationError(
                f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
            )

        # Check file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise serializers.ValidationError(
                f"File size exceeds maximum allowed size of {max_size / (1024 * 1024)}MB"
            )

        return value

    def create(self, validated_data):
        """Create document with file metadata."""
        file_obj = validated_data["file"]
        validated_data["original_name"] = file_obj.name
        validated_data["mime_type"] = file_obj.content_type or "application/octet-stream"
        validated_data["size_bytes"] = file_obj.size
        return super().create(validated_data)


class MedicalRecordSerializer(serializers.ModelSerializer):
    """Serializer for medical records with notes and documents."""
    notes = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()
    patient_email = serializers.EmailField(source="patient.user.email", read_only=True)
    patient_name = serializers.SerializerMethodField()

    class Meta:
        model = MedicalRecord
        fields = (
            "id",
            "patient_email",
            "patient_name",
            "history_text",
            "allergies_text",
            "medications_text",
            "notes",
            "documents",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "patient_email",
            "patient_name",
            "created_at",
            "updated_at",
        )

    def get_patient_name(self, obj) -> str:
        return obj.patient.user.get_full_name()

    def get_notes(self, obj) -> list[dict]:
        """Filter notes based on user's role."""
        request = self.context.get("request")
        user = request.user if request else None

        if not user or not user.is_authenticated:
            return []

        # Staff/Admin see all notes
        if user.role in (User.Role.STAFF, User.Role.ADMIN):
            notes = obj.notes.all()
        else:
            # Patients see only shared notes
            notes = obj.notes.filter(visibility=MedicalNote.Visibility.SHARED_WITH_PATIENT)

        return MedicalNoteSerializer(notes, many=True, context=self.context).data

    def get_documents(self, obj) -> list[dict]:
        """Filter documents based on user's role."""
        request = self.context.get("request")
        user = request.user if request else None

        if not user or not user.is_authenticated:
            return []

        # Staff/Admin see all documents
        if user.role in (User.Role.STAFF, User.Role.ADMIN):
            documents = obj.documents.all()
        else:
            # Patients see only PATIENT_AND_STAFF documents
            documents = obj.documents.filter(
                visibility=MedicalDocument.Visibility.PATIENT_AND_STAFF
            )

        return MedicalDocumentSerializer(documents, many=True, context=self.context).data


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model."""
    patient_email = serializers.EmailField(source="patient.email", read_only=True)
    patient_name = serializers.CharField(source="patient.get_full_name", read_only=True)
    appointment_id = serializers.IntegerField(source="appointment.id", read_only=True, allow_null=True)
    has_invoice = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = (
            "id",
            "patient",
            "patient_email",
            "patient_name",
            "appointment",
            "appointment_id",
            "amount",
            "currency",
            "status",
            "stripe_checkout_session_id",
            "stripe_payment_intent_id",
            "receipt_url",
            "paid_at",
            "created_at",
            "updated_at",
            "has_invoice",
        )
        read_only_fields = (
            "id",
            "patient",
            "patient_email",
            "patient_name",
            "appointment_id",
            "status",
            "stripe_checkout_session_id",
            "stripe_payment_intent_id",
            "receipt_url",
            "paid_at",
            "created_at",
            "updated_at",
            "has_invoice",
        )

    def get_has_invoice(self, obj) -> bool:
        """Check if payment has an associated invoice."""
        return hasattr(obj, "invoice")


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for Invoice model."""
    payment = PaymentSerializer(read_only=True)

    class Meta:
        model = Invoice
        fields = (
            "id",
            "payment",
            "invoice_number",
            "pdf_file",
            "generated_at",
        )
        read_only_fields = (
            "id",
            "payment",
            "invoice_number",
            "pdf_file",
            "generated_at",
        )


# ==================== PRESCRIPTION SERIALIZERS ====================

class PharmacySerializer(serializers.ModelSerializer):
    """Serializer for Pharmacy model."""
    
    class Meta:
        model = Pharmacy
        fields = (
            "id",
            "name",
            "address",
            "city",
            "state",
            "zip_code",
            "phone_number",
            "fax_number",
            "hours",
            "is_active",
        )


class PrescriptionSerializer(serializers.ModelSerializer):
    """Serializer for Prescription model."""
    patient_name = serializers.CharField(source="patient.get_full_name", read_only=True)
    patient_email = serializers.EmailField(source="patient.email", read_only=True)
    prescribed_by_name = serializers.CharField(source="prescribed_by.get_full_name", read_only=True)
    pharmacy_name = serializers.CharField(source="pharmacy.name", read_only=True)
    can_refill = serializers.SerializerMethodField()
    
    class Meta:
        model = Prescription
        fields = (
            "id",
            "patient",
            "patient_name",
            "patient_email",
            "prescribed_by",
            "prescribed_by_name",
            "medication_name",
            "dosage",
            "quantity",
            "refills_allowed",
            "refills_remaining",
            "instructions",
            "status",
            "pharmacy",
            "pharmacy_name",
            "prescribed_date",
            "expiration_date",
            "notes",
            "can_refill",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "patient",
            "patient_name",
            "patient_email",
            "prescribed_by_name",
            "pharmacy_name",
            "prescribed_date",
            "can_refill",
            "created_at",
            "updated_at",
        )

    def get_can_refill(self, obj) -> bool:
        """Check if prescription can be refilled."""
        return (
            obj.status == Prescription.Status.ACTIVE
            and obj.refills_remaining > 0
            and (obj.expiration_date is None or obj.expiration_date > timezone.now().date())
        )


class PrescriptionRefillSerializer(serializers.ModelSerializer):
    """Serializer for PrescriptionRefill model."""
    medication_name = serializers.CharField(source="prescription.medication_name", read_only=True)
    dosage = serializers.CharField(source="prescription.dosage", read_only=True)
    requested_by_name = serializers.CharField(source="requested_by.get_full_name", read_only=True)
    processed_by_name = serializers.CharField(source="processed_by.get_full_name", read_only=True)
    pharmacy_name = serializers.CharField(source="pharmacy.name", read_only=True)
    
    class Meta:
        model = PrescriptionRefill
        fields = (
            "id",
            "prescription",
            "medication_name",
            "dosage",
            "requested_by",
            "requested_by_name",
            "requested_at",
            "status",
            "pharmacy",
            "pharmacy_name",
            "processed_by",
            "processed_by_name",
            "processed_at",
            "notes",
        )
        read_only_fields = (
            "id",
            "prescription",
            "requested_by",
            "requested_by_name",
            "requested_at",
            "medication_name",
            "dosage",
            "processed_by_name",
            "pharmacy_name",
        )


# ==================== MESSAGING SERIALIZERS ====================

class MessageAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for MessageAttachment model."""
    
    class Meta:
        model = MessageAttachment
        fields = (
            "id",
            "file",
            "original_name",
            "mime_type",
            "size_bytes",
            "created_at",
        )
        read_only_fields = ("id", "created_at")


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message model."""
    sender_name = serializers.CharField(source="sender.get_full_name", read_only=True)
    sender_email = serializers.EmailField(source="sender.email", read_only=True)
    sender_role = serializers.CharField(source="sender.role", read_only=True)
    attachments = MessageAttachmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Message
        fields = (
            "id",
            "thread",
            "sender",
            "sender_name",
            "sender_email",
            "sender_role",
            "content",
            "is_read",
            "read_at",
            "attachments",
            "created_at",
        )
        read_only_fields = (
            "id",
            "thread",
            "sender",
            "sender_name",
            "sender_email",
            "sender_role",
            "is_read",
            "read_at",
            "created_at",
        )


class MessageThreadSerializer(serializers.ModelSerializer):
    """Serializer for MessageThread model."""
    patient_name = serializers.CharField(source="patient.get_full_name", read_only=True)
    staff_name = serializers.CharField(source="staff.get_full_name", read_only=True)
    unread_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()
    
    class Meta:
        model = MessageThread
        fields = (
            "id",
            "patient",
            "patient_name",
            "staff",
            "staff_name",
            "subject",
            "status",
            "unread_count",
            "last_message",
            "message_count",
            "created_at",
            "updated_at",
            "last_message_at",
        )
        read_only_fields = (
            "id",
            "patient",
            "patient_name",
            "staff",
            "staff_name",
            "unread_count",
            "last_message",
            "message_count",
            "created_at",
            "updated_at",
            "last_message_at",
        )

    def get_unread_count(self, obj) -> int:
        """Get count of unread messages for current user."""
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()

    def get_last_message(self, obj) -> dict | None:
        """Get the last message in thread."""
        last_msg = obj.messages.last()
        if last_msg:
            return {
                "content": last_msg.content[:100],
                "sender_name": last_msg.sender.get_full_name(),
                "created_at": last_msg.created_at,
            }
        return None

    def get_message_count(self, obj) -> int:
        """Get total message count."""
        return obj.messages.count()


class MessageThreadDetailSerializer(MessageThreadSerializer):
    """Detailed serializer with all messages."""
    messages = MessageSerializer(many=True, read_only=True)
    
    class Meta(MessageThreadSerializer.Meta):
        fields = MessageThreadSerializer.Meta.fields + ("messages",)


# ==================== LAB RESULTS SERIALIZERS ====================

class LabTestSerializer(serializers.ModelSerializer):
    """Serializer for LabTest model."""
    
    class Meta:
        model = LabTest
        fields = (
            "id",
            "name",
            "category",
            "description",
            "typical_turnaround_days",
            "is_active",
        )


class LabResultValueSerializer(serializers.ModelSerializer):
    """Serializer for LabResultValue model."""
    
    class Meta:
        model = LabResultValue
        fields = (
            "id",
            "parameter_name",
            "value",
            "unit",
            "reference_range",
            "is_abnormal",
            "flag",
        )
        read_only_fields = ("id", "result")


class LabResultSerializer(serializers.ModelSerializer):
    """Serializer for LabResult model."""
    reviewed_by_name = serializers.CharField(source="reviewed_by.get_full_name", read_only=True)
    values = LabResultValueSerializer(many=True, read_only=True)
    test_name = serializers.CharField(source="order.test.name", read_only=True)
    
    class Meta:
        model = LabResult
        fields = (
            "id",
            "order",
            "test_name",
            "result_date",
            "status",
            "reviewed_by",
            "reviewed_by_name",
            "interpretation",
            "is_critical",
            "pdf_report",
            "values",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "reviewed_by",
            "reviewed_by_name",
            "test_name",
            "created_at",
            "updated_at",
        )


class LabOrderSerializer(serializers.ModelSerializer):
    """Serializer for LabOrder model."""
    patient_name = serializers.CharField(source="patient.get_full_name", read_only=True)
    ordered_by_name = serializers.CharField(source="ordered_by.get_full_name", read_only=True)
    test_name = serializers.CharField(source="test.name", read_only=True)
    test_category = serializers.CharField(source="test.category", read_only=True)
    test_name_input = serializers.CharField(write_only=True, required=False, allow_blank=True)
    result = LabResultSerializer(read_only=True)
    has_result = serializers.SerializerMethodField()
    
    class Meta:
        model = LabOrder
        fields = (
            "id",
            "patient",
            "patient_name",
            "ordered_by",
            "ordered_by_name",
            "test",
            "test_name",
            "test_category",
            "test_name_input",
            "status",
            "ordered_date",
            "collection_date",
            "priority",
            "notes",
            "result",
            "has_result",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "patient_name",
            "ordered_by",
            "ordered_by_name",
            "test",
            "test_name",
            "test_category",
            "ordered_date",
            "has_result",
            "created_at",
            "updated_at",
        )

    def get_has_result(self, obj) -> bool:
        """Check if order has a result."""
        return hasattr(obj, "result")


# ==================== BILLING SERIALIZERS ====================

class BillableServiceSerializer(serializers.ModelSerializer):
    """Serializer for BillableService model."""
    
    class Meta:
        model = BillableService
        fields = (
            "id",
            "code",
            "name",
            "category",
            "description",
            "default_price",
            "is_active",
        )


class BillLineItemSerializer(serializers.ModelSerializer):
    """Serializer for BillLineItem model."""
    service_code = serializers.CharField(source="service.code", read_only=True)
    service_name = serializers.CharField(source="service.name", read_only=True)
    
    class Meta:
        model = BillLineItem
        fields = (
            "id",
            "service",
            "service_code",
            "service_name",
            "description",
            "quantity",
            "unit_price",
            "total",
            "service_date",
        )
        read_only_fields = ("id", "total", "service_code", "service_name")


class BillPaymentSerializer(serializers.ModelSerializer):
    """Serializer for BillPayment model."""
    
    class Meta:
        model = BillPayment
        fields = (
            "id",
            "bill",
            "amount",
            "payment_method",
            "transaction_id",
            "payment_date",
            "notes",
            "created_at",
        )
        read_only_fields = ("id", "bill", "payment_date", "created_at")


class BillSerializer(serializers.ModelSerializer):
    """Serializer for Bill model."""
    patient_name = serializers.CharField(source="patient.get_full_name", read_only=True)
    patient_email = serializers.EmailField(source="patient.email", read_only=True)
    line_items = BillLineItemSerializer(many=True, read_only=True)
    payments = BillPaymentSerializer(many=True, read_only=True)
    appointment_reason = serializers.CharField(source="related_appointment.reason", read_only=True)
    
    class Meta:
        model = Bill
        fields = (
            "id",
            "patient",
            "patient_name",
            "patient_email",
            "bill_number",
            "related_appointment",
            "appointment_reason",
            "status",
            "subtotal",
            "tax",
            "insurance_covered",
            "patient_responsibility",
            "amount_paid",
            "balance_due",
            "bill_date",
            "due_date",
            "notes",
            "line_items",
            "payments",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "patient",
            "patient_name",
            "patient_email",
            "bill_number",
            "appointment_reason",
            "subtotal",
            "patient_responsibility",
            "amount_paid",
            "balance_due",
            "created_at",
            "updated_at",
        )


class StaffBillWriteSerializer(serializers.ModelSerializer):
    """Writable serializer for staff creating/updating bills. patient is writable."""

    class Meta:
        model = Bill
        fields = (
            "id",
            "patient",
            "bill_number",
            "related_appointment",
            "status",
            "patient_responsibility",
            "insurance_covered",
            "due_date",
            "notes",
        )
        read_only_fields = ("id", "bill_number")


# ==================== FAMILY MANAGEMENT SERIALIZERS ====================

class FamilyMemberSerializer(serializers.ModelSerializer):
    """Serializer for FamilyMember model."""
    member_email = serializers.EmailField(source="member_user.email", read_only=True)
    full_name = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    
    class Meta:
        model = FamilyMember
        fields = (
            "id",
            "primary_account",
            "member_user",
            "member_email",
            "first_name",
            "last_name",
            "full_name",
            "date_of_birth",
            "age",
            "relationship",
            "can_view_appointments",
            "can_manage_appointments",
            "can_view_medical_records",
            "can_view_messages",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "primary_account",
            "member_email",
            "full_name",
            "age",
            "created_at",
            "updated_at",
        )

    def get_full_name(self, obj) -> str:
        """Get full name of family member."""
        return obj.get_full_name()

    def get_age(self, obj) -> int | None:
        """Calculate age from date of birth."""
        if not obj.date_of_birth:
            return None
        today = timezone.now().date()
        age = today.year - obj.date_of_birth.year
        if today.month < obj.date_of_birth.month or (
            today.month == obj.date_of_birth.month and today.day < obj.date_of_birth.day
        ):
            age -= 1
        return age

