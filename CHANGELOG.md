# ChastityOS Changelog

All notable changes to this project will be documented in this file.

## v3.4.3 - June 5, 2025

- 🔐 **Keyholder Mode Added**:
  - Users can now assign a Keyholder with a name and generated password preview
  - Keyholders can set a required minimum chastity duration
  - Unlockable controls using the password preview (8-char)
  - Visual tracker shows progress toward the Keyholder’s required duration

- 🕓 **Session Start Time Editing**:
  - Active session start time can now be manually updated via Settings
  - Edits are logged as "Session Edit" events in the event log for accountability

- 🔄 **Footer Overhaul**:
  - Dynamic version pulled from GitHub
  - Modal support for Privacy Policy and Feedback submission
  - Includes Ko-fi support link

- 🛡️ **Privacy Modal Added**:
  - Explains anonymous analytics usage: Google Analytics, Tag Manager, and Hotjar
  - Clarifies no identifying data is shared

- 🐛 **Feedback Form Integration**:
  - Users can submit bugs or suggestions
  - Sends to Discord (via webhook) and GitHub (via API) with labels
  - Respects environment config: `VITE_GITHUB_REPO`, `VITE_GITHUB_TOKEN`, `VITE_DISCORD_WEBHOOK_*`

- ⏱️ **Goal Timers**:
  - Real-time progress countdown for personal goals and keyholder-required durations
  - Updated visuals and "goal met" state indicators

## v3.4.2 – 2025-06-01
- Added new logo and favicon.
- Code optimization and cleanup.
- Added GPL v3 full license attribution.

## v3.4.1 – 2025-05-31
- Added Google Analytics 4 (GA4) integration for page view tracking.
- Updated footer version to "v3.4.1".

## v3.4 Nightly – 2025-05-30
- Added "Restore Data from User ID" feature in Settings.

## v3.3.1 – 2025-05-30
- App name changed to "ChastityOS".
- UI enhancements: Main title, copyright with version, navigation updates.
- Performance improvements: Code-splitting and centralized utilities.
- Fixed `TypeError` related to `submissivesNameInput`.

## Milestone 3.2
- Implemented "Restore Session Prompt" and "Neutral Start State".

## Milestone 3.1
- Moved Submissive's Name input and User ID display to Settings page.

*(Older versions/features not explicitly versioned here)*
