from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Appointment, Doctor, NotificationLog, PatientProfile, StaffProfile

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
    doctor_id = serializers.IntegerField(source="doctor.id", read_only=True, allow_null=True)
    doctor_name = serializers.CharField(source="doctor.name", read_only=True, allow_null=True)
    doctor_specialty = serializers.CharField(source="doctor.specialty", read_only=True, allow_null=True)

    class Meta:
        model = Appointment
        fields = (
            "id",
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
