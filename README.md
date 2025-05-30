# ChastityOS

## Overview

ChastityOS is a web application designed to help users track time spent in chastity, log various sexual and FLR-related events, and manage session pauses. It provides a dashboard for current session statistics, a comprehensive history log, and tools for data export. The application uses Firebase for backend data storage and authentication, and is built with React and Tailwind CSS.

## Key Features

* **Chastity Session Tracking:**
    * Start and end chastity sessions.
    * Live timer for the current session in chastity.
    * Live timer for the current duration the cage has been off (between sessions).
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
        * Export Chastity History to CSV.
        * Export Sexual Events Log to CSV.
        * Export a Verbose Text Report (.txt) containing all tracker and event data.
        * Reset all application data (with confirmation).
* **User Authentication:**
    * Anonymous Firebase authentication to persist data per user.
* **UI & Styling:**
    * Main application title "ChastityOS" displayed.
    * Copyright notice in the footer.
    * Navigation includes "Chastity Tracker", "Log Event", "Full Report", "Settings" (with "Log Event" and "Full Report" swapped).
    * Page titles displayed consistently.
    * Styled with Tailwind CSS for a responsive user interface.

## Tech Stack

* **Frontend:** React (Vite), Tailwind CSS
* **Backend & Database:** Firebase (Firestore, Firebase Authentication)

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
        ```
    * **Important:** Add `.env` to your `.gitignore` file to avoid committing your secret keys.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running, typically on `http://localhost:5173`.

## Version History (Changelog)

* **v3.3 (Current - Milestone 3.3)**
    * App name changed to "ChastityOS".
    * "ChastityOS" title added to the top of the app.
    * Copyright notice added to the footer.
    * Navigation: "Tracker" renamed to "Chastity Tracker". "Log Event" and "Full Report" buttons swapped.
    * Page titles made consistent; "Full Report" title moved outside its content box.
    * User ID in "Full Report" is now only shown if no Submissive's Name is set.
* **Milestone 3.2**
    * Implemented "Restore Session Prompt" if an active session is found on app load.
    * Implemented "Neutral Start State": No timers run on first load or after discarding a session, until "Cage On" is pressed.
* **Milestone 3.1 (Previously "Simplified")**
    * Submissive's Name input and User ID display moved from Tracker page to Settings page.
    * Pause feature was not yet implemented in this version.
    * General stability and core features (tracking, event logging, reporting, exports) were functional.
* **(Older versions/features not explicitly versioned here)**

## Future Enhancements (Potential TO-DOs)

* Customization options for Keyholder/Partner (e.g., name, separate event logging).
* More advanced reporting and charting.
* Notifications or reminders.
* Connect account to Google or Apple account (for more robust authentication/recovery).
* Restore data from a known User ID (e.g., for keyholder access or device switch).