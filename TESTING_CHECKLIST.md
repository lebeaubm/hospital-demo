# Hospital Demo — Frontend Testing Checklist

Use this checklist to verify every feature works correctly. Test as both a **Patient** and **Staff** user where noted.

---

## 1. Authentication

- [ ] **Register** — Visit `/register`, create a new patient account, verify redirect to login or home
- [ ] **Login** — Visit `/login` with valid credentials, verify token stored and user redirected
- [ ] **Login (invalid)** — Enter wrong password, verify error message shown
- [ ] **Logout** — Click logout, verify tokens cleared and nav updates to show Login/Register links
- [ ] **JWT Refresh** — Stay logged in past 5 minutes of inactivity; verify token silently refreshes and session continues
- [ ] **Protected routes** — Visit `/portal/appointments` while logged out, verify redirect to login
- [ ] **Staff-only routes** — Log in as patient and manually visit `/staff/dashboard`, verify access denied

---

## 2. Public Pages

- [ ] **Home** (`/`) — Page loads with no errors
- [ ] **Services** (`/services`) — Page loads, services displayed
- [ ] **Contact** (`/contact`) — Page loads, contact info displayed
- [ ] **Doctors List** (`/doctors`) — List of doctors loads correctly
- [ ] **Doctor Detail** (`/doctors/:id`) — Click a doctor, detail page loads with specialty, bio, location

---

## 3. Patient Profile

- [ ] **View profile** (`/portal/profile`) — Name, email, DOB, address displayed
- [ ] **Edit profile** — Update fields and save, verify changes persist on reload
- [ ] **Profile missing** — New user with no profile sees a prompt or empty state

---

## 4. Appointments (Patient)

- [ ] **View appointments** (`/portal/appointments`) — List of own appointments loads
- [ ] **Request appointment** (`/portal/request-appointment`) — Fill form (doctor, date, reason), submit, verify new appointment appears with status `REQUESTED`
- [ ] **Appointment detail** — Click an appointment, detail view shows all fields
- [ ] **Cancel appointment** — Cancel a pending appointment, verify status updates to `CANCELED`
- [ ] **Email on request** — After requesting, verify email notification log entry is created (check staff email logs)

---

## 5. Medical Records (Patient)

- [ ] **View records** (`/portal/records`) — Medical history, allergies, current medications shown
- [ ] **View shared notes** — Notes marked "Shared with Patient" appear; staff-only notes do NOT appear
- [ ] **View documents** — Documents visible to patient are listed
- [ ] **Upload document** — Upload a file (PDF/image), verify it appears in the document list
- [ ] **Download document** — Click download on an existing document, verify file downloads

---

## 6. Prescriptions (Patient)

- [ ] **View prescriptions** (`/portal/prescriptions`) — All prescriptions listed with medication name, dosage, status
- [ ] **Prescription detail** — Click a prescription, full details shown
- [ ] **Request refill** — Click "Request Refill" on an active prescription, verify refill request created
- [ ] **View refill history** — Past refill requests visible with status

---

## 7. Lab Results (Patient)

- [ ] **View lab orders** (`/portal/lab-results`) — All lab orders listed
- [ ] **Lab order detail** — Click an order, see associated results and values
- [ ] **Lab test types** — Results show the correct test name and reference ranges

---

## 8. Messages (Patient)

- [ ] **View threads** (`/portal/messages`) — All message threads listed
- [ ] **Create new thread** — Start a new thread with a subject, verify it appears in list
- [ ] **Send a message** — Open a thread, send a message, verify it appears
- [ ] **Thread detail** — All messages in a thread displayed in order

---

## 9. Billing (Patient)

- [ ] **View bills** (`/portal/billing`) — All bills listed with total and status
- [ ] **Bill detail** — Click a bill, line items shown with amounts
- [ ] **Pay bill (Stripe)** — Click "Pay", redirect to Stripe checkout, complete test payment, verify redirect to `/portal/payments/success`
- [ ] **Payment cancelled** — Cancel Stripe checkout, verify redirect to `/portal/payments/cancel`
- [ ] **Payment history** (`/portal/payments`) — All past payments listed
- [ ] **Download invoice** — Click download on a paid bill, PDF/invoice downloads

---

## 10. Family Members (Patient)

- [ ] **View family members** — List of linked family members shown
- [ ] **Add family member** — Fill form and submit, verify new member appears
- [ ] **Edit/delete family member** — Update or remove a family member

---

## 11. Staff Dashboard

- [ ] **Access dashboard** (`/staff/dashboard`) — Staff user sees all patient appointments
- [ ] **Filter/search appointments** — Filter by status or patient name works
- [ ] **Confirm appointment** — Change status from `REQUESTED` → `CONFIRMED`, verify email notification sent
- [ ] **Complete appointment** — Change status to `COMPLETED`, verify email sent
- [ ] **Cancel appointment (staff)** — Staff cancels an appointment, verify email sent
- [ ] **Add staff notes** — Staff can add internal notes to an appointment

---

## 12. Staff — Patient Records

- [ ] **View patient record** — Staff clicks a patient in dashboard, full medical record shown
- [ ] **Edit medical record** — Update history, allergies, or medications and save
- [ ] **Add clinical note** — Staff creates a new note (Visit, Lab, Prescription, General)
- [ ] **Note visibility — staff only** — New notes default to "Staff Only"; patient cannot see them
- [ ] **Share note with patient** — Toggle a note to "Shared with Patient", verify patient can now see it
- [ ] **View patient documents** — Staff sees all documents (including staff-only)
- [ ] **Upload document (staff)** — Staff uploads a document to a patient's record
- [ ] **Delete document** — Staff deletes a document, verify it disappears

---

## 13. Staff — Prescriptions

- [ ] **View all prescriptions** — Staff sees prescriptions for all patients
- [ ] **Create prescription** — Fill form with patient, medication, dosage, pharmacy, submit
- [ ] **Edit prescription** — Update fields on an existing prescription
- [ ] **View refill requests** — All patient refill requests listed
- [ ] **Approve/deny refill** — Staff updates a refill request status

---

## 14. Staff — Lab Orders & Results

- [ ] **View all lab orders** — Staff sees all patient lab orders
- [ ] **Create lab order** — Create a new lab order for a patient with selected tests
- [ ] **Update lab order status** — Change status of an order (e.g., Pending → Completed)
- [ ] **Add lab result** — Attach a result to an order
- [ ] **Add result values** — Add individual test values to a result
- [ ] **Update result** — Edit an existing result

---

## 15. Staff — Billing

- [ ] **View all bills** — Staff sees all patient bills
- [ ] **Create bill** — Create a new bill for a patient
- [ ] **Add line items** — Add billable service line items to a bill
- [ ] **Update bill status** — Mark bill as paid or voided
- [ ] **View billable services** — Full list of services with prices loads

---

## 16. Staff — Email Management

- [ ] **View email logs** (`/staff/emails`) — All sent email records listed
- [ ] **Email log detail** — Click a log entry, full email content shown
- [ ] **Send custom email** — Fill the send form and submit to a patient email address
- [ ] **Automated emails in log** — Appointment lifecycle emails (requested, confirmed, completed, canceled) appear in logs

---

## 17. Notifications / Emails (automated triggers)

| Event | Expected Email |
|---|---|
| Patient registers | Welcome email |
| Patient requests appointment | "Appointment Requested" email |
| Staff confirms appointment | "Appointment Confirmed" email |
| Staff completes appointment | "Appointment Completed" email |
| Staff/patient cancels appointment | "Appointment Canceled" email |
| Staff sends custom email | Logged as "Staff Custom Email" |

- [ ] All of the above events appear in the **Staff Email Logs** page

---

## 18. UI / UX

- [ ] **Dark/Light theme toggle** — Toggle switches theme, preference persists on refresh
- [ ] **Responsive navbar** — On mobile screen, hamburger menu opens/closes correctly
- [ ] **Loading states** — Skeleton loaders or spinners shown while data is fetching
- [ ] **Error states** — If an API call fails, an error alert is shown (not a blank page)
- [ ] **Empty states** — Pages with no data show a helpful empty message

---

## 19. Security / Permissions

- [ ] **Patient cannot access staff APIs** — Calling a staff endpoint as a patient returns 403
- [ ] **Patient cannot see other patients' data** — Appointments, records, bills only show own data
- [ ] **Document download authorization** — Attempting to download a document belonging to another patient returns 403/404
- [ ] **Staff-only notes not leaked** — Patient API for notes does not return `STAFF_ONLY` notes

---

## 20. Stripe Payments (end-to-end)

- [ ] Use Stripe test card `4242 4242 4242 4242` with any future expiry and CVC
- [ ] Successful payment updates bill status and creates a payment record
- [ ] Failed payment (card `4000 0000 0000 0002`) shows an error state
- [ ] Webhook processes the payment event and updates the DB
- [ ] Invoice can be downloaded after successful payment

---

*Test environment: `http://localhost:5173` (frontend) / `http://localhost:8000` (backend)*
