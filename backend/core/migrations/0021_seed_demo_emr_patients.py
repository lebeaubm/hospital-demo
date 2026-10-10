from datetime import date, timedelta

from django.db import migrations
from django.utils import timezone


def seed_patients(apps, schema_editor):
    Patient = apps.get_model("core", "DemoEMRPatient")
    Note = apps.get_model("core", "DemoEMRNote")
    alias = schema_editor.connection.alias
    now = timezone.now()
    profiles = [
        ("EMR-001", "Elena Brooks", date(1958, 4, 12), "Home mobility support", ["Penicillin"], ["Medication A — per care plan", "Medication B — as needed per care plan"], ["Review medication list", "Assess mobility", "Review home safety"], "Home visits focus on mobility, daily routines, and care-plan follow-up."),
        ("EMR-002", "Marcus Reed", date(1972, 9, 6), "Post-visit recovery support", ["No known allergies recorded"], ["Medication C — per care plan"], ["Record vital signs", "Review comfort measures", "Review follow-up schedule"], "Visits focus on recovery progress, comfort, and scheduled follow-up."),
        ("EMR-003", "June Parker", date(1946, 2, 21), "Daily living support", ["Latex"], ["Medication D — per care plan"], ["Review hydration log", "Assess daily activity", "Check caregiver follow-up"], "Visits focus on daily activities, caregiver communication, and continued support at home."),
    ]
    for index, (number, name, dob, condition, allergies, medications, plan, history) in enumerate(profiles):
        patient, created = Patient.objects.using(alias).get_or_create(chart_number=number, defaults={"full_name": name, "date_of_birth": dob, "primary_condition": condition, "allergies": allergies, "medications": medications, "care_plan": plan, "history": history})
        if created:
            Note.objects.using(alias).create(
                patient=patient, author_name="Nursing Team", finalized_by_name="Nursing Team",
                status="FINAL", finalized_at=now - timedelta(days=1), visit_at=now - timedelta(days=1),
                assessment="Patient reports no new concerns during the scheduled home visit.",
                interventions="Reviewed daily routines and the current care plan.",
                response="Patient participated in the visit and discussed follow-up needs.",
                plan="Continue scheduled visits and review progress at the next appointment.",
                vitals={"systolic": 118 + index * 4, "diastolic": 74 + index * 2, "pulse": 72 + index * 3, "respirations": 16, "temperature": 36.7, "oxygen": 97, "pain": index, "weight": 67 + index * 5},
                completed_tasks=plan[:1],
            )


class Migration(migrations.Migration):
    dependencies = [("core", "0020_demoemrnote_client_id")]
    operations = [migrations.RunPython(seed_patients, migrations.RunPython.noop)]
