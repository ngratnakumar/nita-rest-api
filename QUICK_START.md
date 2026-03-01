# Quick Start - Copy & Paste Commands

## Setup (One-Time)
```bash
# Reset database and seed
cd /home/ratnakumar/NITA/nita-rest-api
php artisan migrate:fresh --seed

# Verify everything is correct
php artisan test
```

---

## Running the System

### Terminal 1: Start Backend
```bash
cd /home/ratnakumar/NITA/nita-rest-api
php artisan serve
```
✓ Wait for: "Laravel development server started at http://127.0.0.1:8000"

### Terminal 2: Start Frontend  
```bash
cd /home/ratnakumar/NITA/nita-gui
npm run dev
```
✓ Wait for: "VITE v... ready in ... ms"

### Terminal 3 (or Browser): Test Login
Open: http://localhost:5173/login

**Enter:**
- Username: `admin`
- Password: `password123`
- Type: `Local Database`

Click "Sign In"

---

## Expected Results

### ✅ Successful Login Shows:
- Redirect to `/dashboard`
- Sidebar with "System Admin" badge
- "Management" section in sidebar with:
  - Users & Roles
  - Service Registry
  - Access Matrix
  - Icon Library
  - Export Backup

### ✅ Admin Features Work:
- Go to `/admin/users` → LDAP Discovery works
- Go to `/admin/services` → Services display
- Go to `/profile` → Can change password
- Click "Export Backup" → Downloads JSON

---

## Quick Verification Commands

### Check Admin User Exists
```bash
cd /home/ratnakumar/NITA/nita-rest-api
php artisan tinker

# Copy-paste this:
\App\Models\User::with('roles')->where('username', 'admin')->first();

# Should show: User with roles [admin]
```

### Test Password Hash
```bash
# In tinker, continue with:
use Illuminate\Support\Facades\Hash;
$admin = \App\Models\User::where('username', 'admin')->first();
Hash::check('password123', $admin->password);

# Should return: true
```

### Verify LDAP Ratnakumar Admin
```bash
# In tinker, continue with:
$rat = \App\Models\User::where('username', 'ratnakumar')->first();
$rat->roles()->pluck('name');

# Should return: ["admin"]
```

### Run All Tests
```bash
cd /home/ratnakumar/NITA/nita-rest-api
php artisan test

# Should show: 17 passed
```

### Check Login Endpoint
```bash
cd /home/ratnakumar/NITA/nita-rest-api
php artisan route:list | grep login

# Should show: POST api/login
```

---

## Docker Commands (Alternative)

If using Docker:

```bash
# Build images
docker build -t nita-api ./nita-rest-api
docker build -t nita-gui ./nita-gui

# Run backend on 8000
docker run -p 8000:8000 nita-api

# Run frontend on 5173
docker run -p 5173:5173 nita-gui
```

---

## Troubleshooting Commands

### If Login Fails
```bash
# Check database connectivity
php artisan db
# Should connect without errors

# Verify user exists
php artisan tinker
> \App\Models\User::count();  // Should be >= 2

# Check password
> Hash::check('password123', \App\Models\User::where('username','admin')->first()->password);
// Should be true
```

### If Frontend Can't Connect
```bash
# Check backend is running
curl http://localhost:8000/api/login
# Should return JSON (method not allowed is OK)

# Check CORS
curl -H "Origin: http://localhost:5173" http://localhost:8000/api/login
# Should return CORS headers
```

### If Admin Menu Doesn't Show
```bash
# Open browser console (F12 → Console tab)
# Check localStorage
localStorage.getItem('user')

# Should show user with roles array
# roles should contain {id: 1, name: "admin"}
```

---

## Common Issues

### Port 8000 Already In Use
```bash
# Find and kill process
lsof -i :8000
kill -9 <PID>

# Or use different port
php artisan serve --port=8001
# Then update axios baseURL to http://localhost:8001/api
```

### Port 5173 Already In Use
```bash
# Kill process or use different port
npm run dev -- --port 5174
```

### Database Locked
```bash
# Reset everything
php artisan migrate:fresh --seed

# Or clear cache
php artisan cache:clear
php artisan config:clear
```

---

## After Everything Works

### Change Admin Password
1. Login as admin
2. Go to `/profile`
3. Enter current password: `password123`
4. Enter new password (8+ characters)
5. Confirm new password

### Add More Users
1. Login as admin
2. Go to `/admin/users`
3. Search LDAP for users
4. Sync to database
5. Assign roles

### Configure Services
1. Login as admin
2. Go to `/admin/services`
3. Add/edit services
4. Assign to roles
5. Users see based on their role

---

## Performance Tips

### Optimize Database
```bash
# Run migrations in production
php artisan migrate --step

# Clear caches
php artisan cache:clear
php artisan config:clear
```

### Build Frontend for Production
```bash
cd /home/ratnakumar/NITA/nita-gui
npm run build
# Creates dist/ folder with optimized files
```

---

## Need More Help?

See full documentation in:
- `/home/ratnakumar/NITA/COMPLETE_SETUP_GUIDE.md`
- `/home/ratnakumar/NITA/FIX_SUMMARY.md`
- `/home/ratnakumar/NITA/AUTH_FIX_GUIDE.md`

Good luck! 🚀
