from datetime import timedelta
from decimal import Decimal
import uuid

from django.db import transaction
from django.utils import timezone

from .models import (
    Appointment,
    Bill,
    LabOrder,
    LabResult,
    LabTest,
    Payment,
    Pharmacy,
    Prescription,
    User,
)


def _get_default_staff_user():
    return User.objects.filter(role__in=[User.Role.STAFF, User.Role.ADMIN]).order_by("id").first()


@transaction.atomic
def ensure_patient_default_data(user):
    if not user or user.role != User.Role.PATIENT:
        return

    staff_user = _get_default_staff_user()
    now = timezone.now()

    if not Appointment.objects.filter(patient=user).exists():
        Appointment.objects.create(
            patient=user,
            doctor=None,
            requested_start=now + timedelta(days=1),
            scheduled_start=None,
            reason="Initial consultation",
            patient_notes="",
            staff_notes="",
            status=Appointment.Status.REQUESTED,
        )

    default_pharmacy, _ = Pharmacy.objects.get_or_create(
        name="Demo Community Pharmacy",
        defaults={
            "address": "100 Health Ave",
            "city": "Cityville",
            "state": "CA",
            "zip_code": "90000",
            "phone_number": "555-555-5555",
            "fax_number": "",
            "hours": "Mon-Fri 8AM-6PM",
            "is_active": True,
        },
    )

    if not Prescription.objects.filter(patient=user).exists():
        Prescription.objects.create(
            patient=user,
            prescribed_by=staff_user,
            medication_name="Lisinopril",
            dosage="10mg",
            quantity=30,
            refills_allowed=2,
            refills_remaining=2,
            instructions="Take one tablet by mouth daily.",
            status=Prescription.Status.ACTIVE,
            pharmacy=default_pharmacy,
            notes="Default starter prescription.",
        )

    default_lab_test, _ = LabTest.objects.get_or_create(
        name="Basic Blood Panel",
        defaults={
            "category": LabTest.Category.BLOOD,
            "description": "Default lab panel for new patients.",
            "typical_turnaround_days": 3,
            "is_active": True,
        },
    )

    if not LabOrder.objects.filter(patient=user).exists():
        lab_order = LabOrder.objects.create(
            patient=user,
            ordered_by=staff_user,
            test=default_lab_test,
            status=LabOrder.Status.COMPLETED,
            priority="ROUTINE",
            notes="Default starter lab order.",
        )
        LabResult.objects.create(
            order=lab_order,
            result_date=timezone.localdate(),
            status=LabResult.Status.FINAL,
            reviewed_by=staff_user,
            interpretation="Default normal result.",
            is_critical=False,
        )

    if not Bill.objects.filter(patient=user).exists():
        bill = Bill.objects.create(
            patient=user,
            related_appointment=None,
            status=Bill.Status.SENT,
            subtotal=Decimal("120.00"),
            tax=Decimal("0.00"),
            insurance_covered=Decimal("0.00"),
            patient_responsibility=Decimal("120.00"),
            amount_paid=Decimal("0.00"),
            balance_due=Decimal("120.00"),
            due_date=timezone.localdate() + timedelta(days=30),
            notes="Default starter bill.",
        )
        if not bill.bill_number:
            bill.save()

    if not Payment.objects.filter(patient=user).exists():
        Payment.objects.create(
            patient=user,
            appointment=Appointment.objects.filter(patient=user).order_by("id").first(),
            amount=Decimal("50.00"),
            currency="usd",
            status=Payment.Status.PENDING,
            stripe_checkout_session_id=f"demo_session_{uuid.uuid4().hex}",
            stripe_payment_intent_id=None,
            receipt_url=None,
            paid_at=None,
        )
