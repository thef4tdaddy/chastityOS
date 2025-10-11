# Background Sync & Push Notifications - Manual Testing Checklist

This document provides a comprehensive manual testing checklist for background sync and push notification functionality.

## Prerequisites

- Device/browser with PWA support
- Firebase project configured
- Test user accounts (keyholder and submissive)
- Network throttling tools (Chrome DevTools)

---

## Background Sync Testing

### Queue Operation While Offline

- [ ] **Test ID:** BS-01
- **Steps:**
  1. Open the app and log in
  2. Open Chrome DevTools → Network tab
  3. Set "Offline" in the throttling dropdown
  4. Create a new task
  5. Update an existing task
  6. Delete a task
- **Expected Result:** Operations are queued locally in IndexedDB
- **Verification:** Check Application → IndexedDB → offlineQueue table

### Go Online and Verify Sync

- [ ] **Test ID:** BS-02
- **Steps:**
  1. Follow BS-01 to queue operations
  2. Switch network to "Online" in DevTools
  3. Wait 2-5 seconds
  4. Check Firebase Console
- **Expected Result:** 
  - Queued operations sync to Firebase
  - Local queue is cleared
  - UI reflects synced state
- **Verification:** 
  - Firebase Console shows new/updated/deleted items
  - IndexedDB offlineQueue is empty

### Test Sync Failure and Retry

- [ ] **Test ID:** BS-03
- **Steps:**
  1. Queue operations while offline
  2. Go online
  3. Immediately go offline before sync completes
  4. Go back online
- **Expected Result:**
  - First sync attempt fails
  - Retry count increments
  - Second attempt succeeds
- **Verification:** Check browser console for retry logs

### Test Manual Sync Button

- [ ] **Test ID:** BS-04
- **Steps:**
  1. Queue operations while offline
  2. Stay offline
  3. Click manual sync button (if available)
- **Expected Result:**
  - Shows error message about being offline
  - Operations remain in queue
- **Verification:** IndexedDB still contains queued operations

### Verify Sync Status Indicator

- [ ] **Test ID:** BS-05
- **Steps:**
  1. Queue operations while offline
  2. Observe sync status indicator
  3. Go online
  4. Observe status change
- **Expected Result:**
  - Offline: Shows "Offline" or pending icon
  - Syncing: Shows syncing icon/spinner
  - Online: Shows "Synced" or checkmark
- **Verification:** Visual UI feedback matches sync state

---

## Push Notifications Testing

### Request Notification Permission

- [ ] **Test ID:** PN-01
- **Steps:**
  1. Open app in fresh browser/incognito
  2. Navigate to Settings → Notifications
  3. Click "Enable Notifications"
- **Expected Result:**
  - Browser shows permission prompt
  - Permission state saved in settings
- **Verification:** 
  - Check `Notification.permission` in console
  - Verify localStorage contains notification settings

### Receive Task Assigned Notification

- [ ] **Test ID:** PN-02
- **Steps:**
  1. Log in as submissive user
  2. Have keyholder assign a task
  3. Wait for notification
- **Expected Result:**
  - Toast notification appears in app
  - (Future) Push notification if app in background
- **Verification:** 
  - Notification displays task title
  - Click notification navigates to task detail

### Receive Session Ending Notification

- [ ] **Test ID:** PN-03
- **Steps:**
  1. Start a chastity session
  2. Set end time to 1 minute from now
  3. Wait for session to end
- **Expected Result:**
  - Notification when session ends
  - Badge count updates
- **Verification:** 
  - Notification displays session info
  - App shows updated session status

### Click Notification - Deep Link

- [ ] **Test ID:** PN-04
- **Steps:**
  1. Receive any notification
  2. Click the notification
- **Expected Result:**
  - App opens/focuses
  - Navigates to relevant page (task, session, etc.)
- **Verification:** URL matches notification context

### Test Notification Actions

- [ ] **Test ID:** PN-05
- **Steps:**
  1. Receive task submitted notification (as keyholder)
  2. Click "Approve" action button
- **Expected Result:**
  - Task approved without opening app
  - Notification dismissed
  - UI updates reflect approval
- **Verification:** Firebase shows task status = approved

### Test Badge Count Updates

- [ ] **Test ID:** PN-06
- **Steps:**
  1. Install PWA on mobile device
  2. Receive multiple notifications
  3. Check app icon badge
- **Expected Result:**
  - Badge shows count of unread notifications
  - Count updates as notifications are read
  - Badge clears when all read
- **Verification:** Visual badge count on app icon

---

## Periodic Sync Testing

### Enable Periodic Sync

- [ ] **Test ID:** PS-01
- **Steps:**
  1. Install PWA
  2. Enable periodic sync in settings
  3. Check browser console for registration
- **Expected Result:**
  - Periodic sync registered successfully
  - Console log confirms registration
- **Verification:** Check `navigator.serviceWorker.ready` → periodicSync

### Background Refresh Triggers

- [ ] **Test ID:** PS-02
- **Steps:**
  1. Enable periodic sync
  2. Close app completely
  3. Wait 15+ minutes
  4. Open app
- **Expected Result:**
  - Data is fresh from last sync
  - No loading delay for cached data
- **Verification:** Check last sync timestamp in app

### Data Fetched from Firebase

- [ ] **Test ID:** PS-03
- **Steps:**
  1. Make changes in Firebase Console directly
  2. Wait for periodic sync interval
  3. Open app
- **Expected Result:**
  - App shows latest data from Firebase
  - No manual refresh needed
- **Verification:** UI reflects Firebase changes

### Local Cache Updated

- [ ] **Test ID:** PS-04
- **Steps:**
  1. Check IndexedDB before periodic sync
  2. Wait for sync to occur
  3. Check IndexedDB after sync
- **Expected Result:**
  - IndexedDB contains updated data
  - Timestamps show recent update
- **Verification:** Compare IndexedDB timestamps

### Badge Count Updated

- [ ] **Test ID:** PS-05
- **Steps:**
  1. Have keyholder assign new task
  2. Wait for periodic sync
  3. Check badge count
- **Expected Result:**
  - Badge updates without opening app
  - Shows correct unread count
- **Verification:** App icon badge reflects new tasks

### Disable Periodic Sync

- [ ] **Test ID:** PS-06
- **Steps:**
  1. Enable periodic sync
  2. Close app
  3. Disable periodic sync in settings
  4. Wait 15+ minutes
  5. Check service worker logs
- **Expected Result:**
  - No periodic sync occurs
  - Registration removed
- **Verification:** Console shows no periodic sync events

---

## Cross-Browser Testing

### Chrome Desktop - Full Support

- [ ] **Browser:** Chrome 90+ (Desktop)
- **Tests:** All BS, PN, PS tests
- **Expected:** Full functionality
- **Features:**
  - ✅ Background Sync
  - ✅ Push Notifications
  - ✅ Periodic Sync
  - ✅ Badge API

### Chrome Android - Full Support

- [ ] **Browser:** Chrome 90+ (Android)
- **Tests:** All BS, PN, PS tests
- **Expected:** Full functionality including home screen badge
- **Features:**
  - ✅ Background Sync
  - ✅ Push Notifications
  - ✅ Periodic Sync
  - ✅ Badge API

### Edge Desktop - Full Support

- [ ] **Browser:** Edge 90+ (Desktop)
- **Tests:** All BS, PN, PS tests
- **Expected:** Full functionality (Chromium-based)
- **Features:**
  - ✅ Background Sync
  - ✅ Push Notifications
  - ✅ Periodic Sync
  - ✅ Badge API

### Firefox Desktop - Push Only

- [ ] **Browser:** Firefox 100+ (Desktop)
- **Tests:** PN tests only
- **Expected:** Push notifications work, no background sync
- **Features:**
  - ❌ Background Sync (not supported)
  - ✅ Push Notifications
  - ❌ Periodic Sync (not supported)
  - ❌ Badge API (limited)

### Safari Desktop - Limited Support

- [ ] **Browser:** Safari 16+ (macOS)
- **Tests:** Basic functionality only
- **Expected:** Limited PWA support
- **Features:**
  - ❌ Background Sync
  - ⚠️ Push Notifications (iOS 16.4+)
  - ❌ Periodic Sync
  - ❌ Badge API

### Safari iOS - Limited Support

- [ ] **Browser:** Safari (iOS 16.4+)
- **Tests:** Basic functionality only
- **Expected:** Very limited PWA support
- **Features:**
  - ❌ Background Sync
  - ⚠️ Push Notifications (requires iOS 16.4+)
  - ❌ Periodic Sync
  - ❌ Badge API

---

## Mobile PWA Testing

### Install PWA on Android

- [ ] **Test ID:** PWA-01
- **Steps:**
  1. Open app in Chrome Android
  2. Tap "Install" prompt or menu → "Install app"
  3. Verify app appears on home screen
- **Expected Result:**
  - App icon on home screen
  - Opens in standalone mode
- **Verification:** App opens without browser UI

### Receive Notifications When App Closed

- [ ] **Test ID:** PWA-02
- **Steps:**
  1. Install PWA
  2. Close app completely
  3. Have keyholder assign task
- **Expected Result:**
  - Push notification appears
  - Shows in notification center
  - Can interact without opening app
- **Verification:** Notification visible when app closed

### Badge Count on App Icon

- [ ] **Test ID:** PWA-03
- **Steps:**
  1. Install PWA
  2. Receive notifications
  3. Check home screen icon
- **Expected Result:**
  - Badge shows unread count
  - Updates in real-time
- **Verification:** Visual badge on app icon

### Background Sync Works

- [ ] **Test ID:** PWA-04
- **Steps:**
  1. Install PWA
  2. Queue operations offline
  3. Close app
  4. Connect to internet
- **Expected Result:**
  - Sync occurs in background
  - Next time app opens, changes are synced
- **Verification:** Check Firebase for synced data

### Battery Usage Acceptable

- [ ] **Test ID:** PWA-05
- **Steps:**
  1. Install PWA
  2. Enable all sync features
  3. Use normally for 24 hours
  4. Check battery usage in Android settings
- **Expected Result:**
  - Battery usage < 5% per day
  - No excessive wake locks
- **Verification:** Android Battery Settings

---

## Performance Testing

### Background Sync Completion Time

- [ ] **Test ID:** PERF-01
- **Metric:** Time to complete sync
- **Target:** < 5 seconds for 10 operations
- **Steps:**
  1. Queue 10 operations
  2. Go online
  3. Measure time to complete sync
- **Pass Criteria:** Sync completes in under 5 seconds

### Notification Display Latency

- [ ] **Test ID:** PERF-02
- **Metric:** Time from event to notification
- **Target:** < 2 seconds
- **Steps:**
  1. Trigger notification event
  2. Measure time until notification displays
- **Pass Criteria:** Notification appears within 2 seconds

### Periodic Sync Frequency

- [ ] **Test ID:** PERF-03
- **Metric:** Sync interval consistency
- **Target:** Every 15 minutes (±2 minutes)
- **Steps:**
  1. Enable periodic sync
  2. Monitor sync events over 2 hours
- **Pass Criteria:** Syncs occur 8 times in 2 hours

### IndexedDB Query Performance

- [ ] **Test ID:** PERF-04
- **Metric:** Queue query time
- **Target:** < 100ms for 100 operations
- **Steps:**
  1. Add 100 operations to queue
  2. Measure getQueuedOperations() time
- **Pass Criteria:** Query completes in under 100ms

### Memory Usage

- [ ] **Test ID:** PERF-05
- **Metric:** Service worker memory
- **Target:** < 50MB
- **Steps:**
  1. Open Chrome Task Manager
  2. Monitor service worker memory
  3. Perform sync operations
- **Pass Criteria:** Memory stays below 50MB

---

## Test Environment Setup

### Required Tools

- Chrome DevTools
- Firebase Console access
- Network throttling (Chrome DevTools, 3G/4G simulation)
- Android device or emulator
- iOS device (for Safari testing)

### Test Data

- Create test accounts:
  - Keyholder: `keyholder-test@example.com`
  - Submissive: `submissive-test@example.com`
- Pre-populate test tasks
- Configure Firebase Cloud Messaging

### Reporting Issues

When reporting issues, include:
- Test ID
- Browser/OS version
- Network conditions
- Screenshots/screen recordings
- Console logs
- Steps to reproduce

---

## Notes

- Some features require HTTPS (notifications, service workers)
- Periodic sync may be throttled by browser based on usage
- Badge API support varies by platform
- Push notifications require Firebase Cloud Messaging setup

## References

- [MDN: Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Sync_API)
- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [MDN: Periodic Background Sync](https://developer.mozilla.org/en-US/docs/Web/API/Web_Periodic_Background_Synchronization_API)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
