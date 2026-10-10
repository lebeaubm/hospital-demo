import math

from rest_framework import serializers

from .models import DemoEMRNote, DemoEMRPatient


VITAL_LIMITS = {
    "systolic": (1, 400), "diastolic": (1, 300), "pulse": (1, 350),
    "respirations": (1, 100), "temperature": (20, 50),
    "oxygen": (0, 100), "pain": (0, 10), "weight": (1, 500),
}


class DemoEMRPatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemoEMRPatient
        fields = ("id", "chart_number", "full_name", "date_of_birth", "primary_condition", "allergies", "medications", "care_plan", "history", "is_active", "revision", "removed_at", "removed_by_name")


class DemoEMRNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemoEMRNote
        fields = ("id", "client_id", "patient", "author", "author_name", "visit_at", "assessment", "interventions", "response", "plan", "vitals", "completed_tasks", "status", "amendment_of", "revision", "finalized_by", "finalized_by_name", "finalized_at", "created_at", "updated_at")
        read_only_fields = fields


class DemoEMRNoteInputSerializer(serializers.Serializer):
    client_id = serializers.UUIDField(required=False)
    visit_at = serializers.DateTimeField()
    assessment = serializers.CharField(max_length=5000, allow_blank=True, default="")
    interventions = serializers.CharField(max_length=5000, allow_blank=True, default="")
    response = serializers.CharField(max_length=5000, allow_blank=True, default="")
    plan = serializers.CharField(max_length=5000, allow_blank=True, default="")
    vitals = serializers.JSONField(default=dict)
    completed_tasks = serializers.ListField(child=serializers.CharField(max_length=200), max_length=20, default=list)
    status = serializers.ChoiceField(choices=DemoEMRNote.Status.choices, default=DemoEMRNote.Status.DRAFT)
    revision = serializers.IntegerField(min_value=1, required=False)
    amendment_of = serializers.IntegerField(min_value=1, required=False, allow_null=True)

    def validate_vitals(self, value):
        if not isinstance(value, dict) or set(value) - set(VITAL_LIMITS):
            raise serializers.ValidationError("Use the listed vital-sign fields.")
        for key, number in value.items():
            low, high = VITAL_LIMITS[key]
            if isinstance(number, bool) or not isinstance(number, (int, float)) or not math.isfinite(number) or not low <= number <= high:
                raise serializers.ValidationError(f"{key}: enter a number between {low} and {high}.")
        return value

    def validate_completed_tasks(self, value):
        allowed = self.context["patient"].care_plan
        if len(value) != len(set(value)) or any(task not in allowed for task in value):
            raise serializers.ValidationError("Select tasks from this patient's care plan.")
        return value

    def validate(self, data):
        if data.get("status") == DemoEMRNote.Status.FINAL and not data.get("assessment", "").strip():
            raise serializers.ValidationError({"assessment": "Enter an assessment before finalizing."})
        return data
