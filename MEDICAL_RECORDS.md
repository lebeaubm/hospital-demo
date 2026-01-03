# Medical Records System - Implementation Guide

## Overview

The Medical Records system provides secure document management and clinical notes with staff-controlled visibility. It integrates with the existing JWT authentication and role-based access control (PATIENT/STAFF/ADMIN).

## Features

### Patient Features
- View medical record summary (history, allergies, medications)
- View shared notes from healthcare providers
- View and download accessible documents
- Upload documents (PDF, PNG, JPG, max 10MB)
- Cannot delete documents

### Staff/Admin Features
- View full patient medical records (all notes and documents)
- Add clinical notes with type (VISIT/LAB/PRESCRIPTION/GENERAL)
- Control note visibility (STAFF_ONLY or SHARED_WITH_PATIENT)
- Upload documents with category and visibility control
- Delete any document
- Update medical record summary fields

## Backend Implementation

### Models

**MedicalRecord** (`core.models.MedicalRecord`)
- OneToOne with PatientProfile
- Fields: history_text, allergies_text, medications_text
- Automatically created when accessed

**MedicalNote** (`core.models.MedicalNote`)
- Foreign key to MedicalRecord
- Author tracking (User)
- Note type: VISIT, LAB, PRESCRIPTION, GENERAL
- Visibility: STAFF_ONLY (default) or SHARED_WITH_PATIENT
- Tracks when/who shared the note

**MedicalDocument** (`core.models.MedicalDocument`)
- Foreign key to MedicalRecord
- Secure file storage with randomized names
- Category: LAB_RESULT, PRESCRIPTION, IMAGING, OTHER
- Visibility: PATIENT_AND_STAFF or STAFF_ONLY
- Tracks uploader, file metadata (original name, mime type, size)

### API Endpoints

#### Patient Endpoints (Authenticated PATIENT role)

**GET /api/records/me/**
- Returns patient's own medical record
- Filters notes to SHARED_WITH_PATIENT only
- Filters documents to PATIENT_AND_STAFF only

**POST /api/records/me/documents/**
- Upload document (multipart/form-data)
- Fields: file, category
- Visibility automatically set to PATIENT_AND_STAFF
- Max size: 10MB
- Allowed types: .pdf, .png, .jpg, .jpeg

#### Staff Endpoints (Authenticated STAFF/ADMIN role)

**GET /api/staff/patients/<patient_id>/record/**
- Returns full medical record with all notes and documents
- Staff/Admin can see everything

**PATCH /api/staff/patients/<patient_id>/record/**
- Update record summary fields
- Fields: history_text, allergies_text, medications_text

**POST /api/staff/patients/<patient_id>/notes/**
- Create new note
- Fields: note_type, content, visibility (optional, defaults to STAFF_ONLY)

**PATCH /api/staff/notes/<note_id>/**
- Update note visibility
- Field: visibility (STAFF_ONLY or SHARED_WITH_PATIENT)
- Automatically sets shared_at and shared_by when sharing

**POST /api/staff/patients/<patient_id>/documents/**
- Upload document (multipart/form-data)
- Fields: file, category, visibility
- Staff can choose STAFF_ONLY or PATIENT_AND_STAFF

**DELETE /api/staff/documents/<document_id>/**
- Delete document (staff/admin only)
- Removes file from storage and database

#### Secure Download Endpoint (All authenticated users)

**GET /api/documents/<document_id>/download/**
- Permission-checked file streaming
- Patients: only their own PATIENT_AND_STAFF documents
- Staff/Admin: any document
- Returns 404 if not found or forbidden (prevents leaking existence)

### Security Features

1. **Secure File Storage**
   - Files stored with randomized UUIDs, not original names
   - Files NOT accessible via MEDIA_URL
   - Must use secure download endpoint with permission checks

2. **Role-Based Access Control**
   - Patient endpoints check IsPatientUser permission
   - Staff endpoints check IsStaffUser permission
   - Object-level permission checks for document downloads

3. **Visibility Controls**
   - Notes default to STAFF_ONLY
   - Staff must explicitly share notes with patients
   - Patient-uploaded documents are PATIENT_AND_STAFF by default
   - Staff-uploaded documents default to STAFF_ONLY

4. **Audit Trail**
   - All notes track author
   - Shared notes track who shared and when
   - All documents track uploader and timestamp

## Frontend Implementation

### Patient UI (/portal/records)

**MedicalRecords.jsx**
- Displays record summary
- Lists shared notes from providers
- Lists accessible documents with download
- Document upload form
- Shows note about inability to delete

### Staff UI (/staff/patients/:patientId/record)

**StaffPatientRecord.jsx**
- Patient information header
- Editable record summary form
- Notes section:
  - Add note form with type and visibility
  - List all notes with visibility badges
  - Toggle visibility button per note
- Documents section:
  - Upload form with category and visibility
  - List all documents with visibility badges
  - Download and Delete buttons

**StaffDashboard.jsx**
- Added "📋 Record" button to view patient record
- Links to /staff/patients/:id/record

### Routing

- `/portal/records` - Patient medical records (ProtectedRoute)
- `/staff/patients/:patientId/record` - Staff patient record view (StaffProtectedRoute)

## Testing

### Backend Tests (`core.tests.MedicalRecordsTests`)

11 comprehensive tests covering:
- Patient can view own record
- Patient cannot see STAFF_ONLY notes
- Staff can see all notes
- Staff toggle note visibility
- Patient can upload documents
- Patient cannot download another patient's document
- Patient cannot see STAFF_ONLY documents
- Staff can download any document
- Patient cannot delete documents
- Staff can delete documents
- Admin has full access

**Run tests:**
```bash
cd backend
python manage.py test core.tests.MedicalRecordsTests
```

## Browser-Only Verification Steps

### Patient Workflow

1. **Login as Patient**
   - Register or login as a patient
   - Navigate to "Medical Records" in the menu

2. **Upload a Document**
   - Select category (e.g., Lab Result)
   - Choose a PDF/PNG/JPG file
   - Click "Upload Document"
   - Verify document appears in the documents table
   - Click "Download" to verify file downloads correctly

3. **View Shared Notes**
   - Check "Notes from Healthcare Providers" section
   - Should only see notes marked as shared by staff

### Staff Workflow

1. **Login as Staff**
   - Login with staff credentials
   - Go to Staff Dashboard
   - Click "📋 Record" button for any patient

2. **View Full Record**
   - See all patient information
   - View all notes (including STAFF_ONLY)
   - View all documents (including STAFF_ONLY)

3. **Add and Share a Note**
   - Click "+ Add Note"
   - Enter note content
   - Select "Staff Only" visibility
   - Submit note
   - Click "👁️ Share with Patient" button
   - Verify badge changes to "Shared with Patient"

4. **Upload STAFF_ONLY Document**
   - Click "+ Upload Document"
   - Select file and category
   - Choose "Staff Only" visibility
   - Submit
   - Verify document appears with "Staff Only" badge

5. **Delete a Document**
   - Click "Delete" on any document
   - Confirm deletion
   - Verify document is removed

6. **Verify Patient Cannot See STAFF_ONLY Content**
   - Login as the patient
   - Go to Medical Records
   - Verify STAFF_ONLY note is NOT visible
   - Verify STAFF_ONLY document is NOT visible
   - Verify only shared notes appear

## Database Migrations

**Migration file:** `core/migrations/0009_medicalrecord_medicalnote_medicaldocument.py`

**Run migrations:**
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

## Configuration

### Settings (`backend/backend/settings.py`)

Added media file configuration:
```python
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

### File Upload Limits

- Max file size: 10MB
- Allowed extensions: .pdf, .png, .jpg, .jpeg
- Validated in `MedicalDocumentUploadSerializer`

## Django Admin

All models registered with comprehensive list views:

**MedicalRecord Admin**
- List: ID, patient, created, updated
- Search: patient email/name
- Fieldsets: Patient, Medical Info, Timestamps

**MedicalNote Admin**
- List: ID, record, author, type, visibility, created
- Filters: note_type, visibility, created_at
- Search: patient email, author email, content

**MedicalDocument Admin**
- List: ID, filename, category, visibility, uploader, size, created
- Filters: category, visibility, created_at
- Search: patient email, uploader email, filename

## Files Changed

### Backend
- `core/models.py` - Added MedicalRecord, MedicalNote, MedicalDocument models
- `core/serializers.py` - Added serializers for medical records
- `core/views.py` - Added API views for patient and staff endpoints
- `core/urls.py` - Added URL patterns
- `core/admin.py` - Registered models in admin
- `core/tests.py` - Added comprehensive test suite
- `backend/settings.py` - Added MEDIA_ROOT and MEDIA_URL
- `core/migrations/0009_*.py` - Database migrations

### Frontend
- `src/pages/MedicalRecords.jsx` - Patient medical records page (new)
- `src/pages/StaffPatientRecord.jsx` - Staff patient record management (new)
- `src/pages/StaffDashboard.jsx` - Added "View Record" button
- `src/App.jsx` - Added routes and navigation links

## Running the Application

### Backend
```bash
cd backend
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Access at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Django Admin: http://localhost:8000/admin

## Security Notes

- ✅ Files stored with randomized names (UUID)
- ✅ No direct MEDIA_URL access
- ✅ Permission-checked downloads
- ✅ Role-based access control
- ✅ 404 responses for unauthorized access (no info leaking)
- ✅ File type and size validation
- ✅ Staff-only deletion capability
- ✅ Audit trail for note sharing

## No Secrets Committed

All sensitive configuration uses environment variables:
- `SECRET_KEY`
- `DATABASE_URL`
- Email settings
- CORS origins

Development defaults are safe for local testing.
