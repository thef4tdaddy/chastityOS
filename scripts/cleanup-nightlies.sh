#!/bin/bash
# A modernized script to clean up old nightly GitHub releases and merge their notes.
# This version is compatible with both macOS and Linux date commands.

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
# The GitHub repository in the format "owner/repo".
REPO="thef4tdaddy/chastityOS"

# --- Date Calculation (OS Agnostic) ---
# Determine the operating system to use the correct date command.
if [[ "$(uname)" == "Darwin" ]]; then
  # macOS/BSD date command
  SINCE=$(date -u -v-23H +"%Y-%m-%dT%H:%M:%SZ")
else
  # Linux/GNU date command
  SINCE=$(date -u --date='23 hours ago' +"%Y-%m-%dT%H:%M:%SZ")
fi

echo "🧹 Starting nightly cleanup for repository: $REPO"
echo "🔍 Searching for nightly releases since: $SINCE"


# --- Main Logic ---
# Use a single jq command to:
# 1. Filter releases created after the SINCE timestamp and that are nightlies.
# 2. Sort them by creation date (oldest to newest).
# 3. Separate the last release (the one to keep) from the previous ones (to delete).
# 4. Output a single JSON object containing `latest_tag` and an array `tags_to_delete`.
release_data=$(gh api "repos/$REPO/releases" --jq '
  [ .[] | select(.created_at > "'"$SINCE"'") | select(.tag_name | contains("nightly")) ]
  | sort_by(.created_at)
  | {
      latest_tag: .[-1],
      tags_to_delete: .[:-1]
    }
')

# Extract the tags to delete and the latest tag from the JSON object.
tags_to_delete_json=$(echo "$release_data" | jq -c '.tags_to_delete[]')
latest_tag_json=$(echo "$release_data" | jq -c '.latest_tag')

# Check if there is anything to do.
if [ "$(echo "$latest_tag_json" | jq -r '.tag_name')" == "null" ]; then
  echo "✅ No recent nightly releases found to clean up."
  exit 0
fi

if [ -z "$tags_to_delete_json" ]; then
  echo "✅ Only one nightly release found. Nothing to clean up."
  exit 0
fi

latest_tag=$(echo "$latest_tag_json" | jq -r '.tag_name')
existing_notes=$(echo "$latest_tag_json" | jq -r '.body')
notes_to_merge=""

echo "✅ Keeping the latest nightly release: $latest_tag"

# Loop through the releases marked for deletion.
while IFS= read -r release; do
  tag_to_delete=$(echo "$release" | jq -r '.tag_name')
  body_to_merge=$(echo "$release" | jq -r '.body')

  echo "🗑 Deleting older nightly release: $tag_to_delete"

  # Append the release notes for merging later.
  notes_to_merge+="\n\n--- (Notes from previously deleted release: $tag_to_delete) ---\n$body_to_merge"

  # Delete the GitHub release and the git tag.
  gh release delete "$tag_to_delete" --yes --cleanup-tag
  echo "🔥 Release and tag '$tag_to_delete' have been deleted."

done <<< "$tags_to_delete_json"

# If there were notes from deleted releases, merge them into the latest release.
if [ -n "$notes_to_merge" ]; then
  echo "📝 Merging release notes into $latest_tag..."
  # Append the merged notes to the existing notes of the latest release.
  gh release edit "$latest_tag" --notes "$existing_notes$notes_to_merge"
fi

echo "✨ Nightly cleanup complete."
