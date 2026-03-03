import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import Prescription, PatientProfile, User

print("=== Checking Prescriptions ===\n")

# Check all prescriptions
prescriptions = Prescription.objects.all()
print(f"Total prescriptions in database: {prescriptions.count()}\n")

if prescriptions.exists():
    print("Prescription details:")
    for p in prescriptions:
        patient_email = p.patient.email if p.patient else "No user"
        print(f"  - {p.medication_name} ({p.dosage}) for: {patient_email}")

print("\n=== Checking Patient Profiles ===\n")

# Check all users with patient role
patient_users = User.objects.filter(role=User.Role.PATIENT)
print(f"Total patients: {patient_users.count()}\n")

if patient_users.exists():
    print("Patient users:")
    for user in patient_users:
        rx_count = Prescription.objects.filter(patient=user).count()
        print(f"  - {user.email} (ID: {user.id}) - {rx_count} prescriptions")

print("\n=== Checking patient@example.com ===\n")

try:
    patient_user = User.objects.get(email='patient@example.com')
    print(f"User found: {patient_user.email}")
    print(f"User role: {patient_user.role}")
    
    rx_count = Prescription.objects.filter(patient=patient_user).count()
    print(f"Prescriptions: {rx_count}")
    
    if rx_count == 0:
        print("\n⚠️ PROBLEM: patient@example.com has NO prescriptions!")
        print("   The seed data created prescriptions for a different user.")
        
except User.DoesNotExist:
    print("User not found!")
