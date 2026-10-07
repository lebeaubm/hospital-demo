import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0023_seed_demo_emr_workflows'),
        ('core', '0024_jobapplication_sensitive_data_encrypted'),
    ]

    operations = [
        migrations.AlterField(
            model_name='laborder',
            name='ordered_by',
            field=models.ForeignKey(limit_choices_to={'role__in': ['STAFF', 'OWNER', 'ADMIN']}, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='ordered_labs', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='labresult',
            name='reviewed_by',
            field=models.ForeignKey(limit_choices_to={'role__in': ['STAFF', 'OWNER', 'ADMIN']}, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_results', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='messagethread',
            name='staff',
            field=models.ForeignKey(limit_choices_to={'role__in': ['STAFF', 'OWNER', 'ADMIN']}, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='staff_threads', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='prescription',
            name='prescribed_by',
            field=models.ForeignKey(limit_choices_to={'role__in': ['STAFF', 'OWNER', 'ADMIN']}, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='prescribed_medications', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(choices=[('PATIENT', 'Patient'), ('STAFF', 'Staff'), ('OWNER', 'Owner'), ('ADMIN', 'Admin')], default='PATIENT', max_length=20),
        ),
    ]