"""
Notification service for sending emails and logging them.
"""
import logging
from typing import List, Optional

from django.conf import settings
from django.core.mail import EmailMessage
from django.template import Context, Template

from .models import Appointment, NotificationLog, User

logger = logging.getLogger(__name__)


def render_email_template(template_name: str, context: dict) -> tuple[str, str]:
    """
    Render an email template with the given context.
    Returns (subject, body_text)
    """
    from pathlib import Path
    
    template_path = Path(__file__).parent / "templates" / "emails" / f"{template_name}.txt"
    
    if not template_path.exists():
        raise FileNotFoundError(f"Email template not found: {template_path}")
    
    with open(template_path, "r", encoding="utf-8") as f:
        template_content = f.read()
    
    template = Template(template_content)
    rendered = template.render(Context(context))
    
    # Split into subject (first line) and body (rest)
    lines = rendered.strip().split("\n", 1)
    subject = lines[0].strip()
    body_text = lines[1].strip() if len(lines) > 1 else ""
    
    return subject, body_text


def send_email_notification(
    event_type: str,
    to_email: str,
    subject: str,
    body_text: str,
    cc_emails: Optional[List[str]] = None,
    reply_to: Optional[List[str]] = None,
    sent_by: Optional[User] = None,
    related_appointment: Optional[Appointment] = None,
) -> NotificationLog:
    """
    Send an email notification and log it.
    
    Args:
        event_type: One of NotificationLog.EventType choices
        to_email: Recipient email address
        subject: Email subject
        body_text: Email body (plain text)
        cc_emails: Optional list of CC email addresses
        reply_to: Optional list of reply-to addresses
        sent_by: Optional user who triggered the email
        related_appointment: Optional related appointment
        
    Returns:
        NotificationLog instance
    """
    cc_emails_str = ",".join(cc_emails) if cc_emails else ""
    
    # Create log entry with PENDING status
    log = NotificationLog.objects.create(
        event_type=event_type,
        to_email=to_email,
        cc_emails=cc_emails_str,
        subject=subject,
        body_text=body_text,
        status=NotificationLog.Status.PENDING,
        sent_by=sent_by,
        related_appointment=related_appointment,
    )
    
    try:
        # Prepare email
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@hospitaldemo.com")
        
        email = EmailMessage(
            subject=subject,
            body=body_text,
            from_email=from_email,
            to=[to_email],
            cc=cc_emails or [],
            reply_to=reply_to or [],
        )
        
        # Send email
        email.send(fail_silently=False)
        
        # Update log to SENT
        log.status = NotificationLog.Status.SENT
        log.save(update_fields=["status", "updated_at"])
        
        logger.info(f"Email sent successfully: {event_type} to {to_email}")
        
    except Exception as e:
        # Update log to FAILED with error
        log.status = NotificationLog.Status.FAILED
        log.error = str(e)
        log.save(update_fields=["status", "error", "updated_at"])
        
        logger.error(f"Failed to send email: {event_type} to {to_email}. Error: {e}")
    
    return log


def send_welcome_email(user: User) -> NotificationLog:
    """Send welcome email to newly registered patient."""
    context = {
        "patient_name": user.get_full_name() or user.email,
    }
    
    subject, body_text = render_email_template("welcome", context)
    
    return send_email_notification(
        event_type=NotificationLog.EventType.WELCOME,
        to_email=user.email,
        subject=subject,
        body_text=body_text,
    )


def send_appointment_requested_notification(appointment: Appointment) -> Optional[NotificationLog]:
    """Notify staff when a patient requests an appointment."""
    staff_inbox = getattr(settings, "STAFF_INBOX_EMAIL", None)
    
    if not staff_inbox:
        logger.warning("STAFF_INBOX_EMAIL not configured, skipping appointment request notification")
        return None
    
    context = {
        "patient_name": appointment.patient.get_full_name() or appointment.patient.email,
        "patient_email": appointment.patient.email,
        "requested_start": appointment.requested_start.strftime("%Y-%m-%d %I:%M %p"),
        "reason": appointment.reason,
        "patient_notes": appointment.patient_notes,
        "appointment_id": appointment.pk,
        "doctor": appointment.doctor.name if appointment.doctor else "Not assigned",
    }
    
    subject, body_text = render_email_template("appointment_requested_staff", context)
    
    return send_email_notification(
        event_type=NotificationLog.EventType.APPT_REQUESTED,
        to_email=staff_inbox,
        subject=subject,
        body_text=body_text,
        related_appointment=appointment,
    )


def send_appointment_confirmed_notification(appointment: Appointment) -> NotificationLog:
    """Notify patient when their appointment is confirmed."""
    context = {
        "patient_name": appointment.patient.get_full_name() or appointment.patient.email,
        "scheduled_start": appointment.scheduled_start.strftime("%Y-%m-%d %I:%M %p") if appointment.scheduled_start else "TBD",
        "reason": appointment.reason,
        "staff_notes": appointment.staff_notes,
        "appointment_id": appointment.pk,
        "doctor": appointment.doctor.name if appointment.doctor else "TBD",
    }
    
    subject, body_text = render_email_template("appointment_confirmed_patient", context)
    
    return send_email_notification(
        event_type=NotificationLog.EventType.APPT_CONFIRMED,
        to_email=appointment.patient.email,
        subject=subject,
        body_text=body_text,
        related_appointment=appointment,
    )


def send_appointment_completed_notification(appointment: Appointment) -> NotificationLog:
    """Notify patient when their appointment is completed."""
    context = {
        "patient_name": appointment.patient.get_full_name() or appointment.patient.email,
        "scheduled_start": appointment.scheduled_start.strftime("%Y-%m-%d %I:%M %p") if appointment.scheduled_start else appointment.requested_start.strftime("%Y-%m-%d %I:%M %p"),
        "reason": appointment.reason,
        "staff_notes": appointment.staff_notes,
        "appointment_id": appointment.pk,
        "doctor": appointment.doctor.name if appointment.doctor else "N/A",
    }
    
    subject, body_text = render_email_template("appointment_completed_patient", context)
    
    return send_email_notification(
        event_type=NotificationLog.EventType.APPT_COMPLETED,
        to_email=appointment.patient.email,
        subject=subject,
        body_text=body_text,
        related_appointment=appointment,
    )


def send_appointment_canceled_notification(appointment: Appointment) -> NotificationLog:
    """Notify patient when their appointment is canceled."""
    context = {
        "patient_name": appointment.patient.get_full_name() or appointment.patient.email,
        "scheduled_start": appointment.scheduled_start.strftime("%Y-%m-%d %I:%M %p") if appointment.scheduled_start else None,
        "requested_start": appointment.requested_start.strftime("%Y-%m-%d %I:%M %p"),
        "reason": appointment.reason,
        "staff_notes": appointment.staff_notes,
        "appointment_id": appointment.pk,
        "doctor": appointment.doctor.name if appointment.doctor else "N/A",
    }
    
    subject, body_text = render_email_template("appointment_canceled_patient", context)
    
    return send_email_notification(
        event_type=NotificationLog.EventType.APPT_CANCELED,
        to_email=appointment.patient.email,
        subject=subject,
        body_text=body_text,
        related_appointment=appointment,
    )
