

#!/bin/bash

# Script to pull environment variables from Vercel for both production and nightly (preview)
# Requires `npx` and Vercel CLI access (will prompt login if needed)

echo "🔐 Pulling .env.production from Vercel (Production environment)..."
npx vercel env pull .env.production --environment=production --yes

echo "🌒 Pulling .env.nightly from Vercel (Preview/Nightly environment)..."
npx vercel env pull .env.nightly --environment=preview --yes

echo "✅ Done pulling environment variables."