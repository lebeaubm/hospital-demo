# Payment Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "Stripe is not configured" Error

**Symptoms:**
- Clicking "Pay Consultation Fee" shows error: "Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables."
- HTTP 503 Service Unavailable response from payment endpoint

**Solution:**
1. Sign up for a free Stripe account at https://stripe.com
2. Navigate to: Developers → API keys
3. Copy your **test mode** keys (they start with `sk_test_` and `pk_test_`)
4. Create `backend/.env` file with:
   ```env
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
   ```
5. Restart the backend server:
   ```powershell
   cd backend
   python manage.py runserver
   ```

### Issue 2: 401 Unauthorized on Medical Records

**Symptoms:**
- Error: `GET http://127.0.0.1:8000/api/records/me/ 401 (Unauthorized)`

**Possible Causes:**
1. JWT token expired
2. User not logged in
3. Token not being sent with request

**Solution:**
1. Log out and log back in
2. Check browser console for token issues
3. Clear localStorage and login again:
   ```javascript
   localStorage.clear()
   ```

### Issue 3: Payment Creates But No Redirect

**Symptoms:**
- Payment endpoint returns success but no redirect to Stripe

**Solution:**
- Check browser console for errors
- Verify the `url` property is returned from the API
- Try manually navigating to the URL

### Issue 4: Invoice Download Not Working

**Symptoms:**
- "Download Invoice" button doesn't work
- PDF doesn't download

**Possible Causes:**
1. Payment not marked as PAID
2. Invoice not generated
3. Browser blocking download

**Solution:**
1. Verify payment status is PAID in payment history
2. Check browser's download settings
3. Try a different browser
4. Check backend logs for PDF generation errors

### Issue 5: Webhook Not Working (Production)

**Symptoms:**
- Payments not updating to PAID after Stripe Checkout
- Have to use browser verification manually

**Note:** Webhooks are optional for local development. Browser fallback verification is implemented.

**For Production:**
1. Configure webhook in Stripe Dashboard
2. Set endpoint URL: `https://yourdomain.com/api/payments/webhook/`
3. Select event: `checkout.session.completed`
4. Copy webhook signing secret
5. Add to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

## Testing Checklist

Before testing payments, ensure:

- [x] Backend server is running (`python manage.py runserver`)
- [x] Frontend server is running (`npm run dev`)
- [x] Logged in as a patient account
- [x] Stripe keys are configured in `backend/.env`
- [x] `.env` file is loaded (restart backend after creating)
- [x] Using test card numbers (4242 4242 4242 4242)

## Debug Mode

To see detailed error messages from the backend:

1. Check Django console output where `manage.py runserver` is running
2. Look for Python stack traces
3. Common errors:
   - `stripe.error.AuthenticationError` - Invalid Stripe key
   - `stripe.error.InvalidRequestError` - Bad API request
   - `ValueError` - Missing or invalid data

## Still Having Issues?

1. Check backend logs (terminal running `manage.py runserver`)
2. Check frontend console (browser developer tools)
3. Verify all migrations are applied: `python manage.py migrate`
4. Verify dependencies are installed: `pip install stripe reportlab`
5. Try with a fresh database: `python manage.py flush` (⚠️ deletes all data)

## Verify Configuration

Run this command to check Stripe configuration:

```powershell
cd backend
python manage.py shell -c "from django.conf import settings; print('Stripe Configured:', bool(settings.STRIPE_SECRET_KEY))"
```

Expected output:
- ✅ `Stripe Configured: True` - Ready to test
- ❌ `Stripe Configured: False` - Need to configure keys

## Test Without Stripe (Optional)

To test the application without payment functionality:
1. Simply don't configure Stripe keys
2. Payment buttons will show configuration error
3. All other features will work normally
4. Medical records, appointments, and staff features are independent

## Contact Support

If issues persist:
1. Check the error messages in browser console
2. Check Django server logs
3. Verify Stripe test mode is enabled (not live mode)
4. Ensure you're using test cards, not real cards
