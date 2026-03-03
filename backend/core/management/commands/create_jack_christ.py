"""
Management command to create test staff account: Jack Christ
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from core.models import StaffProfile

User = get_user_model()


class Command(BaseCommand):
    help = "Create test staff account for Jack Christ"

    def handle(self, *args, **options):
        self.stdout.write("Creating Jack Christ test account...")

        # ── 1. User account ──────────────────────────────────────────────
        user, created = User.objects.get_or_create(
            email="jack.christ@teststaff.com",
            defaults={
                "first_name": "Jack",
                "last_name": "Christ",
                "role": User.Role.STAFF,
                "is_staff": True,
                "is_active": True,
            }
        )
        if created:
            user.set_password("JackStaff123!")
            user.save()
            self.stdout.write(self.style.SUCCESS("  ✓ User created"))
        else:
            self.stdout.write("  → User already exists, updating password...")
            user.set_password("JackStaff123!")
            user.first_name = "Jack"
            user.last_name = "Christ"
            user.role = User.Role.STAFF
            user.is_staff = True
            user.save()

        # ── 2. Staff profile ─────────────────────────────────────────────
        StaffProfile.objects.get_or_create(
            user=user,
            defaults={
                "department": "Patient Services",
                "position": "Patient Services Coordinator",
                "phone_number": "(555) 100-2000",
                "office_location": "Building A, Room 101",
            }
        )
        self.stdout.write(self.style.SUCCESS("  ✓ Staff profile ready"))

        # ── Summary ──────────────────────────────────────────────────────
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("═══════════════════════════════════════"))
        self.stdout.write(self.style.SUCCESS("  Jack Christ account ready!"))
        self.stdout.write(self.style.SUCCESS("═══════════════════════════════════════"))
        self.stdout.write(f"  Email:      jack.christ@teststaff.com")
        self.stdout.write(f"  Password:   JackStaff123!")
        self.stdout.write(f"  Role:       Staff")
        self.stdout.write(f"  Department: Patient Services")
        self.stdout.write(self.style.SUCCESS("═══════════════════════════════════════"))
