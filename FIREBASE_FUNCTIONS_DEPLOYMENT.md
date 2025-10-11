# Firebase Functions Deployment Guide

This guide walks you through deploying Firebase Cloud Functions for ChastityOS push notifications.

## Prerequisites

Before deploying, ensure you have:

1. **Node.js 20+** installed
2. **Firebase CLI** installed globally:
   ```bash
   npm install -g firebase-tools
   ```
3. **Firebase Project** with:
   - Firestore database enabled
   - Cloud Messaging enabled
   - Blaze (Pay as you go) plan activated

## Step 1: Initial Setup

### 1.1 Login to Firebase

```bash
firebase login
```

This opens a browser window for authentication.

### 1.2 Select Project

```bash
cd /path/to/chastityOS
firebase use --add
```

Select your Firebase project (e.g., `chastityos`) and give it an alias (e.g., `default`).

### 1.3 Verify Configuration

Check that `.firebaserc` contains your project:

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

## Step 2: Install Dependencies

Install function dependencies:

```bash
npm run functions:install
```

Or manually:

```bash
cd functions
npm install
```

## Step 3: Build Functions

Build TypeScript to JavaScript:

```bash
npm run functions:build
```

This compiles TypeScript files from `functions/src/` to `functions/lib/`.

## Step 4: Test Locally (Recommended)

Before deploying to production, test with the Firebase Emulator:

```bash
npm run functions:serve
```

This starts:
- Functions emulator on http://localhost:5001
- Firestore emulator on http://localhost:8080
- Emulator UI on http://localhost:4000

### Test Your Functions

1. Open http://localhost:4000
2. Navigate to Firestore
3. Create test documents to trigger functions
4. Check logs in the emulator UI

## Step 5: Deploy to Production

### 5.1 Deploy All Functions

```bash
npm run functions:deploy
```

Or manually:

```bash
firebase deploy --only functions
```

### 5.2 Deploy Specific Function

To deploy only one function:

```bash
firebase deploy --only functions:sendPushNotification
```

### 5.3 Verify Deployment

Check deployed functions:

```bash
firebase functions:list
```

## Step 6: Configure Cloud Messaging

### 6.1 Enable Cloud Messaging API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project
3. Navigate to "APIs & Services" → "Library"
4. Search for "Cloud Messaging API"
5. Click "Enable"

### 6.2 Get VAPID Key (for Web Push)

1. Go to Firebase Console → Project Settings → Cloud Messaging
2. Under "Web Push certificates", generate a key pair
3. Copy the "Key pair" value (starts with `B`)
4. Add to your web app configuration

### 6.3 Update Client Code

In your client application, add FCM token registration:

```javascript
// src/services/notifications/fcm.js
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export async function registerFCMToken(userId) {
  try {
    const messaging = getMessaging();
    
    // Request notification permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY_HERE'
      });
      
      // Save to Firestore
      await setDoc(doc(db, 'users', userId), {
        fcmToken: token,
        lastTokenUpdate: new Date()
      }, { merge: true });
      
      console.log('FCM token registered:', token);
      return token;
    }
  } catch (error) {
    console.error('Error registering FCM token:', error);
  }
}

// Listen for foreground messages
export function setupFCMListener() {
  const messaging = getMessaging();
  
  onMessage(messaging, (payload) => {
    console.log('Message received:', payload);
    
    // Show notification
    new Notification(payload.notification.title, {
      body: payload.notification.body,
      icon: '/icon-192x192.png',
      badge: '/badge-icon.png'
    });
  });
}
```

## Step 7: Set Up Firestore Indexes (if needed)

If you get Firestore index errors:

1. Check function logs: `npm run functions:logs`
2. Click the index creation link in the error
3. Wait for index to build (5-10 minutes)

## Step 8: Monitor Functions

### View Logs

```bash
npm run functions:logs
```

Or for specific function:

```bash
firebase functions:log --only onTaskAssigned
```

### Firebase Console

1. Go to Firebase Console → Functions
2. View:
   - Invocation count
   - Execution time
   - Error rate
   - Logs

## Step 9: Set Up Alerts (Optional)

### Configure Error Alerts

1. Firebase Console → Functions → Usage
2. Click "Monitoring"
3. Set up alerts for:
   - High error rate
   - Slow execution time
   - Quota limits

## Troubleshooting

### Common Issues

#### 1. "Insufficient permissions" Error

**Solution:** Ensure your Firebase project has the Blaze plan enabled.

```bash
firebase projects:list
```

Upgrade at: https://console.firebase.google.com/project/_/usage/details

#### 2. TypeScript Compilation Errors

**Solution:** Fix TypeScript errors before deploying:

```bash
cd functions
npm run build
```

#### 3. Function Timeout

**Solution:** Increase timeout in function definition:

```typescript
export const myFunction = functions.https.onCall({
  timeoutSeconds: 300  // 5 minutes
}, async (request) => {
  // ...
});
```

#### 4. FCM Token Invalid

**Solution:** Token may have expired. Re-register:

```javascript
await registerFCMToken(userId);
```

#### 5. Firestore Rules Block Access

**Solution:** Update `firestore.rules` to allow admin access:

```
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Then deploy rules:

```bash
firebase deploy --only firestore:rules
```

## Costs Estimation

### Free Tier (Spark Plan)
- Not available for Cloud Functions

### Blaze Plan (Pay as you go)

Monthly costs for typical usage:

- **125,000 invocations/month**: Free
- **400,000 GB-seconds compute**: Free
- **5 GB outbound networking**: Free

**Estimated cost for 10,000 active users:**
- ~500,000 function invocations/month
- Cost: ~$0.80/month

**Estimated cost for 100,000 active users:**
- ~5,000,000 function invocations/month
- Cost: ~$12/month

## Security Considerations

### 1. Callable Function Authentication

All callable functions check `request.auth` to ensure the user is authenticated.

### 2. Firestore Rules

Ensure Firestore Rules prevent unauthorized access:

```javascript
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

### 3. Environment Variables

Never commit sensitive data. Use Firebase config:

```bash
firebase functions:config:set someservice.key="THE_API_KEY"
```

Access in code:

```typescript
const apiKey = functions.config().someservice.key;
```

### 4. IAM Permissions

Functions automatically have required permissions. To restrict:

1. Go to Google Cloud Console → IAM
2. Find the default service account
3. Review and adjust permissions

## Best Practices

1. **Test in Emulator First**: Always test locally before deploying
2. **Monitor Logs**: Set up log monitoring and alerts
3. **Optimize Performance**: Keep functions fast to reduce costs
4. **Handle Errors Gracefully**: Never let errors crash the client
5. **Use Structured Logging**: Include context in all log messages
6. **Version Control**: Commit function code to git
7. **Document Changes**: Update README when adding new functions
8. **Set Timeouts**: Configure appropriate timeouts for each function
9. **Batch Operations**: Process multiple items in one invocation when possible
10. **Cache Data**: Cache frequently accessed data to reduce Firestore reads

## Rollback

If a deployment causes issues, rollback:

```bash
# List deployments
firebase functions:list

# Delete problematic function
firebase functions:delete functionName

# Redeploy previous version
git checkout previous-commit
npm run functions:deploy
```

## CI/CD Integration

For automated deployments, add to your CI pipeline:

```yaml
# .github/workflows/deploy-functions.yml
name: Deploy Functions
on:
  push:
    branches: [main]
    paths:
      - 'functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install Functions Dependencies
        run: npm run functions:install
      
      - name: Build Functions
        run: npm run functions:build
      
      - name: Deploy to Firebase
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
        run: |
          npm install -g firebase-tools
          firebase deploy --only functions --token $FIREBASE_TOKEN
```

Generate token:

```bash
firebase login:ci
```

## Next Steps

After deployment:

1. **Test Notifications**: Create tasks and verify notifications are sent
2. **Monitor Performance**: Check function execution time and error rate
3. **Optimize**: Identify and optimize slow functions
4. **Document**: Update documentation for new triggers
5. **Scale**: Monitor costs as usage grows

## Support

For help:
- Check [functions/README.md](functions/README.md)
- Review [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- Check function logs: `npm run functions:logs`
- Open an issue on GitHub

## Conclusion

Your Firebase Functions are now deployed and ready to send push notifications! 🎉

Remember to:
- Monitor costs in Firebase Console
- Set up alerts for errors
- Test notifications regularly
- Keep dependencies updated
