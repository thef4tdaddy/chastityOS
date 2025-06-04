
# ChastityOS

![License: GPL v3](https://img.shields.io/badge/license-GPLv3-blue.svg)

## Overview

ChastityOS is your personal chastity and FLR (Female-Led Relationship) tracking web application.  
It helps users track time spent in chastity, log sexual and FLR-related events, manage session pauses, and view detailed reports.  
Built for both desktop and mobile, ChastityOS was designed with feedback from the community.

## Screenshots

Here’s a preview of ChastityOS in action:

![Chastity Tracker Screenshot](https://chastity-os-landing-page.vercel.app/screenshots/tracker.png)

![Full Report Screenshot](https://chastity-os-landing-page.vercel.app/screenshots/fullreport.png)

![Settings Page Screenshot](https://chastity-os-landing-page.vercel.app/screenshots/settings.png)

## Key Features

* **Chastity Session Tracking**
  * Start and end sessions.
  * Live timers for time in chastity and time cage off.
  * Record reasons for cage removal.

* **Pause Functionality**
  * Pause an active session with reason.
  * Live display of pause duration.
  * 12-hour cooldown between pauses.

* **Restore Session**
  * Prompt to restore a session if the app was closed.

* **Neutral Start**
  * App starts in a “Cage Off” state until manually started.

* **Event Logging**
  * Log events like Orgasm, Edging, Tease & Denial, Hygiene, Mood, etc.
  * Include time, duration, orgasm counts, and notes.

* **Reporting & History**
  * View detailed reports on sessions and events.
  * Export history as CSV or text.

* **Data Management**
  * Export or reset all data.
  * Restore data from a known User ID.

* **Authentication**
  * Anonymous Firebase authentication.

* **Analytics**
  * Google Analytics 4 integration.

* **Responsive UI**
  * Designed with Tailwind CSS for mobile and desktop.

## Tech Stack

* **Frontend:** React (Vite), Tailwind CSS  
* **Backend:** Firebase Firestore, Firebase Authentication  
* **Analytics:** Google Analytics 4

## Setup and Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd <repository-name>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   * Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
   * Add a Web App, copy the `firebaseConfig` object.
   * Enable **Anonymous** sign-in.
   * Set up **Firestore Database**.

4. **Create Environment Variables**
   * In the root, create a `.env` file:
     ```env
     VITE_FIREBASE_API_KEY="YOUR_API_KEY"
     VITE_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
     VITE_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
     VITE_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
     VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
     VITE_FIREBASE_APP_ID="YOUR_APP_ID"
     VITE_FIREBASE_MEASUREMENT_ID="YOUR_MEASUREMENT_ID"
     VITE_GA_MEASUREMENT_ID="G-YOUR_GA_MEASUREMENT_ID"
     ```
   * **Important:** Add `.env` to `.gitignore`.

5. **Run the development server**
   ```bash
   npm run dev
   ```
   The app will typically run on `http://localhost:5173`.

## Version History (Changelog)

* **v3.4.1** – 2025-05-31  
  Added Google Analytics 4 tracking.

* **v3.4 Nightly** – 2025-05-30  
  Added “Restore Data from User ID” feature.

* **v3.3.1** – 2025-05-30  
  App renamed to ChastityOS, UI enhancements, performance improvements.

*(For older versions, see `CHANGELOG.md`.)*

## Future Enhancements

* Customization options for Keyholder/Partner.
* Advanced reporting and charting.
* Notifications or reminders.
* Google/Apple account connections.

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0).

You are free to use, modify, and distribute this software, but any derivative works must also be released under the same license.

For full details, see the [LICENSE](LICENSE) file or visit [https://www.gnu.org/licenses/gpl-3.0.html](https://www.gnu.org/licenses/gpl-3.0.html).

---

**ChastityOS** — built with care, powered by community ideas.
