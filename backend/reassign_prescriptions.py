import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import Prescription, User

print("=== Reassigning Prescriptions to patient@example.com ===\n")

try:
    # Get the target patient
    target_patient = User.objects.get(email='patient@example.com')
    print(f"Target patient found: {target_patient.email}")
    
    # Get all prescriptions currently assigned to other users
    prescriptions = Prescription.objects.exclude(patient=target_patient)
    count = prescriptions.count()
    
    print(f"\nFound {count} prescriptions to reassign:")
    for p in prescriptions:
        print(f"  - {p.medication_name} (currently: {p.patient.email})")
    
    # Reassign all prescriptions to patient@example.com
    updated = prescriptions.update(patient=target_patient)
    print(f"\n✅ Successfully reassigned {updated} prescriptions to {target_patient.email}")
    
    # Verify
    patient_rx = Prescription.objects.filter(patient=target_patient)
    print(f"\n{target_patient.email} now has {patient_rx.count()} prescriptions:")
    for p in patient_rx:
        print(f"  - {p.medication_name} {p.dosage}")
        
except User.DoesNotExist:
    print("❌ patient@example.com not found!")
except Exception as e:
    print(f"❌ Error: {e}")
