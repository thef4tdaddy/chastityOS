# Firebase Functions Implementation Summary

## Overview

This implementation adds Firebase Cloud Functions to ChastityOS for server-side notification triggers and push notifications via Firebase Cloud Messaging (FCM).

## What's Included

### Firebase Functions

All functions are located in the `functions/` directory:

#### Callable Functions

**`sendPushNotification`** - Sends push notifications via FCM
- Location: `functions/src/notifications.ts`
- Type: HTTPS Callable
- Auth: Required
- Usage: Client can call directly to send notifications

#### Firestore Triggers

**Task Triggers** (`functions/src/triggers/tasks.ts`):
- `onTaskAssigned` - Notifies submissive when keyholder assigns task
- `onTaskSubmitted` - Notifies keyholder when task is submitted
- `onTaskApproved` - Notifies submissive when task is approved
- `onTaskRejected` - Notifies submissive when task is rejected

**Session Triggers** (`functions/src/triggers/sessions.ts`):
- `onSessionCompleted` - Notifies both users when session ends
- `onPauseCooldownExpired` - Notifies submissive when pause expires

**Relationship Triggers** (`functions/src/triggers/relationships.ts`):
- `onKeyholderRequest` - Notifies recipient of relationship request
- `onEmergencyUnlock` - Notifies keyholder of emergency unlock

#### Scheduled Functions

**`checkSessionsEndingSoon`** (`functions/src/scheduled.ts`):
- Runs every 1 minute
- Checks for sessions ending in 5 minutes
- Sends notifications to both submissive and keyholder

### Configuration Files

- **`firebase.json`** - Firebase project configuration
- **`.firebaserc`** - Firebase project selection
- **`firestore.indexes.json`** - Firestore index definitions
- **`functions/package.json`** - Function dependencies
- **`functions/tsconfig.json`** - TypeScript configuration

### Documentation

- **`functions/README.md`** - Detailed function documentation
- **`FIREBASE_FUNCTIONS_DEPLOYMENT.md`** - Deployment guide
- **`docs/firebase-cloud-messaging-setup.md`** - Client-side FCM setup

## Architecture

### Trigger Flow

```
[Firestore Event] → [Cloud Function] → [FCM] → [User Device]
     ↓                    ↓                ↓          ↓
Task Created      onTaskAssigned    Notification   Toast/Push
Task Updated      onTaskSubmitted   Sent via FCM   Displayed
Session Ended     onSessionCompleted
```

### Data Flow

```
1. User Action (e.g., assign task)
2. Write to Firestore
3. Firestore trigger fires
4. Cloud Function executes
5. Retrieve FCM token from user document
6. Send notification via FCM Admin SDK
7. FCM delivers to device
8. Service worker displays notification
```

## Setup Instructions

### Quick Start

1. **Install dependencies:**
   ```bash
   npm run functions:install
   ```

2. **Build functions:**
   ```bash
   npm run functions:build
   ```

3. **Test locally:**
   ```bash
   npm run functions:serve
   ```

4. **Deploy to Firebase:**
   ```bash
   npm run functions:deploy
   ```

### Detailed Setup

See [FIREBASE_FUNCTIONS_DEPLOYMENT.md](FIREBASE_FUNCTIONS_DEPLOYMENT.md) for complete deployment instructions.

### Client Setup

See [docs/firebase-cloud-messaging-setup.md](docs/firebase-cloud-messaging-setup.md) for FCM integration in the web app.

## Requirements Met

From issue #392:

### Firebase Functions Setup
- ✅ Initialize Firebase Functions in project
- ✅ Install dependencies (`firebase-admin`, `firebase-functions`)
- ✅ Configure Firebase Admin SDK
- ✅ Set up TypeScript compilation
- ⚠️ Deploy functions to Firebase (ready, needs credentials)

### Callable Function
- ✅ Accept notification payload
- ✅ Validate FCM token
- ✅ Send notification via FCM Admin SDK
- ✅ Handle errors and return status
- ✅ Log notification delivery

### Firestore Triggers - Task Triggers
- ✅ `onTaskAssigned` - When task is created with assignedTo
- ✅ `onTaskSubmitted` - When task status changes to "submitted"
- ✅ `onTaskApproved` - When task status changes to "approved"
- ✅ `onTaskRejected` - When task status changes to "rejected"

### Firestore Triggers - Session Triggers
- ✅ `onSessionEnding` - Scheduled function checks sessions ending in 5 min
- ✅ `onSessionCompleted` - When session ends
- ✅ `onPauseCooldownExpired` - When pause cooldown timer expires

### Firestore Triggers - Relationship Triggers
- ✅ `onKeyholderRequest` - When new relationship request created
- ✅ `onEmergencyUnlock` - When emergency unlock triggered

### Files Created
- ✅ `functions/src/index.ts` - Main functions export
- ✅ `functions/src/notifications.ts` - Notification functions
- ✅ `functions/src/scheduled.ts` - Scheduled functions
- ✅ `functions/src/triggers/tasks.ts` - Task triggers
- ✅ `functions/src/triggers/sessions.ts` - Session triggers
- ✅ `functions/src/triggers/relationships.ts` - Relationship triggers
- ✅ `functions/package.json` - Dependencies
- ✅ `functions/tsconfig.json` - TypeScript config

### Testing
- ✅ Unit test structure created (placeholder tests)
- ⚠️ Test functions locally with Firebase Emulator (ready to test)
- ⚠️ Test deployed functions in dev environment (requires deployment)
- ⚠️ Verify trigger timing and accuracy (requires deployment)
- ⚠️ Load test (can be done post-deployment)

## File Structure

```
chastityOS/
├── functions/
│   ├── src/
│   │   ├── __tests__/           # Unit tests
│   │   │   ├── notifications.test.ts
│   │   │   ├── tasks.test.ts
│   │   │   └── sessions.test.ts
│   │   ├── triggers/            # Firestore triggers
│   │   │   ├── tasks.ts
│   │   │   ├── sessions.ts
│   │   │   └── relationships.ts
│   │   ├── index.ts             # Main export
│   │   ├── notifications.ts     # Callable function
│   │   └── scheduled.ts         # Scheduled functions
│   ├── package.json
│   ├── tsconfig.json
│   ├── .gitignore
│   └── README.md
├── docs/
│   └── firebase-cloud-messaging-setup.md
├── firebase.json
├── .firebaserc
├── firestore.indexes.json
├── FIREBASE_FUNCTIONS_DEPLOYMENT.md
└── FIREBASE_FUNCTIONS_IMPLEMENTATION.md (this file)
```

## Usage Examples

### From Cloud Functions

```typescript
import { sendNotificationToUser } from './notifications';

// Send notification to user
await sendNotificationToUser(
  'user-123',
  'Task Assigned',
  'You have a new task',
  { taskId: 'task-456', type: 'task_assigned' }
);
```

### From Client

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const sendNotification = httpsCallable(functions, 'sendPushNotification');

const result = await sendNotification({
  token: userFcmToken,
  title: 'Task Assigned',
  body: 'You have a new task',
  data: { taskId: '123' },
  priority: 'high'
});
```

### Trigger Automatically

Simply perform actions that write to Firestore:

```typescript
// Create task - automatically triggers onTaskAssigned
await addDoc(collection(db, 'users', userId, 'tasks'), {
  text: 'Complete exercise',
  status: 'pending',
  assignedBy: 'keyholder',
  createdAt: new Date(),
});

// Update task - automatically triggers onTaskSubmitted
await updateDoc(doc(db, 'users', userId, 'tasks', taskId), {
  status: 'submitted',
  submittedAt: new Date(),
});
```

## Data Requirements

For notifications to work, users must have an FCM token in their Firestore document:

```typescript
// User document structure
{
  userId: "user-123",
  fcmToken: "fcm-device-token-here",
  lastTokenUpdate: Timestamp,
  settings: {
    notifications: {
      tasks: {
        assigned: true,
        submitted: true,
        approved: true,
        rejected: true,
      }
    }
  }
}
```

## Testing

### Local Testing

```bash
# Start Firebase Emulator
npm run functions:serve

# Access emulator UI
open http://localhost:4000
```

### Unit Tests

```bash
cd functions
npm test
```

### Manual Testing

1. Start emulator
2. Create test documents in Firestore UI
3. Verify functions trigger
4. Check logs in emulator UI

## Monitoring

### View Logs

```bash
npm run functions:logs
```

### Firebase Console

1. Go to Firebase Console → Functions
2. View metrics:
   - Invocations
   - Execution time
   - Errors
   - Memory usage

## Security

- All callable functions require authentication
- Triggers run with admin privileges
- FCM tokens validated before sending
- User preferences respected (framework in place)
- Errors logged but not exposed to clients

## Performance

- Functions timeout after 60s (default)
- Memory: 256MB (default)
- Scheduled function runs every 1 minute
- Batch operations where possible
- Efficient Firestore queries

## Cost Estimation

### Free Tier (Spark)
- Cloud Functions not available

### Blaze Plan (Pay as you go)

For 10,000 active users:
- ~500,000 invocations/month
- ~$0.80/month

For 100,000 active users:
- ~5,000,000 invocations/month
- ~$12/month

## Known Limitations

1. **FCM Token Management**: Clients must register tokens
2. **Notification Preferences**: Framework exists but not enforced
3. **Batch Notifications**: Multiple simultaneous actions create multiple notifications
4. **Token Expiration**: No automatic token refresh implemented
5. **Notification History**: Not tracked in database

## Future Enhancements

1. Implement notification preference checking in functions
2. Add notification history/audit log
3. Implement token refresh mechanism
4. Add notification batching/grouping
5. Add rich notifications with action buttons
6. Implement notification analytics
7. Add notification scheduling
8. Support multiple device tokens per user
9. Add notification templates
10. Implement A/B testing for notification content

## Troubleshooting

### Functions Not Deploying

```bash
# Check build errors
npm run functions:build

# Re-authenticate
firebase login --reauth

# Check project
firebase use
```

### Notifications Not Sending

1. Verify FCM token exists in user document
2. Check function logs for errors
3. Verify Cloud Messaging API is enabled
4. Test with Firebase Emulator first

### Triggers Not Firing

1. Verify Firestore Rules allow writes
2. Check function is deployed
3. Review function logs
4. Test trigger path matches exactly

## Support

For help:
1. Check [functions/README.md](functions/README.md)
2. Review [FIREBASE_FUNCTIONS_DEPLOYMENT.md](FIREBASE_FUNCTIONS_DEPLOYMENT.md)
3. Check [docs/firebase-cloud-messaging-setup.md](docs/firebase-cloud-messaging-setup.md)
4. View logs: `npm run functions:logs`
5. Test with emulator: `npm run functions:serve`

## Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firestore Triggers](https://firebase.google.com/docs/functions/firestore-events)

## Conclusion

All Firebase Cloud Functions have been implemented and are ready for deployment. The functions will automatically trigger on Firestore events and send push notifications to users via FCM.

**Next Steps:**
1. Deploy functions to Firebase
2. Implement client-side FCM token registration
3. Test notifications in production
4. Monitor function performance
5. Implement notification preferences UI

**Status:** ✅ **Implementation Complete** - Ready for Deployment
