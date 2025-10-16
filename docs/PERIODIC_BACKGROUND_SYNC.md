# Periodic Background Sync

## Overview

The Periodic Background Sync feature enables automatic data refresh every 15 minutes while the app is closed or in the background. This ensures users always have the latest information when they open the app.

## Features

### Data Refreshed

- **Active session status** - Current chastity session state
- **Pending tasks** - Tasks assigned by keyholder
- **Unread notifications** - New notifications and updates
- **Recent events** - Latest logged events
- **Badge count** - App icon badge with unread count

### Settings & Controls

- **Enable/Disable** - Toggle periodic sync on/off
- **Battery-Aware** - Automatically pauses when battery is low (<20%)
- **Sync Interval** - Fixed at 15 minutes (browser minimum)
- **Last Sync Time** - Display when data was last refreshed

## Technical Implementation

### Architecture

```
┌─────────────────┐
│   Service       │
│   Worker        │◄──── periodicsync event
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Periodic Sync  │
│    Service      │◄──── Settings from localStorage
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Firebase      │
│   Firestore     │◄──── Fetch latest data
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Local Cache    │
│  & Badge API    │◄──── Update cache & badge
└─────────────────┘
```

### Key Components

#### 1. PeriodicSyncService (`src/services/sync/PeriodicSyncService.ts`)

Core service managing periodic sync lifecycle:

- Singleton pattern for single instance
- Browser feature detection
- Settings persistence in localStorage
- Firebase data fetching
- Local cache updates
- Badge count management

#### 2. usePeriodicSync Hook (`src/hooks/api/usePeriodicSync.ts`)

React hook providing interface to periodic sync:

- Settings management
- Registration/unregistration
- Service worker message handling
- State synchronization

#### 3. PeriodicSyncSection Component (`src/components/settings/PeriodicSyncSection.tsx`)

Settings UI for user control:

- Toggle switches for enable/disable
- Battery-aware option
- Last sync time display
- Feature availability check

#### 4. Service Worker Handler (`public/sw-custom.js`)

Handles `periodicsync` events:

- Listens for sync triggers
- Notifies client app
- Coordinates data refresh

## Browser Support

### Supported Browsers

- **Chrome/Edge 80+** - Full support
- **Android Chrome** - Full support
- **Opera** - Full support

### Unsupported Browsers

- **Firefox** - Not yet supported
- **Safari/iOS** - Not yet supported

The feature gracefully degrades in unsupported browsers with a clear message to users.

## Usage

### Enabling Periodic Sync

1. Navigate to **Settings → Sync**
2. Toggle **Enable Periodic Sync** to ON
3. Optionally enable **Battery-Aware Syncing**
4. Click **Save Changes**

### Disabling Periodic Sync

1. Navigate to **Settings → Sync**
2. Toggle **Enable Periodic Sync** to OFF
3. Click **Save Changes**

## API Reference

### PeriodicSyncService

```typescript
class PeriodicSyncService {
  // Get singleton instance
  static getInstance(): PeriodicSyncService;

  // Check browser support
  isSupported(): boolean;

  // Get current settings
  getSettings(): PeriodicSyncSettings;

  // Update settings
  updateSettings(settings: Partial<PeriodicSyncSettings>): Promise<void>;

  // Register periodic sync
  register(): Promise<void>;

  // Unregister periodic sync
  unregister(): Promise<void>;

  // Refresh app data
  refreshAppData(userId: string | null): Promise<void>;

  // Get last sync timestamp
  getLastSyncTime(): number | undefined;
}
```

### PeriodicSyncSettings

```typescript
interface PeriodicSyncSettings {
  enabled: boolean;
  intervalMinutes: number;
  lastSyncTime?: number;
  batteryAware: boolean;
}
```

## Configuration

### Sync Interval

The minimum sync interval is **15 minutes**, enforced by browsers to prevent battery drain. This cannot be configured to a lower value.

### Battery Awareness

When enabled, syncing pauses if:

- Battery level is below 20%
- Device is not charging

## Development

### Testing

Run unit tests:

```bash
npm run test:unit -- src/services/sync/__tests__/PeriodicSyncService.test.ts
```

### Building

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Troubleshooting

### Sync Not Working

1. **Check browser support**
   - Verify you're using Chrome/Edge 80+
   - Check if periodic sync is enabled in browser settings

2. **Check settings**
   - Ensure "Enable Periodic Sync" is ON
   - Verify user is signed in

3. **Check battery**
   - If battery-aware is enabled, ensure battery > 20% or device is charging

4. **Check service worker**
   - Open DevTools → Application → Service Workers
   - Verify service worker is active

### Last Sync Time Not Updating

This could indicate:

- Sync is disabled
- Browser denied permission
- Service worker not running
- Network connectivity issues

## Performance

### Battery Impact

- Minimal battery usage (browser-optimized)
- Battery-aware feature prevents drain on low battery
- Respects system battery saver mode

### Network Usage

- Efficient queries (limit 10 items per collection)
- Only fetches changed data
- Caches results locally

### Memory Usage

- Singleton pattern prevents multiple instances
- Automatic cleanup of old cache data
- Small memory footprint (~1-2MB)

## Security

- All data fetched over HTTPS
- Firebase security rules enforced
- User authentication required
- No sensitive data stored in localStorage

## Future Enhancements

Potential improvements:

- [ ] Configurable sync interval (when browsers support it)
- [ ] Smart sync based on app usage patterns
- [ ] Offline queue sync integration
- [ ] More granular data refresh options
- [ ] Sync history and analytics
- [ ] Conflict resolution for concurrent updates

## Related Issues

- Parent Issue: #392 - Background Sync & Push Notifications
- Related: Background Sync for offline queue

## References

- [Periodic Background Sync API](https://web.dev/periodic-background-sync/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Battery Status API](https://developer.mozilla.org/en-US/docs/Web/API/Battery_Status_API)
- [Badging API](https://web.dev/badging-api/)
