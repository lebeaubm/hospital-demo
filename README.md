# Hospital Demo

A full-stack hospital management application with role-based access control (RBAC), featuring appointment scheduling, patient profiles, staff dashboard, and comprehensive medical records management.

## Features

- **Role-Based Access Control (RBAC)**: Patient, Staff, and Admin roles
- **JWT Authentication**: Secure token-based auth with refresh tokens
- **Patient Portal**: Profile management, appointment requests, and medical records
- **Medical Records System**: 
  - Secure document management with staff-controlled visibility
  - Clinical notes with sharing capabilities
  - Patient document uploads
  - Staff-only deletion
- **Staff Dashboard**: View and manage all appointments with patient record access
- **Email Notification System**: Automated emails for appointment lifecycle events
- **Staff Email Management**: Send custom emails to patients and view email logs
- **Real-time Updates**: React frontend with instant UI feedback
- **REST API**: Comprehensive Django REST Framework API

## Tech Stack

**Backend:**
- Django 5.0+ with Django REST Framework
- JWT authentication (SimpleJWT)
- SQLite (dev) / PostgreSQL (prod)
- Secure file storage with permission-checked downloads
- drf-spectacular for API docs

**Frontend:**
- React 18 with React Router
- Axios for API calls
- Bootstrap 5 for styling
- Vite for build tooling

## Quick Start

### Backend Setup

```powershell
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The backend will run at `http://127.0.0.1:8000`

### Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

The frontend will run at `http://localhost:5173`

## Environment Variables

The app works locally without configuration using sensible defaults (SQLite database, localhost CORS, insecure dev secret key). For production deployment or custom configuration:

**Backend** (optional `.env` in `backend/`):
- `SECRET_KEY` - Django secret key (auto-generated insecure key used in dev)
- `DEBUG` - Set to `False` for production (default: `True`)
- `ALLOWED_HOSTS` - Comma-separated hosts (default: `localhost,127.0.0.1`)
- `DATABASE_URL` - PostgreSQL connection string (default: SQLite)
- `CORS_ALLOWED_ORIGINS` - Comma-separated origins (default: `http://localhost:5173`)
- **Email Settings** (optional for real email sending):
  - `EMAIL_BACKEND` - Email backend (default: `django.core.mail.backends.console.EmailBackend`)
  - `EMAIL_HOST` - SMTP server (e.g., `smtp.gmail.com`)
  - `EMAIL_PORT` - SMTP port (default: `587`)
  - `EMAIL_USE_TLS` - Use TLS (default: `True`)
  - `EMAIL_HOST_USER` - SMTP username
  - `EMAIL_HOST_PASSWORD` - SMTP password
  - `DEFAULT_FROM_EMAIL` - From email address (default: `noreply@hospitaldemo.com`)
  - `STAFF_INBOX_EMAIL` - Staff notification inbox for appointment requests
- **Stripe Payment Settings** (for payment functionality):
  - `STRIPE_SECRET_KEY` - Stripe secret key (test mode: starts with `sk_test_`)
  - `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (test mode: starts with `pk_test_`)
  - `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (optional for local dev)
  - `STRIPE_CONSULTATION_FEE` - Consultation fee in cents (default: `5000` = $50.00)
  - `STRIPE_CURRENCY` - Currency code (default: `usd`)

**Frontend** (optional `.env` in `frontend/`):
- `VITE_API_URL` - Backend API URL (default: `http://127.0.0.1:8000`)

Copy `.env.example` files to `.env` and customize as needed. See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment instructions.

## Demo Credentials

Seeded test accounts:
- **Patient**: `patient@example.com` / `Pass1234!`
- **Staff**: `staff@example.com` / `StaffPass123!`

## Stripe Payment Testing (Browser-Only)

The application includes Stripe integration for consultation fee payments with browser-only testing (no webhooks required for local development).

### Test Mode Setup

1. **Get Stripe Test Keys** (free, no credit card required):
   - Sign up at https://stripe.com
   - Navigate to Developers → API keys
   - Copy your test keys (they start with `sk_test_` and `pk_test_`)

2. **Configure Backend** (`backend/.env`):
   ```env
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
   STRIPE_CONSULTATION_FEE=5000
   STRIPE_CURRENCY=usd
   ```

3. **Restart Backend**:
   ```powershell
   cd backend
   python manage.py runserver
   ```

**Note**: If Stripe keys are not configured, payment buttons will show an error message: "Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables." This is expected - payments require valid Stripe API keys to function.

### Testing Payment Flow

1. **Login as Patient**:
   - Go to http://localhost:5173/login
   - Use: `patient@example.com` / `Pass1234!`

2. **View Appointments**:
   - Navigate to "My Appointments"
   - Click " Pay Consultation Fee" on any appointment

3. **Complete Payment**:
   - You'll be redirected to Stripe Checkout
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date (e.g., 12/34)
   - Any 3-digit CVC (e.g., 123)
   - Any valid billing details

4. **Verify Payment**:
   - After successful payment, you'll be redirected to the success page
   - The browser will automatically verify payment with Stripe
   - View payment history at "Payments" in the navigation menu

5. **Download Invoice**:
   - Go to "Payments" page
   - Click " Download Invoice" on paid payments
   - PDF invoice will download automatically

### Test Cards

Stripe provides various test cards for different scenarios:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`
- **3D Secure Required**: `4000 0025 0000 3155`

More test cards: https://stripe.com/docs/testing

### Browser-Only Verification

The application uses a browser fallback verification system:
- When you return from Stripe, the success page calls `/api/payments/verify/?session_id=...`
- This endpoint fetches the payment status directly from Stripe
- No webhook configuration needed for local testing
- Works perfectly for development and testing

### Payment Features

-  Secure Stripe Checkout integration
-  Consultation fee payments ($50.00 default)
-  Payment history for patients
-  Automatic invoice generation (PDF)
-  Invoice download
-  Browser-only verification (no webhook setup required)
-  Test mode for safe development

**Note**: For production deployment with webhooks, see [DEPLOYMENT.md](DEPLOYMENT.md) for webhook configuration.

## API Documentation

Interactive API docs available at:
- **Swagger UI**: http://127.0.0.1:8000/api/docs/
- **ReDoc**: http://127.0.0.1:8000/api/redoc/
- **OpenAPI Schema**: http://127.0.0.1:8000/api/schema/

## API Endpoints

### Authentication
```
POST /api/auth/register/     - Register new patient
POST /api/auth/login/        - Login (returns access + refresh tokens)
POST /api/auth/refresh/      - Refresh access token
```

### Doctors (Public)
```
GET  /api/doctors/           - List all doctors (with pagination, search, filters)
                               Query params:
                               - search: Text search in name & specialty
                               - specialty: Filter by exact specialty
                               - location: Filter by location (contains)
                               - page: Page number (default: 1)
                               - page_size: Results per page (default: 10, max: 100)
GET  /api/doctors/{id}/      - Get doctor details
```

### Patient Endpoints (Requires Authentication)
```
GET   /api/patients/me/            - Get my profile
PATCH /api/patients/me/            - Update my profile
POST  /api/appointments/           - Create appointment request
GET   /api/appointments/my/        - List my appointments
GET   /api/appointments/{id}/      - Get my appointment detail
GET   /api/records/me/             - Get my medical record (with shared notes & documents)
POST  /api/records/me/documents/   - Upload document to my record (multipart/form-data)
GET   /api/documents/{id}/download/ - Download document (with permission check)
```

### Staff Endpoints (Requires Staff/Admin Role)
```
GET   /api/staff/me/                  - Get staff profile
PATCH /api/staff/me/                  - Update staff profile
GET   /api/staff/appointments/        - List all appointments (with filters & pagination)
                                        Query params:
                                        - status: Filter by status (REQUESTED, CONFIRMED, COMPLETED, CANCELED)
                                        - doctor: Filter by doctor ID
                                        - date_from: Filter by requested_start >= date (YYYY-MM-DD)
                                        - date_to: Filter by requested_start <= date (YYYY-MM-DD)
                                        - page: Page number (default: 1)
                                        - page_size: Results per page (default: 20, max: 100)
PATCH /api/staff/appointments/{id}/   - Update appointment (status, doctor, scheduled_start, staff_notes)
GET   /api/staff/emails/              - List all email notification logs (with filters & pagination)
                                        Query params:
                                        - event_type: Filter by type (WELCOME, APPT_REQUESTED, etc.)
                                        - status: Filter by status (PENDING, SENT, FAILED)
                                        - to_email: Search by recipient email
                                        - date_from: Filter by created_at >= date (YYYY-MM-DD)
                                        - date_to: Filter by created_at <= date (YYYY-MM-DD)
                                        - page: Page number (default: 1)
                                        - page_size: Results per page (default: 50, max: 200)
GET   /api/staff/emails/{id}/         - Get email notification log details
POST  /api/staff/emails/send/         - Send custom email
                                        Body: {
                                          "to_email": "recipient@example.com",
                                          "subject": "Email subject",
                                          "body": "Email body text",
                                          "appointment_id": 123 (optional),
                                          "cc": ["cc1@example.com"] (optional)
                                        }

# Medical Records API (Staff/Admin)
GET   /api/staff/patients/{id}/record/     - Get patient's full medical record
PATCH /api/staff/patients/{id}/record/     - Update medical record summary
POST  /api/staff/patients/{id}/notes/      - Add note to patient record
POST  /api/staff/patients/{id}/documents/  - Upload document to patient record
PATCH /api/staff/notes/{id}/               - Update note visibility (share/hide from patient)
DELETE /api/staff/documents/{id}/          - Delete document (staff only)

# Payment API (Patient Only)
POST /api/payments/checkout-session/   - Create Stripe Checkout Session
                                         Body: { "appointment_id": 123 (optional) }
                                         Returns: { "url": "...", "session_id": "...", "payment_id": 1 }
GET  /api/payments/verify/              - Verify payment (browser fallback)
                                         Query: ?session_id=cs_test_...
POST /api/payments/webhook/             - Stripe webhook endpoint (production only)
GET  /api/payments/my/                  - Get payment history
GET  /api/payments/{id}/invoice/        - Download invoice PDF
```

## Testing the API

### 1. Register a New Patient

```powershell
# PowerShell
$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/register/" -Method POST -ContentType "application/json" -Body '{"email":"newpatient@test.com","password":"TestPass123!","first_name":"John","last_name":"Doe"}'
$response | ConvertTo-Json
```

**Response:** Returns user object with id and email.

### 2. Login to Get JWT Token

```powershell
$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/login/" -Method POST -ContentType "application/json" -Body '{"email":"newpatient@test.com","password":"TestPass123!"}'
$TOKEN = $response.access
Write-Host "Access Token: $($TOKEN.Substring(0,20))..."
```

**Response:** Returns `access` and `refresh` tokens. The token payload now includes:
- `user_id`: User ID
- `role`: User role (PATIENT, STAFF, or ADMIN)
- `email`: User email

### 3. Get Doctor List (Public Endpoint)

```powershell
# Get all doctors (paginated)
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/doctors/"

# Search by name or specialty
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/doctors/?search=cardio"

# Filter by specialty
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/doctors/?specialty=Cardiology"

# Filter by location
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/doctors/?location=New York"

# Combined filters with pagination
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/doctors/?specialty=Cardiology&location=New York&page=1"
```

### 4. View/Update Patient Profile

```powershell
# Get profile
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/patients/me/" -Headers @{"Authorization"="Bearer $TOKEN"}

# Update profile
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/patients/me/" -Method PATCH -Headers @{"Authorization"="Bearer $TOKEN"} -ContentType "application/json" -Body '{"first_name":"John","last_name":"Doe","phone_number":"555-0123","address":"123 Main St"}'
```

### 5. Create Appointment Request (Patient)

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/appointments/" -Method POST -Headers @{"Authorization"="Bearer $TOKEN"} -ContentType "application/json" -Body '{"requested_start":"2026-01-15T10:00:00","reason":"Annual checkup","patient_notes":"Morning preferred"}'
```

### 6. List My Appointments (Patient)

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/appointments/my/" -Headers @{"Authorization"="Bearer $TOKEN"}
```

### 7. Staff Login and List All Appointments

```powershell
# Login as staff
$staffResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/login/" -Method POST -ContentType "application/json" -Body '{"email":"staff@example.com","password":"StaffPass123!"}'
$STAFF_TOKEN = $staffResponse.access

# List all appointments (paginated, 20 per page)
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/staff/appointments/" -Headers @{"Authorization"="Bearer $STAFF_TOKEN"}

# Filter by status
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/staff/appointments/?status=REQUESTED" -Headers @{"Authorization"="Bearer $STAFF_TOKEN"}

# Filter by doctor ID
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/staff/appointments/?doctor=1" -Headers @{"Authorization"="Bearer $STAFF_TOKEN"}

# Filter by date range
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/staff/appointments/?date_from=2024-01-01&date_to=2024-12-31" -Headers @{"Authorization"="Bearer $STAFF_TOKEN"}

# Combined filters with pagination
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/staff/appointments/?status=CONFIRMED&doctor=1&date_from=2024-01-01&page=2" -Headers @{"Authorization"="Bearer $STAFF_TOKEN"}
```

### 8. Staff Update Appointment

```powershell
# Update appointment status, doctor, schedule, and notes
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/staff/appointments/1/" -Method PATCH -Headers @{"Authorization"="Bearer $STAFF_TOKEN"} -ContentType "application/json" -Body '{"status":"CONFIRMED","doctor":1,"scheduled_start":"2026-01-15T10:30:00","staff_notes":"Confirmed with Dr. Smith"}'
```

## Running Tests

### Backend Tests

The backend includes comprehensive API tests covering security and business logic:

```powershell
# Windows PowerShell
cd backend
python manage.py test
```

```bash
# Linux/Mac
cd backend
python manage.py test
```

**Test Coverage:**
- **RBAC (Role-Based Access Control):**
  - Patients can only see their own appointments
  - Patients cannot retrieve another patient's appointment (404)
  - Staff can list all appointments and update status
  - Patients cannot access staff-only endpoints (403)
  
- **Appointment Creation Security:**
  - Appointment creation assigns patient from JWT token
  - Patient field is ignored if sent in request body
  - Patients cannot create appointments for other patients
  
- **Filtering & Pagination:**
  - Staff can filter appointments by status, doctor, date range
  - Pagination works correctly on staff endpoints

- **Authentication:**
  - Unauthenticated users cannot access protected endpoints (401)

**Expected Output:**
```
Found 12 test(s).
Creating test database for alias 'default'...
System check identified no issues (0 silenced).
............
----------------------------------------------------------------------
Ran 12 tests in 9.073s

OK
Destroying test database for alias 'default'...
```

### Continuous Integration

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that automatically:
-  Sets up Python 3.11
-  Installs dependencies
-  Runs database migrations
-  Executes all tests
-  Checks for missing migrations

CI runs automatically on:
- Pushes to `main`, `branch-1`, `branch-2`
- Pull requests to `main`

View CI status: Check the "Actions" tab on GitHub

## Running Both Backend and Frontend

### Terminal 1 - Backend
```powershell
cd backend
python manage.py runserver
```

### Terminal 2 - Frontend
```powershell
cd frontend
npm run dev
```

Then open `http://localhost:5173` in your browser.

## Frontend Routes

**Public Routes:**
- `/` - Home
- `/services` - Services overview
- `/doctors` - Doctor listings
- `/doctors/:id` - Doctor detail
- `/contact` - Contact information
- `/login` - Login page
- `/register` - Registration page

**Patient Routes (Protected):**
- `/portal/profile` - Patient profile management
- `/portal/appointments` - My appointments list
- `/portal/appointments/request` - Request new appointment

**Staff Routes (Protected, Role: STAFF/ADMIN):**
- `/staff/dashboard` - Appointment queue management
- `/portal/profile` - Staff profile management

## Project Structure

```
hospital-demo/
├── backend/                    # Django REST API
│   ├── backend/               # Project settings
│   │   ├── settings.py       # Configuration
│   │   └── urls.py           # Root URL config
│   ├── core/                 # Main application
│   │   ├── models.py         # User, Doctor, PatientProfile, StaffProfile, Appointment
│   │   ├── serializers.py    # DRF serializers
│   │   ├── serializers_jwt.py # Custom JWT token serializer (includes role)
│   │   ├── views.py          # API views
│   │   ├── urls.py           # API endpoints
│   │   ├── permissions.py    # RBAC permissions
│   │   ├── admin.py          # Django admin config
│   │   ├── tests.py          # RBAC test suite
│   │   └── migrations/       # Database migrations
│   ├── manage.py
│   └── requirements.txt
├── frontend/                  # React application
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js     # Axios client with JWT interceptor
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx      # Auth guard
│   │   │   └── StaffProtectedRoute.jsx # Staff role guard
│   │   ├── context/
│   │   │   └── AuthContext.jsx         # Auth state management
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Profile.jsx            # Patient/Staff profile
│   │   │   ├── Appointments.jsx       # Patient appointments
│   │   │   ├── RequestAppointment.jsx
│   │   │   ├── StaffDashboard.jsx     # Staff appointment management
│   │   │   ├── DoctorsList.jsx
│   │   │   └── DoctorDetail.jsx
│   │   ├── App.jsx           # Main app with routing
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md                  # This file
```

## Data Models

### User
- email (unique, used for login)
- password (hashed)
- first_name, last_name
- role: PATIENT | STAFF | ADMIN
- is_staff, is_active
- date_joined

### PatientProfile (OneToOne with User)
- date_of_birth
- phone_number
- address
- emergency_contact_name, emergency_contact_phone
- insurance_provider, insurance_policy_number

### StaffProfile (OneToOne with User)
- department
- position
- phone_number
- office_location

### Doctor
- name
- specialty
- bio
- years_experience

### Appointment
- patient (FK to User)
- requested_start (datetime)
- scheduled_start (datetime, nullable)
- reason
- patient_notes
- staff_notes
- status: REQUESTED | CONFIRMED | COMPLETED | CANCELED
- created_at, updated_at

## RBAC Rules

### Patients (role=PATIENT)
 Can register and login  
 Can view/update own profile  
 Can create appointment requests  
 Can view only their own appointments  
 Cannot access other patients' data  
 Cannot access staff endpoints  

### Staff (role=STAFF or ADMIN)
 Can login  
 Can view/update own staff profile  
 Can view all appointments (with filters)  
 Can update appointment status, scheduled_start, staff_notes  
 Full access to appointment management  

### Public
 Can view doctor listings  
 Can register as new patient  
 Can login  

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment instructions to Render (backend) and Netlify (frontend).

## Development Notes

- **JWT Token Payload**: Now includes `role` and `email` claims for frontend role-based UI
- **Auto-refresh**: Frontend automatically refreshes expired access tokens using refresh token
- **CORS**: Configured for local development (localhost:5173)
- **API Docs**: Auto-generated with drf-spectacular
- **Seeded Data**: Run migrations to automatically seed doctors and test users

## Files Changed in This Implementation

### Backend
- `core/models.py` - Added StaffProfile model
- `core/serializers.py` - Added StaffProfileSerializer
- `core/serializers_jwt.py` - **NEW** Custom JWT serializer with role in payload
- `core/views.py` - Added StaffMeView, updated LoginView
- `core/urls.py` - Added `/api/staff/me/` endpoint
- `core/admin.py` - Registered StaffProfile
- `core/tests.py` - **NEW** Comprehensive RBAC test suite
- `core/migrations/0005_staffprofile.py` - Added via `makemigrations`

### Frontend
- `src/pages/Profile.jsx` - Updated to handle both patient and staff profiles
- `src/App.jsx` - Added staff profile link to navigation

### Documentation
- `README.md` - **COMPLETELY UPDATED** with comprehensive documentation

## License

MIT
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

## Browser Verification Steps

### Testing Doctor Search, Filter & Pagination

1. **Start both backend and frontend** (see commands above)

2. **Navigate to Doctors Page**
   - Open browser to `http://localhost:5173`
   - Click "Doctors" in navigation bar
   - You should see a list of doctors with pagination controls

3. **Test Search Functionality**
   - Type "cardio" in the search box
   - Results should filter to show only doctors with "cardio" in name or specialty
   - Clear search to see all doctors again

4. **Test Specialty Filter**
   - Select "Cardiology" from the Specialty dropdown
   - Only cardiologists should appear
   - Change to "All Specialties" to reset

5. **Test Location Filter**
   - Type "New York" in the Location field
   - Only doctors in New York should appear
   - Clear to see all doctors

6. **Test Combined Filters**
   - Apply both specialty and location filters together
   - Search should work in combination with filters
   - Click "Reset" button to clear all filters

7. **Test Pagination** (if you have more than 10 doctors)
   - Click "Next" to go to page 2
   - URL should update with `?page=2`
   - Click "Previous" to go back
   - Page counter should show "Page X of Y"

8. **Verify No Console Errors**
   - Open browser DevTools (F12)
   - Check Console tab - should be clean (no red errors)
   - Check Network tab - API calls should show correct query params:
     - `/api/doctors/?search=cardio`
     - `/api/doctors/?specialty=Cardiology&location=New York&page=1`

9. **Test Empty Results**
   - Search for something that doesn't exist (e.g., "xyz123")
   - Should show "No doctors found" message
   - No errors should appear

**Expected Behavior:**
-  Filters update results instantly
-  Pagination shows correct page numbers
-  URL reflects current filters/page
-  Loading spinner shows during requests
-  Results count displays correctly
-  Reset button clears all filters
-  No console errors
-  Network requests show proper query parameters

### Testing Staff Appointment Filtering & Pagination

1. **Login as Staff User**
   - Navigate to `http://localhost:5173/login`
   - Login with: `staff@example.com` / `StaffPass123!`
   - Should redirect to Staff Dashboard

2. **View Appointments**
   - You should see a paginated list of appointments (20 per page)
   - Each appointment shows: Patient, Doctor (if assigned), Status, Dates, Reason, Notes

3. **Test Status Filter**
   - Select "Requested" from Status dropdown
   - Only requested appointments should appear
   - Try other statuses: Confirmed, Completed, Canceled
   - Select "All Statuses" to reset

4. **Test Doctor Filter**
   - Select a doctor from the Doctor dropdown
   - Only appointments for that doctor should appear
   - Note: Also shows unassigned appointments if "All Doctors" is selected

5. **Test Date Range Filters**
   - Set "Date From" to filter appointments starting from that date
   - Set "Date To" to filter appointments up to that date
   - Use both together to get appointments in a specific date range
   - Clear dates to reset

6. **Test Combined Filters**
   - Apply Status + Doctor + Date Range together
   - Example: Show "Confirmed" appointments for "Dr. Smith" between "2024-01-01" and "2024-12-31"
   - All filters should work in combination

7. **Test Pagination** (if more than 20 appointments exist)
   - Pagination controls appear at bottom
   - Shows "Showing X of Y appointments"
   - Click "Next" to go to page 2
   - Click "Previous" to go back
   - Page number displays: "Page X of Y"

8. **Test Appointment Editing**
   - Click "Edit" on any appointment
   - You can change:
     - Status (dropdown)
     - Doctor assignment (dropdown)
     - Scheduled start time (datetime picker)
     - Staff notes (text area)
   - Click "Save" - should see success message
   - Click "Cancel" to abort changes
   - Verify changes persist after page refresh

9. **Test Doctor Assignment**
   - Edit an appointment
   - Select a doctor from the dropdown
   - Save changes
   - Doctor name and specialty should appear in the Doctor column

10. **Verify API Calls**
    - Open Browser DevTools → Network tab
    - Apply filters → should see GET `/api/staff/appointments/?status=REQUESTED&page=1`
    - Expect paginated JSON response with filtering applied correctly

---

## Testing Email Notification System

The email notification system automatically sends emails for key appointment lifecycle events and allows staff to send custom emails to patients.

### Email Configuration (Development Mode)

By default, the app uses Django's **console email backend**, which prints emails to the terminal/console instead of sending real emails. This is perfect for development and testing without needing SMTP credentials.

**To see emails in development:**
1. Make sure the backend server is running: `python manage.py runserver`
2. Emails will appear in the console output where the backend is running

**To send real emails (optional):**
Set these environment variables in `backend/.env`:
```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@hospitaldemo.com
STAFF_INBOX_EMAIL=staff@hospitaldemo.com
```

### Browser-Only Verification Steps

#### Test 1: Welcome Email on Patient Registration

1. **Register a new patient:**
   - Go to `/register` in the browser
   - Fill in email, password, first name, last name
   - Click "Register"

2. **Verify email log:**
   - Login as staff: `staff@example.com` / `StaffPass123!`
   - Navigate to "Email Logs" from the navbar
   - Look for a `WELCOME` email to the new patient's email
   - Status should be `SENT`
   - Click "View" to see the full email body

3. **Check console output (if using console backend):**
   - Look in the terminal where `python manage.py runserver` is running
   - You should see the welcome email printed

#### Test 2: Appointment Request Notification to Staff

**Note:** This requires `STAFF_INBOX_EMAIL` to be set in environment variables.

1. **Set STAFF_INBOX_EMAIL (optional):**
   - In `backend/.env` add: `STAFF_INBOX_EMAIL=staff@hospitaldemo.com`
   - Restart the backend server

2. **Request an appointment as a patient:**
   - Login as patient: `patient@example.com` / `Pass1234!`
   - Navigate to "My Appointments"
   - Click "Request Appointment"
   - Fill in date, reason, and submit

3. **Verify email log:**
   - Logout and login as staff: `staff@example.com` / `StaffPass123!`
   - Go to "Email Logs"
   - Filter by event type: `APPT_REQUESTED`
   - Look for email to the staff inbox with subject "New Appointment Request"
   - Click "View" to see patient details and appointment info

#### Test 3: Appointment Status Change Emails

1. **Confirm an appointment:**
   - Login as staff
   - Go to "Staff Dashboard"
   - Find a `REQUESTED` appointment
   - Click "Edit"
   - Change status to `CONFIRMED`
   - Set scheduled start time
   - Add staff notes (optional)
   - Click "Save"

2. **Verify confirmation email:**
   - Go to "Email Logs"
   - Look for `APPT_CONFIRMED` email to the patient
   - Status should be `SENT`
   - Click "View" to see the confirmation message

3. **Complete an appointment:**
   - In "Staff Dashboard", edit the same appointment
   - Change status to `COMPLETED`
   - Click "Save"

4. **Verify completion email:**
   - Go to "Email Logs"
   - Look for `APPT_COMPLETED` email to the patient
   - Email should thank them for their visit

5. **Cancel an appointment:**
   - Edit another appointment
   - Change status to `CANCELED`
   - Add cancellation reason in staff notes
   - Click "Save"

6. **Verify cancellation email:**
   - Go to "Email Logs"
   - Look for `APPT_CANCELED` email to the patient

#### Test 4: No Duplicate Emails on Same Status

1. **Edit an appointment without changing status:**
   - Find a `CONFIRMED` appointment
   - Click "Edit"
   - Update only staff notes (leave status as `CONFIRMED`)
   - Click "Save"

2. **Verify no new email:**
   - Go to "Email Logs"
   - Count the `APPT_CONFIRMED` emails for that appointment
   - Should be only ONE (not duplicated)

#### Test 5: Staff Send Custom Email

1. **Compose a custom email:**
   - Login as staff
   - Go to "Email Logs"
   - Click "Compose Email" button
   - Fill in:
     - To Email: `patient@example.com`
     - Subject: `Test Custom Email`
     - Body: `This is a test email from staff.`
     - Appointment ID: (optionally link to an appointment)
     - CC: (optionally add CC recipients)
   - Click "Send Email"

2. **Verify email was sent:**
   - Should see success message
   - Email log should refresh automatically
   - Look for `STAFF_CUSTOM` email with your subject
   - "Sent By" column should show staff email
   - Click "View" to see full body

3. **Verify in console:**
   - Check backend terminal for email output

#### Test 6: Email Patient Button from Staff Dashboard

1. **Use quick email link:**
   - Go to "Staff Dashboard"
   - Find any appointment
   - Click the envelope icon () in the Actions column

2. **Verify compose modal opens:**
   - Should redirect to "Email Logs" page
   - Compose modal should open automatically
   - To Email should be pre-filled with patient email
   - Subject should reference the appointment ID
   - Appointment ID field should be pre-filled

3. **Send the email:**
   - Fill in the body
   - Click "Send Email"
   - Verify it appears in the log

#### Test 7: Patient Cannot Access Staff Email Features

1. **Login as patient:**
   - Email: `patient@example.com` / `Pass1234!`

2. **Try to access email logs:**
   - Manually navigate to `/staff/emails` in the browser
   - Should be redirected to home or see "Access Denied"

3. **Verify API protection:**
   - Open Browser DevTools → Console
   - Try: `fetch('http://127.0.0.1:8000/api/staff/emails/', {headers: {'Authorization': 'Bearer ' + localStorage.getItem('accessToken')}})`
   - Should get 403 Forbidden response

#### Test 8: Email Log Filtering and Search

1. **Test filters:**
   - Go to "Email Logs" as staff
   - Filter by Event Type: `WELCOME` - should show only welcome emails
   - Filter by Status: `SENT` - should show only sent emails
   - Filter by Status: `FAILED` - should show any failed sends
   - Search by Recipient Email: `patient@example.com`
   - Click "Apply Filters"

2. **View details:**
   - Click "View" on any email log
   - Modal should show:
     - Full email body (formatted)
     - Subject, To, CC
     - Sent by (staff member or "System")
     - Related appointment ID (if linked)
     - Timestamps
     - Error message (if failed)

#### Test 9: Django Admin Verification

1. **Access Django Admin:**
   - Go to `http://127.0.0.1:8000/admin/`
   - Login as superuser (create one with `python manage.py createsuperuser`)

2. **View NotificationLog:**
   - Click "Notification logs" under CORE
   - Should see all email logs
   - Filters available: event type, status, created date
   - Click any entry to see full details

3. **Verify log structure:**
   - Check that each log has:
     - Event type (WELCOME, APPT_REQUESTED, etc.)
     - To email, CC emails
     - Subject and body text
     - Status (PENDING, SENT, FAILED)
     - Sent by user (if custom email)
     - Related appointment (if linked)
     - Timestamps

### Backend Tests

Run automated tests to verify email functionality:

```powershell
cd backend
python manage.py test core.tests.EmailNotificationTests --verbosity=2
```

**Tests included:**
-  Staff can send custom emails
-  Patients cannot access staff email endpoints
-  Appointment status change creates email log
-  No duplicate emails on same status
-  Staff can view email logs
-  Patients cannot view email logs

All 18 tests should pass (including 6 email notification tests + 12 existing tests).

### Email Templates

Email templates are located in `backend/core/templates/emails/`:
- `welcome.txt` - Welcome email for new patients
- `appointment_requested_staff.txt` - Staff notification for new appointment request
- `appointment_confirmed_patient.txt` - Patient confirmation email
- `appointment_completed_patient.txt` - Post-visit thank you email
- `appointment_canceled_patient.txt` - Appointment cancellation notice

Templates use Django template syntax and can be customized with HTML/plain text.

---

## Development Notes
    - Open DevTools (F12) → Network tab
    - Apply filters and check the API call:
      - `/api/staff/appointments/?status=REQUESTED&doctor=1&date_from=2024-01-01&date_to=2024-12-31&page=1`
    - Should see proper query parameters
    - Response should be paginated: `{count, next, previous, results}`

**Expected Behavior:**
-  Filters work independently and in combination
-  Pagination controls appear when needed
-  Changing filters resets to page 1
-  Edit mode works for status, doctor, date, and notes
-  Success messages appear after updates
-  Page reloads show updated data
-  No console errors
-  Date filters use requested_start field
-  Network requests show proper query parameters

---

## Deployment

For production deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

**Quick Summary:**
- Backend: Deploy to Render/Heroku/Railway with PostgreSQL
- Frontend: Deploy to Netlify/Vercel/Render as static site
- Set environment variables for production configuration
- See DEPLOYMENT.md for complete step-by-step guide
