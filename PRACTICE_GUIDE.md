# Practice Guide — How to Use the Hospital Website
### For: Jane Christ (Patient) and Jack Christ (Staff)

---

## Before You Start

Open your web browser (Chrome, Edge, etc.) and go to:
**http://localhost:5173**

You will see the login page.

---

---

# PART 1 — Practice as a PATIENT (Jane Christ)

> Jane is a regular patient. She can book appointments, view her bills, and make payments.

---

## Step 1 — Log In as Jane

1. On the login page, type in these details:
   - **Email:** `jane.christ@testpatient.com`
   - **Password:** `JaneTest123!`
2. Click the **Sign In** button
3. You should now see Jane's dashboard

---

## Step 2 — Look at Jane's Dashboard

- You will see a welcome message with Jane's name
- There are cards showing upcoming appointments and any bills she owes
- Click around and explore — you cannot break anything!

---

## Step 3 — Book a New Appointment

1. Click **"Book Appointment"** or find the Appointments section in the menu
2. Choose a doctor from the list
3. Pick a date and time
4. Type a short reason (example: *"Routine checkup"*)
5. Click **Submit** or **Book**
6. You should see a message that the appointment was requested

---

## Step 4 — View Jane's Appointments

1. Click **"Appointments"** in the menu
2. You will see a list of all her appointments
3. Each one shows the date, doctor, and status:
   - **REQUESTED** — waiting for staff to confirm
   - **CONFIRMED** — approved
   - **COMPLETED** — already happened
   - **CANCELED** — canceled

---

## Step 5 — View Jane's Bills

1. Click **"Billing"** in the menu
2. You will see 4 test bills already set up for Jane:
   - One that is already **paid** ✅
   - One that is **partially paid** (some money still owed)
   - One **unpaid MRI bill** ($261)
   - One **overdue lab bill** ($95) — past the due date

---

## Step 6 — Make a Demo Payment

1. On the Billing page, click the **"Pay"** button next to any unpaid bill
2. A payment window will pop up
3. Make sure **"📋 Demo Payment"** is selected (left button — this does NOT charge a real card)
4. The amount is already filled in — you can leave it as is
5. Click **"Submit Payment"**
6. The bill should update and show the payment was recorded

---

## Step 7 — Log Out

1. Look for your name or a menu in the top right corner
2. Click **"Log Out"**
3. You will be taken back to the login page

---

---

# PART 2 — Practice as STAFF (Jack Christ)

> Jack is a staff member. He can manage appointments, create bills, and see all patients.

---

## Step 1 — Log In as Jack

1. On the login page, type in these details:
   - **Email:** `jack.christ@teststaff.com`
   - **Password:** `JackStaff123!`
2. Click the **Sign In** button
3. You should now see the **Staff Dashboard**

---

## Step 2 — Look at the Staff Dashboard

- Jack's dashboard is different from Jane's
- He can see a list of all recent appointments from all patients
- He can see appointments waiting to be confirmed

---

## Step 3 — Confirm an Appointment

1. On the Staff Dashboard, look for appointments with the status **"REQUESTED"**
2. You should see Jane's appointment that she just booked in Part 1
3. Click the green **"✓ Confirm"** button next to it
4. The appointment status will change to **CONFIRMED**

> If Jane logs back in now, she would see her appointment is confirmed!

---

## Step 4 — Search for a Patient

1. In the staff menu, click **"Patients"** or look for a search area
2. Search for **"Jane"**
3. Click on Jane Christ to open her profile
4. You can see her personal details, appointments, and medical history

---

## Step 5 — Create a Bill for a Patient

1. In the staff menu, click **"Billing"**
2. Click the **"+ Create New Bill"** button
3. Fill in the form:
   - **Patient:** search for and select *Jane Christ*
   - **Total Cost ($):** type `150`
   - **Due Date:** pick a date a month from now
   - **Notes:** type something like *"Follow-up consultation fee"*
4. Click **"Create Bill"**
5. The new bill will appear in the list

---

## Step 6 — Send the Bill to the Patient

1. Click on the bill you just created to open it
2. You will see a **"📤 Send to Patient"** button
3. Click it — the bill status changes to **SENT**
4. Now if Jane logs in, she can see and pay this bill

---

## Step 7 — Mark a Bill as Paid manually

1. Open any bill in the staff billing page
2. Click the **"✓ Mark as Paid"** button
3. The bill status changes to **PAID**

---

## Step 8 — Log Out

1. Look for your name or a menu in the top right corner
2. Click **"Log Out"**

---

---

# Quick Reference — Login Details

| Person | Role | Email | Password |
|--------|------|-------|----------|
| Jane Christ | Patient | jane.christ@testpatient.com | JaneTest123! |
| Jack Christ | Staff | jack.christ@teststaff.com | JackStaff123! |

---

# Tips

- **Nothing you do here is permanent** in terms of real money or real appointments — it is all test data
- If something looks wrong, try refreshing the page
- If you get logged out, just log back in using the details above
- The **Demo Payment** button never charges a real card — it just pretends
