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
    is_accessible_to_all = models.BooleanField(
        default=False,
        help_text="If true, all patients can book this doctor regardless of assignment."
    )

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
    assigned_doctors = models.ManyToManyField(
        'Doctor',
        blank=True,
        related_name='assigned_patients',
        help_text="Doctors this patient is allowed to book appointments with."
    )
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


def career_resume_upload_path(instance, filename):
    ext = os.path.splitext(filename)[1]
    random_name = f"{uuid.uuid4().hex}{ext}"
    return f"career_resumes/{random_name}"


class JobApplication(models.Model):
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone_number = models.CharField(max_length=50, blank=True)
    position = models.CharField(max_length=255)
    cover_letter = models.TextField(blank=True)
    resume = models.FileField(upload_to=career_resume_upload_path, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"Job Application #{self.id} - {self.full_name} ({self.position})"

    def delete(self, *args, **kwargs):
        if self.resume:
            self.resume.delete(save=False)
        super().delete(*args, **kwargs)


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


# ==================== PRESCRIPTION SYSTEM ====================

class Pharmacy(models.Model):
    """Pharmacy locations where prescriptions can be filled."""
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=2)
    zip_code = models.CharField(max_length=10)
    phone_number = models.CharField(max_length=20)
    fax_number = models.CharField(max_length=20, blank=True)
    hours = models.TextField(blank=True, help_text="Operating hours")
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "Pharmacies"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} - {self.city}, {self.state}"


class Prescription(models.Model):
    """Patient prescriptions with refill tracking."""
    
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACTIVE = "ACTIVE", "Active"
        REFILL_REQUESTED = "REFILL_REQUESTED", "Refill Requested"
        EXPIRED = "EXPIRED", "Expired"
        DISCONTINUED = "DISCONTINUED", "Discontinued"

    patient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="prescriptions",
        limit_choices_to={"role": User.Role.PATIENT}
    )
    prescribed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="prescribed_medications",
        limit_choices_to={"role__in": [User.Role.STAFF, User.Role.ADMIN]}
    )
    medication_name = models.CharField(max_length=255)
    dosage = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField(help_text="Number of pills/doses")
    refills_allowed = models.PositiveIntegerField(default=0)
    refills_remaining = models.PositiveIntegerField(default=0)
    instructions = models.TextField(help_text="How to take the medication")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    pharmacy = models.ForeignKey(
        Pharmacy,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="prescriptions"
    )
    prescribed_date = models.DateField(auto_now_add=True)
    expiration_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.medication_name} - {self.patient.email}"


class PrescriptionRefill(models.Model):
    """Tracks refill requests for prescriptions."""
    
    class Status(models.TextChoices):
        REQUESTED = "REQUESTED", "Requested"
        APPROVED = "APPROVED", "Approved"
        FILLED = "FILLED", "Filled"
        DENIED = "DENIED", "Denied"
        CANCELED = "CANCELED", "Canceled"

    prescription = models.ForeignKey(
        Prescription,
        on_delete=models.CASCADE,
        related_name="refill_requests"
    )
    requested_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="refill_requests"
    )
    requested_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.REQUESTED
    )
    pharmacy = models.ForeignKey(
        Pharmacy,
        on_delete=models.SET_NULL,
        null=True,
        related_name="refill_requests"
    )
    processed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="processed_refills"
    )
    processed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ("-requested_at",)

    def __str__(self):
        return f"Refill for {self.prescription.medication_name} - {self.status}"


# ==================== SECURE MESSAGING ====================

class MessageThread(models.Model):
    """Conversation thread between patient and staff."""
    
    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        CLOSED = "CLOSED", "Closed"

    patient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="patient_threads",
        limit_choices_to={"role": User.Role.PATIENT}
    )
    staff = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="staff_threads",
        limit_choices_to={"role__in": [User.Role.STAFF, User.Role.ADMIN]}
    )
    subject = models.CharField(max_length=255)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_message_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-last_message_at",)

    def __str__(self):
        return f"Thread: {self.subject} - {self.patient.email}"


class Message(models.Model):
    """Individual message in a thread."""
    
    thread = models.ForeignKey(
        MessageThread,
        on_delete=models.CASCADE,
        related_name="messages"
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sent_messages"
    )
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at",)

    def __str__(self):
        return f"Message from {self.sender.email} at {self.created_at}"


class MessageAttachment(models.Model):
    """File attachments for messages."""
    
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name="attachments"
    )
    file = models.FileField(upload_to="message_attachments/%Y/%m/%d/")
    original_name = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100)
    size_bytes = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Attachment: {self.original_name}"

    def delete(self, *args, **kwargs):
        """Delete the file from storage when the model instance is deleted."""
        if self.file:
            self.file.delete(save=False)
        super().delete(*args, **kwargs)


# ==================== LAB RESULTS ====================

class LabTest(models.Model):
    """Lab test definitions (reusable test types)."""
    
    class Category(models.TextChoices):
        BLOOD = "BLOOD", "Blood Work"
        URINE = "URINE", "Urine Analysis"
        IMAGING = "IMAGING", "Imaging"
        BIOPSY = "BIOPSY", "Biopsy"
        CULTURE = "CULTURE", "Culture"
        OTHER = "OTHER", "Other"

    name = models.CharField(max_length=255, unique=True)
    category = models.CharField(max_length=20, choices=Category.choices)
    description = models.TextField(blank=True)
    typical_turnaround_days = models.PositiveIntegerField(default=3)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["category", "name"]

    def __str__(self):
        return f"{self.name} ({self.category})"


class LabOrder(models.Model):
    """Lab test order for a patient."""
    
    class Status(models.TextChoices):
        ORDERED = "ORDERED", "Ordered"
        COLLECTED = "COLLECTED", "Sample Collected"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        CANCELED = "CANCELED", "Canceled"

    patient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="lab_orders",
        limit_choices_to={"role": User.Role.PATIENT}
    )
    ordered_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="ordered_labs",
        limit_choices_to={"role__in": [User.Role.STAFF, User.Role.ADMIN]}
    )
    test = models.ForeignKey(
        LabTest,
        on_delete=models.PROTECT,
        related_name="orders"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ORDERED
    )
    ordered_date = models.DateField(auto_now_add=True)
    collection_date = models.DateField(null=True, blank=True)
    priority = models.CharField(
        max_length=20,
        choices=[("ROUTINE", "Routine"), ("URGENT", "Urgent"), ("STAT", "STAT")],
        default="ROUTINE"
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"Lab Order: {self.test.name} for {self.patient.email}"


class LabResult(models.Model):
    """Lab test results with values and interpretation."""
    
    class Status(models.TextChoices):
        PRELIMINARY = "PRELIMINARY", "Preliminary"
        FINAL = "FINAL", "Final"
        AMENDED = "AMENDED", "Amended"

    order = models.OneToOneField(
        LabOrder,
        on_delete=models.CASCADE,
        related_name="result"
    )
    result_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PRELIMINARY
    )
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="reviewed_results",
        limit_choices_to={"role__in": [User.Role.STAFF, User.Role.ADMIN]}
    )
    interpretation = models.TextField(blank=True, help_text="Doctor's interpretation")
    is_critical = models.BooleanField(default=False)
    pdf_report = models.FileField(upload_to="lab_reports/%Y/%m/%d/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-result_date",)

    def __str__(self):
        return f"Result for {self.order.test.name} - {self.status}"


class LabResultValue(models.Model):
    """Individual values within a lab result (e.g., WBC, RBC counts)."""
    
    result = models.ForeignKey(
        LabResult,
        on_delete=models.CASCADE,
        related_name="values"
    )
    parameter_name = models.CharField(max_length=255)
    value = models.CharField(max_length=100)
    unit = models.CharField(max_length=50)
    reference_range = models.CharField(max_length=100, help_text="Normal range")
    is_abnormal = models.BooleanField(default=False)
    flag = models.CharField(
        max_length=10,
        choices=[("HIGH", "High"), ("LOW", "Low"), ("CRITICAL", "Critical"), ("", "Normal")],
        blank=True
    )

    class Meta:
        ordering = ["parameter_name"]

    def __str__(self):
        return f"{self.parameter_name}: {self.value} {self.unit}"


# ==================== ENHANCED BILLING ====================

class BillableService(models.Model):
    """Catalog of billable services and procedures."""
    
    class Category(models.TextChoices):
        CONSULTATION = "CONSULTATION", "Consultation"
        PROCEDURE = "PROCEDURE", "Procedure"
        LAB = "LAB", "Lab Test"
        IMAGING = "IMAGING", "Imaging"
        MEDICATION = "MEDICATION", "Medication"
        FACILITY = "FACILITY", "Facility Fee"
        OTHER = "OTHER", "Other"

    code = models.CharField(max_length=50, unique=True, help_text="CPT or internal code")
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=Category.choices)
    description = models.TextField(blank=True)
    default_price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["category", "name"]

    def __str__(self):
        return f"{self.code} - {self.name}"


class Bill(models.Model):
    """Patient bill with itemized charges."""
    
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SENT = "SENT", "Sent"
        PARTIALLY_PAID = "PARTIALLY_PAID", "Partially Paid"
        PAID = "PAID", "Paid"
        OVERDUE = "OVERDUE", "Overdue"
        CANCELED = "CANCELED", "Canceled"

    patient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="bills",
        limit_choices_to={"role": User.Role.PATIENT}
    )
    bill_number = models.CharField(max_length=50, unique=True)
    related_appointment = models.ForeignKey(
        Appointment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bills"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    insurance_covered = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    patient_responsibility = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    balance_due = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    bill_date = models.DateField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"Bill {self.bill_number} - {self.patient.email}"

    def generate_bill_number(self):
        """Generate a unique bill number like BILL-20260303-000042."""
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d")
        return f"BILL-{timestamp}-{self.pk:06d}"

    def save(self, *args, **kwargs):
        if not self.bill_number:
            # Save first to get a PK, then generate the number
            super().save(*args, **kwargs)
            self.bill_number = self.generate_bill_number()
            super().save(update_fields=["bill_number"])
        else:
            super().save(*args, **kwargs)

    def calculate_totals(self):
        """Recalculate bill totals from line items."""
        line_items = self.line_items.all()
        self.subtotal = sum(item.total for item in line_items)
        self.patient_responsibility = self.subtotal + self.tax - self.insurance_covered
        self.balance_due = self.patient_responsibility - self.amount_paid
        self.save()


class BillLineItem(models.Model):
    """Individual line item on a bill."""
    
    bill = models.ForeignKey(
        Bill,
        on_delete=models.CASCADE,
        related_name="line_items"
    )
    service = models.ForeignKey(
        BillableService,
        on_delete=models.PROTECT,
        related_name="bill_items"
    )
    description = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    service_date = models.DateField()

    class Meta:
        ordering = ["service_date"]

    def save(self, *args, **kwargs):
        """Auto-calculate total."""
        self.total = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} - ${self.total}"


class BillPayment(models.Model):
    """Payment record for a bill."""
    
    class Method(models.TextChoices):
        CREDIT_CARD = "CREDIT_CARD", "Credit Card"
        DEBIT_CARD = "DEBIT_CARD", "Debit Card"
        BANK_TRANSFER = "BANK_TRANSFER", "Bank Transfer"
        CHECK = "CHECK", "Check"
        CASH = "CASH", "Cash"

    bill = models.ForeignKey(
        Bill,
        on_delete=models.CASCADE,
        related_name="payments"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=Method.choices)
    transaction_id = models.CharField(max_length=255, blank=True)
    payment_date = models.DateField(auto_now_add=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"Payment ${self.amount} for Bill {self.bill.bill_number}"


# ==================== FAMILY ACCOUNT MANAGEMENT ====================

class FamilyMember(models.Model):
    """Family member/dependent linked to a primary account."""
    
    class Relationship(models.TextChoices):
        SELF = "SELF", "Self"
        SPOUSE = "SPOUSE", "Spouse/Partner"
        CHILD = "CHILD", "Child"
        PARENT = "PARENT", "Parent"
        SIBLING = "SIBLING", "Sibling"
        GUARDIAN = "GUARDIAN", "Legal Guardian"
        OTHER = "OTHER", "Other"

    primary_account = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="family_members",
        limit_choices_to={"role": User.Role.PATIENT}
    )
    # If member has their own account (adults)
    member_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="managed_by_accounts"
    )
    # For dependents without accounts (minors)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    relationship = models.CharField(max_length=20, choices=Relationship.choices)
    can_view_appointments = models.BooleanField(default=True)
    can_manage_appointments = models.BooleanField(default=False)
    can_view_medical_records = models.BooleanField(default=False)
    can_view_messages = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["relationship", "last_name", "first_name"]
        unique_together = [["primary_account", "member_user"]]

    def __str__(self):
        if self.member_user:
            return f"{self.member_user.get_full_name()} ({self.relationship})"
        return f"{self.first_name} {self.last_name} ({self.relationship})"

    def get_full_name(self):
        """Get the full name of the family member."""
        if self.member_user:
            return self.member_user.get_full_name()
        return f"{self.first_name} {self.last_name}".strip()
