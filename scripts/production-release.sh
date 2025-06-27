#!/bin/bash
# An interactive script to create and publish a new major, minor, or patch release.
# It uses standard-version for versioning and can trigger a cleanup script for patches.

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
# The path to your stable release cleanup script.
CLEANUP_SCRIPT="./scripts/cleanup-stable-patches.sh"

# --- Main Logic ---
echo "🚀 This script will guide you through creating a new release."
echo "Please make sure your branch is clean and all changes are committed."
echo ""

# 1. Interactively select the release type.
PS3="Select the type of release you want to create: "
options=("patch" "minor" "major" "cancel")
select opt in "${options[@]}"; do
    case $opt in
        "patch")
            RELEASE_TYPE="patch"
            break
            ;;
        "minor")
            RELEASE_TYPE="minor"
            break
            ;;
        "major")
            RELEASE_TYPE="major"
            break
            ;;
        "cancel")
            echo "👋 Release process cancelled."
            exit 0
            ;;
        *) echo "Invalid option $REPLY";;
    esac
done

echo "✅ Releasing as: $RELEASE_TYPE"

# 2. Bump version, create changelog, commit, and tag using standard-version.
echo "🔢 Bumping version and generating changelog..."
npx standard-version --release-as "$RELEASE_TYPE"

# 3. Get the new version/tag name created by standard-version.
NEW_TAG=$(git describe --tags --abbrev=0)
echo "🔖 New tag created: $NEW_TAG"

# 4. Push the new commit and the tag to the remote repository.
echo "⬆️ Pushing commit and tag to origin..."
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push --follow-tags origin "$BRANCH"

# 5. Create a standard GitHub release with auto-generated notes.
echo "📦 Creating GitHub release for $NEW_TAG..."
gh release create "$NEW_TAG" \
  --title "Release: $NEW_TAG" \
  --generate-notes

echo "🎉 Successfully created release $NEW_TAG!"

# 6. Conditionally run the cleanup script if it was a patch release.
if [ "$RELEASE_TYPE" == "patch" ]; then
  echo "🩹 This was a patch release. Running the consolidation script..."
  if [ -f "$CLEANUP_SCRIPT" ]; then
    # The cleanup script will run based on its own time window (e.g., last 8 hours).
    "$CLEANUP_SCRIPT"
  else
    echo "⚠️ Cleanup script not found at $CLEANUP_SCRIPT. Skipping consolidation."
  fi
fi

echo "✨ Release process complete!"