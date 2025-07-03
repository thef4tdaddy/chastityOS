# ChastityOS: The Complete How-To Guide

Welcome to ChastityOS, your all-in-one web app for chastity tracking, task management, and fostering dynamics between a submissive and a Keyholder. This guide will walk you through all the features of the application.

---

## 1. Getting Started

### Initial Setup & Accounts
When you first use ChastityOS, you are assigned an anonymous account. Your data is stored locally on your device. To sync your data across multiple devices and prevent data loss, it's highly recommended to link a Google Account.

* **To Link a Google Account:** Go to `Profile & Preferences` > `Profile & Account` and click "Sign In with Google".
* **Data Migration:** If you sign in with Google after using an anonymous account, your data will be automatically migrated to your new Google-linked account.
* **User ID:** Your anonymous User ID can be found in the settings. You can use this to restore your data on a new device if you haven't linked a Google account.

Upon first use, you will be greeted by a welcome modal explaining that the app is for consenting adults (18+) and that one account is shared between the submissive and Keyholder. You must also accept the Terms & Disclaimer.

---

## 2. For the Submissive (Wearer)

### The Main Tracker Page (`Chastity Tracker`)
This is your main dashboard for tracking your chastity session.

* **Starting/Stopping a Session:** Use the big button to "Cage On / Start Session" or "Cage Off / End Session".
* **Pausing/Resuming:** While a session is active, you can "Pause Session". When paused, you can "Resume Session". You may need to provide a reason for pausing. There is a 12-hour cooldown period between pauses to prevent misuse.
* **Timers:** The page displays several timers:
    * _Cage On Since:_ The exact date and time your current session started.
    * _Current Session In Chastity:_ The effective time you've been locked, minus any paused time.
    * _Current Session Cage Off:_ The time elapsed since you ended your last session.
    * _Total Time In Chastity / Cage Off:_ Your all-time totals across all sessions.
* **Emergency Unlock:** If you have set a "Hardcore Goal", the "Cage Off" button is replaced with an "Emergency Unlock" button, which requires a backup code to use.

### Logging Events & Arousal (`Log Event`)
This page allows you to keep a detailed diary of your activities.

* **Log an Event:** You can log various activities such as "Orgasm (Self)", "Ruined Orgasm", "Hygiene", "Medication", and more. You can specify the date, time, duration, and add optional notes.
* **Log Arousal Level:** You can log your arousal level on a scale of 1-10, with optional notes. This data is used to generate a chart of your arousal history. You can only log your arousal level once every 8 hours.
* **Display Modes:** You can switch between "Kinky" and "Vanilla" display modes in the settings. "Vanilla" mode will hide kinky-related event types from the log for a more discreet view.

### Tasks & Rewards (`Tasks` and `Rewards/Punishments`)
These pages help you manage tasks assigned by your Keyholder.

* **Viewing Tasks:** The `Tasks` page shows your pending tasks, tasks awaiting review, and an archive of approved or rejected tasks. For each pending task, you can see the description, deadline, and any associated reward or punishment.
* **Submitting Tasks:** Once you've completed a task, you can add an optional note and click "Submit for Review". Tasks with a past deadline will be submitted automatically.
* **History:** The `Rewards & Punishments` page shows a complete history of all rewards (like time removed from your sentence) and punishments (like time added) that you have received, either manually from your Keyholder or from completing tasks.

### Rules (`Rules`)
This page displays the list of rules your Keyholder has set for you. The rules are displayed in a read-only format.

### Reporting (`Full Report`)
This page gives a comprehensive overview of your entire chastity history.

* **Current Status & Totals:** A summary of your current session and all-time totals.
* **Arousal History:** A chart showing your logged arousal levels over a selectable period (1-30 days).
* **Chastity History Table:** A detailed log of all past sessions, including start/end times, durations, paused time, and the reason for removal.
* **Sexual Events Log:** A table of all events you have logged.

### Settings & Profile (`Profile & Preferences`)
This is where you manage your profile and application settings.

* **Set Your Name:** You can set or change your display name here.
* **Personal Goal:** You can set a personal chastity goal in days.
    * **Hardcore Mode:** For a greater challenge, you can enable "Hardcore Mode". This disables the "Cage Off" button until your goal is met. You are given a one-time backup code that is required for an emergency unlock.
    * **Keyholder Lock:** You cannot set a personal goal if a Keyholder lock is already active.
* **Public Profile:** You can enable a public profile to share your stats with others. You have granular control over which sections (e.g., current status, chastity history, arousal chart) are visible to the public.
* **Data Management:** You can export your data to a text file or CSV, or create a full JSON backup. You can also import a JSON backup to restore your data or reset all application data entirely.

---

## 3. For the Keyholder

### The Keyholder Dashboard (`Keyholder`)
This is the central hub for all Keyholder controls.

* **Initial Setup:** The first time you access this page, you'll be prompted to set a Keyholder name. The app will then generate a temporary password for you. It is highly recommended to immediately set a new, permanent password.
* **Unlocking Controls:** To access the Keyholder controls, you must enter the correct password. Once unlocked, you have full access to manage the submissive's session. For security, the controls automatically lock again when you navigate away from the Keyholder page.

### Managing the Lock
Once unlocked, you have several options for managing the lock:

* **Set Required Duration:** You can set a minimum time (in days) that the submissive must remain in chastity. This will be displayed on the main tracker page, along with a countdown.
* **Manual Rewards/Punishments:** You can manually add or remove time from the submissive's sentence as a reward or punishment.
* **Manage Rules:** You can set and edit the rules for your submissive, which will be displayed on their `Rules` page. The editor supports Markdown for formatting.

### Managing Tasks
The Keyholder has full control over the submissive's tasks.

* **Assigning Tasks:** Use the form to create new tasks. You can specify:
    * A deadline for completion.
    * A recurrence schedule (e.g., every 3 days).
    * A reward (time removed or a custom note) for successful completion.
    * A punishment (time added or a custom note) for failure.
* **Task Approval:** When a submissive completes a task, it appears in the "Tasks Awaiting Approval" section. You can see any notes they left and choose to **Approve** or **Reject** the task. Approving or rejecting a task automatically applies the associated reward or punishment.

### Release Requests
If a Keyholder lock is active, the submissive's "Cage Off" button is replaced with a "Beg for Release" button.

* **Handling Requests:** When the submissive begs for release, a request appears in your dashboard. You have the option to **Grant** or **Deny** the request.
* **Granting:** If you grant the request, the submissive's session is immediately ended.
* **Denying:** If you deny the request, the submissive is notified and cannot beg again for 4 hours.