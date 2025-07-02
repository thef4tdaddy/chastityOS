#!/bin/bash
# A script to safely merge the nightly branch into main and create a new stable release.

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
MAIN_BRANCH="main"
NIGHTLY_BRANCH="nightly"

# --- Pre-flight Checks ---
echo "🚀 Starting nightly promotion to stable release."

# 1. Check for uncommitted changes.
if ! git diff-index --quiet HEAD --; then
    echo "❌ Error: You have uncommitted changes. Please commit or stash them before running this script."
    exit 1
fi

# 2. Ensure we are on the main branch.
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "$MAIN_BRANCH" ]; then
    echo "❌ Error: You must be on the '$MAIN_BRANCH' branch to run this script."
    echo "Please run 'git checkout $MAIN_BRANCH' first."
    exit 1
fi

echo "✅ Pre-flight checks passed. On branch '$MAIN_BRANCH' with a clean working directory."

# 3. Fetch latest changes from remote to ensure everything is up to date.
echo "⬇️ Fetching latest updates from origin..."
git fetch origin

# 4. Merge the nightly branch.
# We use --no-ff to ensure a merge commit is created for better history tracking.
echo "🔄 Merging '$NIGHTLY_BRANCH' into '$MAIN_BRANCH'..."
git merge "origin/$NIGHTLY_BRANCH" --no-ff -m "feat: Merge nightly branch into main for release"

echo "✅ Merge complete."

# 5. Interactively select the release type for the new stable version.
PS3="Select the type of stable release to create from the merged changes: "
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
            echo "👋 Release process cancelled. The merge commit has been created but not released."
            exit 0
            ;;
        *) echo "Invalid option $REPLY";;
    esac
done

echo "✅ Releasing as a new stable version: $RELEASE_TYPE"

# 6. Use standard-version to bump version, update changelog, commit, and tag.
# This command reads all the commits since the last stable tag (including all from nightly).
echo "🔢 Bumping version and generating new changelog entry..."
npx standard-version --release-as "$RELEASE_TYPE"

# 7. Get the new version tag.
NEW_TAG=$(git describe --tags --abbrev=0)
echo "🔖 New stable tag created: $NEW_TAG"

# 8. Push the merge commit, the release commit, and the new tag.
echo "⬆️ Pushing changes and new tag to origin..."
git push --follow-tags origin "$MAIN_BRANCH"

# 9. Create a final GitHub release with auto-generated notes.
echo "📦 Creating GitHub release for $NEW_TAG..."
gh release create "$NEW_TAG" \
  --title "Release: $NEW_TAG" \
  --generate-notes

echo "🎉 Successfully promoted nightly changes to stable release $NEW_TAG!"
echo "✨ Promotion process complete!"