#!/bin/bash

set -e

echo "📁 Ensuring all important dotfiles are staged..."
git checkout nightly
dotfiles=(.github .husky .eslintrc .prettierrc .vscode .env .gitignore .npmrc .trigger .versionrc)

for f in "${dotfiles[@]}"; do
  if [ -e "$f" ]; then
    git add -f "$f"
  fi
done
git diff --cached --quiet || git commit -m "chore: ensure dotfiles are included in merge"

if [ -n "$(git status --porcelain release-to-main.sh)" ]; then
  git add release-to-main.sh
  git commit -m "chore: update release script"
fi

echo "🔄 Pushing latest commits from nightly..."
git checkout nightly
git push origin nightly

echo "📥 Stashing any local changes before switching branches..."
git stash push -m "temp-stash-before-main-merge"

echo "🚀 Switching to main branch..."
git checkout main

echo "📦 Merging nightly into main..."
git merge nightly --no-ff -m "release: merge nightly into main for v3.7.0"

echo "📤 Pushing merged main to GitHub..."
git push origin main

echo "📤 Restoring local changes from stash..."
git stash pop || true

echo "📌 Running version bump and tagging release (minor)..."
npx standard-version --release-as minor

echo "📤 Pushing tags to GitHub..."
git push --follow-tags

echo "✅ Done! GitHub and Discord releases will trigger automatically."