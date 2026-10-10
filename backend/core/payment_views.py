"""Views for handling Stripe payment functionality."""
import io
import os
import stripe
from datetime import datetime
from decimal import Decimal
from django.conf import settings
from django.http import FileResponse, HttpResponse
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from drf_spectacular.utils import extend_schema
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Payment, Invoice, User
from .serializers import PaymentSerializer, InvoiceSerializer
from .defaults import ensure_patient_default_data

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class CheckoutSessionRequestSerializer(serializers.Serializer):
    appointment_id = serializers.IntegerField(required=False, allow_null=True)


class CheckoutSessionResponseSerializer(serializers.Serializer):
    url = serializers.URLField()
    session_id = serializers.CharField()
    payment_id = serializers.IntegerField()


class PaymentErrorSerializer(serializers.Serializer):
    error = serializers.CharField()


class WebhookStatusSerializer(serializers.Serializer):
    status = serializers.CharField()


def check_stripe_configured():
    """Check if Stripe is properly configured."""
    if not settings.STRIPE_SECRET_KEY:
        return False, "Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables."
    return True, None


class CreateCheckoutSessionView(APIView):
    """Create a Stripe Checkout Session for consultation fee payment."""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=CheckoutSessionRequestSerializer,
        responses={
            200: CheckoutSessionResponseSerializer,
            400: PaymentErrorSerializer,
            403: PaymentErrorSerializer,
            500: PaymentErrorSerializer,
            503: PaymentErrorSerializer,
        },
    )
    def post(self, request):
        # Check if Stripe is configured
        is_configured, error_message = check_stripe_configured()
        if not is_configured:
            return Response(
                {"error": error_message},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Only patients can create payments
        if request.user.role != User.Role.PATIENT:
            return Response(
                {"error": "Only patients can make payments"},
                status=status.HTTP_403_FORBIDDEN
            )

        appointment_id = request.data.get("appointment_id")
        
        # Optional: validate appointment exists and belongs to patient
        # For now, we'll just create the payment

        try:
            # Create Stripe Checkout Session first
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[
                    {
                        "price_data": {
                            "currency": settings.STRIPE_CURRENCY,
                            "unit_amount": settings.STRIPE_CONSULTATION_FEE,
                            "product_data": {
                                "name": "Consultation Fee",
                                "description": "Medical consultation fee",
                            },
                        },
                        "quantity": 1,
                    }
                ],
                mode="payment",
                success_url="http://localhost:5173/payment/success?session_id={CHECKOUT_SESSION_ID}",
                cancel_url="http://localhost:5173/payment/cancel",
                customer_email=request.user.email,
            )

            # Create payment record with actual session ID
            payment = Payment.objects.create(
                patient=request.user,
                appointment_id=appointment_id if appointment_id else None,
                amount=Decimal(settings.STRIPE_CONSULTATION_FEE) / 100,  # Convert cents to dollars
                currency=settings.STRIPE_CURRENCY,
                status=Payment.Status.PENDING,
                stripe_checkout_session_id=checkout_session.id
            )

            return Response({
                "url": checkout_session.url,
                "session_id": checkout_session.id,
                "payment_id": payment.id
            })

        except stripe.error.StripeError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@extend_schema(
    request=None,
    responses={200: WebhookStatusSerializer, 400: PaymentErrorSerializer},
)
@api_view(["POST"])
@permission_classes([])  # No authentication for webhooks
def stripe_webhook(request):
    """Handle Stripe webhook events."""
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
    
    if not settings.STRIPE_WEBHOOK_SECRET:
        # If no webhook secret configured, skip verification (dev mode)
        return Response(
            {"error": "Webhook secret not configured"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return Response(
            {"error": "Invalid payload"},
            status=status.HTTP_400_BAD_REQUEST
        )
    except stripe.error.SignatureVerificationError:
        return Response(
            {"error": "Invalid signature"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Handle the checkout.session.completed event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        handle_checkout_session_completed(session)

    return Response({"status": "success"})


def handle_checkout_session_completed(session):
    """Process completed checkout session."""
    try:
        payment = Payment.objects.get(stripe_checkout_session_id=session.id)
        
        if payment.status != Payment.Status.PAID:
            payment.status = Payment.Status.PAID
            payment.stripe_payment_intent_id = session.get("payment_intent")
            payment.paid_at = timezone.now()
            payment.save()

            # Create invoice
            Invoice.objects.get_or_create(payment=payment)

    except Payment.DoesNotExist:
        print(f"Payment not found for session {session.id}")


@extend_schema(
    request=None,
    responses={
        200: PaymentSerializer,
        400: PaymentErrorSerializer,
        403: PaymentErrorSerializer,
        404: PaymentErrorSerializer,
        503: PaymentErrorSerializer,
    },
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    """Verify payment status from Stripe (browser fallback)."""
    # Check if Stripe is configured
    is_configured, error_message = check_stripe_configured()
    if not is_configured:
        return Response(
            {"error": error_message},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    session_id = request.query_params.get("session_id")
    
    if not session_id:
        return Response(
            {"error": "session_id is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Retrieve session from Stripe
        session = stripe.checkout.Session.retrieve(session_id)
        
        # Find payment
        try:
            payment = Payment.objects.get(stripe_checkout_session_id=session_id)
        except Payment.DoesNotExist:
            return Response(
                {"error": "Payment not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verify user owns this payment
        if payment.patient != request.user:
            return Response(
                {"error": "You don't have permission to view this payment"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Update payment if paid
        if session.payment_status == "paid" and payment.status != Payment.Status.PAID:
            payment.status = Payment.Status.PAID
            payment.stripe_payment_intent_id = session.get("payment_intent")
            payment.paid_at = timezone.now()
            payment.save()

            # Create invoice
            Invoice.objects.get_or_create(payment=payment)

        serializer = PaymentSerializer(payment)
        return Response(serializer.data)

    except stripe.error.StripeError as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@extend_schema(
    request=None,
    responses={200: PaymentSerializer(many=True), 403: PaymentErrorSerializer},
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def payment_history(request):
    """Get payment history for the authenticated patient."""
    if request.user.role != User.Role.PATIENT:
        return Response(
            {"error": "Only patients can view payment history"},
            status=status.HTTP_403_FORBIDDEN
        )

    ensure_patient_default_data(request.user)
    payments = Payment.objects.filter(patient=request.user).select_related("appointment")
    serializer = PaymentSerializer(payments, many=True)
    return Response(serializer.data)


@extend_schema(exclude=True)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def download_invoice(request, payment_id):
    """Generate and download invoice PDF for a payment."""
    try:
        payment = Payment.objects.get(id=payment_id)
    except Payment.DoesNotExist:
        return Response(
            {"error": "Payment not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Verify user owns this payment
    if payment.patient != request.user:
        return Response(
            {"error": "You don't have permission to view this invoice"},
            status=status.HTTP_403_FORBIDDEN
        )

    # Payment must be paid
    if payment.status != Payment.Status.PAID:
        return Response(
            {"error": "Invoice not available for unpaid payments"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get or create invoice
    invoice, created = Invoice.objects.get_or_create(payment=payment)

    # Generate PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []

    # Styles
    styles = getSampleStyleSheet()
    title_style = styles["Title"]
    heading_style = styles["Heading2"]
    normal_style = styles["Normal"]

    # Title
    elements.append(Paragraph("INVOICE", title_style))
    elements.append(Spacer(1, 0.3 * inch))

    # Invoice details
    elements.append(Paragraph(f"Invoice Number: {invoice.invoice_number}", heading_style))
    elements.append(Paragraph(f"Invoice Date: {invoice.generated_at.strftime('%B %d, %Y')}", normal_style))
    elements.append(Spacer(1, 0.2 * inch))

    # Patient details
    elements.append(Paragraph("Bill To:", heading_style))
    elements.append(Paragraph(f"{payment.patient.get_full_name()}", normal_style))
    elements.append(Paragraph(f"{payment.patient.email}", normal_style))
    elements.append(Spacer(1, 0.3 * inch))

    # Payment details table
    payment_data = [
        ["Description", "Amount", "Status"],
        [
            "Consultation Fee",
            f"${payment.amount} {payment.currency.upper()}",
            payment.status
        ]
    ]

    if payment.paid_at:
        payment_data.append([
            "Paid On",
            payment.paid_at.strftime('%B %d, %Y %H:%M UTC'),
            ""
        ])

    table = Table(payment_data, colWidths=[3 * inch, 2 * inch, 1.5 * inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 12),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
        ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
        ("GRID", (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(table)
    elements.append(Spacer(1, 0.5 * inch))

    # Footer
    elements.append(Paragraph("Thank you for your payment!", normal_style))

    # Build PDF
    doc.build(elements)
    buffer.seek(0)

    # Return PDF response
    response = FileResponse(buffer, content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="invoice_{invoice.invoice_number}.pdf"'
    return response
