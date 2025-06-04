# Changelog

All notable changes to this project will be documented in this file.

## [v3.4.1] - 2025-05-31

### Added
- **Google Analytics Integration:**
    - Integrated Google Analytics 4 (GA4) for basic page view tracking.
    - Added `VITE_GA_MEASUREMENT_ID` to environment variables for GA configuration.
    - Included `gtag.js` script in `index.html`.
    - Implemented GA initialization and dynamic page view event sending in `App.jsx`.

### Changed
- Footer version updated to "v3.4.1".
- Application title in `App.jsx` updated to "ChastityOS (v3.4.1 - Release)".

---

## [v3.4 Nightly] - 2025-05-30

### Added
- **Restore Data from User ID (Settings Page):**
    - Added an input field in Settings to enter a User ID from which to restore data.
    - Implemented a confirmation modal to warn users that this action will overwrite their current data.
    - Added logic to fetch data from the specified User ID and replace the current user's data in Firestore.
    - `applyLoadedData` function in `App.jsx` refactored to handle data application for both initial load and this new restore feature.
    - New state and handlers in `App.jsx` (`restoreUserIdInput`, `showRestoreFromIdPrompt`, `handleConfirmRestoreFromId`, etc.) to manage this feature.
    - UI elements for this feature added to `SettingsPage.jsx`.

### Changed
- Main application code title updated to reflect "v3.4 Nightly".
- Footer version updated to "v3.4 Nightly".

---

## [v3.3.1] - 2025-05-30
*(Based on our previous milestone "ChastityOS (Milestone 3.3 - Stable & Refined)")*

### Added
- **App Branding:**
    - Application officially named "ChastityOS".
    - "ChastityOS" title displayed prominently at the top of the application.
    - Copyright notice in the footer updated to include "v3.3.1".
- **UI & Navigation Enhancements:**
    - Navigation button "Tracker" renamed to "Chastity Tracker".
    - "Chastity Tracker" page now has its own `<h2>` title.
    - Navigation order updated: "Log Event" now appears before "Full Report".
    - Page titles for "Full Report", "Log Event", and "Settings" are now rendered consistently outside their main content boxes (managed in `App.jsx`).
- **Conditional User ID Display:**
    - In the "Full Report" page, the User ID is now only displayed if a "Submissive's Name" has not been set.

### Changed
- **Code Structure & Performance:**
    - Implemented code-splitting for page components (`TrackerPage`, `FullReportPage`, `LogEventPage`, `SettingsPage`) using `React.lazy()` and `<React.Suspense>` to improve initial application load times. Page components were moved to separate files (e.g., `src/pages/`).
    - Utility functions (`formatTime`, `formatElapsedTime`, `EVENT_TYPES`, `padString`) centralized into a new `src/utils.js` file and imported where needed.

### Fixed
- Resolved a `TypeError` related to `submissivesNameInput.trim()` by ensuring a string fallback for `submissivesNameInput` in input fields and disabled conditions (though the primary fix was likely ensuring the prop was consistently a string).

---
*(Older milestones like 3.2 and 3.1 are documented in the main README.md's Version History section for now, but could be moved here for a more complete changelog).*