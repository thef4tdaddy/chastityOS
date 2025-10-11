# FCM Deployment Checklist

This checklist ensures push notifications are properly configured for deployment.

## Prerequisites

- [ ] Firebase project created
- [ ] Firebase Cloud Messaging API enabled
- [ ] HTTPS deployment URL available

## Configuration Steps

### 1. Generate VAPID Key

- [ ] Navigate to [Firebase Console](https://console.firebase.google.com/)
- [ ] Select your ChastityOS project
- [ ] Go to **Project Settings** > **Cloud Messaging** tab
- [ ] Under **Web Push certificates**, click **Generate key pair**
- [ ] Copy the generated VAPID key

### 2. Environment Variables

Add the following environment variable to your deployment platform:

**For Vercel:**
```bash
VITE_FIREBASE_VAPID_KEY=your-vapid-key-here
```

**For Netlify:**
```bash
VITE_FIREBASE_VAPID_KEY=your-vapid-key-here
```

**For other platforms:**
Ensure the environment variable is set in your build/deployment configuration.

### 3. Verify Firebase Configuration

Ensure all Firebase environment variables are set:

- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`
- [ ] `VITE_FIREBASE_VAPID_KEY` ← **NEW**

### 4. Service Worker Configuration

- [ ] Verify service worker is registered (handled by Vite PWA plugin)
- [ ] Check that `public/sw-custom.js` includes push event handlers
- [ ] Ensure service worker has proper scope (`/`)

### 5. HTTPS Requirement

⚠️ **CRITICAL:** Push notifications require HTTPS.

- [ ] Deployment URL uses HTTPS
- [ ] Local development uses `https://localhost` or Chrome's service worker dev tools

### 6. Testing

#### Development Testing

1. Build the app: `npm run build`
2. Serve locally with HTTPS:
   ```bash
   npx serve dist -s --ssl-cert localhost.pem --ssl-key localhost-key.pem
   ```
3. Open browser console and check:
   - Service worker registration
   - FCM token generation
   - Permission request flow

#### Production Testing

1. Deploy to staging environment
2. Open the app in a browser
3. After 30 seconds, verify permission prompt appears
4. Grant permission and check console for token
5. Verify token is saved in Firestore:
   ```
   users/{userId}/fcmToken
   users/{userId}/fcmTokenUpdatedAt
   ```

### 7. Firestore Security Rules

Ensure your Firestore rules allow authenticated users to write their own FCM tokens:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Allow users to read and write their own data
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 8. Firebase Functions (Future)

When implementing server-side notification sending:

- [ ] Create Firebase Functions project
- [ ] Deploy notification sending functions
- [ ] Configure function triggers (task assigned, approved, etc.)
- [ ] Test notification sending from Firebase Console

### 9. Browser Compatibility

Test on supported browsers:

- [ ] Chrome/Edge (desktop & mobile)
- [ ] Firefox (desktop & mobile)
- [ ] Safari 16+ (desktop & mobile)

### 10. Monitoring

Set up monitoring to track:

- [ ] FCM token generation rate
- [ ] Permission grant/deny rates
- [ ] Notification delivery rates
- [ ] Notification click-through rates

Use Firebase Analytics or your preferred analytics platform.

## Common Issues

### Token Not Generated

**Symptoms:** No token in console, FCM service fails silently

**Solutions:**
1. Check VAPID key is correct
2. Verify HTTPS is being used
3. Check browser console for errors
4. Ensure service worker is registered

### Permission Prompt Not Showing

**Symptoms:** No prompt appears after delay

**Solutions:**
1. Clear localStorage and try again
2. Check if already prompted (stored in localStorage)
3. Verify 30-second delay hasn't been skipped
4. Check browser notification settings

### Notifications Not Received

**Symptoms:** Token exists but no notifications appear

**Solutions:**
1. Verify token is valid (test with Firebase Console)
2. Check service worker is active
3. Ensure notification permission is granted
4. Check browser notification settings (not blocked)

## Rollback Plan

If issues arise in production:

1. **Disable Permission Prompt:**
   - Set `showAfterDelay` to a very high value (e.g., 999999999)
   - Or comment out `<NotificationPermissionPrompt>` in Root.tsx

2. **Revert Code:**
   ```bash
   git revert <commit-hash>
   ```

3. **Remove Environment Variable:**
   - Remove `VITE_FIREBASE_VAPID_KEY` from deployment platform

## Success Criteria

- [ ] Permission prompt appears for new users after 30 seconds
- [ ] FCM tokens are generated and stored in Firestore
- [ ] Tokens refresh automatically when needed
- [ ] Tokens are deleted on logout
- [ ] Service worker receives push events (testable via Firebase Console)
- [ ] No console errors related to FCM
- [ ] Build completes successfully
- [ ] All linting checks pass

## Additional Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications Guide](https://web.dev/push-notifications-overview/)
- [ChastityOS FCM Setup Guide](./FCM_SETUP.md)

## Notes

- Push notifications are **optional** - the app works fine without them
- Users can deny permission and the app will continue to function normally
- Permission can be re-enabled in browser settings if denied
- Maximum 3 re-prompts after denial, with 7-day cooldown
