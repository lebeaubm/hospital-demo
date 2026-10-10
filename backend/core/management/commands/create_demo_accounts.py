"""
Management command to create standard demo accounts.
Safe to re-run — uses get_or_create.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import PatientProfile, StaffProfile

User = get_user_model()


ACCOUNTS = [
    {
        "email": "patient@example.com",
        "password": "Pass1234!",
        "first_name": "Demo",
        "last_name": "Patient",
        "role": "PATIENT",
        "is_staff": False,
        "is_superuser": False,
    },
    {
        "email": "staff@example.com",
        "password": "StaffPass123!",
        "first_name": "Demo",
        "last_name": "Staff",
        "role": "STAFF",
        "is_staff": True,
        "is_superuser": False,
    },
    {
        "email": "lebeaubm@yahoo.com",
        "password": "Admin123!",
        "first_name": "Billy",
        "last_name": "Lebeau",
        "role": "ADMIN",
        "is_staff": True,
        "is_superuser": True,
    },
    {
        "email": "testadmin@hospital.com",
        "password": "TestAdmin123!",
        "first_name": "Test",
        "last_name": "Admin",
        "role": "ADMIN",
        "is_staff": True,
        "is_superuser": True,
    },
]


class Command(BaseCommand):
    help = "Create standard demo accounts (patient, staff, admin)"

    def handle(self, *args, **options):
        self.stdout.write("Creating demo accounts...")

        for account in ACCOUNTS:
            user, created = User.objects.get_or_create(
                email=account["email"],
                defaults={
                    "first_name": account["first_name"],
                    "last_name": account["last_name"],
                    "role": account["role"],
                    "is_staff": account["is_staff"],
                    "is_superuser": account["is_superuser"],
                    "is_active": True,
                }
            )
            if created:
                user.set_password(account["password"])
                user.save()
                action = "created"
            else:
                # Always sync password and flags in case they changed
                user.set_password(account["password"])
                user.is_staff = account["is_staff"]
                user.is_superuser = account["is_superuser"]
                user.role = account["role"]
                user.save()
                action = "updated"

            # Create profile if missing
            if account["role"] == "PATIENT":
                PatientProfile.objects.get_or_create(user=user)
            elif account["role"] in ("STAFF", "ADMIN"):
                StaffProfile.objects.get_or_create(
                    user=user,
                    defaults={"department": "Administration", "position": account["role"].capitalize()}
                )

            self.stdout.write(self.style.SUCCESS(
                f"  ✓ {account['email']} ({account['role']}) — {action}"
            ))

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Demo accounts ready:"))
        self.stdout.write("  patient@example.com    / Pass1234!")
        self.stdout.write("  staff@example.com      / StaffPass123!")
        self.stdout.write("  lebeaubm@yahoo.com     / Admin123!")
        self.stdout.write("  testadmin@hospital.com / TestAdmin123!")
