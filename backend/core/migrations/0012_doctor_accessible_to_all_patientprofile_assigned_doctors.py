from django.db import migrations, models


def add_admin_doctor(apps, schema_editor):
    """Create a 'Dr. Admin' fallback doctor accessible to all patients."""
    Doctor = apps.get_model('core', 'Doctor')
    Doctor.objects.get_or_create(
        name='Dr. Admin',
        defaults={
            'specialty': 'General Practice',
            'bio': 'General practice doctor available to all patients.',
            'years_experience': 0,
            'is_accessible_to_all': True,
        }
    )
    # Also mark any existing doctor named 'Dr. Admin' as accessible to all
    Doctor.objects.filter(name='Dr. Admin').update(is_accessible_to_all=True)


def remove_admin_doctor(apps, schema_editor):
    Doctor = apps.get_model('core', 'Doctor')
    Doctor.objects.filter(name='Dr. Admin', specialty='General Practice').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0011_billableservice_labtest_pharmacy_bill_billlineitem_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='doctor',
            name='is_accessible_to_all',
            field=models.BooleanField(
                default=False,
                help_text='If true, all patients can book this doctor regardless of assignment.',
            ),
        ),
        migrations.AddField(
            model_name='patientprofile',
            name='assigned_doctors',
            field=models.ManyToManyField(
                blank=True,
                help_text='Doctors this patient is allowed to book appointments with.',
                related_name='assigned_patients',
                to='core.doctor',
            ),
        ),
        migrations.RunPython(add_admin_doctor, remove_admin_doctor),
    ]
