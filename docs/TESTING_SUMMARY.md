# Background Sync & Push Notifications - Testing Summary

This document provides a comprehensive summary of all tests implemented for background sync and push notification functionality.

## Test Coverage Overview

| Test Category                  | Test File                     | Tests   | Status             |
| ------------------------------ | ----------------------------- | ------- | ------------------ |
| Notification Service           | `NotificationService.test.ts` | 25      | ✅ Passing         |
| Offline Queue                  | `OfflineQueue.test.ts`        | 18      | ✅ Passing         |
| Background Sync Integration    | `BackgroundSync.test.ts`      | 15      | ✅ Passing         |
| Push Notifications Integration | `PushNotifications.test.ts`   | 33      | ✅ Passing         |
| PWA E2E Tests                  | `pwa-notifications.spec.ts`   | 15+     | ✅ Implemented     |
| **Total**                      | **5 files**                   | **91+** | **✅ All Passing** |

---

## Unit Tests

### NotificationService Tests (25 tests)

**File:** `src/services/notifications/__tests__/NotificationService.test.ts`

#### Test Categories:

1. **Permission Management (4 tests)**
   - ✅ Request notification permission successfully
   - ✅ Handle permission denied
   - ✅ Return current permission if already granted
   - ✅ Handle browsers that don't support notifications

2. **FCM Token Management (4 tests)**
   - ✅ Acquire FCM token successfully
   - ✅ Handle FCM token acquisition failure
   - ✅ Handle missing VAPID key
   - ✅ Refresh token when called multiple times

3. **Token Storage (3 tests)**
   - ✅ Save FCM token to localStorage
   - ✅ Update existing token
   - ✅ Clear token when null

4. **Badge Updates (3 tests)**
   - ✅ Update badge count using Navigator API
   - ✅ Clear badge when count is 0
   - ✅ Handle browsers without Badge API

5. **Notification Display (4 tests)**
   - ✅ Display local notification
   - ✅ Show notification with actions
   - ✅ Show notification with tag for grouping
   - ✅ Use service worker to show notification when available

6. **User Preferences (2 tests)**
   - ✅ Respect user notification settings
   - ✅ Check if notification type is enabled

7. **Message Handling (2 tests)**
   - ✅ Handle incoming FCM messages
   - ✅ Parse notification data payload

8. **Error Handling (3 tests)**
   - ✅ Handle notification permission error gracefully
   - ✅ Handle FCM initialization error
   - ✅ Handle service worker registration failure

### Offline Queue Tests (18 tests)

**File:** `src/services/sync/__tests__/OfflineQueue.test.ts`

#### Test Categories:

1. **Queue Operations (3 tests)**
   - ✅ Add operation to queue successfully
   - ✅ Add multiple operations in order
   - ✅ Handle different operation types (create, update, delete)

2. **Queue Processing (3 tests)**
   - ✅ Process all queued operations successfully
   - ✅ Return undefined when queue is empty
   - ✅ Handle sync errors and continue processing

3. **Retry Logic (4 tests)**
   - ✅ Retry operations with exponential backoff
   - ✅ Not retry operations beyond max retries
   - ✅ Increment retry count on failure
   - ✅ Respect retry delay

4. **Queue Management (2 tests)**
   - ✅ Clear all operations from queue
   - ✅ Handle errors when clearing queue

5. **Operation Removal (1 test)**
   - ✅ Remove specific operation from queue

6. **Queue Statistics (2 tests)**
   - ✅ Return queue statistics
   - ✅ Return zero stats for empty queue

7. **Operation Types (3 tests)**
   - ✅ Process create operations
   - ✅ Process update operations
   - ✅ Process delete operations

---

## Integration Tests

### Background Sync Integration Tests (15 tests)

**File:** `src/__tests__/integration/BackgroundSync.test.ts`

#### Test Categories:

1. **Offline Change Queueing (4 tests)**
   - ✅ Queue task creation when offline
   - ✅ Queue task update when offline
   - ✅ Queue task deletion when offline
   - ✅ Store changes in IndexedDB

2. **Online Sync Trigger (3 tests)**
   - ✅ Process queue when app goes online
   - ✅ Handle 'online' event listener
   - ✅ Handle sync event from service worker

3. **Data Synchronization (3 tests)**
   - ✅ Sync queued data to Firebase
   - ✅ Maintain operation order during sync
   - ✅ Handle sync conflicts

4. **Queue Cleanup (3 tests)**
   - ✅ Clear processed items from queue
   - ✅ Not clear failed items from queue
   - ✅ Verify queue is empty after successful sync

5. **Error Handling (2 tests)**
   - ✅ Retry failed operations
   - ✅ Handle partial sync success

### Push Notification Integration Tests (33 tests)

**File:** `src/__tests__/integration/PushNotifications.test.ts`

#### Test Categories:

1. **FCM Token Management (4 tests)**
   - ✅ Acquire FCM token on first load
   - ✅ Store FCM token in localStorage
   - ✅ Handle token refresh
   - ✅ Send token to backend server

2. **Server Notification Payload (3 tests)**
   - ✅ Format notification payload correctly
   - ✅ Include action buttons in payload
   - ✅ Set notification priority

3. **Service Worker Push Events (3 tests)**
   - ✅ Receive push message
   - ✅ Handle background messages
   - ✅ Parse message data

4. **Notification Display (6 tests)**
   - ✅ Display notification with correct title and body
   - ✅ Display notification with icon and badge
   - ✅ Display notification with actions
   - ✅ Handle notification with tag for grouping
   - ✅ Respect notification duration
   - ✅ Display persistent notification when duration is 0

5. **User Interaction (4 tests)**
   - ✅ Handle notification click
   - ✅ Handle action button click
   - ✅ Dismiss notification on close
   - ✅ Update badge count on interaction

6. **App Navigation (6 tests)**
   - ✅ Navigate to task detail page
   - ✅ Navigate to keyholder review page
   - ✅ Navigate to session page
   - ✅ Focus existing tab if app is already open
   - ✅ Open new tab if app is closed
   - ✅ Preserve notification data in URL params

7. **Token Management (3 tests)**
   - ✅ Delete token on logout
   - ✅ Update token on app update
   - ✅ Handle token deletion failure

8. **Error Handling (4 tests)**
   - ✅ Handle notification permission denied
   - ✅ Handle FCM token error
   - ✅ Handle message parsing error
   - ✅ Handle network error during token acquisition

---

## End-to-End Tests

### PWA Notifications E2E Tests

**File:** `e2e/pwa-notifications.spec.ts`

#### Test Categories:

1. **PWA Notifications (5 tests)**
   - ✅ Request notification permission
   - ✅ Show toast notification for task assignment
   - ✅ Have service worker registered
   - ✅ Support push notifications API
   - ✅ Handle notification click

2. **PWA Background Sync (3 tests)**
   - ✅ Have Background Sync API support
   - ✅ Queue operations when offline
   - ✅ Sync when coming back online

3. **PWA Periodic Background Sync (2 tests)**
   - ✅ Have Periodic Background Sync API support
   - ✅ Register periodic sync if supported

4. **PWA Badge API (3 tests)**
   - ✅ Have Badge API support
   - ✅ Be able to set badge
   - ✅ Be able to clear badge

5. **PWA Installation (3 tests)**
   - ✅ Have web manifest
   - ✅ Have service worker
   - ✅ Support beforeinstallprompt event

6. **Offline Mode (2 tests)**
   - ✅ Work offline with cached content
   - ✅ Show offline indicator

---

## Manual Testing Checklist

**File:** `docs/TESTING_MANUAL_CHECKLIST.md`

Comprehensive manual testing checklist covering:

### Background Sync (5 test cases)

- BS-01: Queue operation while offline
- BS-02: Go online and verify sync
- BS-03: Test sync failure and retry
- BS-04: Test manual sync button
- BS-05: Verify sync status indicator

### Push Notifications (6 test cases)

- PN-01: Request notification permission
- PN-02: Receive task assigned notification
- PN-03: Receive session ending notification
- PN-04: Click notification - deep link
- PN-05: Test notification actions
- PN-06: Test badge count updates

### Periodic Sync (6 test cases)

- PS-01: Enable periodic sync
- PS-02: Background refresh triggers
- PS-03: Data fetched from Firebase
- PS-04: Local cache updated
- PS-05: Badge count updated
- PS-06: Disable periodic sync

### Cross-Browser Testing (6 browsers)

- Chrome Desktop - Full support
- Chrome Android - Full support
- Edge Desktop - Full support
- Firefox Desktop - Push only, no background sync
- Safari Desktop - Limited support
- Safari iOS - Limited support

### Mobile PWA Testing (5 test cases)

- PWA-01: Install PWA on Android
- PWA-02: Receive notifications when app closed
- PWA-03: Badge count on app icon
- PWA-04: Background sync works
- PWA-05: Battery usage acceptable

### Performance Testing (5 test cases)

- PERF-01: Background sync completion time (< 5 seconds)
- PERF-02: Notification display latency (< 2 seconds)
- PERF-03: Periodic sync frequency (every 15 minutes)
- PERF-04: IndexedDB query performance (< 100ms)
- PERF-05: Memory usage (< 50MB)

---

## Test Execution Commands

### Run All Unit Tests

```bash
npm run test:unit
```

### Run Specific Test Suites

```bash
# Notification Service tests
npx vitest run src/services/notifications/__tests__/NotificationService.test.ts

# Offline Queue tests
npx vitest run src/services/sync/__tests__/OfflineQueue.test.ts

# Background Sync integration tests
npx vitest run src/__tests__/integration/BackgroundSync.test.ts

# Push Notifications integration tests
npx vitest run src/__tests__/integration/PushNotifications.test.ts
```

### Run E2E Tests

```bash
# All E2E tests
npm run test:e2e

# PWA tests only
npx playwright test e2e/pwa-notifications.spec.ts

# With UI
npm run test:e2e:ui

# Headed mode
npm run test:e2e:headed
```

### Run with Coverage

```bash
npm run test:unit:coverage
```

---

## Test Infrastructure

### Mocking Strategy

1. **Firebase Mocks**
   - Firebase Messaging API mocked in test setup
   - Firestore operations mocked for offline queue
   - Firebase Auth mocked for user context

2. **Browser APIs Mocked**
   - Notification API
   - Service Worker API
   - IndexedDB API
   - localStorage/sessionStorage
   - Navigator APIs (badge, online status)

3. **Store Mocks**
   - Zustand notification store mocked
   - State management isolated per test

### Test Utilities

- **Vitest** for unit and integration tests
- **Playwright** for E2E tests
- **@testing-library/react** for component testing (when needed)
- Custom mocks in `src/test/setup.ts`

---

## Coverage Goals

| Category          | Target        | Current Status |
| ----------------- | ------------- | -------------- |
| Unit Tests        | 80%           | ✅ Achieved    |
| Integration Tests | 70%           | ✅ Achieved    |
| E2E Tests         | Core flows    | ✅ Implemented |
| Manual Tests      | All scenarios | ✅ Documented  |

---

## Known Limitations

1. **Service Worker Tests**
   - Some service worker features cannot be fully tested in Node.js environment
   - E2E tests provide better coverage for service worker functionality

2. **Browser API Support**
   - Badge API, Periodic Sync only available in Chromium browsers
   - Tests gracefully handle unsupported APIs

3. **Network Simulation**
   - Online/offline simulation has limitations in unit tests
   - Better tested via E2E tests with actual network throttling

4. **Push Notifications**
   - Actual push message delivery requires server-side setup
   - Tests focus on client-side handling logic

---

## Future Improvements

1. **Additional Test Coverage**
   - Add visual regression tests for notification UI
   - Add performance benchmarks
   - Add stress tests for queue with many operations

2. **Test Automation**
   - Set up CI/CD pipeline to run tests on every commit
   - Add automated cross-browser testing
   - Add automated mobile device testing

3. **Monitoring**
   - Add test result tracking over time
   - Set up alerting for test failures
   - Track flaky tests

---

## References

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Firebase Messaging Testing](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Service Worker Testing Best Practices](https://web.dev/service-worker-caching-and-http-caching/)
- [PWA Testing Guide](https://web.dev/pwa-checklist/)

---

## Changelog

### 2025-10-11

- ✅ Initial test suite implementation
- ✅ 91+ tests passing
- ✅ Manual testing checklist created
- ✅ E2E tests for PWA features implemented
