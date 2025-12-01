# Sentinel Feedback API

Simple Flask API to persist tag feedback from the frontend.

## Local Development

```bash
cd api
pip install -r requirements.txt
python app.py
```

API runs on http://localhost:5000

## Deployment Options

### Option 1: Render (Recommended - Free Forever)
1. Go to https://render.com and sign in with GitHub
2. Click "New +" → "Web Service"
3. Connect your `sentinel` repository
4. Configure:
   - **Name**: `sentinel-feedback-api`
   - **Root Directory**: `api`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Plan**: `Free` (sleeps after 15min, wakes on request)
5. Click "Create Web Service"
6. Wait ~2 minutes for deployment
7. Copy your URL: `https://sentinel-feedback-api.onrender.com`
8. Update `src/tabs/feeds.js` line 173 with your URL:
   ```javascript
   const API_URL = 'https://sentinel-feedback-api.onrender.com';
   ```

**Free tier**: Unlimited uptime, auto-sleeps after 15min inactivity (20-30s cold start)

### Option 2: Railway
1. Go to https://railway.app
2. Sign in with GitHub
3. "New Project" → "Deploy from GitHub repo" → Select `sentinel`
4. Set root directory to `/api`
5. Copy URL and update `feeds.js`

**Free tier**: 500 hours/month (~21 days), then shuts down

### Option 3: Fly.io
```bash
cd api
fly launch
fly deploy
```

**Free tier**: 3 small VMs, always on

## Frontend Integration

The frontend (`src/tabs/feeds.js`) uses a **hybrid approach**:
1. Saves feedback to **localStorage** immediately (instant UI update)
2. Syncs to **API in background** (persistent storage)
3. If API fails/sleeps, feedback stays in localStorage until next successful sync

After deploying, update line 173 in `src/tabs/feeds.js`:
```javascript
const API_URL = 'https://your-app.onrender.com';  // Replace with your Render URL
```

**How it works**:
- User clicks 👍/👎 → Instant visual feedback
- API request happens in background (no blocking)
- If API is asleep (20-30s delay), user doesn't notice
- Feedback persists to `public/data/tag_feedback.json` on server

## Endpoints

- `POST /api/feedback` - Submit tag feedback
- `GET /api/health` - Health check
