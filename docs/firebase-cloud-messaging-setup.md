# Firebase Cloud Messaging (FCM) Setup Guide

This guide explains how to integrate Firebase Cloud Messaging for push notifications in ChastityOS.

## Overview

Firebase Cloud Messaging (FCM) enables push notifications from Firebase Cloud Functions to web and mobile clients. This allows server-side triggers to send real-time notifications to users.

## Prerequisites

- Firebase project configured
- Firebase Cloud Functions deployed
- Service worker support in the web app
- HTTPS hosting (required for service workers)

## Step 1: Enable Cloud Messaging

### 1.1 Enable FCM API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project
3. Navigate to **APIs & Services** → **Library**
4. Search for **"Firebase Cloud Messaging API"**
5. Click **Enable**

### 1.2 Generate Web Push Certificate

1. Go to **Firebase Console** → **Project Settings** → **Cloud Messaging**
2. Scroll to **Web configuration**
3. Under **Web Push certificates**, click **Generate key pair**
4. Copy the generated key (starts with `B...`)
5. Save it as `VITE_FIREBASE_VAPID_KEY` in your environment variables

## Step 2: Update Environment Variables

Add to `.env.local`:

```env
VITE_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE
```

And to `.env.production`:

```env
VITE_FIREBASE_VAPID_KEY=YOUR_PRODUCTION_VAPID_KEY
```

## Step 3: Create FCM Service

Create `src/services/fcm/index.ts`:

```typescript
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';

/**
 * Request notification permission and register FCM token
 */
export async function registerFCMToken(userId: string): Promise<string | null> {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return null;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Get messaging instance
    const messaging = getMessaging();
    
    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    });
    
    if (!token) {
      console.error('No FCM token received');
      return null;
    }

    // Save token to Firestore
    await setDoc(doc(db, 'users', userId), {
      fcmToken: token,
      lastTokenUpdate: new Date(),
    }, { merge: true });
    
    console.log('FCM token registered:', token);
    return token;
  } catch (error) {
    console.error('Error registering FCM token:', error);
    return null;
  }
}

/**
 * Set up listener for foreground messages
 */
export function setupFCMListener() {
  const messaging = getMessaging();
  
  onMessage(messaging, (payload) => {
    console.log('FCM message received:', payload);
    
    const { notification, data } = payload;
    
    if (notification) {
      // Show notification
      showNotification(notification.title || '', {
        body: notification.body || '',
        icon: '/icon-192x192.png',
        badge: '/badge-icon.png',
        data: data || {},
      });
    }
  });
}

/**
 * Show browser notification
 */
function showNotification(title: string, options: NotificationOptions) {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, options);
    });
  } else {
    // Fallback for browsers without service worker
    new Notification(title, options);
  }
}

/**
 * Unregister FCM token (on logout)
 */
export async function unregisterFCMToken(userId: string): Promise<void> {
  try {
    await setDoc(doc(db, 'users', userId), {
      fcmToken: null,
      lastTokenUpdate: new Date(),
    }, { merge: true });
    
    console.log('FCM token unregistered');
  } catch (error) {
    console.error('Error unregistering FCM token:', error);
  }
}
```

## Step 4: Create Service Worker

Create or update `public/firebase-messaging-sw.js`:

```javascript
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in service worker
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  
  const notificationTitle = payload.notification.title || 'ChastityOS';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: '/icon-192x192.png',
    badge: '/badge-icon.png',
    data: payload.data || {},
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.link || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if none found
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
```

## Step 5: Register Service Worker

Update `public/sw.js` or create a new one to register the Firebase messaging service worker:

```javascript
// Register Firebase Messaging Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Firebase Messaging SW registered:', registration);
    })
    .catch((error) => {
      console.error('Firebase Messaging SW registration failed:', error);
    });
}
```

## Step 6: Integrate in App

Update `src/App.tsx` or your auth provider:

```typescript
import { useEffect } from 'react';
import { registerFCMToken, setupFCMListener, unregisterFCMToken } from '@/services/fcm';
import { auth } from '@/firebase';

export default function App() {
  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // User logged in - register FCM token
        await registerFCMToken(user.uid);
        
        // Set up foreground message listener
        setupFCMListener();
      } else {
        // User logged out - no action needed
        // Token will be cleaned up on next login
      }
    });

    return unsubscribe;
  }, []);

  // ... rest of app
}
```

## Step 7: Add Notification Preferences UI

Create settings page for notification preferences:

```typescript
// src/components/settings/NotificationSettings.tsx
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';

interface NotificationPreferences {
  tasks: {
    assigned: boolean;
    submitted: boolean;
    approved: boolean;
    rejected: boolean;
    deadlineApproaching: boolean;
    overdue: boolean;
  };
  sessions: {
    completed: boolean;
    endingSoon: boolean;
    pauseExpired: boolean;
  };
  relationships: {
    newRequest: boolean;
    emergencyUnlock: boolean;
  };
  pushEnabled: boolean;
}

export default function NotificationSettings({ userId }: { userId: string }) {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  async function loadPreferences() {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const data = userDoc.data();
    setPrefs(data?.settings?.notifications || getDefaultPreferences());
  }

  async function updatePreferences(newPrefs: Partial<NotificationPreferences>) {
    const updated = { ...prefs, ...newPrefs };
    await setDoc(doc(db, 'users', userId), {
      settings: {
        notifications: updated
      }
    }, { merge: true });
    setPrefs(updated);
  }

  function getDefaultPreferences(): NotificationPreferences {
    return {
      tasks: {
        assigned: true,
        submitted: true,
        approved: true,
        rejected: true,
        deadlineApproaching: true,
        overdue: true,
      },
      sessions: {
        completed: true,
        endingSoon: true,
        pauseExpired: true,
      },
      relationships: {
        newRequest: true,
        emergencyUnlock: true,
      },
      pushEnabled: true,
    };
  }

  // ... render UI with toggles for each preference
}
```

## Step 8: Test Notifications

### Test Locally

1. Start your app: `npm run dev`
2. Open in browser (must be HTTPS or localhost)
3. Allow notifications when prompted
4. Check browser console for FCM token
5. Verify token is saved in Firestore

### Test from Cloud Functions

Using Firebase CLI:

```bash
firebase functions:shell
```

Then call:

```javascript
sendNotificationToUser('user-id', 'Test Title', 'Test Body', { test: 'data' })
```

### Test from Client

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const sendNotification = httpsCallable(functions, 'sendPushNotification');

await sendNotification({
  token: 'fcm-token-here',
  title: 'Test Notification',
  body: 'This is a test',
  data: { type: 'test' },
  priority: 'high'
});
```

## Troubleshooting

### Notifications Not Appearing

1. **Check permission**: `Notification.permission` should be `'granted'`
2. **Verify token**: Check Firestore for `fcmToken` in user document
3. **Check service worker**: Open DevTools → Application → Service Workers
4. **View console logs**: Look for FCM-related messages
5. **Test in incognito**: Rules out cached service worker issues

### Token Not Saving

1. Ensure Firestore rules allow writes to user document
2. Check browser console for errors
3. Verify `userId` is correct
4. Test with Firebase Emulator

### Background Notifications Not Working

1. Ensure service worker is registered
2. Check service worker scope
3. Verify Firebase config in service worker
4. Test with app closed

### Permission Denied

1. Reset site permissions in browser settings
2. Try in different browser
3. Ensure HTTPS (not HTTP)

## Security Best Practices

1. **Never expose VAPID key in client code** - use environment variables
2. **Validate tokens server-side** - don't trust client-provided tokens
3. **Implement token refresh** - tokens can expire
4. **Rate limit notifications** - prevent spam
5. **Respect user preferences** - honor opt-out settings

## Performance Optimization

1. **Register token once per session** - cache in memory
2. **Batch notification requests** - when possible
3. **Use data messages** - more efficient than notification messages
4. **Implement notification throttling** - avoid overwhelming users
5. **Clean up old tokens** - remove inactive tokens from database

## Analytics

Track notification metrics:

```typescript
// Track notification sent
gtag('event', 'notification_sent', {
  type: 'task_assigned',
  userId: userId,
});

// Track notification clicked
gtag('event', 'notification_clicked', {
  type: 'task_assigned',
  userId: userId,
});

// Track notification permission
gtag('event', 'notification_permission', {
  result: Notification.permission,
});
```

## Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications Guide](https://web.dev/notifications/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)

## Next Steps

1. Implement notification preferences UI
2. Add notification history/log
3. Set up A/B testing for notification content
4. Implement rich notifications with actions
5. Add notification grouping and stacking

## Support

For issues:
1. Check Firebase Console → Cloud Messaging
2. Review function logs: `npm run functions:logs`
3. Test with Firebase Emulator
4. Check browser console for errors
