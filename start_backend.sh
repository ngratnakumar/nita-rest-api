#!/bin/bash

# Start NITA Backend Server
echo "🚀 Starting NITA Backend Server..."
echo "Server will be available at: http://localhost:8000"
echo "API endpoint: http://localhost:8000/api"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd /home/ratnakumar/NITA/nita-rest-api
php artisan serve --host=0.0.0.0 --port=8000
