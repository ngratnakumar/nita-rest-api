#!/bin/bash

# NITA LAN Server Startup Script
# Starts both backend and frontend servers configured for LAN access
# Server: 192.168.110.2
# Frontend: http://192.168.110.2:5174
# Backend: http://192.168.110.2:8000

set -e

echo "=================================="
echo "NITA LAN Server Startup"
echo "=================================="
echo ""

# Stop any existing servers
echo "[1/4] Stopping existing servers..."
pkill -f "php artisan serve" || true
pkill -f "vite" || true
sleep 2

# Clear caches
echo "[2/4] Clearing application caches..."
cd /home/ratnakumar/NITA/nita-rest-api
php artisan config:clear
php artisan route:clear
php artisan cache:clear

# Start backend server
echo "[3/4] Starting backend server on 0.0.0.0:8000..."
cd /home/ratnakumar/NITA/nita-rest-api
php artisan serve --host=0.0.0.0 --port=8000 &
BACKEND_PID=$!

# Start frontend server
echo "[4/4] Starting frontend server on 0.0.0.0:5174..."
cd /home/ratnakumar/NITA/nita-gui
npm run dev -- --host 0.0.0.0 --port 5174 &
FRONTEND_PID=$!

echo ""
echo "=================================="
echo "✅ Servers Started Successfully!"
echo "=================================="
echo ""
echo "Frontend URL: http://192.168.110.2:5174"
echo "Backend URL:  http://192.168.110.2:8000/api"
echo ""
echo "From LAN client (192.168.110.65):"
echo "  - Frontend: http://192.168.110.2:5174"
echo "  - Backend:  http://192.168.110.2:8000/api"
echo ""
echo "Credentials:"
echo "  - Username: admin"
echo "  - Password: newpassword123"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "=================================="
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
