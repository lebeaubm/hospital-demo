from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0013_jobapplication'),
    ]

    operations = [
        migrations.AlterField(
            model_name='jobapplication',
            name='resume',
            field=models.FileField(blank=True, null=True, upload_to='career_resumes/'),
        ),
    ]
