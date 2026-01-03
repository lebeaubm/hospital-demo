# Deployment Guide

This guide covers deploying the Hospital Demo application to production environments like Render, Heroku, Railway, or similar platforms.

## Overview

The application consists of two components:
- **Backend**: Django REST API with PostgreSQL database
- **Frontend**: React SPA built with Vite

---

## Local Development Setup

### Backend Environment Variables

For local development, the backend works with default settings (SQLite, DEBUG=True). To customize:

1. **Copy the example file:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit `.env` for local development:**
   ```bash
   # Leave these commented out for local development defaults
   # DEBUG=True
   # ALLOWED_HOSTS=localhost,127.0.0.1
   # DATABASE_URL=  # Empty = SQLite
   # CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   
   # Or generate a secret key for production testing:
   SECRET_KEY=your-generated-secret-key-here
   ```

3. **Run the backend:**
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

**Default Settings (no .env file):**
- `DEBUG=True`
- `ALLOWED_HOSTS=localhost,127.0.0.1`
- `DATABASE_URL=` (uses SQLite)
- `CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`

### Frontend Environment Variables

1. **Copy the example file:**
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. **Edit `.env`:**
   ```bash
   VITE_API_URL=http://127.0.0.1:8000
   ```

3. **Run the frontend:**
   ```bash
   npm install
   npm run dev
   ```

**Default Behavior:**
If no `.env` file exists, the frontend defaults to `http://127.0.0.1:8000` for the API URL.

**Changing the API URL:**
To point to a different backend (e.g., staging server):
```bash
# In frontend/.env
VITE_API_URL=https://api-staging.example.com
```
Then restart the dev server (`npm run dev`).

---

## Backend Deployment (Django)

### Prerequisites

- PostgreSQL database (provided by hosting platform or external service)
- Python 3.10+ runtime
- Git repository access

### Environment Variables

Set these environment variables in your hosting platform:

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key (generate a new one!) | `django-insecure-...` |
| `DEBUG` | Debug mode (must be `False` in production) | `False` |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hostnames | `myapp.onrender.com,www.myapp.com` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend URLs | `https://myapp-frontend.onrender.com` |

### Deployment Steps (Render)

1. **Create a new Web Service** on Render.com
   - Connect your GitHub repository
   - Select the `backend` directory as the root

2. **Configure Build Settings:**
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn backend.wsgi:application`
   - **Environment:** Python 3

3. **Add PostgreSQL Database:**
   - Create a new PostgreSQL database on Render
   - Copy the Internal Database URL
   - Add as `DATABASE_URL` environment variable

4. **Set Environment Variables:**
   ```bash
   SECRET_KEY=<generate-new-secret-key>
   DEBUG=False
   ALLOWED_HOSTS=<your-backend-url>.onrender.com
   CORS_ALLOWED_ORIGINS=https://<your-frontend-url>.onrender.com
   DATABASE_URL=<from-render-postgres>
   ```

5. **Run Migrations:**
   After first deploy, run in Render Shell:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

6. **Collect Static Files:**
   Render automatically runs this, but manually:
   ```bash
   python manage.py collectstatic --noinput
   ```

### Deployment Steps (Heroku)

1. **Create Heroku App:**
   ```bash
   heroku create hospital-demo-api
   heroku addons:create heroku-postgresql:mini
   ```

2. **Set Environment Variables:**
   ```bash
   heroku config:set SECRET_KEY="<generate-new-key>"
   heroku config:set DEBUG=False
   heroku config:set ALLOWED_HOSTS="hospital-demo-api.herokuapp.com"
   heroku config:set CORS_ALLOWED_ORIGINS="https://hospital-demo-frontend.herokuapp.com"
   ```

3. **Deploy:**
   ```bash
   git subtree push --prefix backend heroku main
   ```

4. **Run Migrations:**
   ```bash
   heroku run python manage.py migrate
   heroku run python manage.py createsuperuser
   ```

### Deployment Steps (Railway)

1. **Create New Project** on Railway.app
2. **Deploy from GitHub** (select backend folder)
3. **Add PostgreSQL Plugin**
4. **Configure Environment Variables** (Railway auto-sets DATABASE_URL)
5. **Set Custom Start Command:** `gunicorn backend.wsgi:application`

### Generate Django Secret Key

```python
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Or online: https://djecrety.ir/

### Seed Demo Data (Optional)

After deployment, create demo users:

```bash
# In production shell/console
python manage.py shell

# Then in Python shell:
from core.models import User
User.objects.create_user(email='patient@example.com', password='Pass1234!', role='PATIENT', first_name='Demo', last_name='Patient')
User.objects.create_user(email='staff@example.com', password='StaffPass123!', role='STAFF', is_staff=True, first_name='Demo', last_name='Staff')
```

Or run existing migrations that seed data:
```bash
python manage.py migrate core 0002_seed_doctors
python manage.py migrate core 0004_seed_patients_and_appointments
```

---

## Frontend Deployment (React + Vite)

### Prerequisites

- Node.js 18+ runtime
- Backend API deployed and accessible

### Environment Variables

Create a `.env.production` file or set in hosting platform:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `https://hospital-demo-api.onrender.com` |

### Build Configuration

The frontend needs to know the backend URL. Set `VITE_API_URL` before building.

### Deployment Steps (Render)

1. **Create a new Static Site** on Render.com
   - Connect your GitHub repository
   - Select the `frontend` directory as the root

2. **Configure Build Settings:**
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
   - **Environment:** Node

3. **Set Environment Variables:**
   ```bash
   VITE_API_URL=https://<your-backend-url>.onrender.com
   ```

4. **Deploy:** Render automatically builds and serves your static files

### Deployment Steps (Netlify)

1. **Connect Repository** on Netlify
2. **Configure Build Settings:**
   - **Base Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Publish Directory:** `frontend/dist`

3. **Set Environment Variables:**
   ```bash
   VITE_API_URL=https://<your-backend-url>.onrender.com
   ```

4. **Add `_redirects` file** for SPA routing:
   Create `frontend/public/_redirects`:
   ```
   /* /index.html 200
   ```

### Deployment Steps (Vercel)

1. **Import Project** from GitHub on Vercel
2. **Configure:**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

3. **Set Environment Variables:**
   ```bash
   VITE_API_URL=https://<your-backend-url>.onrender.com
   ```

### Local Production Build Test

Test production build locally:

```bash
cd frontend
npm run build
npm run preview
```

---

## Complete Deployment Checklist

### Backend
- [ ] Generate new `SECRET_KEY`
- [ ] Set `DEBUG=False`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Set up PostgreSQL database
- [ ] Configure `DATABASE_URL`
- [ ] Set `CORS_ALLOWED_ORIGINS` with frontend URL
- [ ] Run migrations
- [ ] Create superuser
- [ ] Collect static files
- [ ] Seed demo data (optional)
- [ ] Test API endpoints

### Frontend
- [ ] Set `VITE_API_URL` to backend URL
- [ ] Build production bundle
- [ ] Configure SPA routing redirects
- [ ] Test all pages and API calls
- [ ] Verify authentication flow
- [ ] Test staff and patient portals

### Security
- [ ] All secrets stored as environment variables
- [ ] HTTPS enabled on both frontend and backend
- [ ] CORS properly configured
- [ ] Strong passwords for demo accounts
- [ ] Django security settings enabled (when DEBUG=False)

### Post-Deployment
- [ ] Monitor application logs
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure backups for PostgreSQL
- [ ] Set up monitoring/uptime checks
- [ ] Document any custom deployment steps

---

## Common Issues & Solutions

### Backend Issues

**Issue: Static files not loading**
- Ensure `STATIC_ROOT` is set correctly
- Run `python manage.py collectstatic`
- Verify WhiteNoise is in `MIDDLEWARE`

**Issue: Database connection errors**
- Verify `DATABASE_URL` format
- Check PostgreSQL is running and accessible
- Ensure database exists

**Issue: CORS errors from frontend**
- Add frontend URL to `CORS_ALLOWED_ORIGINS`
- Include protocol (https://)
- No trailing slash in URL

**Issue: 400 Bad Request errors**
- Add domain to `ALLOWED_HOSTS`
- Include all domain variations (with/without www)

### Frontend Issues

**Issue: API calls fail**
- Verify `VITE_API_URL` is set correctly
- Check CORS on backend
- Ensure backend is accessible

**Issue: 404 on page refresh**
- Add redirect rules for SPA routing
- Netlify: `_redirects` file
- Vercel: automatic
- Render: configure rewrites in dashboard

**Issue: Environment variables not working**
- Must be prefixed with `VITE_`
- Must rebuild after changing
- Don't forget `.env.production` or platform settings

---

## Monitoring & Maintenance

### Logging
- Check platform logs regularly
- Set up log aggregation (e.g., Papertrail, Logtail)
- Monitor error rates

### Database
- Regular backups (most platforms auto-backup)
- Monitor database size and performance
- Plan for scaling

### Updates
- Keep dependencies updated
- Monitor security advisories
- Test updates in staging environment first

---

## Cost Estimates (as of 2026)

### Render
- **Backend Web Service:** $7/month (Starter)
- **PostgreSQL:** $7/month (Starter)
- **Frontend Static Site:** Free
- **Total:** ~$14/month

### Heroku
- **Backend Dyno:** $7/month (Eco)
- **PostgreSQL:** $5/month (Mini)
- **Frontend:** Free (via Netlify/Vercel)
- **Total:** ~$12/month

### Railway
- **Backend + Database:** ~$10-15/month (usage-based)
- **Frontend:** Free (via Netlify/Vercel)
- **Total:** ~$10-15/month

**Note:** Free tiers available on most platforms for hobby projects.

---

## Support

For issues specific to this application, check:
- Backend logs for Python/Django errors
- Frontend browser console for JavaScript errors
- Network tab for API call failures
- Platform-specific documentation for deployment issues
