from django.db import migrations, models
from django.utils import timezone
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0016_alter_jobapplication_resume"),
    ]

    operations = [
        migrations.AddField(
            model_name="jobapplication",
            name="application_data",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="jobapplication",
            name="resume_content",
            field=models.BinaryField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="jobapplication",
            name="resume_original_filename",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="jobapplication",
            name="resume_storage_id",
            field=models.UUIDField(blank=True, editable=False, null=True),
        ),
        migrations.AddField(
            model_name="jobapplication",
            name="ssn_encrypted",
            field=models.CharField(blank=True, max_length=512),
        ),
        migrations.AddField(
            model_name="jobapplication",
            name="status",
            field=models.CharField(
                choices=[
                    ("NEW", "New"),
                    ("REVIEWING", "Reviewing"),
                    ("INTERVIEW", "Interview"),
                    ("OFFER", "Offer"),
                    ("HIRED", "Hired"),
                    ("NOT_SELECTED", "Not Selected"),
                ],
                default="NEW",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="jobapplication",
            name="submitted_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="jobapplication",
            name="updated_at",
            field=models.DateTimeField(default=timezone.now),
        ),
    ]