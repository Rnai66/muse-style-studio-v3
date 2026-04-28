# 🔧 Error Analysis & Fix Guide

## 📊 Error Breakdown

### 1. **favicon.ico 404** ✓ FIXED
**Root Cause:** No favicon file  
**What I did:**
- Created `muse-icon.svg` with MUSE branding
- Updated `index.html` to reference it
- Added `/favicon.ico` endpoint in backend

**Status:** ✓ Should resolve on next deployment

---

### 2. **remove-background API 503** ⚠️ NEEDS CONFIG
**Root Cause:** Missing environment variables on Render

**Error Flow:**
```
Frontend → POST /api/rnai/remove-background → 503 Service Unavailable
  ↓
Backend cannot find API credentials:
  - RNAI_API_KEY not set
  - REPLICATE_API_TOKEN not set  
  - HUGGINGFACE_API_TOKEN not set
  ↓
All fallback methods fail
  ↓
Backend returns 503 with "AI services busy"
```

**What I did:**
- Updated `render.yaml` to include:
  - `VITE_RNAI_API_KEY` (sync: false)
  - `HUGGINGFACE_API_TOKEN` (sync: false)
  - `RENDER` flag (set to "true")
- Added startup diagnostics logging in `backend/main.py`
- Enhanced `/health` endpoint to show available services

---

## 🚀 How to Fix the 503 Error

### Step 1: Get API Credentials

**Option A: Use RNAI Platform** (Recommended)
```
1. Go to https://rnai-io.vercel.app/
2. Sign up / Login
3. Get your API Key
4. Copy to environment variable: VITE_RNAI_API_KEY
```

**Option B: Use Replicate**
```
1. Go to https://replicate.com/
2. Sign up / Login
3. Go to API tokens
4. Copy token to: REPLICATE_API_TOKEN
```

**Option C: Use Hugging Face**
```
1. Go to https://huggingface.co/
2. Sign up / Login  
3. Create token at Settings → Access Tokens
4. Copy to: HUGGINGFACE_API_TOKEN
```

### Step 2: Set Variables on Render
```
1. Go to Render Dashboard
2. Select "muse-backend" service
3. Click "Environment"
4. Add/update these variables:
   - VITE_RNAI_API_KEY = [your key]
   - REPLICATE_API_TOKEN = [your token]
   - HUGGINGFACE_API_TOKEN = [your token]
5. Save and trigger redeploy
```

### Step 3: Verify Configuration
```bash
# Test the health endpoint
curl https://muse-backend-q8aa.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "environment": "render",
  "services": {
    "replicate": true,
    "rnai": true,
    "huggingface": true
  },
  "bg_removal_available": true
}
```

---

## 📋 Files Changed

1. **index.html**
   - Added favicon link

2. **muse-icon.svg** (NEW)
   - SVG favicon for the app

3. **render.yaml**
   - Added missing environment variables

4. **backend/main.py**
   - Added startup logging
   - Enhanced health endpoint

5. **backend/routers/rnai_proxy.py**
   - No changes (already has proper fallback logic)

---

## ✅ Troubleshooting

### Still getting 503?

**Check 1: Verify environment variables**
```bash
curl https://muse-backend-q8aa.onrender.com/health
```
Look for `"bg_removal_available": false` → Set API keys

**Check 2: Check Render logs**
- Go to Render Dashboard
- Select "muse-backend"
- Click "Logs"
- Look for startup message showing which services are available

**Check 3: Verify API credentials are valid**
- Test RNAI key: `curl -H "Authorization: Bearer YOUR_KEY" https://rnai-io.vercel.app/api/v1/...`
- Test Replicate key: `curl -H "Authorization: Token YOUR_TOKEN" https://api.replicate.com/v1/predictions`
- Test HF key: `curl -H "Authorization: Bearer YOUR_KEY" https://api-inference.huggingface.co/...`

### Frontend shows "AI services busy"?
This happens when all backends fail. Common causes:
- API keys are invalid or expired
- Rate limit exceeded
- Service downtime
- Network timeout (Render cold start)

**Solution:** Wait 30 seconds and retry (Render needs time to boot)

---

## 🎯 Next Steps

1. ✓ Deploy the code changes (automatic from git)
2. ⚠️ **YOU MUST: Set environment variables in Render**
3. ⚠️ Restart the backend service on Render
4. ✓ Test the /health endpoint
5. ✓ Test background removal from the UI
