# 🎯 NITA Complete System - Ready to Use!

## ✅ What's Been Done

### Database Setup
- ✅ PostgreSQL database created and configured
- ✅ All 10 migrations completed
- ✅ Admin user created (local login)
- ✅ Ratnakumar user created (LDAP/FreeIPA login)
- ✅ Both users have admin role attached
- ✅ Roles (admin, staff, guest) created
- ✅ Services configured

### Backend Changes
- ✅ AuthController: Login handles types 0 (Local), 1 (OpenLDAP), 2 (FreeIPA)
- ✅ Password change endpoint created
- ✅ Role-based access control implemented
- ✅ All tests passing (17 tests)

### Frontend Changes
- ✅ Fixed API endpoint from https://192.168.110.2/api → http://localhost:8000/api
- ✅ Login page with provider selection
- ✅ Password change UI
- ✅ Admin-only sidebar menu 
- ✅ Role-based route protection

## 🚀 How to Start the System

### Terminal 1: Backend Server
```bash
cd /home/ratnakumar/NITA
./start_backend.sh
# Or manually:
cd /home/ratnakumar/NITA/nita-rest-api
php artisan serve
```
- Running on: `http://localhost:8000`
- API: `http://localhost:8000/api`

### Terminal 2: Frontend Server
```bash
cd /home/ratnakumar/NITA
./start_frontend.sh
# Or manually:
cd /home/ratnakumar/NITA/nita-gui
npm run dev
```
- Running on: `http://localhost:5173`

## 🔐 Login Credentials

### Test Admin (Local Database)
```
Username: admin
Password: password123
Type: Local Database
```

### Ratnakumar (LDAP/FreeIPA)
```
Username: ratnakumar
Password: [Your LDAP/FreeIPA password]
Type: OpenLDAP or FreeIPA
```
- This user is already set as admin in the database
- Will authenticate against your directory server

## 📋 Database Details

### Current Users
```
User: admin         | Type: Local (0)     | Role: Admin
User: ratnakumar    | Type: OpenLDAP (1)  | Role: Admin
```

### Available Roles
- `admin` - Full system access
- `staff` - Regular user (no admin features)
- `guest` - Guest access

### Services
- GitLab Internal
- NCRA Wiki
- VPN Access

## 🧪 Testing the System

### 1. Test Local Admin Login
1. Go to http://localhost:5173/login
2. Enter username: `admin`
3. Enter password: `password123`
4. Select type: `Local Database`
5. Click "Sign In"
6. Should see Dashboard + Admin Menu

### 2. Test Admin Features
- Click on "Users & Roles" → Test LDAP discovery
- Click on "Service Registry" → Manage services
- Click on "Profile Settings" → Change password
- Click "Export Backup" → Download JSON backup

### 3. Test Role-Based Access
- Try accessing /admin/users without logging in → Redirected to login
- Log in as staff user → Admin menu hidden
- Log in as admin → Admin menu visible

## 📊 API Endpoints

### Authentication
```
POST /api/login
{
  "username": "admin",
  "password": "password123",
  "type": "0"
}

Response:
{
  "status": "success",
  "token": "...",
  "user": {
    "id": 1,
    "username": "admin",
    "roles": [{"id": 1, "name": "admin"}]
  }
}
```

### Protected Routes
```
GET /api/me                          - Get current user with roles
POST /api/change-password            - Change user password
POST /api/admin/ldap/discover        - Find LDAP users
POST /api/admin/ldap/sync            - Sync user to database
```

## 🔧 Configuration Files

### Backend Config
- **Database:** `/home/ratnakumar/NITA/nita-rest-api/.env` (PostgreSQL)
- **LDAP Config:** `/home/ratnakumar/NITA/nita-rest-api/config/ldap.php`
- **CORS Config:** `/home/ratnakumar/NITA/nita-rest-api/config/cors.php`

### Frontend Config  
- **API Endpoint:** `/home/ratnakumar/NITA/nita-gui/src/api/axios.ts`
- **Routes:** `/home/ratnakumar/NITA/nita-gui/src/App.tsx`
- **Login:** `/home/ratnakumar/NITA/nita-gui/src/pages/Login.tsx`

## 🐛 Troubleshooting

### "Invalid local credentials"
- ✅ Verify admin user exists in DB
- ✅ Check password is "password123"
- ✅ Ensure type is "0" (Local Database)
- ✅ Verify database was seeded

### "Cannot reach API"
- ✅ Backend must be running on http://localhost:8000
- ✅ Check axios baseURL in src/api/axios.ts
- ✅ Check CORS is configured for localhost:5173
- ✅ Check no firewall is blocking port 8000

### "Admin menu not showing"
- ✅ Verify user has admin role in database
- ✅ Check roles object is in user response
- ✅ Check localStorage has full user object
- ✅ Refresh page after login

### "LDAP/FreeIPA not working"
- ✅ Verify LDAP configuration in config/ldap.php
- ✅ Check network connectivity to LDAP server
- ✅ Verify LDAP user exists in directory
- ✅ Check LDAP discovery test results

## 📝 Quick Commands

### Check Database Users
```bash
cd /home/ratnakumar/NITA/nita-rest-api
php artisan tinker
> \App\Models\User::with('roles')->get();
```

### Reset Everything
```bash
cd /home/ratnakumar/NITA/nita-rest-api
php artisan migrate:fresh --seed
```

### Run Tests
```bash
cd /home/ratnakumar/NITA/nita-rest-api
php artisan test
```

### Check Routes
```bash
cd /home/ratnakumar/NITA/nita-rest-api
php artisan route:list | grep api
```

## 🎓 Architecture Overview

```
Frontend (React + TypeScript)              Backend (Laravel 11)
    ↓                                           ↓
Login.tsx ←→ /api/login ←→ AuthController
    ↓                                           ↓
App.tsx (Routes) ←→ Protected Endpoints ←→ Sanctum Tokens
    ↓                                           ↓
Sidebar (Admin Check) ←→ /api/me ←→ User + Roles
    ↓                                           ↓
Admin Components ←→ /api/admin/* ←→ LDAPController
    ↓                                           ↓
Dashboard, Services ←→ /api/services ←→ Database
```

## 🌟 Key Features Implemented

1. **Multi-Type Authentication**
   - Local database (type 0)
   - OpenLDAP (type 1)
   - FreeIPA (type 2)

2. **Role-Based Access Control**
   - Admin role sees all management features
   - Staff/Guest roles see limited features
   - Protected routes enforce rules

3. **User Management**
   - Discover users in LDAP/FreeIPA
   - Sync to local database
   - Assign roles from UI

4. **Security**
   - Password hashing with bcrypt
   - Token-based auth (Sanctum)
   - Protected API endpoints
   - CORS configured

5. **Service Management**
   - Search and filter services
   - Service assignment by role
   - Icon management
   - Category organization

## 📞 Support

If something isn't working:
1. Check the database with tinker
2. Run tests to verify endpoints
3. Check browser console for frontend errors
4. Check Laravel logs in `/storage/logs/`

---

**Your NITA system is now fully operational!** 🚀
