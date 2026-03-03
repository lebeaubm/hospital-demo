# Hospital Demo — Browser Testing Guide

> **Reference this file as you click through the site.**
> Each section tells you exactly where to go, what to do, and what a passing result looks like.

---

## Before You Start — Launch the App

**Terminal 1 (Backend):**
```powershell
cd hospital-demo\backend
python manage.py runserver
```

**Terminal 2 (Frontend):**
```powershell
cd hospital-demo\frontend
npm run dev
```

| URL | What it is |
|---|---|
| http://localhost:5173 | Frontend (main app) |
| http://127.0.0.1:8000 | Backend API root |
| http://127.0.0.1:8000/admin | Django admin panel |

---

## Login Credentials

| Role | Email | Password |
|---|---|---|
| Patient | `patient@example.com` | `Pass1234!` |
| Staff | `staff@example.com` | `StaffPass123!` |
| Admin | `lebeaubm@yahoo.com` | `Admin123!` |
| Test Patient | `jane.christ@testpatient.com` | `JaneTest123!` |
| Test Staff | `jack.christ@teststaff.com` | `JackStaff123!` |

---

---

## SECTION A — Public Pages (No Login Required)

### A1 — Home Page
- [ ] Go to: **http://localhost:5173/**
- **Expect:** Landing page loads, navbar shows Login and Register links

### A2 — Services Page
- [ ] Go to: **http://localhost:5173/services**
- **Expect:** Page loads with a list of hospital services

### A3 — Contact Page
- [ ] Go to: **http://localhost:5173/contact**
- **Expect:** Contact info or form displayed

### A4 — Doctors List
- [ ] Go to: **http://localhost:5173/doctors**
- **Expect:** Grid or list of doctors with name, specialty, department

### A5 — Doctor Detail
- [ ] Click any doctor card on the doctors list
- **Expect:** Detail page shows name, specialty, location, bio
- [ ] URL should change to `/doctors/<id>`

---

## SECTION B — Authentication

### B1 — Register a New Account
- [ ] Go to: **http://localhost:5173/register**
- [ ] Fill in: first name, last name, email (use something new), password
- [ ] Click **Register**
- **Expect:** Success message or redirect; no red errors

### B2 — Login (Valid)
- [ ] Go to: **http://localhost:5173/login**
- [ ] Enter: `patient@example.com` / `Pass1234!`
- [ ] Click **Login**
- **Expect:** Redirect to home or portal; navbar changes to show "My Health" dropdown and Logout

### B3 — Login (Invalid)
- [ ] Stay on login page, enter a wrong password
- **Expect:** Error message shown (e.g. "Invalid credentials") — no crash or blank page

### B4 — Protected Route (Logged Out)
- [ ] Log out first, then manually go to: **http://localhost:5173/portal/appointments**
- **Expect:** Redirected to login page

### B5 — Staff Route Blocked for Patients
- [ ] Log in as **patient**, then manually go to: **http://localhost:5173/staff/dashboard**
- **Expect:** Access denied message or redirect — patient cannot see staff dashboard

### B6 — Logout
- [ ] While logged in, click **Logout** in the navbar
- **Expect:** Redirected to home, navbar reverts to Login/Register links

---

## SECTION C — Patient Portal

> Log in as **patient** (`patient@example.com` / `Pass1234!`) before starting this section.

---

### C1 — My Profile
- [ ] Go to: **http://localhost:5173/portal/profile**
- **Expect:** Your name, email, date of birth, and address are shown
- [ ] Edit one field (e.g. address), save
- **Expect:** Changes saved; refresh the page and confirm the update persisted

---

### C2 — Appointments
- [ ] Click **My Health → Appointments** in the navbar  
  OR go to: **http://localhost:5173/portal/appointments**
- **Expect:** Your appointment list loads (cards or table with date, doctor, status)

#### Request a New Appointment
- [ ] Go to: **http://localhost:5173/portal/request-appointment**
- [ ] Select a doctor, pick a date/time, enter a reason
- [ ] Click **Submit**
- **Expect:** New appointment appears in your list with status `REQUESTED`

#### Cancel an Appointment
- [ ] Find a `REQUESTED` appointment and click **Cancel**
- **Expect:** Status updates to `CANCELED`

---

### C3 — Medical Records
- [ ] Click **My Health → Medical Records**  
  OR go to: **http://localhost:5173/portal/records**
- **Expect:** Medical history, allergies, and current medications section visible

#### Shared Notes
- [ ] Look for a "Notes" section
- **Expect:** Only notes shared by staff appear — no "Staff Only" notes visible

#### Upload a Document
- [ ] Find the document upload section
- [ ] Upload any small file (PDF or image)
- **Expect:** File appears in your document list after upload

#### Download a Document
- [ ] Click **Download** on any listed document
- **Expect:** File downloads to your computer

---

### C4 — Prescriptions
- [ ] Click **My Health → Prescriptions**  
  OR go to: **http://localhost:5173/portal/prescriptions**
- **Expect:** List of prescriptions (Lisinopril, Metformin, Atorvastatin if using demo data)

#### Request a Refill
- [ ] Click **Request Refill** on any active prescription
- **Expect:** Refill request submitted; confirmation shown
- [ ] Check the **Refill Requests** tab or section
- **Expect:** Your new request appears with status `PENDING`

---

### C5 — Lab Results
- [ ] Click **My Health → Lab Results**  
  OR go to: **http://localhost:5173/portal/lab-results**
- **Expect:** Lab orders listed (CBC, Lipid Panel if using demo data)
- [ ] Click a completed lab order
- **Expect:** Detail view shows individual test values; abnormal values are highlighted

---

### C6 — Messages
- [ ] Click **My Health → Messages**  
  OR go to: **http://localhost:5173/portal/messages**
- **Expect:** Your message threads listed

#### Create a New Thread
- [ ] Click **New** or **Compose**
- [ ] Enter a subject ("Question about medication"), write a message, submit
- **Expect:** New thread appears in the list

#### Reply to a Thread
- [ ] Open an existing thread
- [ ] Type a reply and send
- **Expect:** New message appears at the bottom of the thread

---

### C7 — Bills & Payments
- [ ] Click **My Health → Bills & Payments**  
  OR go to: **http://localhost:5173/portal/billing**
- **Expect:** Summary cards showing total balance, paid bills, unpaid bills
- [ ] Click a bill (if any exist)
- **Expect:** Detail view shows line items with service names and amounts

#### Pay a Bill (Stripe Test)
- [ ] Click **Pay Now** on an unpaid bill
- **Expect:** Redirected to Stripe checkout page
- [ ] Use test card: **4242 4242 4242 4242**, any future expiry, any CVC
- **Expect:** Redirected back to `/portal/payments/success`

#### Payment History
- [ ] Go to: **http://localhost:5173/portal/payments**
- **Expect:** List of past payments

#### Download Invoice
- [ ] Click **Download Invoice** on a paid bill
- **Expect:** Invoice/PDF file downloads

---

### C8 — Family Members
- [ ] Click **My Health → Family Members**  
  OR go to: **http://localhost:5173/portal/family**
- **Expect:** List of family members (or empty state if none added)

#### Add a Family Member
- [ ] Click **Add Family Member**
- [ ] Fill in: Name = "Jane Doe", DOB = any date, Relationship = "Spouse"
- [ ] Save
- **Expect:** New family member card appears in the list

---

---

## SECTION D — Staff Features

> Log out of the patient account, then log in as **staff** (`staff@example.com` / `StaffPass123!`).

---

### D1 — Staff Dashboard
- [ ] Go to: **http://localhost:5173/staff/dashboard**
- **Expect:** Table or list of ALL patient appointments, with patient name, date, status

#### Confirm an Appointment
- [ ] Find an appointment with status `REQUESTED`
- [ ] Change status to **Confirmed**
- **Expect:** Status updates; confirmation email should be logged

#### Complete an Appointment
- [ ] Change a confirmed appointment status to **Completed**
- **Expect:** Status updates; completion email logged

#### Cancel an Appointment (Staff)
- [ ] Cancel any appointment
- **Expect:** Status updates to `CANCELED`; cancellation email logged

---

### D2 — View a Patient's Full Record
- [ ] From the Staff Dashboard, click on a patient name or a "View Record" button
- **Expect:** Full patient medical record page loads (history, allergies, medications, notes, documents)

#### Edit the Medical Record
- [ ] Update the "Medical History" or "Allergies" field
- [ ] Save
- **Expect:** Changes saved

#### Add a Clinical Note
- [ ] Find the "Add Note" section
- [ ] Select note type (Visit, Lab, Prescription, General)
- [ ] Write content, set visibility to **Staff Only**, submit
- **Expect:** Note appears in the Staff view

#### Share a Note with Patient
- [ ] Find the note you just created
- [ ] Change visibility to **Shared with Patient**
- **Expect:** Visibility label updates
- [ ] Now log in as the **patient** and check Medical Records
- **Expect:** The shared note is now visible to the patient

#### Delete a Document
- [ ] Find a document in the patient's record
- [ ] Click **Delete**
- **Expect:** Document removed from the list (staff-only feature)

---

### D3 — Staff Prescriptions
- [ ] While logged in as staff, navigate to the Staff Dashboard and find prescription management  
  (or check if there is a staff prescriptions view in the dashboard)
- **Expect:** Full list of all patient prescriptions

#### Create a Prescription
- [ ] Click **Create Prescription**
- [ ] Fill in patient, medication name, dosage, frequency, pharmacy
- [ ] Submit
- **Expect:** New prescription appears and can be viewed by the patient

#### Approve a Refill Request
- [ ] Find the pending refill request submitted in C4
- [ ] Change status to **Approved**
- **Expect:** Status updates; patient sees updated status on their Prescriptions page

---

### D4 — Staff Lab Orders
- [ ] From the Staff Dashboard, navigate to lab order management

#### Create a Lab Order
- [ ] Click **Create Lab Order**, select a patient and one or more tests
- [ ] Submit
- **Expect:** New order appears in the staff lab order list

#### Record Lab Results
- [ ] Open the new lab order
- [ ] Add a result with individual test values
- **Expect:** Results saved; patient can see them in Lab Results page

---

### D5 — Staff Billing

#### Create a Bill
- [ ] Find the billing management section in the staff dashboard
- [ ] Click **Create Bill**, select a patient
- [ ] Add line items (billable services with amounts)
- [ ] Submit
- **Expect:** Bill appears in the patient's billing page

#### Mark a Bill as Paid
- [ ] Update the bill status
- **Expect:** Status changes; summary cards on patient billing page update

---

### D6 — Email Logs
- [ ] Go to: **http://localhost:5173/staff/emails**
- **Expect:** Table of all email events (welcome, appointment requested, confirmed, completed, canceled)

#### Send a Custom Email
- [ ] Find the **Send Email** form on this page
- [ ] Enter a patient's email address, subject, and body
- [ ] Send
- **Expect:** New entry appears in the log with type "Staff Custom Email"

#### Check Email Log Detail
- [ ] Click any log entry
- **Expect:** Full email details (to, subject, body, status, timestamp) shown

---

---

## SECTION E — UI & Cross-Cutting Checks

### E1 — Dark / Light Theme
- [ ] Click the **Theme Toggle** button (sun/moon icon in navbar)
- **Expect:** Entire app switches to dark mode
- [ ] Refresh the page
- **Expect:** Theme preference is remembered

### E2 — Responsive / Mobile Nav
- [ ] Shrink your browser window to ~375px wide (or use DevTools mobile view)
- **Expect:** Navbar collapses to a hamburger menu
- [ ] Click the hamburger icon
- **Expect:** Menu opens with all navigation links

### E3 — Loading States
- [ ] Navigate to any data-heavy page (Appointments, Lab Results)
- **Expect:** A skeleton loader or spinner appears briefly before data loads

### E4 — Error State
- [ ] Stop the backend server, then try to load a page with data
- **Expect:** An error alert or message is shown — not a blank white page
- [ ] Restart the backend after testing

### E5 — Empty State
- [ ] Register a brand new account and log in
- [ ] Navigate to Appointments, Messages, Bills
- **Expect:** Each page shows a helpful "No data yet" or similar empty state message

---

---

## SECTION F — Security Checks

| Test | How to test | Expected result |
|---|---|---|
| Patient sees only own appointments | Log in as patient → `/portal/appointments` | Only your own appointments listed |
| Patient blocked from staff API | Log in as patient → visit `http://127.0.0.1:8000/api/staff/appointments/` | 403 Forbidden response |
| Staff-only notes not visible to patient | Add a Staff Only note as staff → log in as patient → check Medical Records | Note does NOT appear |
| Document download authorization | Copy a document URL from one patient while logged in as a different patient | 403 or 404 response |
| Stripe webhook security | Webhook endpoint only accepts Stripe-signed requests | Direct POST returns 400 |

---

---

## Quick Reference — All Frontend Routes

| Path | Who can see it | Description |
|---|---|---|
| `/` | Everyone | Home |
| `/services` | Everyone | Services list |
| `/doctors` | Everyone | Doctors list |
| `/doctors/:id` | Everyone | Doctor detail |
| `/contact` | Everyone | Contact page |
| `/login` | Logged out | Login form |
| `/register` | Logged out | Registration form |
| `/portal/profile` | Patient | My profile |
| `/portal/appointments` | Patient | My appointments |
| `/portal/request-appointment` | Patient | Request a new appointment |
| `/portal/records` | Patient | Medical records |
| `/portal/prescriptions` | Patient | Prescriptions & refills |
| `/portal/lab-results` | Patient | Lab orders & results |
| `/portal/messages` | Patient | Secure messages |
| `/portal/billing` | Patient | Bills & payments |
| `/portal/payments` | Patient | Payment history |
| `/portal/payments/success` | Patient | Payment success page |
| `/portal/payments/cancel` | Patient | Payment cancelled page |
| `/portal/family` | Patient | Family members |
| `/staff/dashboard` | Staff only | All appointments |
| `/staff/emails` | Staff only | Email logs & send |
| `/staff/patients/:id/record` | Staff only | Full patient record |

---

*Backend runs at `http://127.0.0.1:8000` · Frontend runs at `http://localhost:5173`*
