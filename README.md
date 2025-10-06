**Current Version: 4.0.0-nightly.1**

# ChastityOS

ChastityOS is a modern chastity and FLR (Female-Led Relationship) tracking web app designed for self-trackers and keyholders alike. Whether you're logging cage time, orgasms, or enforcing a keyholder's required duration, ChastityOS empowers you with privacy, control, and full visibility.

---

## 🔑 Key Features

### 💠 Chastity Tracker

- Start and end chastity sessions manually
- Live timer and session tracking (including paused state)
- View effective vs total time in chastity (subtracting pauses)

### ⏸ Pause Sessions

- Optional pause mid-session with reason logging
- Built-in cooldown logic to prevent abuse of pause function

### 📆 Edit Session Start Time

- Adjust the start date/time of the current session via Settings
- All changes are logged as "Session Edit" events in your log

### 🧠 Keyholder Mode

- Set a keyholder with a name and secure password preview
- Keyholder can set a required minimum chastity duration
- Locked controls unless the user enters the correct 8-character password preview
- Visual tracker shows progress toward required keyholder time
- "Beg for Release" button replaces manual unlock when a keyholder lock is active
- Denials show a message on the tracker and you must wait 4 hours before begging again

### 🎯 Goal Tracking

- Set a personal chastity goal duration (optional)
- Real-time countdown toward your goal
- Highlights when you meet or exceed your goal

### 📊 Full Report

- Summary of all past sessions: raw time, paused time, effective time, reasons
- Tracker includes goal performance (met/not met)
- Separate log of sexual activity and orgasm stats

### 📝 Sexual Event Logging

- Log orgasms (self or partner), durations, notes, and other events
- Personalize orgasm labels using the Submissive’s and Keyholder’s names

### 🧾 Export Data

- Export full tracker history (.csv)
- Export sexual event log (.csv)
- Generate a full text report for journaling or backup

### ☁️ Import/Export JSON

- Allow users to backup and migrate data manually between devices or browsers via JSON file import/export.

### 📶 Offline Mode

- Works as a PWA with data cached locally
- Changes sync to Firebase automatically once you reconnect

### 🔐 Authentication Options

- Default anonymous sign-in (no setup required)
- Optional upgrade to sign in with Google account
- Once linked to Google, your data syncs automatically and you no longer need to remember your User ID
- Visual indicators in Settings and Footer when signed in with Google
- Ability to disconnect Google and delete all synced data to return to anonymous mode

---

## 🔧 Tech Stack

- **Frontend:** React 19 + Vite 7 + TypeScript (migration in progress)
- **Styling:** Tailwind CSS 4 + Glass Morphism Design System
- **State Management:** TanStack Query (server state) + Zustand (UI state) + React Context (auth/app)
- **Data Layer:** Firebase (cloud) ↔ Dexie (local IndexedDB) ↔ TanStack Query (cache)
- **Backend:** Firebase (Auth + Firestore + Security Rules)
- **Build:** Modern ESM + Rollup bundling + Vite dev server
- **Quality:** ESLint 9 + Prettier + Conventional Commits
- **Testing:** Comprehensive testing framework (coming in Phase 2)
- **CI/CD:** GitHub Actions + Automated deployment + Security scanning

## 🏗️ Architecture

ChastityOS uses a modern, scalable architecture with offline-first data management:

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌────────────────┐
│   Firebase  │◄──►│    Dexie     │◄──►│ TanStack Query  │◄──►│  React Components │
│  (Cloud DB) │    │ (Local DB)   │    │ (Server Cache)  │    │   (UI Only)     │
└─────────────┘    └──────────────┘    └─────────────────┘    └────────────────┘
                                                    ▲
                                                    │
                                              ┌─────────────┐
                                              │   Zustand   │
                                              │ (UI State)  │
                                              └─────────────┘
```

- **Firebase:** Source of truth, cloud sync, real-time updates
- **Dexie:** Offline storage, fast local queries, automatic sync
- **TanStack Query:** Server state caching, optimistic updates, background sync
- **Zustand:** UI state only (modals, forms, preferences)
- **React Context:** Auth state, app-level state
- **Services Layer:** All business logic (separated from UI components)

## 📚 Documentation

For comprehensive guides, API documentation, and architecture details:

- **Developer Setup:** `docs/development/getting-started.md`
- **Architecture Overview:** `docs/development/architecture/`
- **API Documentation:** `docs/api/`
- **Contributing Guide:** `docs/contributing/guidelines.md`

---

## 🔒 Privacy First

ChastityOS prioritizes your privacy:

- No sensitive content (name, notes, orgasm logs) is shared externally
- Analytics are anonymous and used only to improve app usability
- Your Firebase User ID (anonymous or Google-linked) is never used for tracking—only for data storage

You can view the full Privacy & Analytics statement in the app’s footer modal.

---

## 🧪 Beta Testing

- 🐞 Submit bugs & 💡 suggestions directly in-app
- Feedback posts to GitHub issues and Discord channels
- Beta testers must provide feedback at least once a week
- Premium features unlocked free for 1 year for beta users

---

## 🚀 Deployment

- **Stable:** https://app.chastityOS.io
- **Nightly Preview:** https://nightly.chastityOS.io
- **Source Code:** [GitHub Repo](https://github.com/thef4tdaddy/chastityOS)
- **Support:** [Ko-fi Page](https://ko-fi.com/chastityos)

---

## 📜 License

This project is licensed under the [GNU General Public License v3.0 (GPLv3)](https://www.gnu.org/licenses/gpl-3.0.en.html).

