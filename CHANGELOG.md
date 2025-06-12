# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [3.6.3-nightly.1](https://github.com/thef4tdaddy/chastityOS/compare/v3.6.3-nightly.0...v3.6.3-nightly.1) (2025-06-12)


### 🧹 Chores

* adding a conventional commits doc ([a324a95](https://github.com/thef4tdaddy/chastityOS/commit/a324a95b998b6e0c3318ece1dcce5da33b752bc8))
* adding more Github Actions, documentation ([0343dac](https://github.com/thef4tdaddy/chastityOS/commit/0343dacbb1f4478bcf3f4afcd8d338d19c1bbaa4))

### [3.6.3-nightly.0](https://github.com/thef4tdaddy/chastityOS/compare/v3.6.1...v3.6.3-nightly.0) (2025-06-12)

### [3.6.2](https://github.com/thef4tdaddy/chastityOS/compare/v3.6.1...v3.6.2) (2025-06-12)

### 3.6.1 (2025-06-12)


### Features

* PWA update notification + fix ([0f0c010](https://github.com/thef4tdaddy/chastityOS/commit/0f0c010e47c0665750b58f6be29c3de86cd59844))
* update FeedbackForm, App.jsx, and SettingsPage with GTM tracking and Ko-fi link ([f8fef70](https://github.com/thef4tdaddy/chastityOS/commit/f8fef70375a00e63197cf2899f45fd60c13d01ca))

# ChastityOS Changelog

All notable changes to this project will be documented in this file.


## [3.5] - June 7, 2025

### Added
- 🔐 Support for Google Sign-In alongside default anonymous auth
- 🚪 Logout and Google disconnect options, including full data deletion
- 👁️ Visual indicator in footer showing active Google login email
- 🧹 Confirmation modal for data reset when disconnecting Google
- 🧩 Compartmentalized account settings into clearer state-managed sections

### Changed
- 🧼 Cleaned up auth handling logic and ensured anonymous remains default
- 📤 Settings page logic now conditionally shows relevant buttons based on auth state

## v3.4.4 - June 5, 2025

- **✨ PWA Enhancements**:
  - Integrated `vite-plugin-pwa` to make ChastityOS installable as a Progressive Web App.
  - Enabled auto-updates for the PWA and automatic registration of the service worker.
  - Configured Workbox for offline capabilities, including precaching of essential app assets (`js,css,html,ico,png,svg,json,vue,txt,woff2`).
  - Implemented runtime caching strategies (NetworkFirst) for Firestore API calls and Google Tag Manager to ensure functionality and data freshness while offline or on slow networks.
  - Added a comprehensive web app manifest (`manifest.json`) including app name, short name, FLR-themed description, theme colors, background color, display mode, scope, start URL, and various icon sizes (including a maskable icon).
  - Included mobile and desktop screenshots in the manifest for an enhanced PWA installation experience.
- **💾 JSON Backup & Restore**:
  - Implemented functionality to export all application data (including chastity history, sexual events, settings, and current session state) to a downloadable JSON file from the Settings page.
  - Added the ability to import data from a JSON backup file via the Settings page, which overwrites existing data after user confirmation, ensuring data integrity by preserving original event IDs where possible.
- **⏱️ Timer Display Update**:
  - Modified the `formatElapsedTime` utility to display durations in days, hours, minutes, and seconds (e.g., "1d 05h 30m 15s") when the total duration is 24 hours or more. For durations less than 24 hours, it displays hours, minutes, and seconds (e.g., "12h 00m 00s").

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