"""
Management command to create test patient account: Jane Christ
"""
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from core.models import PatientProfile, Doctor, Appointment, Bill

User = get_user_model()


class Command(BaseCommand):
    help = "Create test patient account for Jane Christ with sample appointments and bills"

    def handle(self, *args, **options):
        self.stdout.write("Creating Jane Christ test account...")

        # ── 1. User account ──────────────────────────────────────────────
        user, created = User.objects.get_or_create(
            email="jane.christ@testpatient.com",
            defaults={
                "first_name": "Jane",
                "last_name": "Christ",
                "role": User.Role.PATIENT,
                "is_active": True,
            }
        )
        if created:
            user.set_password("JaneTest123!")
            user.save()
            self.stdout.write(self.style.SUCCESS("  ✓ User created"))
        else:
            self.stdout.write("  → User already exists, updating password...")
            user.set_password("JaneTest123!")
            user.first_name = "Jane"
            user.last_name = "Christ"
            user.save()

        # ── 2. Patient profile ───────────────────────────────────────────
        profile, _ = PatientProfile.objects.get_or_create(
            user=user,
            defaults={
                "date_of_birth": date(1990, 6, 15),
                "phone_number": "(555) 867-5309",
                "address": "42 Willow Lane, Springfield, IL 62701",
                "emergency_contact_name": "John Christ",
                "emergency_contact_phone": "(555) 867-5310",
                "insurance_provider": "BlueCross BlueShield",
                "insurance_policy_number": "BCB-9988-JANE",
            }
        )
        self.stdout.write(self.style.SUCCESS("  ✓ Patient profile ready"))

        # ── 3. Pick a couple of doctors ──────────────────────────────────
        doctors = list(Doctor.objects.all()[:3])
        if doctors:
            profile.assigned_doctors.set(doctors)

        doctor1 = doctors[0] if len(doctors) > 0 else None
        doctor2 = doctors[1] if len(doctors) > 1 else None

        today = timezone.now()

        # ── 4. Appointments ──────────────────────────────────────────────
        appointments_data = [
            {
                "reason": "Annual physical examination",
                "status": Appointment.Status.COMPLETED,
                "requested_start": today - timedelta(days=60),
                "scheduled_start": today - timedelta(days=60),
                "doctor": doctor1,
                "staff_notes": "Routine annual checkup. Patient is in good health.",
            },
            {
                "reason": "Persistent headaches and dizziness",
                "status": Appointment.Status.COMPLETED,
                "requested_start": today - timedelta(days=30),
                "scheduled_start": today - timedelta(days=30),
                "doctor": doctor2 or doctor1,
                "staff_notes": "Referred for MRI. Likely tension headaches.",
            },
            {
                "reason": "Follow-up on MRI results",
                "status": Appointment.Status.CONFIRMED,
                "requested_start": today + timedelta(days=7),
                "scheduled_start": today + timedelta(days=7),
                "doctor": doctor2 or doctor1,
                "patient_notes": "Hoping to discuss the MRI results.",
            },
            {
                "reason": "Flu symptoms",
                "status": Appointment.Status.REQUESTED,
                "requested_start": today + timedelta(days=14),
                "scheduled_start": None,
                "doctor": doctor1,
                "patient_notes": "Fever and sore throat for 2 days.",
            },
            {
                "reason": "Prescription refill - blood pressure medication",
                "status": Appointment.Status.CANCELED,
                "requested_start": today - timedelta(days=10),
                "scheduled_start": None,
                "doctor": doctor1,
                "staff_notes": "Patient canceled - handled via phone.",
            },
        ]

        created_appts = []
        for appt_data in appointments_data:
            appt = Appointment.objects.create(
                patient=user,
                reason=appt_data["reason"],
                status=appt_data["status"],
                requested_start=appt_data["requested_start"],
                scheduled_start=appt_data.get("scheduled_start"),
                doctor=appt_data.get("doctor"),
                patient_notes=appt_data.get("patient_notes", ""),
                staff_notes=appt_data.get("staff_notes", ""),
            )
            created_appts.append(appt)

        self.stdout.write(self.style.SUCCESS(f"  ✓ {len(created_appts)} appointments created"))

        # ── 5. Bills ─────────────────────────────────────────────────────
        bills_data = [
            {
                "status": Bill.Status.PAID,
                "patient_responsibility": 150.00,
                "amount_paid": 150.00,
                "balance_due": 0.00,
                "insurance_covered": 80.00,
                "notes": "Annual physical examination",
                "due_date": date.today() - timedelta(days=45),
                "appointment": created_appts[0],
            },
            {
                "status": Bill.Status.PARTIALLY_PAID,
                "patient_responsibility": 320.00,
                "amount_paid": 100.00,
                "balance_due": 220.00,
                "insurance_covered": 150.00,
                "notes": "Specialist consultation — headache evaluation",
                "due_date": date.today() + timedelta(days=10),
                "appointment": created_appts[1],
            },
            {
                "status": Bill.Status.SENT,
                "patient_responsibility": 261.00,
                "amount_paid": 0.00,
                "balance_due": 261.00,
                "insurance_covered": 0.00,
                "notes": "MRI imaging — brain scan",
                "due_date": date.today() + timedelta(days=20),
                "appointment": None,
            },
            {
                "status": Bill.Status.OVERDUE,
                "patient_responsibility": 95.00,
                "amount_paid": 0.00,
                "balance_due": 95.00,
                "insurance_covered": 0.00,
                "notes": "Lab work — blood panel",
                "due_date": date.today() - timedelta(days=5),
                "appointment": None,
            },
        ]

        for bill_data in bills_data:
            bill = Bill(
                patient=user,
                status=bill_data["status"],
                patient_responsibility=bill_data["patient_responsibility"],
                amount_paid=bill_data["amount_paid"],
                balance_due=bill_data["balance_due"],
                insurance_covered=bill_data["insurance_covered"],
                notes=bill_data["notes"],
                due_date=bill_data["due_date"],
                related_appointment=bill_data.get("appointment"),
            )
            bill.save()

        self.stdout.write(self.style.SUCCESS(f"  ✓ {len(bills_data)} bills created"))

        # ── Summary ──────────────────────────────────────────────────────
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("═══════════════════════════════════════"))
        self.stdout.write(self.style.SUCCESS("  Jane Christ account ready!"))
        self.stdout.write(self.style.SUCCESS("═══════════════════════════════════════"))
        self.stdout.write(f"  Email:    jane.christ@testpatient.com")
        self.stdout.write(f"  Password: JaneTest123!")
        self.stdout.write(f"  Role:     Patient")
        self.stdout.write("")
        self.stdout.write("  Bills:")
        self.stdout.write("    • 1 × PAID (annual physical, $150)")
        self.stdout.write("    • 1 × PARTIALLY PAID (specialist, $220 remaining)")
        self.stdout.write("    • 1 × SENT / UNPAID (MRI, $261)")
        self.stdout.write("    • 1 × OVERDUE (lab work, $95)")
        self.stdout.write("")
        self.stdout.write("  Appointments:")
        self.stdout.write("    • 2 × COMPLETED (past)")
        self.stdout.write("    • 1 × CONFIRMED (next week)")
        self.stdout.write("    • 1 × REQUESTED (pending)")
        self.stdout.write("    • 1 × CANCELED")
        self.stdout.write(self.style.SUCCESS("═══════════════════════════════════════"))
