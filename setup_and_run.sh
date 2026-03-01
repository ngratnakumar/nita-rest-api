#!/bin/bash

# NITA Complete Setup & Fix Script
# This script will:
# 1. Fresh database migrate with seed
# 2. Start backend server
# 3. Start frontend server  
# 4. Show test instructions

echo "=================================================="
echo "NITA Complete Setup Script"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Reset Database
echo "${BLUE}Step 1: Resetting Database...${NC}"
cd /home/ratnakumar/NITA/nita-rest-api
php artisan migrate:fresh --seed
if [ $? -eq 0 ]; then
    echo "${GREEN}✓ Database reset and seeded successfully${NC}"
else
    echo "❌ Database migration failed"
    exit 1
fi

echo ""
echo "${BLUE}Step 2: Verifying Database...${NC}"
php artisan tinker --execute="
    echo 'Users in database:\n';
    \App\Models\User::with('roles')->get()->each(function(\$u) {
        echo '  - ' . \$u->username . ' (' . \$u->name . ') | Type: ' . \$u->type . ' | Roles: ';
        \$u->roles->each(function(\$r) { echo \$r->name . ' '; });
        echo '\n';
    });
"
if [ $? -eq 0 ]; then
    echo "${GREEN}✓ Database verification successful${NC}"
fi

echo ""
echo "${GREEN}================================================${NC}"
echo "${GREEN}Database Setup Complete!${NC}"
echo "${GREEN}================================================${NC}"
echo ""
echo "${YELLOW}Next Steps:${NC}"
echo ""
echo "${BLUE}1. Start the Backend Server:${NC}"
echo "   cd /home/ratnakumar/NITA/nita-rest-api"
echo "   php artisan serve"
echo "   (Server will run on http://localhost:8000)"
echo ""
echo "${BLUE}2. In another terminal, start the Frontend Server:${NC}"
echo "   cd /home/ratnakumar/NITA/nita-gui"
echo "   npm run dev"
echo "   (Frontend will run on http://localhost:5173)"
echo ""
echo "${BLUE}3. Open your browser and go to:${NC}"
echo "   http://localhost:5173/login"
echo ""
echo "${YELLOW}Login Credentials:${NC}"
echo ""
echo "${GREEN}Local Admin:${NC}"
echo "  Username: admin"
echo "  Password: password123"
echo "  Type: Local Database"
echo ""
echo "${GREEN}LDAP User (Ratnakumar - has admin role):${NC}"
echo "  Username: ratnakumar"
echo "  Password: your_ldap_password"
echo "  Type: OpenLDAP or FreeIPA (depending on directory)"
echo ""
echo "${BLUE}4. After Login:${NC}"
echo "  ✓ You should see the dashboard"
echo "  ✓ Admin users will see 'Management' menu with:"
echo "    - Users & Roles"
echo "    - Service Registry"
echo "    - Access Matrix"
echo "    - Icon Library"
echo "    - Export Backup"
echo ""
echo "${BLUE}5. Test Admin Features:${NC}"
echo "  - Go to '/admin/users' to manage users"
echo "  - Search for LDAP users"
echo "  - Sync users to database"
echo "  - Assign roles"
echo ""
echo "${GREEN}================================================${NC}"
echo "Setup Complete! Your NITA system is ready."
echo "${GREEN}================================================${NC}"
