#!/bin/bash

# NITA Development Server Starter
# This script starts both frontend and backend servers

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "🚀 NITA Development Environment"
echo "================================"
echo ""

# Function to kill processes on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    pkill -f "php artisan serve" || true
    pkill -f "vite" || true
    echo "✅ Servers stopped"
}

trap cleanup EXIT

# Start Backend
echo "📡 Starting Backend API on http://192.168.110.2:8000..."
cd "$SCRIPT_DIR/nita-rest-api"
php artisan serve --host=0.0.0.0 --port=8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start Frontend
echo "🎨 Starting Frontend on http://192.168.110.2:5174..."
cd "$SCRIPT_DIR/nita-gui"
npm run dev -- --host 0.0.0.0 --port 5174 &
FRONTEND_PID=$!

echo ""
echo "✅ Servers are running!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 Access the application:"
echo ""
echo "Option 1 - Direct Access (Development, no HTTPS):"
echo "  Frontend: http://192.168.110.2:5174"
echo "  Backend:  http://192.168.110.2:8000/api"
echo ""
echo "Option 2 - Using Nginx Reverse Proxy (Production-like, with HTTPS):"
echo "  Frontend & API: https://192.168.110.2"
echo "  (Set up nginx using the provided nginx.conf)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for both processes
wait
