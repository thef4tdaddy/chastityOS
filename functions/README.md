# Firebase Cloud Functions for ChastityOS

This directory contains Firebase Cloud Functions for server-side triggers and push notifications.

## Overview

The functions provide:
- **Push Notifications**: Send FCM notifications to users
- **Task Triggers**: Notify users about task lifecycle events
- **Session Triggers**: Alert users about session changes
- **Relationship Triggers**: Notify about relationship requests and emergency unlocks
- **Scheduled Functions**: Check for sessions ending soon

## Setup

### Prerequisites

- Node.js 20 or higher
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project with Firestore and Cloud Messaging enabled

### Installation

1. Install dependencies:
```bash
npm run functions:install
```

2. Login to Firebase:
```bash
firebase login
```

3. Set your Firebase project:
```bash
firebase use --add
```

### Configuration

The functions automatically use the Firebase Admin SDK credentials from the Firebase environment.

For local development, you can download a service account key:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save as `functions/service-account-key.json` (DO NOT commit this file!)

## Development

### Build Functions

```bash
npm run functions:build
```

### Run Local Emulator

```bash
npm run functions:serve
```

This starts the Firebase emulator suite at:
- Functions: http://localhost:5001
- Firestore: http://localhost:8080
- Emulator UI: http://localhost:4000

### Watch Mode

For continuous building during development:
```bash
cd functions
npm run build:watch
```

## Deployment

### Deploy All Functions

```bash
npm run functions:deploy
```

### Deploy Specific Function

```bash
firebase deploy --only functions:sendPushNotification
```

### View Logs

```bash
npm run functions:logs
```

Or view specific function logs:
```bash
firebase functions:log --only onTaskAssigned
```

## Functions Reference

### Callable Functions

#### `sendPushNotification`
Send a push notification to a user via FCM.

**Parameters:**
```typescript
{
  token: string;          // FCM device token
  title: string;          // Notification title
  body: string;           // Notification body
  data?: Record<string, string>;  // Optional data payload
  priority?: "high" | "normal";   // Notification priority
}
```

**Usage from Client:**
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const sendNotification = httpsCallable(functions, 'sendPushNotification');

await sendNotification({
  token: userFcmToken,
  title: 'Task Assigned',
  body: 'You have a new task',
  data: { taskId: '123' },
  priority: 'high'
});
```

### Firestore Triggers

#### Task Triggers

**`onTaskAssigned`**
- **Path:** `users/{userId}/tasks/{taskId}`
- **Event:** onCreate
- **Notifies:** Submissive when assigned a task by keyholder

**`onTaskSubmitted`**
- **Path:** `users/{userId}/tasks/{taskId}`
- **Event:** onUpdate (status → submitted)
- **Notifies:** Keyholder when task is submitted

**`onTaskApproved`**
- **Path:** `users/{userId}/tasks/{taskId}`
- **Event:** onUpdate (status → approved)
- **Notifies:** Submissive when task is approved

**`onTaskRejected`**
- **Path:** `users/{userId}/tasks/{taskId}`
- **Event:** onUpdate (status → rejected)
- **Notifies:** Submissive when task is rejected

#### Session Triggers

**`onSessionCompleted`**
- **Path:** `users/{userId}/sessions/{sessionId}`
- **Event:** onUpdate (endTime set)
- **Notifies:** Both submissive and keyholder

**`onPauseCooldownExpired`**
- **Path:** `users/{userId}/sessions/{sessionId}`
- **Event:** onUpdate (isPaused → false)
- **Notifies:** Submissive when pause ends

#### Relationship Triggers

**`onKeyholderRequest`**
- **Path:** `relationshipRequests/{requestId}`
- **Event:** onCreate
- **Notifies:** Recipient of relationship request

**`onEmergencyUnlock`**
- **Path:** `users/{userId}/sessions/{sessionId}`
- **Event:** onUpdate (isEmergencyUnlock → true)
- **Notifies:** Keyholder about emergency unlock

### Scheduled Functions

**`checkSessionsEndingSoon`**
- **Schedule:** Every 1 minute
- **Action:** Checks for sessions ending in 5 minutes and sends notifications

## Data Requirements

For push notifications to work, users must have an FCM token stored in their user document:

```javascript
// Store FCM token in Firestore
import { getMessaging, getToken } from 'firebase/messaging';

const messaging = getMessaging();
const token = await getToken(messaging, { 
  vapidKey: 'YOUR_VAPID_KEY' 
});

// Save to user document
await setDoc(doc(db, 'users', userId), {
  fcmToken: token
}, { merge: true });
```

## Testing

### Unit Tests

Unit tests can be added to `src/__tests__/` directory.

### Integration Testing

Use the Firebase Emulator Suite for integration testing:

```bash
npm run functions:serve
```

Then run your tests against the emulator endpoints.

### Manual Testing

1. Start emulator: `npm run functions:serve`
2. Trigger functions through:
   - Creating/updating documents in Firestore UI (http://localhost:4000)
   - Calling callable functions from your app
   - Using Firebase CLI: `firebase functions:shell`

## Performance & Monitoring

### View Function Performance

Firebase Console → Functions → Dashboard

### Set Timeout and Memory

In function definition:
```typescript
export const myFunction = functions.https.onCall({
  timeoutSeconds: 300,
  memory: '1GB'
}, async (request) => {
  // ...
});
```

### Error Handling

All functions include comprehensive error handling and logging:
- Errors are logged to Cloud Logging
- Failed operations don't crash the app
- Graceful degradation for missing data

## Security

### Function Security

- Callable functions require authentication
- Triggers run with admin privileges
- No direct database access from clients

### IAM Permissions

Functions automatically have the following permissions:
- Firestore read/write
- Cloud Messaging send
- Cloud Logging write

### Secrets Management

Never commit:
- Service account keys
- API keys
- Environment variables with sensitive data

Use Firebase environment config:
```bash
firebase functions:config:set someservice.key="THE API KEY"
```

## Costs

Cloud Functions pricing (as of 2024):
- **Invocations:** First 2M free, then $0.40/million
- **Compute Time:** First 400,000 GB-seconds free
- **Network:** First 5GB free

Optimize costs by:
- Minimizing function execution time
- Batching operations
- Using appropriate memory allocation
- Caching frequently accessed data

## Troubleshooting

### Function Not Deploying

```bash
# Check for TypeScript errors
npm run functions:build

# Check Firebase CLI version
firebase --version

# Re-authenticate
firebase login --reauth
```

### Function Not Triggering

1. Check Firestore Rules allow writes
2. Verify function is deployed: `firebase functions:list`
3. Check logs: `npm run functions:logs`
4. Test with emulator first

### Notifications Not Sending

1. Verify FCM token exists in user document
2. Check token is valid (not expired)
3. Verify Firebase Cloud Messaging is enabled
4. Check function logs for errors

## Best Practices

1. **Idempotency**: Functions may be called multiple times; ensure they're idempotent
2. **Timeouts**: Set appropriate timeouts for long-running operations
3. **Error Handling**: Always catch and log errors
4. **Logging**: Use structured logging with context
5. **Testing**: Test with emulator before deploying
6. **Monitoring**: Set up alerts for function failures

## Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Cloud Functions Samples](https://github.com/firebase/functions-samples)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)

## Support

For issues or questions:
1. Check function logs: `npm run functions:logs`
2. Review Firestore Rules
3. Test with emulator
4. Check Firebase Console for quota/billing issues

## License

Same as parent ChastityOS project.
