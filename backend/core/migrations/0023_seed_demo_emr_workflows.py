from datetime import timedelta

from django.db import migrations
from django.utils import timezone


def seed_workflows(apps, schema_editor):
    Patient = apps.get_model("core", "DemoEMRPatient")
    Assessment = apps.get_model("core", "DemoEMRAssessment")
    Visit = apps.get_model("core", "DemoEMRVisit")
    Task = apps.get_model("core", "DemoEMRTask")
    alias = schema_editor.connection.alias
    now = timezone.now()
    for index, patient in enumerate(Patient.objects.using(alias).filter(chart_number__in=("EMR-001", "EMR-002", "EMR-003"), is_active=True).order_by("chart_number")):
        Assessment.objects.using(alias).create(
            patient=patient, author_name="Nursing Team", observed_at=now - timedelta(days=1),
            findings={"orientation": "Alert and oriented", "breathing": "Unlabored", "mobility": "Needs assistance" if index != 1 else "Independent", "skin": "Intact", "nutrition": "Usual intake", "fall_concern": "Concern noted" if index == 0 else "No concern noted", "pain": index},
            notes="Sample observations from the scheduled home visit.",
        )
        visit = Visit.objects.using(alias).create(
            patient=patient, purpose="Home health follow-up", scheduled_start=now + timedelta(hours=2 + index * 3),
            created_by_name="Nursing Team",
        )
        Task.objects.using(alias).create(
            patient=patient, visit=visit, title=patient.care_plan[0] if patient.care_plan else "Review care plan",
            details="Review during the next scheduled visit.", due_at=now + timedelta(hours=-1 if index == 0 else 3 + index),
            priority="HIGH" if index == 0 else "NORMAL", created_by_name="Nursing Team",
        )


class Migration(migrations.Migration):
    dependencies = [("core", "0022_demoemrpatient_client_id_demoemrpatient_is_active_and_more")]
    operations = [migrations.RunPython(seed_workflows, migrations.RunPython.noop)]
