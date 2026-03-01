# NITA LAN Configuration Guide

## Network Setup

- **Server Machine:** 192.168.110.2 (ww2)
- **Client Machine:** 192.168.110.65
- **Frontend Port:** 5174
- **Backend Port:** 8000

## Access URLs

From any machine on the LAN network:

```
Frontend: http://192.168.110.2:5174
Backend:  http://192.168.110.2:8000/api
```

## Quick Start

### Option 1: Using the Startup Script

```bash
cd /home/ratnakumar/NITA
./start-lan-servers.sh
```

This will:
- Stop any existing servers
- Clear application caches
- Start backend on 0.0.0.0:8000
- Start frontend on 0.0.0.0:5174

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd /home/ratnakumar/NITA/nita-rest-api
php artisan serve --host=0.0.0.0 --port=8000
```

**Terminal 2 - Frontend:**
```bash
cd /home/ratnakumar/NITA/nita-gui
npm run dev -- --host 0.0.0.0 --port 5174
```

## Configuration Files Updated

### 1. Frontend API Configuration
**File:** `nita-gui/src/api/axios.ts`

```typescript
const api = axios.create({
  baseURL: 'http://192.168.110.2:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});
```

### 2. Backend Environment
**File:** `nita-rest-api/.env`

```env
APP_URL=http://192.168.110.2:8000
SANCTUM_STATEFUL_DOMAINS=192.168.110.2,192.168.110.65,localhost
SESSION_DOMAIN=.ncra.tifr.res.in
```

### 3. CORS Configuration
**File:** `nita-rest-api/config/cors.php`

Allowed origins include:
- `http://192.168.110.2` (LAN server)
- `http://192.168.110.65:5174` (LAN client frontend)
- `http://localhost:5173` (local development)
- All variations with HTTPS

## Login Credentials

```
Username: admin
Password: newpassword123
Authentication Type: Local Database (Type 0)
```

## Testing the Connection

From client machine (192.168.110.65):

### Test Frontend
```bash
curl -v http://192.168.110.2:5174
```

### Test Backend
```bash
curl -X POST http://192.168.110.2:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"newpassword123","type":0}'
```

Expected response: JSON with token and user data

### Test LDAP Discovery
```bash
TOKEN=$(curl -s -X POST http://192.168.110.2:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"newpassword123","type":0}' | jq -r '.token')

curl -X POST http://192.168.110.2:8000/api/admin/ldap/discover \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"ratnakumar","provider":"openldap"}'
```

## Server Details

### Backend Server (PHP Laravel)
- **Host:** 0.0.0.0 (all network interfaces)
- **Port:** 8000
- **Database:** PostgreSQL 16 on 127.0.0.1:5432
- **Database Name:** nita_db
- **Debug Mode:** Enabled (local environment)

### Frontend Server (Node.js Vite)
- **Host:** 0.0.0.0 (all network interfaces)
- **Port:** 5174
- **Framework:** React 18 + TypeScript + Vite
- **API Backend:** http://192.168.110.2:8000/api

## LDAP Connections

Configured for both OpenLDAP and FreeIPA:

### OpenLDAP
- **Host:** ns.ncra.tifr.res.in:389
- **Base DN:** dc=ncra,dc=in
- **Admin User:** cn=manager,dc=ncra,dc=in

### FreeIPA
- **Host:** bhimaipa.ncra.tifr.res.in:389
- **Base DN:** cn=users,cn=accounts,dc=ncra,dc=tifr,dc=res,dc=in
- **Admin User:** uid=admin,cn=users,cn=accounts,dc=ncra,dc=tifr,dc=res,dc=in

## Features

✅ **Authentication**
- Local database authentication (Type 0)
- OpenLDAP authentication (Type 1)
- FreeIPA authentication (Type 2)

✅ **User Management**
- LDAP user discovery
- Password change functionality
- Role-based access control (admin, staff, guest)

✅ **Services**
- Service management (GitLab, Wiki, VPN)
- Service categorization
- Role-service relationships

## Troubleshooting

### Connection Refused
- Ensure both servers are running on the server machine (192.168.110.2)
- Check firewall settings allowing port 8000 and 5174

### CORS Errors
- Verify the client IP is added to `allowed_origins` in `config/cors.php`
- Ensure `SANCTUM_STATEFUL_DOMAINS` includes both IPs in `.env`

### Database Connection Issues
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify credentials in `.env` (DB_HOST, DB_USERNAME, DB_PASSWORD)

### LDAP Connection Issues
- Test LDAP connectivity: `ldapsearch -x -H ldap://ns.ncra.tifr.res.in -D "cn=manager,dc=ncra,dc=in" -W`
- Check LDAP credentials in `.env`

## Documentation Files

- `COMPREHENSIVE_TEST_REPORT.md` - Full test results
- `start-lan-servers.sh` - Automated server startup
- `.env` - Backend configuration
- `config/cors.php` - CORS allowed origins
- `src/api/axios.ts` - Frontend API configuration

## Support

For issues or questions about the LAN setup, check:
1. Server logs: `storage/logs/laravel.log`
2. Browser console (Frontend): Press F12
3. Network tab in DevTools for API calls
