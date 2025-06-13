#!/bin/bash

set -e

echo "📁 Ensuring all important dotfiles are staged..."
git checkout nightly
git add -f .env.nightly .env.production .github .husky .vscode .npmrc .trigger .versionrc
git commit -m "chore: ensure dotfiles are included in merge" || echo "⚠️ No dotfile changes to commit"

echo "🔄 Pushing latest commits from nightly..."
git checkout nightly
git push origin nightly

echo "🚀 Switching to main branch..."
git checkout main

echo "📦 Merging nightly into main..."
git merge nightly --no-ff -m "release: merge nightly into main for v3.7.0"

echo "📤 Pushing merged main to GitHub..."
git push origin main

echo "📌 Running version bump and tagging release (minor)..."
npx standard-version --release-as minor

echo "📤 Pushing tags to GitHub..."
git push --follow-tags

echo "✅ Done! GitHub and Discord releases will trigger automatically."