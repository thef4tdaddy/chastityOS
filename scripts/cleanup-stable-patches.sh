#!/bin/bash
# A modernized script to consolidate multiple stable patch releases into a single release.
# It keeps the *earliest* release in a time window and merges notes from newer ones into it.

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
# The GitHub repository in the format "owner/repo".
REPO="thef4tdaddy/chastityOS"
# The time window to check for releases.
SINCE=$(date -u --date='8 hours ago' +"%Y-%m-%dT%H:%M:%SZ")

echo "🧹 Starting stable release cleanup for repository: $REPO"
echo "🔍 Searching for patch releases (e.g., X.Y.Z) since: $SINCE"

# --- Main Logic ---
# Use a single jq command to:
# 1. Filter releases created after the SINCE timestamp.
# 2. Select only releases whose tags look like semantic versions (e.g., 1.2.3).
# 3. Sort them by creation date (oldest to newest).
# 4. Separate the first release (the base to keep) from the subsequent ones (to delete).
# 5. Output a single JSON object containing `base_release` and an array `tags_to_delete`.
release_data=$(gh api "repos/$REPO/releases" --jq '
  [ .[] | select(.created_at > "'"$SINCE"'") | select(.tag_name | test("^\\d+\\.\\d+\\.\\d+$")) ]
  | sort_by(.created_at)
  | {
      base_release: .[0],
      tags_to_delete: .[1:]
    }
')

# Extract the base release and the tags to delete from the JSON object.
base_release_json=$(echo "$release_data" | jq -c '.base_release')
tags_to_delete_json=$(echo "$release_data" | jq -c '.tags_to_delete[]')

# Check if there is anything to do.
if [ "$(echo "$base_release_json" | jq -r '.tag_name')" == "null" ]; then
  echo "✅ No recent patch releases found to clean up."
  exit 0
fi

if [ -z "$tags_to_delete_json" ]; then
  echo "✅ Only one patch release found. Nothing to consolidate."
  exit 0
fi

base_tag=$(echo "$base_release_json" | jq -r '.tag_name')
existing_notes=$(echo "$base_release_json" | jq -r '.body')
notes_to_merge=""

echo "✅ Keeping the base patch release: $base_tag"

# Loop through the releases marked for deletion.
while IFS= read -r release; do
  tag_to_delete=$(echo "$release" | jq -r '.tag_name')
  body_to_merge=$(echo "$release" | jq -r '.body')

  echo "🗑 Consolidating and deleting patch release: $tag_to_delete"

  # Append the release notes for merging later.
  notes_to_merge+="\n\n--- (Notes from consolidated release: $tag_to_delete) ---\n$body_to_merge"

  # Delete the GitHub release and the git tag in one go.
  gh release delete "$tag_to_delete" --yes --cleanup-tag
  echo "🔥 Release and tag '$tag_to_delete' have been deleted."

done <<< "$tags_to_delete_json"

# If there were notes from deleted releases, merge them into the base release.
if [ -n "$notes_to_merge" ]; then
  echo "📝 Merging all collected release notes into $base_tag..."
  # Append the merged notes to the existing notes of the base release.
  gh release edit "$base_tag" --notes "$existing_notes$notes_to_merge"
fi

echo "✨ Stable release cleanup complete."