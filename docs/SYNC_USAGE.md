# Firebase Sync Service Usage Guide

This guide shows how to integrate and use the Firebase Sync Service in the ChastityOS application.

## Quick Start

### 1. Add SyncProvider to Your App

Wrap your app with the SyncProvider to enable sync functionality:

```typescript
// src/App.tsx or src/main.tsx
import { SyncProvider } from '@/contexts/SyncContext';

function App() {
  return (
    <SyncProvider>
      {/* Your app components */}
    </SyncProvider>
  );
}
```

### 2. Use Sync Status in Components

Display sync status to users:

```typescript
// src/components/Header.tsx
import { SyncStatusIndicator } from '@/components/common/SyncStatusIndicator';

export const Header = () => {
  return (
    <header>
      <h1>ChastityOS</h1>
      <SyncStatusIndicator />
    </header>
  );
};
```

### 3. Access Sync State in Components

Use the sync context to access sync state and trigger operations:

```typescript
import { useSyncContext } from '@/contexts/SyncContext';

export const SettingsPage = () => {
  const { isSyncing, hasConflicts, triggerSync } = useSyncContext();

  const handleManualSync = async () => {
    try {
      await triggerSync();
      toast.success('Sync completed successfully');
    } catch (error) {
      toast.error('Sync failed: ' + error.message);
    }
  };

  return (
    <div>
      <button 
        onClick={handleManualSync} 
        disabled={isSyncing}
      >
        {isSyncing ? 'Syncing...' : 'Sync Now'}
      </button>
      
      {hasConflicts && (
        <div className="alert alert-warning">
          Data conflicts detected. Please resolve them.
        </div>
      )}
    </div>
  );
};
```

## Advanced Usage

### Manual Sync Operations

For more control over sync operations, use the `useSync` hook directly:

```typescript
import { useSync } from '@/hooks/useSync';

export const DataManagementPage = () => {
  const { sync, lastSyncResult, error } = useSync();

  const handleFullSync = async () => {
    const result = await sync(userId, {
      force: true, // Force full sync
      collections: ['sessions', 'tasks'], // Specific collections
      conflictResolution: 'manual' // Force manual resolution
    });

    console.log('Sync result:', result);
    // result.operations.uploaded - number of uploaded items
    // result.operations.downloaded - number of downloaded items  
    // result.operations.conflicts - number of conflicts detected
  };

  const handlePartialSync = async () => {
    // Sync only specific collections
    await sync(userId, {
      collections: ['settings'],
      conflictResolution: 'auto'
    });
  };

  return (
    <div>
      <button onClick={handleFullSync}>Full Sync</button>
      <button onClick={handlePartialSync}>Sync Settings Only</button>
      
      {error && (
        <div className="error">Sync Error: {error.message}</div>
      )}
      
      {lastSyncResult && (
        <div className="sync-stats">
          <p>Last sync: {lastSyncResult.timestamp.toLocaleString()}</p>
          <p>Uploaded: {lastSyncResult.operations.uploaded}</p>
          <p>Downloaded: {lastSyncResult.operations.downloaded}</p>
          <p>Conflicts: {lastSyncResult.operations.conflicts}</p>
        </div>
      )}
    </div>
  );
};
```

### Custom Conflict Resolution

Handle conflicts programmatically:

```typescript
import { useSync } from '@/hooks/useSync';

export const ConflictManager = () => {
  const { pendingConflicts, resolveConflicts } = useSync();

  const handleAutoResolveAll = async () => {
    // Auto-resolve all conflicts (choose local version)
    const resolutions = pendingConflicts.reduce((acc, conflict, index) => {
      acc[`${conflict.collection}-${conflict.documentId}-${index}`] = 'local';
      return acc;
    }, {} as Record<string, 'local' | 'remote'>);

    await resolveConflicts(resolutions);
  };

  const handleResolveSpecific = async (conflictIndex: number, choice: 'local' | 'remote') => {
    const conflict = pendingConflicts[conflictIndex];
    const resolutions = {
      [`${conflict.collection}-${conflict.documentId}-${conflictIndex}`]: choice
    };

    await resolveConflicts(resolutions);
  };

  return (
    <div>
      <h2>Pending Conflicts ({pendingConflicts.length})</h2>
      
      {pendingConflicts.map((conflict, index) => (
        <div key={index} className="conflict-item">
          <h3>{conflict.collection} - {conflict.documentId}</h3>
          <p>Detected: {conflict.detectedAt.toLocaleString()}</p>
          
          <button onClick={() => handleResolveSpecific(index, 'local')}>
            Keep Local
          </button>
          <button onClick={() => handleResolveSpecific(index, 'remote')}>
            Keep Remote
          </button>
        </div>
      ))}
      
      {pendingConflicts.length > 1 && (
        <button onClick={handleAutoResolveAll}>
          Resolve All (Keep Local)
        </button>
      )}
    </div>
  );
};
```

### Monitoring Sync Performance

Track sync performance and user experience:

```typescript
import { useSync } from '@/hooks/useSync';

export const SyncMonitor = () => {
  const { lastSyncResult, isSyncing } = useSync();
  const [syncMetrics, setSyncMetrics] = useState({
    totalSyncs: 0,
    averageDuration: 0,
    conflictRate: 0,
  });

  useEffect(() => {
    if (lastSyncResult) {
      // Track sync metrics
      const duration = Date.now() - lastSyncResult.timestamp.getTime();
      const hasConflicts = lastSyncResult.operations.conflicts > 0;
      
      setSyncMetrics(prev => ({
        totalSyncs: prev.totalSyncs + 1,
        averageDuration: (prev.averageDuration + duration) / 2,
        conflictRate: hasConflicts ? (prev.conflictRate + 1) / prev.totalSyncs : prev.conflictRate,
      }));

      // Send metrics to analytics
      analytics.track('sync_completed', {
        success: lastSyncResult.success,
        duration,
        uploaded: lastSyncResult.operations.uploaded,
        downloaded: lastSyncResult.operations.downloaded,
        conflicts: lastSyncResult.operations.conflicts,
      });
    }
  }, [lastSyncResult]);

  return (
    <div className="sync-metrics">
      <h3>Sync Performance</h3>
      <p>Total Syncs: {syncMetrics.totalSyncs}</p>
      <p>Average Duration: {syncMetrics.averageDuration.toFixed(0)}ms</p>
      <p>Conflict Rate: {(syncMetrics.conflictRate * 100).toFixed(1)}%</p>
      
      {isSyncing && <div className="sync-indicator">Syncing...</div>}
    </div>
  );
};
```

## Integration with Existing Hooks

### TanStack Query Integration

The sync system automatically invalidates relevant queries. You can also manually trigger invalidation:

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { useSyncContext } from '@/contexts/SyncContext';

export const TasksPage = () => {
  const queryClient = useQueryClient();
  const { lastSyncTime } = useSyncContext();

  // Queries will be automatically invalidated after sync
  const { data: tasks } = useQuery({
    queryKey: ['tasks', userId],
    queryFn: () => taskDBService.findByUserId(userId),
  });

  useEffect(() => {
    // Optional: additional cache invalidation logic
    if (lastSyncTime) {
      queryClient.invalidateQueries(['tasks']);
    }
  }, [lastSyncTime, queryClient]);

  return (
    <div>
      {tasks?.map(task => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  );
};
```

### Database Service Integration

The sync system works with existing database services. Ensure you mark data as pending sync:

```typescript
import { taskDBService } from '@/services/database';
import { useSyncContext } from '@/contexts/SyncContext';

export const useTaskManager = () => {
  const { triggerSync } = useSyncContext();

  const createTask = async (taskData: Omit<DBTask, 'id' | 'lastModified' | 'syncStatus'>) => {
    // Create task locally
    const taskId = await taskDBService.create(taskData);
    
    // Trigger sync to upload to Firebase
    try {
      await triggerSync();
    } catch (error) {
      // Sync will retry automatically or when back online
      console.warn('Failed to sync immediately, will retry later:', error);
    }

    return taskId;
  };

  const updateTask = async (taskId: string, updates: Partial<DBTask>) => {
    await taskDBService.update(taskId, updates);
    
    // Trigger sync
    await triggerSync().catch(console.warn);
  };

  return { createTask, updateTask };
};
```

## Error Handling

### Sync Errors

Handle different types of sync errors appropriately:

```typescript
import { useSync } from '@/hooks/useSync';

export const SyncErrorHandler = () => {
  const { error, clearError, sync } = useSync();

  const handleRetrySync = async () => {
    clearError();
    try {
      await sync(userId);
    } catch (err) {
      // Error will be set in useSync state
      console.error('Retry failed:', err);
    }
  };

  if (!error) return null;

  const getErrorMessage = (error: Error) => {
    if (error.message.includes('offline')) {
      return 'You are offline. Changes will sync when connection is restored.';
    }
    if (error.message.includes('auth')) {
      return 'Authentication error. Please sign in again.';
    }
    if (error.message.includes('permission')) {
      return 'Permission denied. Please check your account settings.';
    }
    return 'Sync failed. Please try again.';
  };

  return (
    <div className="sync-error">
      <p>{getErrorMessage(error)}</p>
      <button onClick={handleRetrySync}>Retry Sync</button>
      <button onClick={clearError}>Dismiss</button>
    </div>
  );
};
```

### Offline Handling

The system automatically handles offline scenarios, but you can provide additional UX:

```typescript
import { connectionStatus } from '@/services/sync/connectionStatus';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(connectionStatus.getIsOnline());

  useEffect(() => {
    const unsubscribe = connectionStatus.subscribe(setIsOnline);
    return unsubscribe;
  }, []);

  if (isOnline) return null;

  return (
    <div className="offline-banner">
      <p>You are offline. Changes will be saved locally and synced when you reconnect.</p>
    </div>
  );
};
```

## Best Practices

### 1. Minimize Manual Syncs
Let the automatic sync handle most scenarios. Only trigger manual syncs for critical operations.

### 2. Handle Conflicts Gracefully
Design your UI to handle conflicts smoothly without disrupting user workflow.

### 3. Provide Sync Feedback
Always show sync status to users so they understand what's happening.

### 4. Test Offline Scenarios
Test your app thoroughly in offline mode to ensure good user experience.

### 5. Monitor Performance
Track sync performance and user conflict resolution patterns to improve the system.

### 6. Graceful Degradation
Ensure your app works even if sync fails temporarily.

## Common Patterns

### Auto-save with Sync

```typescript
const useAutoSave = (data: any, userId: string) => {
  const { sync } = useSync();
  const debouncedSync = useMemo(
    () => debounce(() => sync(userId).catch(console.warn), 1000),
    [sync, userId]
  );

  useEffect(() => {
    debouncedSync();
  }, [data, debouncedSync]);
};
```

### Sync Status in Forms

```typescript
const TaskForm = () => {
  const { isSyncing } = useSyncContext();
  
  return (
    <form>
      {/* form fields */}
      <button type="submit" disabled={isSyncing}>
        {isSyncing ? 'Saving...' : 'Save Task'}
      </button>
    </form>
  );
};
```

This sync system provides a robust foundation for data synchronization while maintaining a smooth user experience across all scenarios.