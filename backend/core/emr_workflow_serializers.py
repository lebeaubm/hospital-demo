import math

from django.utils import timezone
from rest_framework import serializers

from .models import DemoEMRAssessment, DemoEMRPatient, DemoEMRTask, DemoEMRVisit, User


ASSESSMENT_CHOICES = {
    "orientation": ("Alert and oriented", "Drowsy", "Confusion noted", "Unable to assess"),
    "breathing": ("Unlabored", "Concern noted", "Unable to assess"),
    "mobility": ("Independent", "Needs assistance", "Unable to assess"),
    "skin": ("Intact", "Concern noted", "Unable to assess"),
    "nutrition": ("Usual intake", "Reduced intake", "Unable to assess"),
    "fall_concern": ("No concern noted", "Concern noted", "Unable to assess"),
}


class DemoEMRPatientCreateSerializer(serializers.Serializer):
    client_id = serializers.UUIDField()
    full_name = serializers.CharField(max_length=150)
    date_of_birth = serializers.DateField()
    primary_condition = serializers.CharField(max_length=200)
    allergies = serializers.ListField(child=serializers.CharField(max_length=200), max_length=50, default=list)
    medications = serializers.ListField(child=serializers.CharField(max_length=200), max_length=50, default=list)
    care_plan = serializers.ListField(child=serializers.CharField(max_length=200), max_length=20, default=list)
    history = serializers.CharField(max_length=5000, allow_blank=True, default="")

    def validate_date_of_birth(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError("Birth date cannot be in the future.")
        return value

    def validate(self, data):
        for field in ("allergies", "medications", "care_plan"):
            data[field] = list(dict.fromkeys(data[field]))
        return data


class DemoEMRPatientStatusSerializer(serializers.Serializer):
    is_active = serializers.BooleanField()
    revision = serializers.IntegerField(min_value=1)


class DemoEMRAssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemoEMRAssessment
        fields = ("id", "client_id", "patient", "author_name", "observed_at", "findings", "notes", "created_at")
        read_only_fields = fields


class DemoEMRAssessmentInputSerializer(serializers.Serializer):
    client_id = serializers.UUIDField()
    observed_at = serializers.DateTimeField()
    findings = serializers.JSONField(default=dict)
    notes = serializers.CharField(max_length=5000, allow_blank=True, default="")

    def validate_findings(self, value):
        if not isinstance(value, dict) or set(value) - (set(ASSESSMENT_CHOICES) | {"pain"}):
            raise serializers.ValidationError("Use the listed assessment fields.")
        for key, finding in value.items():
            if key == "pain":
                if isinstance(finding, bool) or not isinstance(finding, (int, float)) or not math.isfinite(finding) or not 0 <= finding <= 10:
                    raise serializers.ValidationError("Pain must be a number from 0 to 10.")
            elif finding not in ASSESSMENT_CHOICES[key]:
                raise serializers.ValidationError(f"Select a listed value for {key}.")
        return value

    def validate(self, data):
        if not data["findings"] and not data["notes"].strip():
            raise serializers.ValidationError("Record at least one observation or a note.")
        return data


class DemoEMRAssignmentInputSerializer(serializers.Serializer):
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role__in=(User.Role.STAFF, User.Role.ADMIN), is_active=True),
        required=False, allow_null=True, default=None,
    )


class DemoEMRVisitInputSerializer(DemoEMRAssignmentInputSerializer):
    client_id = serializers.UUIDField()
    patient = serializers.PrimaryKeyRelatedField(queryset=DemoEMRPatient.objects.filter(is_active=True))
    purpose = serializers.CharField(max_length=200)
    scheduled_start = serializers.DateTimeField()


class DemoEMRTaskInputSerializer(DemoEMRAssignmentInputSerializer):
    client_id = serializers.UUIDField()
    patient = serializers.PrimaryKeyRelatedField(queryset=DemoEMRPatient.objects.filter(is_active=True))
    visit = serializers.PrimaryKeyRelatedField(queryset=DemoEMRVisit.objects.all(), required=False, allow_null=True, default=None)
    title = serializers.CharField(max_length=200)
    details = serializers.CharField(max_length=1000, allow_blank=True, default="")
    due_at = serializers.DateTimeField(required=False, allow_null=True, default=None)
    priority = serializers.ChoiceField(choices=DemoEMRTask.Priority.choices, default=DemoEMRTask.Priority.NORMAL)

    def validate(self, data):
        visit = data["visit"]
        if visit and (visit.patient_id != data["patient"].id or visit.status not in ("SCHEDULED", "IN_PROGRESS")):
            raise serializers.ValidationError({"visit": "Select an unfinished visit for this patient."})
        return data


class DemoEMRVisitSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    chart_number = serializers.CharField(source="patient.chart_number", read_only=True)

    class Meta:
        model = DemoEMRVisit
        fields = ("id", "patient", "patient_name", "chart_number", "purpose", "scheduled_start", "assigned_to", "assigned_name", "status", "revision", "created_by_name", "updated_by_name", "completed_at", "updated_at")
        read_only_fields = fields


class DemoEMRTaskSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    chart_number = serializers.CharField(source="patient.chart_number", read_only=True)

    class Meta:
        model = DemoEMRTask
        fields = ("id", "patient", "patient_name", "chart_number", "visit", "title", "details", "due_at", "priority", "assigned_to", "assigned_name", "status", "revision", "created_by_name", "completed_by_name", "completed_at", "updated_at")
        read_only_fields = fields


class DemoEMRVisitStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=DemoEMRVisit.Status.choices)
    revision = serializers.IntegerField(min_value=1)


class DemoEMRTaskStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=DemoEMRTask.Status.choices)
    revision = serializers.IntegerField(min_value=1)
