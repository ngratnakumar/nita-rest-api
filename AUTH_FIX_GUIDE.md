# NITA Authentication System - Complete Fix Guide

## Current Status
✅ Database: PostgreSQL with admin user created
✅ Backend: Laravel API with correct password hashing  
❌ Frontend API: Pointing to wrong endpoint (https://192.168.110.2/api instead of localhost)
❌ Issue: Frontend cannot reach the backend API

## The Problem

### Issue 1: Frontend Base URL Wrong
- **Current:** `https://192.168.110.2/api`
- **Actual Backend:** `http://localhost:8000` (or wherever you're running it)
- **Fix:** Update axios configuration

### Issue 2: Admin User Not Accessible in Frontend
- Database has admin user with password 'password123' ✓
- Tests confirm login works ✓  
- But ratnakumar doesn't show admin options in UI

## Solution

### Step 1: Fix Frontend API Configuration
File: `nita-gui/src/api/axios.ts`

Change FROM:
```typescript
const api = axios.create({
  baseURL: 'https://192.168.110.2/api',  // ❌ Production URL
  ...
```

Change TO (for localhost development):
```typescript
const api = axios.create({
  baseURL: 'http://localhost:8000/api',  // ✅ Development URL
  ...
```

Or for production on 192.168.110.2:
```typescript
const api = axios.create({
  baseURL: 'https://192.168.110.2:8000/api',  // ✅ If backend runs on 8000
  ...
```

### Step 2: Verify Backend is Running
```bash
cd /home/ratnakumar/NITA/nita-rest-api
php artisan serve  # Runs on http://localhost:8000
```

### Step 3: Verify Frontend is Running
```bash
cd /home/ratnakumar/NITA/nita-gui
npm run dev  # Runs on http://localhost:5173
```

### Step 4: Test Login in Frontend
1. Go to http://localhost:5173/login
2. Username: `admin`
3. Password: `password123`
4. Type: `Local Database`
5. Click "Sign In"

## Database Verification

✅ Admin User Created:
- Username: admin
- Password: password123 (hashed)
- Type: 0 (Local)
- Role: admin
- Email: admin@ncra.tifr.res.in

✅ Ratnakumar User Created:
- Username: ratnakumar  
- Type: 1 (OpenLDAP) or 2 (FreeIPA based on actual config)
- Role: admin (assigned)
- Can login via LDAP

## Test Commands

To verify the database CLI:
```php
cd /home/ratnakumar/NITA/nita-rest-api

# Check users exist
php artisan tinker
> \App\Models\User::with('roles')->get();

# Test password hash
> use Illuminate\Support\Facades\Hash;
> $user = \App\Models\User::where('username', 'admin')->first();
> Hash::check('password123', $user->password);  // Should return true

# Check roles
> $user->roles()->get();  // Should show admin role
```

## Next Steps

1. **Update Frontend API URL** to match your backend location
2. **Start Both Servers** (Backend on 8000, Frontend on 5173)
3. **Test Login** with admin/password123
4. **Verify Admin UI** appears after login
5. **Test LDAP Users** if credentials available

## Backend Details

- **API Base URL:** `http://localhost:8000` or `https://192.168.110.2:PORT` (depending on deployment)
- **Login Endpoint:** `POST /api/login`
- **Credentials Format:**
  ```json
  {
    "username": "admin",
    "password": "password123",
    "type": "0"  // 0=Local, 1=OpenLDAP, 2=FreeIPA
  }
  ```
- **Response on Success:**
  ```json
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
