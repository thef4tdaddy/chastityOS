# ChastityOS

## Overview

ChastityOS is a web application designed to help users track time spent in chastity, log various sexual and FLR-related events, and manage session pauses. It provides a dashboard for current session statistics, a comprehensive history log, and tools for data export. The application uses Firebase for backend data storage and authentication, and is built with React and Tailwind CSS.

## Key Features

* **Chastity Session Tracking:**
    * Start and end chastity sessions.
    * Live timer for the current session in chastity.
    * Live timer for the current duration the cage has been off (between sessions, after a session has been active).
    * Record reasons for cage removal.
* **Pause Functionality:**
    * Pause an active chastity session with an optional reason.
    * Live display of the current pause duration.
    * Accumulates total paused time for the current session.
    * 12-hour cooldown period between initiating pauses.
* **Restore Session:**
    * If the app is closed during an active session, users are prompted to restore the previous session or start a new one upon reopening.
* **Neutral Start State:**
    * The app starts in a "Cage Off" state with no timers running until a session is explicitly started or restored and then ended.
* **Event Logging:**
    * Log various types of sexual and FLR-related events (e.g., Orgasm (Self/Partner), Ruined Orgasm, Edging, Tease & Denial, Play Session, Hygiene, Medication, Mood Entry, Other).
    * Record date, time, duration, orgasm counts (differentiated for self/partner), and notes for each event.
* **Reporting & History:**
    * **Chastity Tracker Page:** Displays current session timers, total chastity time, and total cage off time. Page title "Chastity Tracker".
    * **Full Report Page:**
        * Shows current status (cage on/off, paused state, current session times).
        * Displays overall totals for time in chastity, time cage off, and total paused time across all sessions.
        * Detailed table of chastity history (start/end times, raw duration, pause duration, effective chastity duration, reason for removal).
        * Detailed log of all sexual events.
        * User ID displayed only if Submissive's Name is not set.
* **Data Management & Export:**
    * **Settings Page:**
        * Set a Submissive's Name for personalized display.
        * Toggle visibility of the User ID.
        * Restore data from a known User ID (overwrites current user's data after confirmation).
        * Export Chastity History to CSV.
        * Export Sexual Events Log to CSV.
        * Export a Verbose Text Report (.txt) containing all tracker and event data.
        * Reset all application data (with confirmation).
* **User Authentication:**
    * Anonymous Firebase authentication to persist data per user.
* **Analytics:**
    * Google Analytics 4 (GA4) integration for basic page view tracking.
* **UI & Styling:**
    * Main application title "ChastityOS" displayed.
    * Copyright notice in the footer with version number.
    * Navigation includes "Chastity Tracker", "Log Event", "Full Report", "Settings".
    * Page titles displayed consistently.
    * Styled with Tailwind CSS for a responsive user interface.
* **Performance:**
    * Code-splitting implemented for page components using `React.lazy()` and `<React.Suspense>` to improve initial load times.
    * Utility functions centralized in `src/utils.js`.

## Tech Stack

* **Frontend:** React (Vite), Tailwind CSS
* **Backend & Database:** Firebase (Firestore, Firebase Authentication)
* **Analytics:** Google Analytics 4

## Setup and Local Development

To run this project locally:

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Firebase:**
    * Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
    * In your Firebase project, go to **Project settings** > **General**.
    * Under "Your apps", click the "Web" icon (`</>`) to add a web app.
    * Register your app and copy the `firebaseConfig` object.
    * Enable **Anonymous** sign-in: Go to **Authentication** > **Sign-in method** tab, and enable "Anonymous".
    * Set up **Firestore Database**: Go to **Firestore Database**, click "Create database", start in **production mode** (or test mode, but be sure to update security rules later), and choose your server location.

4.  **Create Environment Variables:**
    * In the root of your project, create a file named `.env`.
    * Add your Firebase configuration details to this file, prefixing each key with `VITE_`:
        ```env
        VITE_FIREBASE_API_KEY="YOUR_API_KEY"
        VITE_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
        VITE_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
        VITE_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
        VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
        VITE_FIREBASE_APP_ID="YOUR_APP_ID"
        VITE_FIREBASE_MEASUREMENT_ID="YOUR_MEASUREMENT_ID" # Optional
        VITE_GA_MEASUREMENT_ID="G-YOUR_GA_MEASUREMENT_ID" # For Google Analytics
        ```
    * **Important:** Add `.env` to your `.gitignore` file to avoid committing your secret keys.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running, typically on `http://localhost:5173`.

## Version History (Changelog)

* **v3.4.1** - 2025-05-31
    * Added Google Analytics 4 (GA4) integration for page view tracking.
    * Updated footer version to "v3.4.1".
* **v3.4 Nightly** - 2025-05-30
    * Added "Restore Data from User ID" feature in Settings.
* **v3.3.1** - 2025-05-30
    * App name changed to "ChastityOS".
    * UI enhancements: Main title, copyright with version, navigation updates, consistent page titles.
    * Conditional User ID display in Full Report.
    * Performance: Code-splitting and centralized utilities.
    * Fixed `TypeError` related to `submissivesNameInput`.
* **Milestone 3.2**
    * Implemented "Restore Session Prompt" and "Neutral Start State".
* **Milestone 3.1**
    * Submissive's Name input and User ID display moved to Settings page.
* **(Older versions/features not explicitly versioned here)**

*(For a more detailed changelog, see `CHANGELOG.md`)*

## Future Enhancements (Potential TO-DOs)

* Customization options for Keyholder/Partner (e.g., name, separate event logging).
* More advanced reporting and charting.
* Notifications or reminders.
* Connect account to Google or Apple account (for more robust authentication/recovery).
* (Restore data from a known User ID is now implemented in v3.4)

---

This README provides a good starting point. Feel free to modify and expand it as your project evolves!