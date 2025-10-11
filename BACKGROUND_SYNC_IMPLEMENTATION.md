# Background Sync Implementation - Issue #392

## Overview

This document describes the Background Sync & Retry Logic implementation for ChastityOS, enabling reliable offline operation with automatic synchronization when the connection is restored.

## Features Implemented

### 1. SyncQueueService
A comprehensive queue management service with exponential backoff retry logic.

**Location**: `/src/services/sync/SyncQueueService.ts`

**Key Methods**:
- `addToQueue(operation, collectionName, data)` - Add operation to queue
- `processSyncQueue()` - Process all queued operations
- `getStatus()` - Get current sync status
- `getStats()` - Get queue statistics
- `triggerSync()` - Manually trigger sync
- `subscribe(callback)` - Subscribe to status changes

**Retry Logic**:
- Max 3 attempts per operation
- Exponential backoff: 1s → 2s → 4s
- Operations removed after max retries exceeded

### 2. Service Worker Enhancement
Enhanced service worker with Background Sync API support and retry logic.

**Location**: `/public/sw-custom.js`

**Features**:
- Background Sync event handling
- Exponential backoff implementation
- Workbox integration for caching
- Client notification system
- Error handling and recovery

**Supported Events**:
- `sync` - Triggers when connection restored
- `message` - Communication with clients
- SKIP_WAITING - Immediate activation

### 3. React Integration

#### useSyncStatus Hook
React hook for monitoring sync status.

**Location**: `/src/hooks/useSyncStatus.ts`

```typescript
const {
  syncStatus,    // "idle" | "syncing" | "synced" | "error"
  stats,         // { total, pending, failed, lastSyncTime, lastSyncStatus }
  isOnline,      // boolean
  lastSyncTime,  // Date | undefined
  triggerSync,   // () => Promise<void>
  refreshStats   // () => Promise<void>
} = useSyncStatus();
```

#### SyncIndicator Component
Visual component for displaying sync status.

**Location**: `/src/components/ui/SyncIndicator.tsx`

```typescript
// Compact mode (for headers)
<SyncIndicator compact />

// Full mode with stats (for settings)
<SyncIndicator showStats showLastSync />
```

**Features**:
- Shows sync icon (spinning, check, error)
- Displays last sync time
- Manual sync button
- Offline warning
- Queue statistics display

### 4. Integration Points

#### SyncContext
The existing SyncContext has been enhanced to use background sync.

**Location**: `/src/contexts/SyncContext.tsx`

```typescript
export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  // Initialize background sync for offline queue
  useBackgroundSync();
  
  // ... rest of implementation
};
```

#### Settings Page
Sync status indicator added to Settings > Data section.

**Location**: `/src/pages/SettingsPage.tsx`

Users can:
- View current sync status
- See queue statistics
- Manually trigger sync
- View last sync time

## Architecture

### Flow Diagram

```
┌─────────────────┐
│  User Action    │
│ (offline)       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  SyncQueueService       │
│  addToQueue()           │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  IndexedDB              │
│  (offlineQueue)         │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Connection Restored    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Service Worker         │
│  sync event             │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  SyncQueueService       │
│  processSyncQueue()     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Retry with Backoff     │
│  (max 3 attempts)       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Firebase Sync          │
│  syncCollection()       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Update UI Status       │
│  (via subscriptions)    │
└─────────────────────────┘
```

## Usage Examples

### Adding Operations to Queue

```typescript
import { syncQueueService } from "@/services/sync/SyncQueueService";

// Queue a task submission
await syncQueueService.addToQueue("create", "tasks", {
  id: "task-123",
  userId: "user-456",
  title: "Complete daily check-in",
  status: "pending",
  // ... other task data
});

// Queue a session update
await syncQueueService.addToQueue("update", "sessions", {
  id: "session-789",
  userId: "user-456",
  isPaused: true,
  // ... other session data
});
```

### Monitoring Sync Status

```typescript
import { useSyncStatus } from "@/hooks/useSyncStatus";

function SyncMonitor() {
  const { syncStatus, stats, isOnline, triggerSync } = useSyncStatus();
  
  return (
    <div>
      <div>Status: {syncStatus}</div>
      <div>Pending Operations: {stats?.pending || 0}</div>
      <div>Failed Operations: {stats?.failed || 0}</div>
      <div>Connection: {isOnline ? "Online" : "Offline"}</div>
      
      <button 
        onClick={triggerSync}
        disabled={!isOnline || syncStatus === "syncing"}
      >
        Sync Now
      </button>
    </div>
  );
}
```

### Using the SyncIndicator Component

```typescript
// In a header component
import { SyncIndicator } from "@/components/ui";

function Header() {
  return (
    <header>
      <Logo />
      <Navigation />
      <SyncIndicator compact />
    </header>
  );
}

// In settings page
function SettingsDataSection() {
  return (
    <div>
      <h2>Sync Status</h2>
      <SyncIndicator showStats showLastSync />
    </div>
  );
}
```

## Testing

### Unit Tests
Location: `/src/services/sync/__tests__/SyncQueueService.test.ts`

Run tests:
```bash
npm run test:unit -- src/services/sync/__tests__/SyncQueueService.test.ts
```

Test coverage:
- Status management
- Subscription handling
- Retry logic calculations
- Last sync time tracking

### Manual Testing

#### Offline Sync Test
1. Open the app while online
2. Open DevTools > Application > Service Workers
3. Check "Offline" checkbox
4. Perform actions (create task, update session, etc.)
5. Verify actions are queued (check Settings > Data)
6. Uncheck "Offline"
7. Verify sync starts automatically
8. Check that queued operations are processed

#### Retry Logic Test
1. Go offline
2. Queue several operations
3. Modify network to simulate intermittent connection
4. Observe retry attempts with increasing delays
5. Verify operations succeed after retries

#### UI Feedback Test
1. Navigate to Settings > Data
2. Verify SyncIndicator shows current status
3. Go offline - verify "Offline" message appears
4. Queue operations - verify pending count increases
5. Go online - verify "Syncing..." status shows
6. After sync - verify "Synced" status with timestamp

## Configuration

### Retry Settings
Edit `/src/services/sync/SyncQueueService.ts`:

```typescript
class SyncQueueService {
  private readonly MAX_RETRIES = 3;        // Maximum retry attempts
  private readonly BASE_DELAY = 1000;      // Base delay in milliseconds
  
  // Exponential backoff: BASE_DELAY * (2 ^ retryCount)
  // 0: 1s, 1: 2s, 2: 4s, 3: 8s
}
```

### Service Worker Strategy
Edit `/configs/build/vite.config.js`:

```javascript
VitePWA({
  strategies: "injectManifest",  // Use custom service worker
  srcDir: "public",
  filename: "sw-custom.js",
  // ... other settings
})
```

## Browser Support

### Full Support (Background Sync API)
- Chrome 67+
- Edge 79+
- Opera 54+
- Chrome Android

### Fallback (Immediate Sync)
- Safari (all versions)
- Firefox (all versions)

The implementation automatically falls back to immediate synchronization on browsers that don't support the Background Sync API.

## Troubleshooting

### Sync Not Processing
1. Check if service worker is registered:
   - DevTools > Application > Service Workers
2. Verify IndexedDB contains queued operations:
   - DevTools > Application > IndexedDB > ChastityOS > offlineQueue
3. Check browser console for errors
4. Verify network connection is actually restored

### Operations Not Queuing
1. Verify `addToQueue()` is being called
2. Check IndexedDB permissions
3. Look for JavaScript errors in console
4. Ensure user is authenticated

### Retry Logic Not Working
1. Verify retry count is below MAX_RETRIES
2. Check that enough time has passed (exponential backoff)
3. Look for errors in service worker console
4. Verify operation structure is correct

### UI Not Updating
1. Check that component is using `useSyncStatus` hook
2. Verify subscriptions are not being unsubscribed prematurely
3. Check React DevTools for component state
4. Ensure SyncContext is properly wrapping the app

## Performance Considerations

### Queue Size
- Monitor queue size in production
- Large queues (>100 operations) may cause delays
- Consider implementing queue size limits

### Battery Impact
- Background sync respects browser battery-saving modes
- Sync may be delayed when battery is low
- Consider showing user notification for delayed syncs

### Network Usage
- Operations are batched when possible
- Firebase batching automatically handles multiple operations
- Consider implementing data compression for large payloads

## Future Improvements

- [ ] Implement queue size limits
- [ ] Add operation prioritization
- [ ] Support selective sync (urgent vs. background)
- [ ] Implement conflict resolution UI
- [ ] Add sync progress indicators
- [ ] Support partial operation sync
- [ ] Implement sync event analytics
- [ ] Add queue persistence across sessions

## Related Documentation

- [PWA.md](./docs/PWA.md) - Progressive Web App features
- [Issue #392](https://github.com/thef4tdaddy/chastityOS/issues/392) - Original issue
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)

## Support

For issues or questions about the background sync implementation:
1. Check this documentation
2. Review the [PWA documentation](./docs/PWA.md)
3. Open an issue on GitHub
4. Contact the development team
