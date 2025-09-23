#!/bin/bash
# generate-today-changelog.sh
# Generates a changelog of all commits from today and prepends to CHANGELOG.md.

set -e

# --- Config ---
CHANGELOG="CHANGELOG.md"
VERSION="3.12.0-nightly.0"
TODAY=$(date +%F)

echo "📆 Generating changelog for $TODAY"

# --- Get commits ---
COMMITS=$(git log --since="$TODAY 00:00" --until="$TODAY 23:59" --pretty=format:"* %s (%h)%n%n%b%n")

if [ -z "$COMMITS" ]; then
  echo "✅ No commits found for today."
  exit 0
fi

# --- Prepare new changelog section ---
NEW_SECTION="## [$VERSION] - $TODAY

$COMMITS
"

# --- Prepend to CHANGELOG.md ---
if [ -f "$CHANGELOG" ]; then
  echo "📝 Prepending to existing $CHANGELOG..."
  TMP_FILE=$(mktemp)
  echo "$NEW_SECTION" > "$TMP_FILE"
  cat "$CHANGELOG" >> "$TMP_FILE"
  mv "$TMP_FILE" "$CHANGELOG"
else
  echo "📝 Creating new $CHANGELOG..."
  echo "$NEW_SECTION" > "$CHANGELOG"
fi

echo "✅ Changelog updated with version $VERSION."

git add "$CHANGELOG"
git commit -m "chore: update changelog for version bump"
git push origin HEAD