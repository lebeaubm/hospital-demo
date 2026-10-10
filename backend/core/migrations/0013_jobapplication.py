from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0012_doctor_accessible_to_all_patientprofile_assigned_doctors'),
    ]

    operations = [
        migrations.CreateModel(
            name='JobApplication',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('full_name', models.CharField(max_length=255)),
                ('email', models.EmailField(max_length=254)),
                ('phone_number', models.CharField(blank=True, max_length=50)),
                ('position', models.CharField(max_length=255)),
                ('cover_letter', models.TextField(blank=True)),
                ('resume', models.FileField(upload_to='career_resumes/')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ('-created_at',),
            },
        ),
    ]
