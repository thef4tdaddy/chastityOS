# Offline Sync & Background Sync

This document describes the offline sync and background sync implementation in ChastityOS.

## Overview

ChastityOS implements a comprehensive offline-first sync system that:
- Queues all data changes when offline
- Automatically syncs when connection is restored
- Retries failed operations with exponential backoff
- Provides real-time sync status to users
- Ensures no data loss during offline usage

## Architecture

### Components

#### 1. SyncQueueService (`src/services/sync/SyncQueueService.ts`)

The main service for managing the offline sync queue.

**Key Features:**
- Queue management (add, remove, clear operations)
- Automatic sync on reconnection
- Exponential backoff retry logic (30s, 60s, 120s)
- Max 3 retry attempts per operation
- Queue statistics and operation status tracking

**Usage:**
```typescript
import { syncQueueService } from '@/services/sync';

// Add operation to queue
await syncQueueService.addToQueue(
  'create',
  'tasks',
  taskData,
  userId
);

// Process queue manually
await syncQueueService.processSyncQueue();

// Get queue statistics
const stats = await syncQueueService.getQueueStats();
```

#### 2. OfflineQueue (`src/services/sync/OfflineQueue.ts`)

Lower-level queue implementation using Dexie/IndexedDB.

**Key Features:**
- Persistent storage in IndexedDB
- Operation retry tracking
- Exponential backoff calculation
- Queue statistics

#### 3. Service Worker (`public/sw-custom.js`)

Handles background sync events from the browser.

**Key Features:**
- Background Sync API integration
- Retry logic with exponential backoff
- Progress notifications to clients
- Error handling and reporting

**Sync Event:**
```javascript
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-queue-sync') {
    event.waitUntil(processOfflineQueue());
  }
});
```

#### 4. useSyncStatus Hook (`src/hooks/useSyncStatus.ts`)

React hook for accessing sync status in components.

**Returns:**
- `status`: Current sync status ('syncing', 'synced', 'failed', 'offline', 'idle')
- `isOnline`: Connection status
- `isSyncing`: Whether sync is in progress
- `lastSyncedAt`: Timestamp of last successful sync
- `queueStats`: Queue statistics
- `pendingOperations`: Number of pending operations
- `failedOperations`: Number of failed operations
- `errorMessage`: Current error message if any

**Actions:**
- `manualSync()`: Trigger manual sync
- `retryFailed()`: Retry failed operations
- `clearQueue()`: Clear the sync queue
- `refreshStatus()`: Refresh sync status

**Usage:**
```typescript
import { useSyncStatus } from '@/hooks/useSyncStatus';

function MyComponent() {
  const {
    status,
    isOnline,
    pendingOperations,
    manualSync,
  } = useSyncStatus();

  return (
    <div>
      <span>Status: {status}</span>
      <span>Pending: {pendingOperations}</span>
      <button onClick={manualSync}>Sync Now</button>
    </div>
  );
}
```

### UI Components

#### 1. SyncStatusPanel (`src/components/sync/SyncStatusPanel.tsx`)

Full-featured sync status panel with controls.

**Features:**
- Connection status display
- Last synced timestamp
- Queue statistics
- Error messages
- Manual sync button
- Retry failed operations button
- Clear queue button

**Usage:**
```typescript
import { SyncStatusPanel } from '@/components/sync';

<SyncStatusPanel showDetails={true} />
```

#### 2. HeaderSyncIndicator (`src/components/sync/HeaderSyncIndicator.tsx`)

Compact sync indicator for app header/navigation.

**Features:**
- Minimal space usage
- Shows sync status icon
- Optional label
- Manual sync button
- Hover tooltip with details

**Usage:**
```typescript
import { HeaderSyncIndicator } from '@/components/sync';

<HeaderSyncIndicator showLabel={false} />
```

#### 3. SyncIndicator (`src/components/ui/SyncIndicator.tsx`)

Low-level sync indicator component (used by other components).

## Retry Logic

The sync system implements exponential backoff for retries:

1. **First retry**: 30 seconds after failure
2. **Second retry**: 60 seconds after failure (2^1 * 30s)
3. **Third retry**: 120 seconds after failure (2^2 * 30s)
4. **Max retries**: 3 attempts

After 3 failed attempts, operations are marked as failed and require manual retry.

## Sync Flow

### Normal Operation (Online)

1. User performs an action (e.g., creates a task)
2. Action is saved to local IndexedDB immediately
3. Action is synced to Firebase in the background
4. UI is updated optimistically

### Offline Operation

1. User performs an action while offline
2. Action is saved to local IndexedDB immediately
3. Action is added to the offline queue
4. UI is updated optimistically
5. User sees "Offline" indicator with pending count

### Reconnection

1. App detects connection is restored
2. Service worker registers background sync
3. Queue is processed automatically
4. Failed operations are retried with exponential backoff
5. User sees "Syncing" indicator
6. On completion, user sees "Synced" indicator

## Error Handling

### Sync Failures

When a sync operation fails:
1. Error is logged
2. Retry count is incremented
3. Last retry timestamp is updated
4. Operation remains in queue for next retry
5. User sees "Sync Failed" indicator

### Max Retries Exceeded

When an operation exceeds max retries (3):
1. Operation is marked as failed
2. User sees error indicator
3. User can manually retry via "Retry Failed" button
4. User can clear failed operations via "Clear Queue" button

## Browser Support

### Background Sync API
- ✅ Chrome/Chromium (full support)
- ✅ Edge (full support)
- ✅ Opera (full support)
- ⚠️ Firefox (fallback to manual sync)
- ⚠️ Safari (fallback to manual sync)

### Fallback Behavior

On browsers without Background Sync API support:
- Automatic sync triggers on connection restoration
- Manual sync button always available
- Periodic sync checks (every 10 seconds)
- No background sync when app is closed

## Testing

### Manual Testing Scenarios

#### Test Offline Queue
1. Disconnect from internet (or use Chrome DevTools offline mode)
2. Create/update/delete some data (tasks, sessions, etc.)
3. Verify data appears in local UI
4. Open Settings > Sync tab
5. Verify pending operations count increases
6. Reconnect to internet
7. Verify operations sync automatically
8. Verify pending count decreases to 0

#### Test Retry Logic
1. Use Chrome DevTools Network tab to simulate failures:
   - Set "Slow 3G" to slow down requests
   - Or block specific Firebase requests
2. Create some data
3. Observe retry attempts in console
4. Verify exponential backoff timing
5. Verify max retries (3) before marking as failed

#### Test Manual Sync
1. Have pending operations in queue
2. Click "Sync Now" button in Settings > Sync
3. Verify sync progress indicator
4. Verify operations are processed

#### Test Failed Operations
1. Create operations that will fail (e.g., invalid data)
2. Wait for max retries to be exceeded
3. Verify "Failed" indicator appears
4. Click "Retry Failed" button
5. Verify operations are retried

## Configuration

### Max Retries

To change the maximum number of retries, update:
- `SyncQueueService.ts`: `private readonly MAX_RETRIES = 3;`
- `OfflineQueue.ts`: `private readonly MAX_RETRIES = 3;`
- `sw-custom.js`: `const MAX_RETRIES = 3;`

### Retry Delays

To change the exponential backoff timing, update the calculation in:
- `OfflineQueue.ts`: `const retryDelay = 30 * 1000 * Math.pow(2, op.retryCount || 0);`
- `sw-custom.js`: `const retryDelay = 30 * 1000 * Math.pow(2, retryCount);`

Base delay is 30 seconds. Formula: `baseDelay * 2^retryCount`

### Status Refresh Interval

To change how often sync status refreshes, update:
- `useSyncStatus.ts`: `const interval = setInterval(refreshStatus, 10000);` (10 seconds)

## Security Considerations

### Data Integrity
- All operations are queued with timestamps
- Operations maintain their order in the queue
- Failed operations don't block subsequent operations
- Queue is persistent across app sessions

### Privacy
- All data stays local until synced
- Failed operations remain in local IndexedDB only
- Users can clear queue to remove unsynced data
- No sensitive data is logged

## Performance

### IndexedDB
- Queue operations are async and non-blocking
- Efficient indexing on `retryCount` and `createdAt`
- Automatic cleanup of processed operations

### Network
- Batch operations where possible
- Exponential backoff prevents network spam
- Failed operations don't retry on every check

### UI
- Optimistic updates for better UX
- Status updates are debounced
- Background sync doesn't block UI

## Troubleshooting

### Queue Not Processing
1. Check browser console for errors
2. Verify connection is actually online
3. Check Settings > Sync for queue statistics
4. Try manual sync
5. Check IndexedDB (DevTools > Application > Storage)

### Operations Failing
1. Check browser console for error messages
2. Verify Firebase permissions
3. Check network requests in DevTools
4. Try clearing and recreating the operation
5. Check for data validation issues

### Service Worker Issues
1. Check if service worker is registered (DevTools > Application)
2. Update service worker if needed
3. Try unregistering and re-registering
4. Clear browser cache and reload

## Future Enhancements

Possible improvements for the future:
- Conflict resolution UI for concurrent edits
- Batch sync optimization
- Priority queue for critical operations
- Sync scheduling (sync at specific times)
- Bandwidth-aware sync (WiFi vs cellular)
- Sync pause/resume controls
- Operation cancellation
- Detailed sync history/logs
