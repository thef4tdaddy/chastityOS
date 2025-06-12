#!/bin/bash

# Get current Git branch manually
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "🛠 Branch: $BRANCH"

if [ "$BRANCH" = "nightly" ]; then
  echo "🔧 Running nightly build"
  npm run build:nightly
else
  echo "⛔ Production build blocked temporarily. Remove this message in 24 hours to allow production deployment."
  exit 1
fi