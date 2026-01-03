# FREE Deployment Guide - No Cost Option

Deploy your Hospital Demo completely FREE using Render's free tier + Netlify.

## 💰 Cost Breakdown

- **Frontend (Netlify)**: FREE forever
- **Backend (Render Free Tier)**: FREE with limitations
- **Database (Render Free Tier)**: FREE with limitations
- **Total**: $0/month ✨

## 🚀 Quick Start - FREE Deployment

### Step 1: Deploy Backend to Render (FREE)

1. Go to https://render.com → **"New"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `hospital-demo-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Instance Type**: ⚠️ **Select "Free"** (not Starter!)
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn backend.wsgi:application`

4. **Environment Variables**:
   ```
   SECRET_KEY=<generate with: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())">
   DEBUG=False
   ALLOWED_HOSTS=<your-backend-name>.onrender.com
   CORS_ALLOWED_ORIGINS=https://<your-netlify-site>.netlify.app
   DATABASE_URL=<will add after database creation>
   ```

5. Click **"Create Web Service"** (don't deploy yet, need database first)

### Step 2: Create PostgreSQL Database (FREE)

1. Render Dashboard → **"New"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `hospital-demo-db`
   - **Database**: `hospital_demo`
   - **User**: `hospital_demo_user`
   - **Instance Type**: ⚠️ **Select "Free"** (1GB limit)
3. Click **"Create Database"**
4. Copy the **Internal Database URL**
5. Go back to your backend service → Environment → Add `DATABASE_URL` with the connection string
6. Click **"Manual Deploy"** → **"Deploy latest commit"**

### Step 3: Deploy Frontend to Netlify (FREE)

1. Go to https://netlify.com → **"Add new site"** → **"Import existing project"**
2. Connect your GitHub repository
3. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
4. **Environment variables** → **"Add variable"**:
   ```
   VITE_API_URL=https://<your-backend-name>.onrender.com
   ```
5. Click **"Deploy site"**
6. After deployment, Netlify gives you a URL like `https://your-site.netlify.app`

### Step 4: Update Backend CORS

1. Go to Render → Your backend service → Environment
2. Update `CORS_ALLOWED_ORIGINS` with your Netlify URL: `https://your-site.netlify.app`
3. Save and redeploy

### Step 5: Setup Database & Admin

In Render backend service → **"Shell"** tab:

```bash
# Create admin account
python manage.py createsuperuser

# Optional: Seed demo data
python manage.py migrate core 0002_seed_doctors
python manage.py migrate core 0004_seed_patients_and_appointments
```

## ⚡ Important: Free Tier Limitations

### Render Free Tier:
- ⏰ **Spins down after 15 min of inactivity** (takes 30-60 seconds to wake up on first request)
- 💾 Database limited to **1GB storage**
- 🔄 Database data persists, but you may want to backup regularly
- ⚠️ Not suitable for production, perfect for demos/testing

### Netlify Free Tier:
- ✅ **Always on** (no spin down)
- ✅ **100GB bandwidth/month**
- ✅ **Global CDN** (fast everywhere)
- ✅ Perfect for demos and small projects

## 💡 Tips for Free Tier

1. **Keep it awake**: Use UptimeRobot (free) to ping your backend every 5 minutes
2. **Database cleanup**: Regularly delete old test data to stay under 1GB
3. **Monitor usage**: Check Render dashboard for storage usage

## 🔄 Alternative: Use Railway.app (Also Has Free Tier)

Railway offers $5 credit/month for free:
- Backend + Database can run on free credit
- Similar setup process
- May be more generous than Render free tier

## 📊 If You Need Production (Paid)

For a production app with no downtime:

### Cheapest Option (~$7-10/month):
- **Backend**: Render Starter ($7/month)
- **Database**: Render Free or Starter ($7/month)
- **Frontend**: Netlify (FREE)

### Budget Option (~$5/month):
- **Railway**: $5/month gets you backend + database + frontend
- All-in-one, simpler billing

## 🆘 Having Issues?

### "Service unavailable" or slow to load?
- Normal on free tier after inactivity (wakes up in 30-60 sec)

### Running out of database storage?
- Delete old test appointments and medical records
- Consider upgrading database to paid tier ($7/month)

### Need always-on service?
- Upgrade backend to Render Starter ($7/month)
- Or switch to Railway with $5 credit

## ✅ Deployment Checklist

- [ ] Backend on Render (FREE tier selected)
- [ ] Database on Render (FREE tier selected)
- [ ] Frontend on Netlify (always free)
- [ ] Environment variables set correctly
- [ ] CORS updated with Netlify URL
- [ ] Superuser created
- [ ] Demo data seeded (optional)
- [ ] Test the site works

## Your Deployment URLs

Fill these in as you deploy:

- Backend API: `https://________________.onrender.com`
- Frontend: `https://________________.netlify.app`
- Admin Panel: `https://________________.onrender.com/admin/`

---

**Total Monthly Cost: $0** 🎉

*(with free tier limitations - suitable for demos, portfolios, testing)*
