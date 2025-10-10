#!/bin/bash
# A simplified nightly release script using standard-version and GitHub CLI.
# This script assumes you are using the Conventional Commits standard for your git messages.

# Exit immediately if a command exits with a non-zero status.
set -e

echo "🚀 Starting nightly release process..."

# 1. Bump version, create changelog, commit, and tag.
# `standard-version` handles all of this based on your commit history.
# The `--prerelease nightly` flag creates a version like `1.2.3-nightly.0`,
# incrementing the last number on each subsequent run.
echo "🔢 Bumping version and generating changelog with standard-version..."
npx standard-version --prerelease nightly

# 2. Get the new version/tag name created by standard-version.
# We use `git describe` to reliably get the most recent tag on the current commit.
NEW_TAG=$(git describe --tags --abbrev=0)
echo "🔖 New tag created: $NEW_TAG"

# 3. Push the new commit and the tag to the remote repository.
# The --follow-tags flag is crucial to ensure the tag created by standard-version is pushed.
echo "⬆️ Pushing commit and tags to origin..."
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push --follow-tags origin "$BRANCH"

# 4. Create a GitHub prerelease.
# The `gh release create` command can automatically generate release notes
# from the commits included in the tag. This is a very powerful feature.
echo "📦 Creating GitHub prerelease for $NEW_TAG..."
gh release create "$NEW_TAG" \
  --title "Nightly: $NEW_TAG" \
  --generate-notes \
  --prerelease

# 5. Run the cleanup script to remove old nightly releases.
# This part of your logic remains the same.
echo "🧹 Cleaning up old nightly releases..."
if [ -f "./scripts/cleanup-nightlies.sh" ]; then
  ./scripts/cleanup-nightlies.sh
else
  echo "⚠️ Cleanup script not found at ./scripts/cleanup-nightlies.sh, skipping."
fi

echo "✅ Nightly release complete for version $NEW_TAG!"