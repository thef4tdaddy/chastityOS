#!/bin/bash
# Comprehensive build cleanup script

set -e

echo "🧹 Starting comprehensive cleanup..."

# Clean build outputs
echo "📁 Removing build outputs..."
rm -rf dist/
rm -rf build/

# Clean Vite cache
echo "⚡ Removing Vite cache..."
rm -rf node_modules/.vite/

# Clean other caches
echo "🗂️ Removing other caches..."
rm -rf .parcel-cache/
rm -rf .cache/

# Clean coverage reports (when we have tests)
echo "📊 Removing coverage reports..."
rm -rf coverage/

# Clean log files
echo "📝 Removing log files..."
rm -f *.log
rm -f npm-debug.log*
rm -f yarn-debug.log*
rm -f yarn-error.log*

# Optional: Clean node_modules (with confirmation)
echo ""
read -p "❓ Also remove node_modules? This will require 'npm install' afterward (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Removing node_modules..."
    rm -rf node_modules/
    echo "🔄 Run 'npm install' to restore dependencies"
fi

echo "✅ Cleanup complete!"