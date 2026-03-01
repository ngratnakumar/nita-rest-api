# Fix: Browser Auto-Redirecting HTTP to HTTPS

## Problem
When accessing `http://192.168.110.2`, the browser automatically redirects to `https://192.168.110.2`, and the page doesn't load because the HTTPS version doesn't exist.

## Root Causes

### 1. **Fixed: Vite HMR Protocol** ✅
The Vite config was using `protocol: 'wss'` (Secure WebSocket). Changed to `ws` (plain WebSocket).

**File Updated:**
- `nita-gui/vite.config.ts` - Changed HMR protocol from `wss` to `ws`

### 2. **Browser HSTS Cache**
If you previously accessed this site over HTTPS, your browser has cached an HSTS (HTTP Strict Transport Security) header and automatically redirects all HTTP requests to HTTPS.

## Solution

### Step 1: Fix the Application ✅
Already done:
- ✅ Vite config uses `ws` instead of `wss`
- ✅ Nginx config is HTTP-only
- ✅ Laravel `.env` has `APP_URL=http://...`

### Step 2: Clear Browser Cache/HSTS

#### **Chrome/Chromium**
1. Open **Settings** → **Privacy and security** → **Delete browsing data**
2. Select **All time** and check:
   - ☑ Cookies and other site data
   - ☑ Cached images and files
3. Click **Delete data**
4. **OR** Go to `chrome://net-internals/#hsts`
   - Type `192.168.110.2` in "Delete domain security policies" field
   - Click **Delete**
   - Type `ww2.ncra.tifr.res.in` and **Delete**

#### **Firefox**
1. Open **Settings** → **Privacy & Security**
2. Scroll to **Cookies and Site Data**
3. Click **Clear Data** 
4. Check both options and click **Clear**

#### **Safari**
1. **Develop** menu → **Empty Web Storage** (or **Clear History**)
2. Then **Settings** → **Privacy** → **Remove all website data**

#### **Edge**
1. Similar to Chrome - **Settings** → **Privacy**
2. Or go to `edge://net-internals/#hsts`

### Step 3: Test

**Important:** Clear cache and manually type the URL:
```
http://192.168.110.2
```

Not `https://` - make sure it's **HTTP** (no S).

Press **Enter** and the page should load!

## Verification

Once the fix is applied, verify using:

**Option A: Direct Access (Development)**
```bash
# Terminal 1
cd nita-rest-api && php artisan serve --host=0.0.0.0 --port=8000

# Terminal 2
cd nita-gui && npm run dev -- --host 0.0.0.0 --port 5174

# Visit: http://192.168.110.2:5174
```

**Option B: With Nginx**
```bash
# After nginx is setup and running both services
# Visit: http://192.168.110.2
# Visit: http://ww2.ncra.tifr.res.in
```

## Files Modified
- ✅ `nita-gui/vite.config.ts` - HMR protocol: `ws` (not `wss`)
- ✅ `nginx.conf` - HTTP only, no HTTPS redirection
- ✅ `nita-rest-api/.env` - `APP_URL=http://192.168.110.2:8000`

## Build Status
✅ Frontend builds successfully with HTTP-compatible configuration
