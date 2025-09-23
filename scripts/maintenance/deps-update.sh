#!/bin/bash
# Safe dependency update script with backup and rollback capability

set -e

echo "🔍 Checking for dependency updates..."

# Create backup of package files
echo "📦 Creating backup of package files..."
cp package.json package.json.backup
cp package-lock.json package-lock.json.backup

# Check what would be updated
echo "📋 Showing outdated packages:"
npm outdated || echo "All packages are up to date!"

echo ""
read -p "❓ Continue with updates? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Update cancelled"
    rm -f package*.backup
    exit 0
fi

# Perform updates
echo "⬆️ Updating dependencies..."
npm update

# Run security audit
echo "🔒 Running security audit..."
npm audit fix --force || echo "⚠️ Some audit issues could not be auto-fixed"

# Test that everything still works
echo "🧪 Testing builds after update..."
npm run lint || {
    echo "❌ Lint failed after update, rolling back..."
    mv package.json.backup package.json
    mv package-lock.json.backup package-lock.json
    npm install
    exit 1
}

npm run build:nightly || {
    echo "❌ Build failed after update, rolling back..."
    mv package.json.backup package.json
    mv package-lock.json.backup package-lock.json
    npm install
    exit 1
}

# Clean up backup files
rm -f package*.backup

echo "✅ Dependencies updated successfully!"
echo "📝 Consider committing these changes: git add package*.json && git commit -m 'chore: update dependencies'"