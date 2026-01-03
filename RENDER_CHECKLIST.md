# Render Deployment Checklist

## Pre-Deployment
- [ ] Code is committed to Git
- [ ] Code is pushed to GitHub
- [ ] Have Render account (render.com)
- [ ] Have Stripe keys ready (optional, for payments)

## Render Setup
- [ ] Created new Blueprint OR manually created services
- [ ] PostgreSQL database created
- [ ] Backend web service created
- [ ] Frontend static site created

## Backend Environment Variables
- [ ] SECRET_KEY (auto-generated or custom)
- [ ] DEBUG=False
- [ ] ALLOWED_HOSTS=<your-backend-url>.onrender.com
- [ ] CORS_ALLOWED_ORIGINS=https://<your-frontend-url>.onrender.com
- [ ] DATABASE_URL (from database connection string)
- [ ] STRIPE_SECRET_KEY (optional)
- [ ] STRIPE_PUBLISHABLE_KEY (optional)

## Frontend Environment Variables
- [ ] VITE_API_URL=https://<your-backend-url>.onrender.com

## Post-Deployment
- [ ] Backend deployed successfully (check logs)
- [ ] Frontend deployed successfully (check logs)
- [ ] Created superuser account via Render shell
- [ ] Seeded demo data (optional)
- [ ] Updated CORS_ALLOWED_ORIGINS with actual frontend URL

## Testing
- [ ] Backend API accessible (visit /api/doctors/)
- [ ] Frontend loads correctly
- [ ] Can register new account
- [ ] Can log in
- [ ] Can view doctors list
- [ ] Can book appointment
- [ ] Staff dashboard accessible
- [ ] Admin panel accessible (/admin/)

## Optional Features
- [ ] Stripe payments working
- [ ] Email notifications configured
- [ ] Custom domain configured

## Your URLs
Backend API: ___________________________
Frontend: ___________________________
Admin Panel: ___________________________

## Demo Accounts Created
Admin: ___________________________
Staff: ___________________________
Patient: ___________________________
