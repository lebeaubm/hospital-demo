from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from .models import (
    Appointment,
    Doctor,
    Invoice,
    MedicalDocument,
    MedicalNote,
    MedicalRecord,
    NotificationLog,
    PatientProfile,
    Payment,
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
        fields = ("id", "name", "specialty", "bio", "years_experience", "location")


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

    def get_patient_name(self, obj):
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

    def get_author_name(self, obj):
        if obj.author:
            return obj.author.get_full_name()
        return "Unknown"

    def get_shared_by_name(self, obj):
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

    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            return obj.uploaded_by.get_full_name()
        return "Unknown"

    def get_download_url(self, obj):
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

    def get_patient_name(self, obj):
        return obj.patient.user.get_full_name()

    def get_notes(self, obj):
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

    def get_documents(self, obj):
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

    def get_has_invoice(self, obj):
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
