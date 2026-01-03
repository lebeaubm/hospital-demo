from django.db import migrations


def seed_doctors(apps, schema_editor):
    Doctor = apps.get_model('core', 'Doctor')
    if Doctor.objects.exists():
        return

    Doctor.objects.bulk_create(
        [
            Doctor(
                name='Dr. Maya Chen',
                specialty='Cardiology',
                bio='Focused on preventive cardiology and patient education.',
                years_experience=12,
            ),
            Doctor(
                name='Dr. Rafael Ortiz',
                specialty='Orthopedics',
                bio='Sports injuries and joint replacement specialist.',
                years_experience=9,
            ),
            Doctor(
                name='Dr. Priya Nair',
                specialty='Pediatrics',
                bio='Committed to whole-family pediatric care.',
                years_experience=14,
            ),
        ]
    )


def remove_doctors(apps, schema_editor):
    Doctor = apps.get_model('core', 'Doctor')
    Doctor.objects.filter(
        name__in=['Dr. Maya Chen', 'Dr. Rafael Ortiz', 'Dr. Priya Nair']
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_doctors, remove_doctors),
    ]
