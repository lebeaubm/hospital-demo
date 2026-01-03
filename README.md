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

## Frontend (React + Vite)

```powershell
cd frontend
npm install
npm run dev
```

The frontend expects the backend at `http://127.0.0.1:8000`.
To override, set `VITE_API_URL` before running `npm run dev`.

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
