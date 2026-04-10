# Fix Background Removal on Production - Quick Guide

## Problem
Background removal works on localhost but fails on `https://muse-style-studio-v3.web.app/`. This is because the Render backend URL was not included in the production build.

## Root Cause
- ✅ `.env` file has `VITE_BACKEND_URL=https://muse-backend-q8aa.onrender.com`
- ❌ `.env` is in `.gitignore` (not available during Firebase build)
- ❌ App defaults to `http://localhost:8000` which doesn't work from the browser

## Solution: Rebuild and Redeploy

### Step 1: Rebuild Frontend with Environment Variable
```bash
cd /Users/rnaibro/muse-style-studio-v3

# Build with environment variable set
VITE_BACKEND_URL=https://muse-backend-q8aa.onrender.com npm run build
```

### Step 2: Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

**Wait 2-3 minutes for deployment to complete**, then test at: https://muse-style-studio-v3.web.app/

### Step 3: Verify It Works
1. Open the app in your browser
2. Upload an image to the editor
3. Click "ลบพื้นหลัง" (Remove Background)
4. **Check in DevTools (F12)**:
   - Network tab → look for request to `https://muse-backend-q8aa.onrender.com/api/rembg/`
   - Should NOT go to `http://localhost:8000`

## For Future Deployments
Two files have been created to prevent this issue:

1. **`.env.production`** - Used by Vite as fallback for production builds
2. **`.github/workflows/deploy.yml`** - GitHub Actions automation (see DEPLOYMENT_GUIDE.md for setup)

## Still Having Issues?
Check the backend is healthy:
```bash
curl https://muse-backend-q8aa.onrender.com/health
```
Expected response:
```json
{"status":"ok","replicate":true,"anthropic":true}
```
