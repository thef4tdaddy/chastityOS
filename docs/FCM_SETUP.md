# Firebase Cloud Messaging (FCM) Setup Guide

This guide explains how to set up Firebase Cloud Messaging for push notifications in ChastityOS.

## Prerequisites

- Firebase project with Cloud Messaging enabled
- Service Worker registered (already configured via Vite PWA plugin)
- HTTPS deployment (required for push notifications)

## Configuration Steps

### 1. Generate VAPID Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your ChastityOS project
3. Navigate to **Project Settings** > **Cloud Messaging** tab
4. Scroll to **Web Push certificates** section
5. Click **Generate key pair** to create a VAPID key
6. Copy the generated key

### 2. Add VAPID Key to Environment Variables

Add the VAPID key to your environment files:

**`.env.development`**:

```env
VITE_FIREBASE_VAPID_KEY=your-vapid-key-here
```

**`.env.production`**:

```env
VITE_FIREBASE_VAPID_KEY=your-vapid-key-here
```

**`.env.nightly`**:

```env
VITE_FIREBASE_VAPID_KEY=your-vapid-key-here
```

### 3. Enable Cloud Messaging in Firebase

1. In Firebase Console, go to **Build** > **Cloud Messaging**
2. Ensure Cloud Messaging API is enabled
3. (Optional) Configure notification templates for common scenarios

### 4. Configure Firebase Functions (Future)

When implementing server-side notification sending:

```typescript
// functions/src/notifications/sendTaskNotification.ts
import * as admin from "firebase-admin";

export async function sendTaskAssignedNotification(
  userId: string,
  taskTitle: string,
) {
  const userDoc = await admin.firestore().collection("users").doc(userId).get();

  const fcmToken = userDoc.data()?.fcmToken;

  if (!fcmToken) {
    console.log("No FCM token for user:", userId);
    return;
  }

  const message = {
    notification: {
      title: "New Task Assigned",
      body: `Your Keyholder assigned you: "${taskTitle}"`,
    },
    data: {
      type: "task_assigned",
      taskId: taskId,
      link: "/tasks",
    },
    token: fcmToken,
  };

  await admin.messaging().send(message);
}
```

## Architecture

### Components

1. **FCMService** (`src/services/notifications/FCMService.ts`)
   - Handles FCM token lifecycle
   - Requests and stores tokens
   - Deletes tokens on logout

2. **useNotificationPermission** (`src/hooks/useNotificationPermission.ts`)
   - Manages permission state
   - Handles re-prompting logic
   - Tracks denial history

3. **NotificationPermissionPrompt** (`src/components/notifications/NotificationPermissionPrompt.tsx`)
   - User-friendly permission UI
   - Shows benefits of enabling notifications
   - Handles permission flow

4. **useFCMInitialization** (`src/hooks/useFCMInitialization.ts`)
   - Initializes FCM on app load
   - Refreshes tokens automatically
   - Integrates with auth system

5. **Service Worker** (`public/sw-custom.js`)
   - Receives push notifications
   - Displays notifications
   - Handles notification clicks
   - Routes to appropriate pages

### Data Flow

```
User Login
    ↓
useFCMInitialization
    ↓
Check Permission → Granted → Request Token → Save to Firestore
    ↓                             ↓
    Not Granted              Token Refresh Listener
    ↓
NotificationPermissionPrompt (after delay)
    ↓
User Grants → Request Token → Save to Firestore
```

### Token Storage

FCM tokens are stored in Firestore:

```typescript
users/{userId} {
  fcmToken: string,
  fcmTokenUpdatedAt: Date
}
```

## Permission Flow

### Initial Prompt Timing

- **First Load**: No prompt (avoid interrupting onboarding)
- **After 30 seconds**: Show prompt if user hasn't been asked before
- **Settings Page**: User can manually enable via force show

### Re-prompting Logic

- Maximum 3 denial prompts
- 7-day cooldown between prompts after denial
- Resets on grant

### Permission States

1. **default**: User hasn't been asked yet
2. **granted**: User allowed notifications
3. **denied**: User blocked notifications (browser level)
4. **unsupported**: Push notifications not available

## Service Worker Integration

The service worker handles:

1. **Push Events**: Receives notifications from FCM
2. **Notification Display**: Shows notifications with proper formatting
3. **Click Handling**: Opens app to relevant page
4. **Action Buttons**: (Future) Quick actions like approve/reject

### Notification Types

- `task_assigned` → Routes to `/tasks`
- `task_submitted` → Routes to `/keyholder`
- `task_approved` → Routes to `/tasks`
- `task_rejected` → Routes to `/tasks`
- `task_deadline` → Routes to `/tasks`
- `task_overdue` → Routes to `/tasks`

## Testing

### Local Testing

1. Use `npm run dev` with HTTPS (required for notifications)
2. Grant notification permission via prompt
3. Check browser console for token
4. Verify token saved in Firestore

### Testing Notifications

Use Firebase Console to send test messages:

1. Go to **Cloud Messaging** in Firebase Console
2. Click **Send test message**
3. Enter the FCM token from console logs
4. Send notification and verify receipt

### Manual Token Testing

```typescript
// In browser console
const { FCMService } = await import("./src/services/notifications/FCMService");
const token = await FCMService.requestToken("your-user-id");
console.log("Token:", token);
```

## Security Considerations

1. **VAPID Key**: Stored in environment variables (not committed to repo)
2. **Token Storage**: Per-user in Firestore with security rules
3. **Authentication**: Only authenticated users receive tokens
4. **Token Cleanup**: Deleted on logout
5. **Firestore Rules**: Ensure only authenticated users can write their own tokens

### Recommended Firestore Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow write: if request.auth.uid == userId;
      allow read: if request.auth.uid == userId;
    }
  }
}
```

## Troubleshooting

### Token Not Generated

1. Check VAPID key is configured correctly
2. Verify HTTPS is being used
3. Check browser console for errors
4. Ensure service worker is registered

### Notifications Not Received

1. Verify token is saved in Firestore
2. Check notification permission is granted
3. Test with Firebase Console test message
4. Check service worker is active
5. Verify push event listener is registered

### Permission Denied

1. User must manually re-enable in browser settings
2. Browser-level blocks cannot be overridden
3. Provide instructions for re-enabling in settings

## Browser Support

- ✅ Chrome/Edge (full support)
- ✅ Firefox (full support)
- ✅ Safari 16+ (full support)
- ❌ Safari 15 and below (no support)
- ❌ iOS Safari 15 and below (no support)
- ✅ iOS Safari 16.4+ (full support)

## Future Enhancements

1. **Server-side Sending**: Firebase Functions to send notifications
2. **Notification Templates**: Pre-defined templates for common scenarios
3. **Notification Settings**: Per-notification-type preferences
4. **Action Buttons**: Quick actions in notifications
5. **Badge Count**: Update app badge with unread count
6. **Silent Notifications**: Background updates without display
7. **Notification History**: In-app notification center

## Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications](https://web.dev/push-notifications-overview/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
