# NITA LAN Setup Guide (HTTP Only)

## Overview
This guide explains how to set up NITA for LAN-only HTTP access using either:
- **IP Address:** `http://192.168.110.2`
- **Domain Name:** `http://ww2.ncra.tifr.res.in`

## Quick Start (Development)

### Option 1: Direct Access (Fastest for Development)
```bash
# Terminal 1 - Start Backend
cd nita-rest-api
php artisan serve --host=0.0.0.0 --port=8000

# Terminal 2 - Start Frontend
cd nita-gui
npm run dev -- --host 0.0.0.0 --port 5174

# Access at:
# http://192.168.110.2:5174 (Frontend)
# http://192.168.110.2:8000/api (Backend API)
```

### Option 2: Using Nginx Reverse Proxy (Recommended for Production)
Single domain/IP for both frontend and backend.

#### Setup Steps:
```bash
# 1. Install nginx
sudo apt-get install nginx  # Ubuntu/Debian
# or
brew install nginx          # macOS

# 2. Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/nita

# 3. Enable site
sudo ln -s /etc/nginx/sites-available/nita /etc/nginx/sites-enabled/

# 4. Test and reload
sudo nginx -t
sudo systemctl restart nginx

# Now start both services
cd nita-rest-api && php artisan serve --host=0.0.0.0 --port=8000 &
cd nita-gui && npm run dev -- --host 0.0.0.0 --port 5174 &

# Access at:
# http://192.168.110.2      (Frontend via nginx)
# http://ww2.ncra.tifr.res.in (Frontend via domain)
# API requests go to `/api` (proxied to backend)
```

## Environment Configuration

### For Nginx Reverse Proxy (Recommended)
Use `.env.development`:
```env
VITE_API_URL=/api
```
Frontend makes requests to `/api`, nginx proxies them to backend:8000.

### For Direct Backend Access
Create `.env.development.local`:
```env
VITE_API_URL=http://192.168.110.2:8000/api
```

## Nginx Configuration

The provided `nginx.conf` handles:
- ✅ HTTP (port 80) - no HTTPS
- ✅ Both `192.168.110.2` and `ww2.ncra.tifr.res.in` domains
- ✅ Proxies `/api` to backend (port 8000)
- ✅ Proxies `/` to frontend (port 5174)

## CORS Configuration

Updated `nita-rest-api/config/cors.php` to allow:
- `http://localhost:5173`, `http://localhost:5174`, `http://localhost:8000`
- `http://127.0.0.1:5173`, `http://127.0.0.1:5174`
- `http://192.168.110.2`, `http://192.168.110.2:5173`, `http://192.168.110.2:5174`, `http://192.168.110.2:8000`
- `http://192.168.110.65:5173`, `http://192.168.110.65:5174`
- `http://ww2.ncra.tifr.res.in`

## Troubleshooting

### Backend not responding
```bash
# Check if backend is running
curl http://192.168.110.2:8000/api/me

# If not, start it:
cd nita-rest-api && php artisan serve --host=0.0.0.0 --port=8000
```

### Frontend not responding
```bash
# Check if frontend is running
curl http://192.168.110.2:5174

# If not, start it:
cd nita-gui && npm run dev -- --host 0.0.0.0 --port 5174
```

### Nginx not proxying correctly
```bash
# Check nginx config syntax
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Restart nginx
sudo systemctl restart nginx
```

### Domain not resolving
Add to your hosts file if DNS is not configured:
```bash
# /etc/hosts (Linux/macOS) or C:\Windows\System32\drivers\etc\hosts (Windows)
192.168.110.2 ww2.ncra.tifr.res.in
```

## Testing Icon Upload

1. Navigate to **Admin > Icons** in the web UI
2. Upload an icon file (PNG, SVG, JPG)
3. Should work without "Mixed Content" errors ✅

The mixed content error is now fixed because everything uses HTTP (no HTTPS/HTTP mismatch).

## Files Modified
- ✅ `nginx.conf` - HTTP-only reverse proxy for both domains
- ✅ `nita-gui/.env` - Set to `http://192.168.110.2/api`
- ✅ `nita-gui/.env.development` - Set to `/api` (relative, for nginx)
- ✅ `nita-rest-api/config/cors.php` - Cleaned up HTTPS entries, added `http://ww2.ncra.tifr.res.in`
- ✅ `nita-gui/src/api/axios.ts` - Uses environment variables

## Build Status
✅ Frontend builds successfully (0 TypeScript errors)
