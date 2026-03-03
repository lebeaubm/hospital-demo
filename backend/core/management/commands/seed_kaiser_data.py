"""
Management command to seed Kaiser Permanente-style data:
- Pharmacies
- Lab Tests
- Billable Services
- Sample prescriptions
- Sample lab orders
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from core.models import (
    Pharmacy,
    LabTest,
    BillableService,
    Prescription,
    LabOrder,
    LabResult,
    LabResultValue,
)

User = get_user_model()


class Command(BaseCommand):
    help = "Seed Kaiser Permanente-style data for pharmacies, lab tests, and billing"

    def handle(self, *args, **options):
        self.stdout.write("Seeding Kaiser Permanente-style data...")

        # Create Pharmacies
        self.seed_pharmacies()

        # Create Lab Tests
        self.seed_lab_tests()

        # Create Billable Services
        self.seed_billable_services()

        # Create sample prescriptions for existing patients
        self.seed_prescriptions()

        # Create sample lab orders
        self.seed_lab_orders()

        self.stdout.write(self.style.SUCCESS("✅ Successfully seeded Kaiser data!"))

    def seed_pharmacies(self):
        """Create sample pharmacy locations."""
        pharmacies = [
            {
                "name": "Kaiser Permanente Pharmacy - Downtown",
                "address": "123 Main Street",
                "city": "San Francisco",
                "state": "CA",
                "zip_code": "94102",
                "phone_number": "(415) 555-1000",
                "fax_number": "(415) 555-1001",
                "hours": "Mon-Fri: 8:00 AM - 8:00 PM\nSat: 9:00 AM - 5:00 PM\nSun: Closed",
            },
            {
                "name": "Kaiser Permanente Pharmacy - Mission Bay",
                "address": "456 Mission Bay Blvd",
                "city": "San Francisco",
                "state": "CA",
                "zip_code": "94158",
                "phone_number": "(415) 555-2000",
                "fax_number": "(415) 555-2001",
                "hours": "Mon-Fri: 7:00 AM - 9:00 PM\nSat-Sun: 9:00 AM - 6:00 PM",
            },
            {
                "name": "Kaiser Permanente Pharmacy - Oakland",
                "address": "789 Broadway",
                "city": "Oakland",
                "state": "CA",
                "zip_code": "94612",
                "phone_number": "(510) 555-3000",
                "fax_number": "(510) 555-3001",
                "hours": "Mon-Fri: 8:00 AM - 7:00 PM\nSat: 9:00 AM - 5:00 PM\nSun: Closed",
            },
            {
                "name": "Kaiser Permanente Pharmacy - San Jose",
                "address": "321 First Street",
                "city": "San Jose",
                "state": "CA",
                "zip_code": "95113",
                "phone_number": "(408) 555-4000",
                "fax_number": "(408) 555-4001",
                "hours": "Mon-Sun: 8:00 AM - 8:00 PM",
            },
        ]

        for pharmacy_data in pharmacies:
            pharmacy, created = Pharmacy.objects.get_or_create(
                name=pharmacy_data["name"],
                defaults=pharmacy_data
            )
            if created:
                self.stdout.write(f"  ✓ Created pharmacy: {pharmacy.name}")

    def seed_lab_tests(self):
        """Create common lab test types."""
        lab_tests = [
            {
                "name": "Complete Blood Count (CBC)",
                "category": LabTest.Category.BLOOD,
                "description": "Measures red blood cells, white blood cells, and platelets",
                "typical_turnaround_days": 1,
            },
            {
                "name": "Basic Metabolic Panel (BMP)",
                "category": LabTest.Category.BLOOD,
                "description": "Tests glucose, calcium, and electrolyte levels",
                "typical_turnaround_days": 1,
            },
            {
                "name": "Comprehensive Metabolic Panel (CMP)",
                "category": LabTest.Category.BLOOD,
                "description": "Includes BMP plus liver and kidney function tests",
                "typical_turnaround_days": 2,
            },
            {
                "name": "Lipid Panel",
                "category": LabTest.Category.BLOOD,
                "description": "Measures cholesterol and triglyceride levels",
                "typical_turnaround_days": 1,
            },
            {
                "name": "Thyroid Stimulating Hormone (TSH)",
                "category": LabTest.Category.BLOOD,
                "description": "Tests thyroid function",
                "typical_turnaround_days": 2,
            },
            {
                "name": "Hemoglobin A1C",
                "category": LabTest.Category.BLOOD,
                "description": "Long-term blood sugar control for diabetes",
                "typical_turnaround_days": 2,
            },
            {
                "name": "Urinalysis",
                "category": LabTest.Category.URINE,
                "description": "Tests for urinary tract infections and kidney problems",
                "typical_turnaround_days": 1,
            },
            {
                "name": "Chest X-Ray",
                "category": LabTest.Category.IMAGING,
                "description": "Images of chest, lungs, and heart",
                "typical_turnaround_days": 1,
            },
            {
                "name": "Blood Culture",
                "category": LabTest.Category.CULTURE,
                "description": "Tests for bacteria in blood",
                "typical_turnaround_days": 3,
            },
            {
                "name": "COVID-19 PCR Test",
                "category": LabTest.Category.OTHER,
                "description": "Molecular test for SARS-CoV-2",
                "typical_turnaround_days": 1,
            },
        ]

        for test_data in lab_tests:
            test, created = LabTest.objects.get_or_create(
                name=test_data["name"],
                defaults=test_data
            )
            if created:
                self.stdout.write(f"  ✓ Created lab test: {test.name}")

    def seed_billable_services(self):
        """Create common billable services."""
        services = [
            {
                "code": "99213",
                "name": "Office Visit - Established Patient (Low Complexity)",
                "category": BillableService.Category.CONSULTATION,
                "description": "15-20 minute office visit",
                "default_price": 150.00,
            },
            {
                "code": "99214",
                "name": "Office Visit - Established Patient (Moderate Complexity)",
                "category": BillableService.Category.CONSULTATION,
                "description": "25-30 minute office visit",
                "default_price": 200.00,
            },
            {
                "code": "99215",
                "name": "Office Visit - Established Patient (High Complexity)",
                "category": BillableService.Category.CONSULTATION,
                "description": "40+ minute office visit",
                "default_price": 250.00,
            },
            {
                "code": "99203",
                "name": "Office Visit - New Patient",
                "category": BillableService.Category.CONSULTATION,
                "description": "30-45 minute initial visit",
                "default_price": 300.00,
            },
            {
                "code": "85025",
                "name": "Complete Blood Count (CBC)",
                "category": BillableService.Category.LAB,
                "default_price": 35.00,
            },
            {
                "code": "80053",
                "name": "Comprehensive Metabolic Panel",
                "category": BillableService.Category.LAB,
                "default_price": 45.00,
            },
            {
                "code": "80061",
                "name": "Lipid Panel",
                "category": BillableService.Category.LAB,
                "default_price": 40.00,
            },
            {
                "code": "84443",
                "name": "Thyroid Stimulating Hormone (TSH)",
                "category": BillableService.Category.LAB,
                "default_price": 50.00,
            },
            {
                "code": "71045",
                "name": "Chest X-Ray",
                "category": BillableService.Category.IMAGING,
                "default_price": 200.00,
            },
            {
                "code": "76856",
                "name": "Ultrasound - Pelvis",
                "category": BillableService.Category.IMAGING,
                "default_price": 350.00,
            },
            {
                "code": "11042",
                "name": "Wound Debridement",
                "category": BillableService.Category.PROCEDURE,
                "default_price": 180.00,
            },
            {
                "code": "FAC001",
                "name": "Facility Fee",
                "category": BillableService.Category.FACILITY,
                "default_price": 75.00,
            },
        ]

        for service_data in services:
            service, created = BillableService.objects.get_or_create(
                code=service_data["code"],
                defaults=service_data
            )
            if created:
                self.stdout.write(f"  ✓ Created billable service: {service.code} - {service.name}")

    def seed_prescriptions(self):
        """Create sample prescriptions for existing patients."""
        from datetime import date, timedelta

        try:
            patient = User.objects.filter(role=User.Role.PATIENT).first()
            staff = User.objects.filter(role__in=[User.Role.STAFF, User.Role.ADMIN]).first()
            pharmacy = Pharmacy.objects.first()

            if not patient or not staff or not pharmacy:
                self.stdout.write(self.style.WARNING("  ⚠ Skipping prescriptions - missing patient, staff, or pharmacy"))
                return

            prescriptions = [
                {
                    "patient": patient,
                    "prescribed_by": staff,
                    "medication_name": "Lisinopril",
                    "dosage": "10mg",
                    "quantity": 30,
                    "refills_allowed": 3,
                    "refills_remaining": 3,
                    "instructions": "Take 1 tablet by mouth once daily",
                    "status": Prescription.Status.ACTIVE,
                    "pharmacy": pharmacy,
                    "expiration_date": date.today() + timedelta(days=365),
                },
                {
                    "patient": patient,
                    "prescribed_by": staff,
                    "medication_name": "Metformin",
                    "dosage": "500mg",
                    "quantity": 60,
                    "refills_allowed": 5,
                    "refills_remaining": 5,
                    "instructions": "Take 1 tablet by mouth twice daily with meals",
                    "status": Prescription.Status.ACTIVE,
                    "pharmacy": pharmacy,
                    "expiration_date": date.today() + timedelta(days=365),
                },
                {
                    "patient": patient,
                    "prescribed_by": staff,
                    "medication_name": "Atorvastatin",
                    "dosage": "20mg",
                    "quantity": 30,
                    "refills_allowed": 2,
                    "refills_remaining": 1,
                    "instructions": "Take 1 tablet by mouth once daily in the evening",
                    "status": Prescription.Status.ACTIVE,
                    "pharmacy": pharmacy,
                    "expiration_date": date.today() + timedelta(days=365),
                },
            ]

            for rx_data in prescriptions:
                rx, created = Prescription.objects.get_or_create(
                    patient=rx_data["patient"],
                    medication_name=rx_data["medication_name"],
                    defaults=rx_data
                )
                if created:
                    self.stdout.write(f"  ✓ Created prescription: {rx.medication_name}")

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  ✗ Error creating prescriptions: {e}"))

    def seed_lab_orders(self):
        """Create sample lab orders with results."""
        from datetime import date, timedelta

        try:
            patient = User.objects.filter(role=User.Role.PATIENT).first()
            staff = User.objects.filter(role__in=[User.Role.STAFF, User.Role.ADMIN]).first()
            cbc_test = LabTest.objects.filter(name__contains="CBC").first()
            lipid_test = LabTest.objects.filter(name__contains="Lipid").first()

            if not patient or not staff or not cbc_test:
                self.stdout.write(self.style.WARNING("  ⚠ Skipping lab orders - missing required data"))
                return

            # Create CBC order with results
            cbc_order, created = LabOrder.objects.get_or_create(
                patient=patient,
                test=cbc_test,
                defaults={
                    "ordered_by": staff,
                    "status": LabOrder.Status.COMPLETED,
                    "collection_date": date.today() - timedelta(days=2),
                    "priority": "ROUTINE",
                }
            )

            if created:
                self.stdout.write(f"  ✓ Created lab order: {cbc_test.name}")

                # Create result for CBC
                result = LabResult.objects.create(
                    order=cbc_order,
                    result_date=date.today() - timedelta(days=1),
                    status=LabResult.Status.FINAL,
                    reviewed_by=staff,
                    interpretation="All values within normal limits. No abnormalities detected.",
                    is_critical=False,
                )

                # Add CBC values
                cbc_values = [
                    {"parameter_name": "WBC (White Blood Cells)", "value": "7.2", "unit": "K/uL", "reference_range": "4.5-11.0", "is_abnormal": False, "flag": ""},
                    {"parameter_name": "RBC (Red Blood Cells)", "value": "4.8", "unit": "M/uL", "reference_range": "4.5-5.9", "is_abnormal": False, "flag": ""},
                    {"parameter_name": "Hemoglobin", "value": "14.5", "unit": "g/dL", "reference_range": "13.5-17.5", "is_abnormal": False, "flag": ""},
                    {"parameter_name": "Hematocrit", "value": "42.0", "unit": "%", "reference_range": "38.8-50.0", "is_abnormal": False, "flag": ""},
                    {"parameter_name": "Platelets", "value": "245", "unit": "K/uL", "reference_range": "150-400", "is_abnormal": False, "flag": ""},
                ]

                for value_data in cbc_values:
                    LabResultValue.objects.create(result=result, **value_data)

                self.stdout.write(f"  ✓ Created lab result with values for CBC")

            # Create Lipid Panel order with results if available
            if lipid_test:
                lipid_order, created = LabOrder.objects.get_or_create(
                    patient=patient,
                    test=lipid_test,
                    defaults={
                        "ordered_by": staff,
                        "status": LabOrder.Status.COMPLETED,
                        "collection_date": date.today() - timedelta(days=5),
                        "priority": "ROUTINE",
                    }
                )

                if created:
                    self.stdout.write(f"  ✓ Created lab order: {lipid_test.name}")

                    # Create result for Lipid Panel
                    result = LabResult.objects.create(
                        order=lipid_order,
                        result_date=date.today() - timedelta(days=4),
                        status=LabResult.Status.FINAL,
                        reviewed_by=staff,
                        interpretation="Total cholesterol slightly elevated. Recommend dietary modifications and follow-up in 3 months.",
                        is_critical=False,
                    )

                    # Add Lipid Panel values
                    lipid_values = [
                        {"parameter_name": "Total Cholesterol", "value": "215", "unit": "mg/dL", "reference_range": "<200", "is_abnormal": True, "flag": "HIGH"},
                        {"parameter_name": "LDL Cholesterol", "value": "135", "unit": "mg/dL", "reference_range": "<100", "is_abnormal": True, "flag": "HIGH"},
                        {"parameter_name": "HDL Cholesterol", "value": "55", "unit": "mg/dL", "reference_range": ">40", "is_abnormal": False, "flag": ""},
                        {"parameter_name": "Triglycerides", "value": "125", "unit": "mg/dL", "reference_range": "<150", "is_abnormal": False, "flag": ""},
                    ]

                    for value_data in lipid_values:
                        LabResultValue.objects.create(result=result, **value_data)

                    self.stdout.write(f"  ✓ Created lab result with values for Lipid Panel")

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  ✗ Error creating lab orders: {e}"))
