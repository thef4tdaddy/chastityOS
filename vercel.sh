#!/bin/bash

echo "🛠 Branch: $VERCEL_GIT_COMMIT_REF"

if [ "$VERCEL_GIT_COMMIT_REF" = "nightly" ]; then
  echo "🔧 Running nightly build"
  npm run build:nightly
else
  echo "⛔ Production build blocked temporarily. Remove this message in 24 hours to allow production deployment."
  exit 1
fi