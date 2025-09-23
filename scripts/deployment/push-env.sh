#!/bin/bash

# Authenticate (if not logged in)
vercel login

echo "🔁 Syncing .env.nightly → preview"
while IFS='=' read -r key value || [[ -n "$key" ]]; do
  [[ -z "$key" || "$key" == \#* ]] && continue
  echo "➕ Adding $key to preview"
  echo "$value" | vercel env add "$key" preview --yes
done < .env.nightly

echo "🔁 Syncing .env.production → production"
while IFS='=' read -r key value || [[ -n "$key" ]]; do
  [[ -z "$key" || "$key" == \#* ]] && continue
  echo "➕ Adding $key to production"
  echo "$value" | vercel env add "$key" production --yes
done < .env.production

# Deploy Nightly (Preview)
echo "🚀 Deploying Nightly (Preview)..."
vercel --previews

# Deploy Stable (Production)
echo "🚀 Deploying Stable (Production)..."
vercel --prod