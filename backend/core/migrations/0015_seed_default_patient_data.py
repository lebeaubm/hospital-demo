from datetime import date, timedelta
from decimal import Decimal
import uuid

from django.db import migrations
from django.utils import timezone


def seed_default_patient_data(apps, schema_editor):
    User = apps.get_model('core', 'User')
    Appointment = apps.get_model('core', 'Appointment')
    Pharmacy = apps.get_model('core', 'Pharmacy')
    Prescription = apps.get_model('core', 'Prescription')
    LabTest = apps.get_model('core', 'LabTest')
    LabOrder = apps.get_model('core', 'LabOrder')
    LabResult = apps.get_model('core', 'LabResult')
    Bill = apps.get_model('core', 'Bill')
    Payment = apps.get_model('core', 'Payment')

    staff_user = User.objects.filter(role__in=['STAFF', 'ADMIN']).order_by('id').first()

    default_pharmacy, _ = Pharmacy.objects.get_or_create(
        name='Demo Community Pharmacy',
        defaults={
            'address': '100 Health Ave',
            'city': 'Cityville',
            'state': 'CA',
            'zip_code': '90000',
            'phone_number': '555-555-5555',
            'fax_number': '',
            'hours': 'Mon-Fri 8AM-6PM',
            'is_active': True,
        },
    )

    default_lab_test, _ = LabTest.objects.get_or_create(
        name='Basic Blood Panel',
        defaults={
            'category': 'BLOOD',
            'description': 'Default lab panel for new patients.',
            'typical_turnaround_days': 3,
            'is_active': True,
        },
    )

    for patient in User.objects.filter(role='PATIENT'):
        if not Appointment.objects.filter(patient=patient).exists():
            Appointment.objects.create(
                patient=patient,
                doctor=None,
                requested_start=timezone.now() + timedelta(days=1),
                scheduled_start=None,
                reason='Initial consultation',
                patient_notes='',
                staff_notes='',
                status='REQUESTED',
            )

        if not Prescription.objects.filter(patient=patient).exists():
            Prescription.objects.create(
                patient=patient,
                prescribed_by=staff_user,
                medication_name='Lisinopril',
                dosage='10mg',
                quantity=30,
                refills_allowed=2,
                refills_remaining=2,
                instructions='Take one tablet by mouth daily.',
                status='ACTIVE',
                pharmacy=default_pharmacy,
                notes='Default starter prescription.',
            )

        if not LabOrder.objects.filter(patient=patient).exists():
            order = LabOrder.objects.create(
                patient=patient,
                ordered_by=staff_user,
                test=default_lab_test,
                status='COMPLETED',
                priority='ROUTINE',
                notes='Default starter lab order.',
            )
            LabResult.objects.create(
                order=order,
                result_date=date.today(),
                status='FINAL',
                reviewed_by=staff_user,
                interpretation='Default normal result.',
                is_critical=False,
            )

        if not Bill.objects.filter(patient=patient).exists():
            Bill.objects.create(
                patient=patient,
                bill_number=f'DEFAULT-BILL-{patient.id}',
                related_appointment=None,
                status='SENT',
                subtotal=Decimal('120.00'),
                tax=Decimal('0.00'),
                insurance_covered=Decimal('0.00'),
                patient_responsibility=Decimal('120.00'),
                amount_paid=Decimal('0.00'),
                balance_due=Decimal('120.00'),
                bill_date=date.today(),
                due_date=date.today() + timedelta(days=30),
                notes='Default starter bill.',
            )

        if not Payment.objects.filter(patient=patient).exists():
            appointment = Appointment.objects.filter(patient=patient).order_by('id').first()
            Payment.objects.create(
                patient=patient,
                appointment=appointment,
                amount=Decimal('50.00'),
                currency='usd',
                status='PENDING',
                stripe_checkout_session_id=f'demo_session_{uuid.uuid4().hex}',
                stripe_payment_intent_id=None,
                receipt_url=None,
                paid_at=None,
            )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0014_alter_jobapplication_resume'),
    ]

    operations = [
        migrations.RunPython(seed_default_patient_data, noop_reverse),
    ]
