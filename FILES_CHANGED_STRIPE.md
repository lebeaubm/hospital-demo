# Stripe Payment Integration - Files Changed

This document lists all files created or modified for the Stripe payment integration feature.

## Backend Changes

### New Files Created

1. **`backend/core/payment_views.py`**
   - New file containing all payment-related views and Stripe integration
   - Implements:
     - `CreateCheckoutSessionView`: Creates Stripe Checkout Sessions
     - `stripe_webhook`: Handles Stripe webhook events (checkout.session.completed)
     - `verify_payment`: Browser fallback verification endpoint
     - `payment_history`: Returns patient's payment history
     - `download_invoice`: Generates and downloads PDF invoices using ReportLab

2. **`backend/core/migrations/0010_payment_invoice.py`**
   - Django migration file to create Payment and Invoice database tables

### Modified Files

1. **`backend/requirements.txt`**
   - Added `stripe>=7.0.0` for Stripe API integration
   - Added `reportlab>=4.0.0` for PDF invoice generation

2. **`backend/core/models.py`**
   - Added `Payment` model with fields:
     - patient (ForeignKey to User)
     - appointment (ForeignKey to Appointment, optional)
     - amount, currency, status
     - stripe_checkout_session_id, stripe_payment_intent_id, receipt_url
     - paid_at, created_at, updated_at
   - Added `Invoice` model with fields:
     - payment (OneToOneField to Payment)
     - invoice_number (auto-generated)
     - pdf_file (optional storage)
     - generated_at

3. **`backend/backend/settings.py`**
   - Added Stripe configuration variables:
     - STRIPE_SECRET_KEY
     - STRIPE_PUBLISHABLE_KEY
     - STRIPE_WEBHOOK_SECRET
     - STRIPE_CONSULTATION_FEE (default: 5000 cents = $50)
     - STRIPE_CURRENCY (default: 'usd')

4. **`backend/core/serializers.py`**
   - Added import for Payment and Invoice models
   - Added `PaymentSerializer` with fields for patient info, appointment, amounts, and Stripe data
   - Added `InvoiceSerializer` with nested payment details

5. **`backend/core/urls.py`**
   - Added import for payment views
   - Added 5 new URL patterns:
     - `payments/checkout-session/` → CreateCheckoutSessionView
     - `payments/webhook/` → stripe_webhook
     - `payments/verify/` → verify_payment
     - `payments/my/` → payment_history
     - `payments/<int:payment_id>/invoice/` → download_invoice

6. **`backend/core/admin.py`**
   - Added import for Payment and Invoice models
   - Added `PaymentAdmin` with list display, filters, and readonly fields
   - Added `InvoiceAdmin` with invoice management

## Frontend Changes

### New Files Created

1. **`frontend/src/pages/PaymentSuccess.jsx`**
   - Success page shown after Stripe Checkout completion
   - Automatically calls verification endpoint with session_id
   - Displays payment confirmation and links to payment history

2. **`frontend/src/pages/PaymentCancel.jsx`**
   - Cancel page shown if user cancels Stripe Checkout
   - Provides links back to appointments and support

3. **`frontend/src/pages/Payments.jsx`**
   - Payment history page for patients
   - Lists all payments with status badges
   - Includes "Download Invoice" button for paid payments
   - Handles PDF download via blob URL

### Modified Files

1. **`frontend/src/api/client.js`**
   - Added 4 payment API functions:
     - `createCheckoutSession(appointmentId)`: Creates Stripe Checkout Session
     - `verifyPayment(sessionId)`: Verifies payment from browser
     - `getPaymentHistory()`: Fetches patient's payment history
     - `downloadInvoice(paymentId)`: Downloads invoice PDF as blob

2. **`frontend/src/pages/Appointments.jsx`**
   - Added import for `createCheckoutSession`
   - Added `paymentLoading` state
   - Added `handlePayConsultationFee` function
   - Added " Pay Consultation Fee" button to each appointment card
   - Button shows loading spinner during payment initiation

3. **`frontend/src/App.jsx`**
   - Added imports for payment pages: Payments, PaymentSuccess, PaymentCancel
   - Added "Payments" link to patient navigation menu
   - Added 3 new routes:
     - `/portal/payments` → Payments page (protected)
     - `/payment/success` → PaymentSuccess page
     - `/payment/cancel` → PaymentCancel page

## Documentation Changes

1. **`README.md`**
   - Added Stripe environment variables to configuration section
   - Added comprehensive "Stripe Payment Testing (Browser-Only)" section with:
     - Test mode setup instructions
     - Step-by-step payment flow testing guide
     - Test card numbers
     - Browser verification explanation
     - Feature list
   - Added payment API endpoints documentation

## Database Changes

The migration creates two new tables:

1. **`core_payment`**
   - Tracks all payment transactions
   - Links to patients and appointments
   - Stores Stripe session and payment intent IDs

2. **`core_invoice`**
   - Links one-to-one with payments
   - Stores invoice numbers
   - Optional PDF file storage

## Summary

**Total Files Changed: 13**
- Backend: 7 files modified, 2 files created
- Frontend: 3 files modified, 3 files created
- Documentation: 1 file modified

**New Dependencies:**
- `stripe>=7.0.0` (Python)
- `reportlab>=4.0.0` (Python)

**New Features:**
-  Stripe Checkout integration
-  Payment verification (browser fallback)
-  Payment history
-  PDF invoice generation and download
-  Webhook support (production-ready)
-  Test mode support with Stripe test cards

## Running Instructions

1. **Install dependencies:**
   ```powershell
   cd backend
   pip install stripe reportlab
   ```

2. **Run migrations:**
   ```powershell
   python manage.py migrate
   ```

3. **Configure Stripe (optional for testing):**
   - Get test keys from https://stripe.com (Developers → API keys)
   - Add to `backend/.env`:
     ```env
     STRIPE_SECRET_KEY=sk_test_...
     STRIPE_PUBLISHABLE_KEY=pk_test_...
     ```

4. **Start servers:**
   ```powershell
   # Backend
   cd backend
   python manage.py runserver

   # Frontend (new terminal)
   cd frontend
   npm run dev
   ```

5. **Test payments:**
   - Login as patient: `patient@example.com` / `Pass1234!`
   - Go to "My Appointments"
   - Click "Pay Consultation Fee"
   - Use test card: `4242 4242 4242 4242`
   - View payment in "Payments" menu

## Security Notes

-  Stripe secret key stored in environment variables only
-  No card data stored in database
-  Patients can only see their own payments/invoices
-  Payment verification checks ownership
-  Webhook signature verification (when configured)
-  CSRF protection on API endpoints
