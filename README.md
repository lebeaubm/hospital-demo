# Hospital Demo

## Backend (Django)

```powershell
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

API docs:
- http://127.0.0.1:8000/api/docs/

Seeded demo logins:
- Patient: `patient@example.com` / `Pass1234!`
- Staff: `staff@example.com` / `StaffPass123!`

Example auth flow:

```powershell
# Register a patient
curl -X POST http://127.0.0.1:8000/api/auth/register/ `
  -H "Content-Type: application/json" `
  -d '{"email":"patient@example.com","password":"Pass1234!","first_name":"Pat","last_name":"Smith"}'

# Login (returns access + refresh)
curl -X POST http://127.0.0.1:8000/api/auth/login/ `
  -H "Content-Type: application/json" `
  -d '{"email":"patient@example.com","password":"Pass1234!"}'

# Refresh access token
curl -X POST http://127.0.0.1:8000/api/auth/refresh/ `
  -H "Content-Type: application/json" `
  -d '{"refresh":"<refresh_token>"}'
```

Example doctors endpoints (seeded data):

```powershell
curl http://127.0.0.1:8000/api/doctors/
curl http://127.0.0.1:8000/api/doctors/1/
```

Example patient profile endpoints (requires Bearer token):

```powershell
# Get your profile
curl http://127.0.0.1:8000/api/patients/me/ `
  -H "Authorization: Bearer <access_token>"

# Update demographics
curl -X PATCH http://127.0.0.1:8000/api/patients/me/ `
  -H "Authorization: Bearer <access_token>" `
  -H "Content-Type: application/json" `
  -d '{
    "first_name": "Pat",
    "last_name": "Smith",
    "phone_number": "+1-555-0000",
    "address": "123 Demo Street"
  }'
```

Example patient appointments flow:

```powershell
# Request an appointment
curl -X POST http://127.0.0.1:8000/api/appointments/ `
  -H "Authorization: Bearer <access_token>" `
  -H "Content-Type: application/json" `
  -d '{
    "requested_start": "2026-01-10T14:00:00Z",
    "reason": "Annual physical",
    "patient_notes": "Prefer morning slot"
  }'

# View your appointments
curl http://127.0.0.1:8000/api/appointments/my/ `
  -H "Authorization: Bearer <access_token>"

# View a specific appointment you own
curl http://127.0.0.1:8000/api/appointments/1/ `
  -H "Authorization: Bearer <access_token>"
```

Example staff appointment management:

```powershell
# List all appointments with optional filters (status, patient_email, scheduled_after, scheduled_before)
curl "http://127.0.0.1:8000/api/staff/appointments/?status=REQUESTED" `
  -H "Authorization: Bearer <staff_access_token>"

# Update status / scheduling details
curl -X PATCH http://127.0.0.1:8000/api/staff/appointments/1/ `
  -H "Authorization: Bearer <staff_access_token>" `
  -H "Content-Type: application/json" `
  -d '{
    "status": "CONFIRMED",
    "scheduled_start": "2026-01-10T14:30:00Z",
    "staff_notes": "Confirmed for 2:30 PM"
  }'
```

## Frontend (React + Vite)

### Setup

```powershell
cd frontend
npm install
```

### Configuration

The frontend connects to the backend API. By default, it uses `http://127.0.0.1:8000`.

To override the API URL, create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://127.0.0.1:8000
```

### Run Development Server

```powershell
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173`.

### Features

**Public Pages:**
- `/` - Home page with hospital overview
- `/services` - List of available services
- `/contact` - Contact information
- `/doctors` - Browse available doctors
- `/doctors/:id` - View doctor details

**Authentication:**
- `/register` - Create a new patient account
- `/login` - Login with email and password

**Patient Portal (requires authentication):**
- `/portal/profile` - View and update patient profile (demographics, insurance)
- `/portal/appointments` - View all your appointments
- `/portal/appointments/request` - Request a new appointment

**Staff Dashboard (requires staff/admin role):**
- `/staff/dashboard` - View and manage all appointments with filters

### Testing the Frontend

1. **Start both backend and frontend** (see "Run both" section below)

2. **Register a new patient:**
   - Navigate to `http://localhost:5173/register`
   - Fill in email, password, and optional name fields
   - Click "Register" - you'll be auto-logged in and redirected to your profile

3. **Complete your profile:**
   - After registration, you're on `/portal/profile`
   - Fill in demographics, emergency contact, and insurance info
   - Click "Save Changes"

4. **Browse doctors:**
   - Click "Doctors" in the navbar
   - Click on any doctor to view their full profile

5. **Request an appointment:**
   - Click "My Appointments" in the navbar
   - Click "Request Appointment"
   - Select a date/time, reason, and any notes
   - Submit the request

6. **View your appointments:**

7. **Test staff dashboard (use seeded staff account):**
   - Logout if logged in as patient
   - Login with staff credentials: `staff@example.com` / `StaffPass123!`
   - You'll be redirected to `/staff/dashboard`
   - See "Staff Dashboard" link in navbar
   - View all patient appointments in a table
  User role is fetched after login and stored in `localStorage` and AuthContext
- Access token is automatically attached to API requests via axios interceptor
- On 401 errors, the app attempts to refresh the token automatically
- If refresh fails, user is logged out
- Protected routes (`/portal/*`) redirect to `/login` if not authenticated
- Staff routes (`/staff/*`) check for STAFF or ADMIN role and show access denied if unauthorized

### Role-Based Access Control

- **Patient role**: Can access `/portal/*` routes (profile, appointments)
- **Staff/Admin role**: Can access `/staff/*` routes (dashboard to manage appointments)
- Navigation links dynamically show/hide based on authentication status and user role
- Staff users see "Staff Dashboard" link, patients see "My Profile" and "My Appointments" links
     - Add staff notes (textarea)
     - Click "Save" to update
   - Changes are immediately reflected
   - Patient will see updates when they check their appointments
   - Go to "My Appointments"
   - See all your appointment requests with status badges
   - Status will be "REQUESTED" until staff confirms it

### Authentication Flow

- Tokens are stored in `localStorage` (access token and refresh token)
- Access token is automatically attached to API requests via axios interceptor
- On 401 errors, the app attempts to refresh the token automatically
- If refresh fails, user is logged out
- Protected routes (`/portal/*`) redirect to `/login` if not authenticated

## Run both (two terminals)

Terminal 1:

```powershell
cd backend
python manage.py runserver
```

Terminal 2:

```powershell
cd frontend
npm run dev
```

---

## Deployment

For production deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

**Quick Summary:**
- Backend: Deploy to Render/Heroku/Railway with PostgreSQL
- Frontend: Deploy to Netlify/Vercel/Render as static site
- Set environment variables for production configuration
- See DEPLOYMENT.md for complete step-by-step guide
