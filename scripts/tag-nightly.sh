#!/bin/bash
set -e
VERSION=$(node -p "require('./package.json').version")-nightly.$(date +%Y%m%d%H%M)
TAG_MSG="Nightly build $VERSION"
echo "📦 Tagging version: $VERSION"
git tag -a "$VERSION" -m "$TAG_MSG"
git push origin "$VERSION"
echo "🚀 Creating GitHub prerelease..."
gh release create "$VERSION" \
  --title "Nightly Build $VERSION" \
  --notes "Automated nightly build generated on $(date -u)" \
  --prerelease
echo "✅ Done: $VERSION released as prerelease."
