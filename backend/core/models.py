import os
import uuid
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, role=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, role=role or User.Role.PATIENT, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        return self.create_user(email, password, role=User.Role.ADMIN, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        PATIENT = "PATIENT", "Patient"
        STAFF = "STAFF", "Staff"
        ADMIN = "ADMIN", "Admin"

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.PATIENT)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

    def get_full_name(self):
        """Return the full name or email if name is not set"""
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name if full_name else self.email

    def get_short_name(self):
        """Return the first name or email"""
        return self.first_name or self.email


class Doctor(models.Model):
    name = models.CharField(max_length=200)
    specialty = models.CharField(max_length=200)
    bio = models.TextField(blank=True)
    years_experience = models.PositiveIntegerField(default=0)
    location = models.CharField(max_length=200, blank=True, default='')

    def __str__(self):
        return f"{self.name} ({self.specialty})"


class PatientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="patient_profile")
    date_of_birth = models.DateField(null=True, blank=True)
    phone_number = models.CharField(max_length=50, blank=True)
    address = models.CharField(max_length=255, blank=True)
    emergency_contact_name = models.CharField(max_length=255, blank=True)
    emergency_contact_phone = models.CharField(max_length=50, blank=True)
    insurance_provider = models.CharField(max_length=255, blank=True)
    insurance_policy_number = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"PatientProfile for {self.user.email}"


class StaffProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="staff_profile")
    department = models.CharField(max_length=200, blank=True)
    position = models.CharField(max_length=200, blank=True)
    phone_number = models.CharField(max_length=50, blank=True)
    office_location = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"StaffProfile for {self.user.email}"


class Appointment(models.Model):
    class Status(models.TextChoices):
        REQUESTED = "REQUESTED", "Requested"
        CONFIRMED = "CONFIRMED", "Confirmed"
        COMPLETED = "COMPLETED", "Completed"
        CANCELED = "CANCELED", "Canceled"

    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="appointments")
    doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, blank=True, related_name="appointments")
    requested_start = models.DateTimeField()
    scheduled_start = models.DateTimeField(null=True, blank=True)
    reason = models.CharField(max_length=255)
    patient_notes = models.TextField(blank=True)
    staff_notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.REQUESTED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"Appointment #{self.pk} - {self.patient.email} - {self.status}"


class NotificationLog(models.Model):
    class EventType(models.TextChoices):
        WELCOME = "WELCOME", "Welcome"
        APPT_REQUESTED = "APPT_REQUESTED", "Appointment Requested"
        APPT_CONFIRMED = "APPT_CONFIRMED", "Appointment Confirmed"
        APPT_COMPLETED = "APPT_COMPLETED", "Appointment Completed"
        APPT_CANCELED = "APPT_CANCELED", "Appointment Canceled"
        STAFF_CUSTOM = "STAFF_CUSTOM", "Staff Custom Email"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SENT = "SENT", "Sent"
        FAILED = "FAILED", "Failed"

    event_type = models.CharField(max_length=20, choices=EventType.choices)
    to_email = models.EmailField()
    cc_emails = models.TextField(blank=True, help_text="Comma-separated email addresses")
    subject = models.CharField(max_length=255)
    body_text = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    error = models.TextField(blank=True, null=True)
    sent_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="sent_emails")
    related_appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name="email_logs")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["event_type"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.event_type} to {self.to_email} - {self.status}"


def medical_document_upload_path(instance, filename):
    """Generate a secure random filename for medical documents."""
    ext = os.path.splitext(filename)[1]
    random_name = f"{uuid.uuid4().hex}{ext}"
    return f"medical_documents/{instance.record.patient.id}/{random_name}"


class MedicalRecord(models.Model):
    """
    Medical record for a patient. OneToOne with PatientProfile.
    Contains summary information and links to notes/documents.
    """
    patient = models.OneToOneField(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name="medical_record"
    )
    history_text = models.TextField(blank=True, help_text="Medical history summary")
    allergies_text = models.TextField(blank=True, help_text="Known allergies")
    medications_text = models.TextField(blank=True, help_text="Current medications")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Medical Record for {self.patient.user.email}"


class MedicalNote(models.Model):
    """
    Staff notes attached to a medical record.
    Visibility can be STAFF_ONLY or SHARED_WITH_PATIENT.
    """
    class NoteType(models.TextChoices):
        VISIT = "VISIT", "Visit Note"
        LAB = "LAB", "Lab Result"
        PRESCRIPTION = "PRESCRIPTION", "Prescription"
        GENERAL = "GENERAL", "General Note"

    class Visibility(models.TextChoices):
        STAFF_ONLY = "STAFF_ONLY", "Staff Only"
        SHARED_WITH_PATIENT = "SHARED_WITH_PATIENT", "Shared with Patient"

    record = models.ForeignKey(
        MedicalRecord,
        on_delete=models.CASCADE,
        related_name="notes"
    )
    author = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="authored_notes"
    )
    note_type = models.CharField(
        max_length=20,
        choices=NoteType.choices,
        default=NoteType.GENERAL
    )
    content = models.TextField()
    visibility = models.CharField(
        max_length=30,
        choices=Visibility.choices,
        default=Visibility.STAFF_ONLY
    )
    shared_at = models.DateTimeField(null=True, blank=True)
    shared_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="shared_notes"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.note_type} note for {self.record.patient.user.email} - {self.visibility}"


class MedicalDocument(models.Model):
    """
    Documents (files) attached to a medical record.
    Can be uploaded by patient or staff with different visibility rules.
    """
    class Category(models.TextChoices):
        LAB_RESULT = "LAB_RESULT", "Lab Result"
        PRESCRIPTION = "PRESCRIPTION", "Prescription"
        IMAGING = "IMAGING", "Imaging"
        OTHER = "OTHER", "Other"

    class Visibility(models.TextChoices):
        PATIENT_AND_STAFF = "PATIENT_AND_STAFF", "Patient and Staff"
        STAFF_ONLY = "STAFF_ONLY", "Staff Only"

    record = models.ForeignKey(
        MedicalRecord,
        on_delete=models.CASCADE,
        related_name="documents"
    )
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_documents"
    )
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.OTHER
    )
    visibility = models.CharField(
        max_length=30,
        choices=Visibility.choices,
        default=Visibility.PATIENT_AND_STAFF
    )
    file = models.FileField(upload_to=medical_document_upload_path)
    original_name = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100)
    size_bytes = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.original_name} ({self.category}) - {self.visibility}"

    def delete(self, *args, **kwargs):
        """Delete the file from storage when the model instance is deleted."""
        if self.file:
            self.file.delete(save=False)
        super().delete(*args, **kwargs)


class Payment(models.Model):
    """Model for tracking patient payments for consultation fees."""
    
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PAID = "PAID", "Paid"
        FAILED = "FAILED", "Failed"
        REFUNDED = "REFUNDED", "Refunded"

    patient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="payments",
        limit_choices_to={"role": User.Role.PATIENT}
    )
    appointment = models.ForeignKey(
        "Appointment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="usd")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    stripe_checkout_session_id = models.CharField(max_length=255, unique=True)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, null=True)
    receipt_url = models.URLField(max_length=500, blank=True, null=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"Payment {self.id} - {self.patient.email} - {self.amount} {self.currency} - {self.status}"


class Invoice(models.Model):
    """Model for storing invoice information linked to payments."""
    
    payment = models.OneToOneField(
        Payment,
        on_delete=models.CASCADE,
        related_name="invoice"
    )
    invoice_number = models.CharField(max_length=50, unique=True)
    pdf_file = models.FileField(
        upload_to="invoices/",
        blank=True,
        null=True
    )
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-generated_at",)

    def __str__(self):
        return f"Invoice {self.invoice_number} for Payment {self.payment.id}"

    def generate_invoice_number(self):
        """Generate a unique invoice number."""
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d")
        return f"INV-{timestamp}-{self.payment.id:06d}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            # Generate invoice number before saving
            super().save(*args, **kwargs)
            self.invoice_number = self.generate_invoice_number()
            super().save(update_fields=["invoice_number"])
        else:
            super().save(*args, **kwargs)
