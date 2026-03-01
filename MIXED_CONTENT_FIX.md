# Mixed Content Error - HTTPS to HTTP Issue

## Problem
When accessing the frontend over HTTPS (`https://192.168.110.2`), you get this error:
```
Mixed Content: The page at 'https://192.168.110.2/admin/icons' was loaded over HTTPS, 
but requested an insecure XMLHttpRequest endpoint 'http://192.168.110.2:8000/api/admin/media/icons'.
```

This happens because modern browsers **block** HTTPS pages from loading HTTP resources (mixed content).

## Root Cause
- **Frontend**: Running on `http://192.168.110.2:5174` (HTTP, port 5174)
- **Backend API**: Running on `http://192.168.110.2:8000` (HTTP, port 8000)
- **Accessed via**: `https://192.168.110.2` (HTTPS, no port)

## Solution Options

### Option 1: Use Reverse Proxy (Recommended) ✅
Set up nginx to terminate HTTPS and proxy both frontend and backend through one HTTPS endpoint.

**Setup:**
1. Install nginx on your system
2. Copy the provided `nginx.conf` to `/etc/nginx/sites-available/nita` (or your nginx config directory)
3. Generate or provide SSL certificates:
   ```bash
   # Generate self-signed certificate for development (valid for 365 days)
   openssl req -x509 -newkey rsa:4096 -keyout /etc/ssl/private/server.key -out /etc/ssl/certs/server.crt -days 365 -nodes
   ```
4. Enable the nginx site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/nita /etc/nginx/sites-enabled/
   sudo nginx -t                    # Test configuration
   sudo systemctl restart nginx     # Restart nginx
   ```

**How it works:**
- User accesses `https://192.168.110.2`
- Nginx terminates SSL/HTTPS connection
- Nginx proxies `/` → frontend on `:5174`
- Nginx proxies `/api` → backend on `:8000`
- All traffic between user and nginx is HTTPS (secure)
- All traffic between nginx and services is HTTP (internal, fast)

**Environment File:** `.env` (as-is)
```env
VITE_API_URL=https://192.168.110.2/api
```

### Option 2: Local Development WITHOUT Reverse Proxy
If you want to skip nginx during development and test locally:

1. **Keep frontend on HTTP:** Access at `http://192.168.110.2:5174` (not HTTPS)
2. **Backend stays on HTTP:** Running at `http://192.168.110.2:8000`
3. **Create** `.env.development.local`:
   ```env
   VITE_API_URL=http://192.168.110.2:8000/api
   ```
4. Restart frontend: `npm run dev`

This avoids the mixed content error because both are HTTP.

### Option 3: Enable HTTPS on Laravel Backend
Run Laravel with SSL (more complex for development):
```bash
php artisan serve --host=0.0.0.0 --port=8000 --ssl
```
Then update `.env`:
```env
VITE_API_URL=https://192.168.110.2:8000/api
```

## Current Configuration

✅ **Updated Files:**
- `nita-gui/src/api/axios.ts` - Now uses environment variable (was hardcoded to HTTP)
- `nita-gui/.env` - Set to production HTTPS endpoint
- `nita-gui/.env.development` - Use relative `/api` paths
- `nita-gui/.env.development.local.example` - Example for direct backend URL
- `nginx.conf` - Reverse proxy configuration (if you want to use Option 1)

## Recommended for Production
Use **Option 1 (Reverse Proxy with Nginx)**:
1. Provides a single HTTPS entry point
2. All external traffic is encrypted
3. Backend can run on HTTP (internal network)
4. Better performance (nginx is optimized for static files)
5. Better security (internal services don't need public SSL)

## Quick Start
If you want to fix it immediately without nginx:
```bash
# Copy this to .env.development.local to test local development
cp nita-gui/.env.development.local.example nita-gui/.env.development.local

# Access frontend at HTTP (not HTTPS):
# http://192.168.110.2:5174
```

Once you set up nginx, you can access at `https://192.168.110.2` without the port.
