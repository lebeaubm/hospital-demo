from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0017_expand_jobapplication"),
    ]

    operations = [
        migrations.CreateModel(
            name="ContactMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("full_name", models.CharField(max_length=255)),
                ("email", models.EmailField(max_length=254)),
                ("subject", models.CharField(max_length=200)),
                ("message", models.TextField(max_length=5000)),
                ("status", models.CharField(choices=[("NEW", "New"), ("REVIEWED", "Reviewed")], default="NEW", max_length=10)),
                ("is_demo", models.BooleanField(default=True, editable=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ("-created_at",),
            },
        ),
    ]
