# Progressive Web App (PWA) Features

## Overview

ChastityOS implements full Progressive Web App functionality, enabling offline support, app installation, and background synchronization.

## Features

### 1. App Installation

Users can install ChastityOS as a native-like app on their device:

- **Install Prompt**: A custom prompt appears when the app can be installed
- **Home Screen Icon**: Once installed, the app appears on the device's home screen
- **Standalone Mode**: Runs in its own window without browser UI
- **App Shortcuts**: Quick actions available from the home screen icon

#### Supported Platforms

- **Android**: Chrome, Edge, Samsung Internet
- **iOS/iPadOS**: Safari 16.4+ (Add to Home Screen)
- **Desktop**: Chrome, Edge, Opera

### 2. Offline Functionality

The app continues to work even without an internet connection:

- **Core Features Offline**: Session tracking, timer, and UI remain functional
- **Offline Queue**: Actions performed offline are queued for sync
- **Background Sync**: Automatically syncs data when connection returns
- **Cache Management**: Static assets and resources are cached efficiently

#### What Works Offline

- ✅ Active session timer continues running
- ✅ View current session data
- ✅ Navigate between pages
- ✅ Access cached data
- ✅ Queue events, tasks, and settings changes

#### What Requires Connection

- ❌ Starting new sessions (requires Firebase)
- ❌ Fetching fresh data from server
- ❌ Authenticating with Google
- ❌ Real-time sync with keyholder

### 3. Service Worker

The service worker provides offline functionality and caching:

- **Workbox Integration**: Uses Workbox for robust caching strategies
- **Background Sync**: Processes offline queue when connection restored
- **Update Management**: Notifies users when new version is available
- **Cache Strategies**:
  - Documents: NetworkFirst (30 day cache)
  - Static Resources: StaleWhileRevalidate
  - Images: CacheFirst (30 day cache)

### 4. Update Notifications

Users are notified when a new version is available:

- **Update Prompt**: Non-intrusive notification appears at top of screen
- **Manual Updates**: Users can choose when to update
- **Automatic Reload**: App refreshes after update is applied
- **Version Management**: Seamless updates without data loss

## Technical Implementation

### Service Worker Registration

Service worker is registered automatically on app start:

```typescript
// In App.tsx
import { useBackgroundSync } from "./hooks/api/useBackgroundSync";

function App() {
  const { registerBackgroundSync } = useBackgroundSync();
  
  useEffect(() => {
    // Register background sync on app start
    registerBackgroundSync();
  }, []);
}
```

### Install Manager

```typescript
import { pwaInstallManager } from "@/services/pwa";

// Check if app can be installed
const canInstall = pwaInstallManager.canInstall();

// Prompt user to install
const success = await pwaInstallManager.promptInstall();

// Listen for install availability
const unsubscribe = pwaInstallManager.onInstallAvailable((canInstall) => {
  console.log("Install available:", canInstall);
});
```

### Update Manager

```typescript
import { pwaUpdateManager } from "@/services/pwa";

// Check for updates
await pwaUpdateManager.checkForUpdates();

// Apply pending update
await pwaUpdateManager.applyUpdate();

// Listen for updates
const unsubscribe = pwaUpdateManager.onUpdateAvailable(() => {
  console.log("Update available");
});
```

### Background Sync

The offline queue is automatically synced when connection is restored:

```typescript
import { offlineQueue } from "@/services/sync/OfflineQueue";

// Queue an operation
await offlineQueue.queueOperation({
  type: "create",
  collectionName: "events",
  userId: "user123",
  data: { /* ... */ },
});

// Process queue manually
await offlineQueue.processQueue();

// Get queue statistics
const stats = await offlineQueue.getQueueStats();
```

### Connection Status

Monitor online/offline status:

```typescript
import { connectionStatus } from "@/services/sync/connectionStatus";

// Get current status
const isOnline = connectionStatus.getIsOnline();

// Subscribe to changes
const unsubscribe = connectionStatus.subscribe((isOnline) => {
  console.log("Connection status:", isOnline ? "Online" : "Offline");
});
```

## Configuration

### Manifest Configuration

The PWA manifest is configured in `vite.config.js`:

```javascript
manifest: {
  name: "ChastityOS",
  short_name: "ChastityOS",
  description: "Modern chastity tracking and FLR management app",
  start_url: "/",
  display: "standalone",
  background_color: "#282132",
  theme_color: "#581c87",
  orientation: "portrait-primary",
  // ... icons, shortcuts, screenshots
}
```

### Service Worker Configuration

Workbox configuration in `vite.config.js`:

```javascript
workbox: {
  globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff,woff2}"],
  runtimeCaching: [
    // Cache strategies for different resource types
  ],
  skipWaiting: false,
  clientsClaim: true,
}
```

## Testing

### Testing Installation

1. Build the app: `npm run build`
2. Serve locally: `npm run preview`
3. Open in a PWA-supported browser
4. Look for install prompt or browser install button

### Testing Offline Mode

1. Start the app while online
2. Open DevTools > Application > Service Workers
3. Check "Offline" checkbox
4. Verify app continues to work
5. Perform actions (they should be queued)
6. Uncheck "Offline"
7. Verify queued actions are synced

### Testing Updates

1. Make a change to the code
2. Build a new version: `npm run build`
3. Deploy the new version
4. Keep the old version running in a browser
5. Reload the page
6. Verify update notification appears
7. Click "Update Now"
8. Verify app reloads with new version

## Browser Support

### Full Support (Install + Offline)

- Chrome 67+ (Desktop & Android)
- Edge 79+
- Opera 54+
- Samsung Internet 8.2+

### Partial Support (Offline Only)

- Safari 11.1+ (iOS & macOS)
- Firefox 44+ (Service Workers only, no install)

### No Support

- Internet Explorer (not supported by Vite)
- Legacy browsers without Service Worker support

## Troubleshooting

### Install Prompt Not Showing

- Ensure app is served over HTTPS (required for PWA)
- Check that manifest.webmanifest is accessible
- Verify icons are correct size and format
- Some browsers only show prompt after multiple visits

### Offline Mode Not Working

- Check Service Worker is registered (DevTools > Application)
- Verify cache storage is not full
- Clear cache and re-register service worker
- Check browser console for errors

### Background Sync Not Processing

- Verify browser supports Background Sync API
- Check network is actually restored
- Look for IndexedDB errors
- Ensure offline queue is not empty

### Updates Not Applying

- Service worker may be cached by browser
- Try hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- Check "Update on reload" in DevTools
- Verify new service worker is in "waiting" state

## Best Practices

1. **Test Offline Regularly**: Ensure critical features work without connection
2. **Monitor Queue Size**: Large queues can cause sync delays
3. **Handle Conflicts**: Implement proper conflict resolution for sync
4. **Clear Old Caches**: Remove outdated service worker caches
5. **Notify Users**: Keep users informed of sync status and updates
6. **Graceful Degradation**: Disable features that require network gracefully

## Future Enhancements

- [ ] Periodic background sync for checking updates
- [ ] Push notifications for keyholder actions
- [ ] Advanced conflict resolution strategies
- [ ] Selective sync based on data priority
- [ ] Storage quota management
- [ ] Web Share API integration
- [ ] Shortcuts for common actions
