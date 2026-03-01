#!/bin/bash

# Configuration
WEB_DIR="/var/www/nita-gui"
BACKEND_DIR="/home/ratnakumar/NITA/nita-rest-api"
GUI_DIR="/home/ratnakumar/NITA/nita-gui"
BACKUP_DIR="/home/ratnakumar/NITA/backups"

echo "🚀 Starting NITA Deployment..."

# 0. Create Backup of Icons (Safety first)
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/icons_backup_$(date +%Y%m%d).tar.gz -C $BACKUP_DIR/../nita-rest-api/storage/app/public icons 2>/dev/null || echo "⚠️ No icons found to backup."

# 1. Build Frontend
cd $GUI_DIR
echo "📦 Building React Frontend..."
npm run build

# 2. Optimize Backend (Run this BEFORE changing ownership to www-data)
cd $BACKEND_DIR
echo "⚡ Optimizing Backend..."
# We use sudo -u ratnakumar to ensure the current user can write the cache files
php artisan config:clear
php artisan route:clear
php artisan config:cache
php artisan route:cache

# 3. Move Frontend files to Web Directory
echo "📂 Moving files to $WEB_DIR..."
sudo rm -rf $WEB_DIR/*
sudo cp -r $GUI_DIR/dist/* $WEB_DIR/

# 4. Final Permission Handover
echo "🔐 Setting permissions for www-data..."
sudo chown -R www-data:www-data $WEB_DIR
sudo chown -R www-data:www-data $BACKEND_DIR/storage
sudo chown -R www-data:www-data $BACKEND_DIR/bootstrap/cache
sudo chmod -R 775 $BACKEND_DIR/storage $BACKEND_DIR/bootstrap/cache

echo "✅ Deployment Complete! Visit https://ww2.ncra.tifr.res.in"