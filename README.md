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

### 🧠 Keyholder Mode *(New!)*
- Set a keyholder with a name and secure password preview
- Keyholder can set a required minimum chastity duration
- Locked controls unless the user enters the correct 8-character password preview
- Visual tracker shows progress toward required keyholder time

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

### ☁️ Import/Export JSON (Coming Soon)
- Allow users to backup and migrate data manually between devices

---

## 🔧 Tech Stack

- **Frontend:** React + Vite
- **Styling:** Tailwind CSS
- **Backend:** Firebase (Auth + Firestore)
- **Analytics:** Google Analytics, GTM, Hotjar
- **Feedback:** GitHub API + Discord Webhooks

---

## 🔒 Privacy First

ChastityOS prioritizes your privacy:
- No sensitive content (name, notes, orgasm logs) is shared externally
- Analytics are anonymous and used only to improve app usability
- Your Firebase User ID is never used for tracking—only for data storage

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
