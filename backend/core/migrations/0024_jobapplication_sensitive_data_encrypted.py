from django.db import migrations, models


def protect_existing_answers(apps, schema_editor):
    from core.security import encrypt_application_answers, protect_application_answers

    Application = apps.get_model("core", "JobApplication")
    alias = schema_editor.connection.alias
    for application in Application.objects.using(alias).only("id", "application_data").iterator(chunk_size=100):
        safe, protected = protect_application_answers(application.application_data)
        if protected:
            Application.objects.using(alias).filter(pk=application.pk).update(
                application_data=safe,
                sensitive_data_encrypted=encrypt_application_answers(protected),
            )


class Migration(migrations.Migration):
    dependencies = [("core", "0018_contactmessage")]

    operations = [
        migrations.AddField(
            model_name="jobapplication",
            name="sensitive_data_encrypted",
            field=models.TextField(blank=True, default="", editable=False),
        ),
        # Never turn stored sensitive answers back into plaintext during a rollback.
        migrations.RunPython(protect_existing_answers),
    ]
