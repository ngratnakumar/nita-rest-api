#!/bin/bash

# Start NITA Frontend Server
echo "🚀 Starting NITA Frontend Server..."
echo "Frontend will be available at: https://192.168.110.2:5174 (dev server)"
echo "Or via nginx reverse proxy: https://ww2.ncra.tifr.res.in"
echo ""
echo "Note: Make sure the backend server is running on http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd /home/ratnakumar/NITA/nita-gui
npm run dev
