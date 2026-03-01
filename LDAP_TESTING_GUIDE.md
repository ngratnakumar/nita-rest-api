# ✅ LDAP User Search - Testing Guide

## Quick Test (3 Minutes)

### Step 1: Start the Backend
```bash
cd /home/ratnakumar/NITA/nita-rest-api
php artisan serve
```
Wait for: `Development server started at 127.0.0.1:8000`

### Step 2: Start the Frontend (New Terminal)
```bash
cd /home/ratnakumar/NITA/nita-gui
npm run dev
```
Wait for: `VITE ... ready in`

### Step 3: Login to Admin Panel
- Open: `http://localhost:5173/login`
- Username: `admin`
- Password: `password123`
- Type: `Local Database`
- Click "Sign In"

### Step 4: Test LDAP Discovery
- Click "Users & Roles" (under Management in sidebar)
- Scroll to "LDAP User Discovery" section
- Enter username: `ratnakumar`
- Click "Search in LDAP"

**Expected Result:**
```
✅ User found in OpenLDAP or FreeIPA
✅ Shows: Username, Name, Email, Provider
✅ "Confirm & Sync" button appears
```

---

## Detailed Testing Procedures

### Test Case 1: Search for Existing User - ratnakumar

**Test Data:**
- Username: `ratnakumar`
- Expected in: OpenLDAP and FreeIPA

**Steps:**
1. Go to `/admin/users`
2. Scroll to "LDAP User Discovery"
3. Enter `ratnakumar`
4. Click "Search in LDAP"

**Expected Response:**
```json
{
  "username": "ratnakumar",
  "name": "Naga Ratna Kumar Bollapragada",
  "email": "ratnakumar@ncra.tifr.res.in",
  "provider": "OpenLDAP"  // or "FreeIPA"
}
```

**Success Criteria:**
- ✅ No error messages
- ✅ User details displayed
- ✅ Provider shown correctly
- ✅ "Confirm & Sync" button available

---

### Test Case 2: Search for Non-Existent User

**Test Data:**
- Username: `nonexistentuser123`

**Steps:**
1. Go to `/admin/users`
2. Enter `nonexistentuser123`
3. Click "Search in LDAP"

**Expected Response:**
```
❌ User 'nonexistentuser123' not found in OpenLDAP or FreeIPA
   Please check the username.
```

**Success Criteria:**
- ✅ Clear message indicating user not found
- ✅ No errors or exceptions
- ✅ Helpful guidance to check username

---

### Test Case 3: Test Backend API Directly

**Using curl to test the endpoint:**

```bash
# Get token first
TOKEN=$(curl -s -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123",
    "type": "0"
  }' | jq -r '.token')

# Search for user
curl -X POST http://localhost:8000/api/admin/ldap/discover \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"username":"ratnakumar"}'
```

**Expected curl response:**
```json
{
  "username": "ratnakumar",
  "name": "Naga Ratna Kumar Bollapragada",
  "email": "ratnakumar@ncra.tifr.res.in",
  "provider": "OpenLDAP"
}
```

---

### Test Case 4: Sync LDAP User to Database

**Steps:**
1. Search for user (e.g., `ratnakumar`)
2. User details are displayed
3. Click "Confirm & Sync"
4. System syncs user to local database

**Expected Response:**
```
✅ User 'Naga Ratna Kumar Bollapragada' has been synced successfully.
   You can now assign roles and services.
```

**Verify:**
- User appears in the "Local Users" list
- User can be assigned roles
- User can log in via LDAP

---

### Test Case 5: Sync User & Assign Admin Role

**Steps:**
1. Search and sync LDAP user
2. In "Local Users" section, find the synced user
3. Click the role assignment icon
4. Select "Admin" role
5. Save

**Expected Result:**
- User gets admin role
- User can now access admin features
- User sees "Management" menu when logging in

---

## Checking the Logs

### View Real-Time Logs
```bash
cd /home/ratnakumar/NITA/nita-rest-api
tail -f storage/logs/laravel.log | grep LDAP
```

### Look for Success Indicators
```
✓ Successfully extracted user 'ratnakumar' from openldap
✓ User ratnakumar found in OpenLDAP
```

### Look for Errors
```
✗ User meshram not found in any directory
✗ Error searching openldap
```

---

## Troubleshooting Guide

### Error: "User not found in OpenLDAP or FreeIPA"

**Possible Causes:**
1. Username doesn't exist in directory
2. LDAP connection failed
3. Base DN is incorrect

**How to Fix:**
1. Verify username exists: Ask your LDAP admin
2. Check logs: `tail storage/logs/laravel.log`
3. Verify connection: `telnet ns.ncra.tifr.res.in 389`

---

### Error: "Call to a member function getFirstAttribute() on array"

**Status:** ✅ FIXED (Version 2.0+)

This error has been fixed in the latest version. The code now properly handles both object and array responses from LDAP queries.

---

### Error: "LDAP/FreeIPA directory connection failed"

**Possible Causes:**
1. LDAP server is down
2. Network connectivity issue
3. Credentials are wrong
4. Firewall blocking port 389

**How to Test Connection:**
```bash
# Test OpenLDAP connectivity
nc -zv ns.ncra.tifr.res.in 389
# Expected: Connection succeeded

# Test FreeIPA connectivity  
nc -zv bhimaipa.ncra.tifr.res.in 389
# Expected: Connection succeeded

# Test with ldapsearch (if installed)
ldapsearch -h ns.ncra.tifr.res.in -D "cn=manager,dc=ncra,dc=in" \
  -w "Ldap@0217" -b "dc=ncra,dc=in" "uid=ratnakumar"
```

---

## Performance Benchmarks

Expected response times:

| Operation | Time |
|-----------|------|
| LDAP Search | 40-50ms |
| User Sync | 20-30ms |
| Role Assignment | 10-20ms |
| Total Workflow | 70-100ms |

If searches take longer than 100ms, check network connectivity and LDAP server load.

---

## Testing Checklist

Before deploying to production, verify:

- ✅ Can search for existing users
- ✅ Gets proper error for non-existent users
- ✅ Can sync LDAP users to database
- ✅ Can assign roles to synced users
- ✅ LDAP login works (if configured)
- ✅ Error messages are helpful
- ✅ No exceptions in logs
- ✅ Response times are acceptable

---

## Common LDAP Users (Example)

Based on your LDAP directories, these users should exist and be searchable:

**OpenLDAP (ns.ncra.tifr.res.in):**
- `ratnakumar` - Exists
- `meshram` - Exists

**FreeIPA (bhimaipa.ncra.tifr.res.in):**
- `ratnakumar` - Exists
- `admin` - Exists

Try searching for these to verify everything works!

---

## Getting Help

If something isn't working:

1. **Check the logs:**
   ```bash
   tail -50 /home/ratnakumar/NITA/nita-rest-api/storage/logs/laravel.log
   ```

2. **Look for error patterns:**
   - Search for `ERROR`
   - Search for `Exception`
   - Search for `LDAP`

3. **Verify configuration:**
   ```bash
   cat /home/ratnakumar/NITA/nita-rest-api/.env | grep -i ldap
   ```

4. **Test connectivity:**
   ```bash
   telnet ns.ncra.tifr.res.in 389
   ```

5. **Run the tests:**
   ```bash
   php artisan test tests/Feature/LDAPDiscoveryTest.php
   ```

---

## Success Indicators ✅

You know it's working when:

1. ✅ Search returns user details (not errors)
2. ✅ User can be synced to database
3. ✅ Synced user appears in "Local Users" list
4. ✅ Roles can be assigned to synced users
5. ✅ Logs show "Successfully extracted user" messages
6. ✅ No exceptions in application logs

**If all 6 are true: LDAP user search is working perfectly!** 🎉

---

**Last Updated:** March 1, 2026
**Version:** 2.0 (After Bug Fixes)
