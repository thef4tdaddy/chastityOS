# Data Flow Architecture

Understanding how data flows through ChastityOS is crucial for maintaining consistency, performance, and reliability.

## 🔄 Primary Data Flow

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌────────────────┐
│   Firebase  │◄──►│    Dexie     │◄──►│ TanStack Query  │◄──►│  React Components │
│ (Cloud DB)  │    │ (Local DB)   │    │ (Server Cache)  │    │   (UI Only)     │
│             │    │              │    │                 │    │                │
│ - Auth      │    │ - Sessions   │    │ - Query Cache   │    │ - Rendering    │
│ - Firestore │    │ - Events     │    │ - Mutations     │    │ - User Input   │
│ - Security  │    │ - Tasks      │    │ - Background    │    │ - State Mgmt   │
│ - Real-time │    │ - Settings   │    │   Refetch       │    │ - Event Handle │
└─────────────┘    └──────────────┘    └─────────────────┘    └────────────────┘
       ▲                   ▲                       ▲                     ▲
       │                   │                       │                     │
       │            ┌─────────────┐         ┌─────────────┐       ┌─────────────┐
       │            │  Sync Queue │         │   Zustand   │       │   Context   │
       │            │ (Background)│         │ (UI State)  │       │ (Auth/App)  │
       │            └─────────────┘         └─────────────┘       └─────────────┘
       │                   │
       └───────────────────┘
```

## 📊 Data Flow Patterns

### 1. Read Operations (Query Flow)

#### Optimistic Local-First Reading
```
Component Request → TanStack Query → Check Cache → Dexie (Local) → Firebase (if needed) → Update Cache → Component
```

**Implementation Example:**
```javascript
export function useCurrentSession(userId: string) {
  return useQuery({
    queryKey: ['session', 'current', userId],
    queryFn: async () => {
      // 1. Try local storage first (fast)
      const localSession = await DexieStorage.sessions
        .where('userId').equals(userId)
        .and(session => session.status === 'active')
        .first();

      // 2. Return local data if fresh
      if (localSession && isDataFresh(localSession.lastUpdated)) {
        return localSession;
      }

      // 3. Fetch from Firebase if stale or missing
      const firebaseSession = await FirebaseAPI.sessions.getCurrent(userId);

      // 4. Update local storage
      if (firebaseSession) {
        await DexieStorage.sessions.put(firebaseSession);
      }

      return firebaseSession;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,   // 30 minutes
  });
}
```

### 2. Write Operations (Mutation Flow)

#### Optimistic Updates with Background Sync
```
User Action → Local Update → UI Update → Background Firebase Sync → Conflict Resolution
```

**Implementation Example:**
```javascript
export function useStartSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (startData: StartSessionData) => {
      const optimisticSession = {
        id: generateTempId(),
        ...startData,
        startTime: new Date(),
        status: 'active' as const,
        syncStatus: 'pending' as const,
      };

      // 1. Save to local storage immediately (optimistic)
      await DexieStorage.sessions.add(optimisticSession);

      // 2. Return optimistic data for immediate UI update
      return optimisticSession;
    },

    onSuccess: async (optimisticSession) => {
      // 3. Update cache with optimistic data
      queryClient.setQueryData(
        ['session', 'current', optimisticSession.userId],
        optimisticSession
      );

      // 4. Sync to Firebase in background
      try {
        const firebaseSession = await FirebaseAPI.sessions.create({
          userId: optimisticSession.userId,
          startTime: optimisticSession.startTime,
        });

        // 5. Replace optimistic data with real Firebase data
        await DexieStorage.sessions.update(optimisticSession.id, {
          id: firebaseSession.id,
          syncStatus: 'synced',
          lastUpdated: new Date(),
        });

        // 6. Update cache with real data
        queryClient.setQueryData(
          ['session', 'current', optimisticSession.userId],
          firebaseSession
        );

      } catch (error) {
        // 7. Handle sync failure
        await DexieStorage.sessions.update(optimisticSession.id, {
          syncStatus: 'failed',
          syncError: error.message,
        });

        // Queue for retry
        SyncQueue.addFailedOperation('createSession', optimisticSession);

        // Show user feedback
        toast.error('Session saved locally, will sync when online');
      }
    },

    onError: async (error, variables) => {
      // Rollback optimistic update
      console.error('Failed to start session:', error);
      queryClient.invalidateQueries(['session', 'current']);
    },
  });
}
```

### 3. Real-time Updates Flow

#### Firebase → Local → Cache → Components
```
Firebase Change → Real-time Listener → Update Dexie → Invalidate Cache → Component Re-render
```

**Implementation Example:**
```javascript
export class RealtimeService {
  private unsubscribeFunctions = new Map<string, () => void>();

  subscribeToUserData(userId: string) {
    // Subscribe to user's session data
    const unsubscribe = firebase.firestore()
      .collection('users')
      .doc(userId)
      .collection('sessions')
      .where('status', '==', 'active')
      .onSnapshot(async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          const sessionData = { id: change.doc.id, ...change.doc.data() };

          if (change.type === 'added' || change.type === 'modified') {
            // Update local storage
            await DexieStorage.sessions.put(sessionData);

            // Invalidate relevant queries
            queryClient.invalidateQueries(['session', 'current', userId]);
            queryClient.invalidateQueries(['sessions', 'history', userId]);
          }

          if (change.type === 'removed') {
            // Remove from local storage
            await DexieStorage.sessions.delete(sessionData.id);

            // Invalidate queries
            queryClient.invalidateQueries(['sessions']);
          }
        }
      });

    this.unsubscribeFunctions.set(`user-${userId}`, unsubscribe);
  }

  unsubscribeFromUserData(userId: string) {
    const unsubscribe = this.unsubscribeFunctions.get(`user-${userId}`);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribeFunctions.delete(`user-${userId}`);
    }
  }
}
```

## 🔄 Sync Strategies

### 1. Conflict Resolution

When data conflicts occur between local and Firebase:

```javascript
export class ConflictResolver {
  static async resolveSessionConflict(
    localSession: ChastitySession,
    firebaseSession: ChastitySession
  ): Promise<ChastitySession> {
    // Rule 1: Firebase wins for start/end times (authoritative)
    // Rule 2: Local wins for temporary pauses (user experience)
    // Rule 3: Merge non-conflicting fields

    const resolved: ChastitySession = {
      ...firebaseSession, // Firebase as base
      id: firebaseSession.id, // Always use Firebase ID

      // Merge pause states (local might have unsync'd pauses)
      pauseStates: this.mergePauseStates(
        localSession.pauseStates,
        firebaseSession.pauseStates
      ),

      // Use latest updated timestamp
      lastUpdated: new Date(Math.max(
        localSession.lastUpdated.getTime(),
        firebaseSession.lastUpdated.getTime()
      )),
    };

    // Save resolved version locally
    await DexieStorage.sessions.put(resolved);

    // Update Firebase if we made changes
    if (!this.areEqual(resolved, firebaseSession)) {
      await FirebaseAPI.sessions.update(resolved.id, resolved);
    }

    return resolved;
  }

  private static mergePauseStates(
    localPauses: PauseState[],
    firebasePauses: PauseState[]
  ): PauseState[] {
    // Merge logic: combine both arrays, dedupe by ID, sort by timestamp
    const allPauses = [...localPauses, ...firebasePauses];
    const unique = allPauses.reduce((acc, pause) => {
      acc[pause.id] = pause;
      return acc;
    }, {} as Record<string, PauseState>);

    return Object.values(unique).sort((a, b) =>
      a.startTime.getTime() - b.startTime.getTime()
    );
  }
}
```

### 2. Background Sync Queue

For handling offline operations:

```javascript
export class SyncQueue {
  private static queue: SyncOperation[] = [];
  private static isProcessing = false;

  static addOperation(operation: SyncOperation) {
    this.queue.push(operation);
    this.processQueue();
  }

  static async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const operation = this.queue.shift()!;

      try {
        await this.executeOperation(operation);
      } catch (error) {
        // Re-queue failed operations with exponential backoff
        operation.retryCount = (operation.retryCount || 0) + 1;

        if (operation.retryCount < 3) {
          setTimeout(() => {
            this.queue.unshift(operation);
            this.processQueue();
          }, Math.pow(2, operation.retryCount) * 1000);
        } else {
          // Save to failed operations for manual review
          await DexieStorage.failedOperations.add({
            ...operation,
            failedAt: new Date(),
            error: error.message,
          });
        }
      }
    }

    this.isProcessing = false;
  }

  private static async executeOperation(operation: SyncOperation) {
    switch (operation.type) {
      case 'createSession':
        await FirebaseAPI.sessions.create(operation.data);
        break;
      case 'updateSession':
        await FirebaseAPI.sessions.update(operation.id, operation.data);
        break;
      case 'deleteSession':
        await FirebaseAPI.sessions.delete(operation.id);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }
}
```

### 3. Cache Invalidation Strategy

Intelligent cache management to balance performance and freshness:

```javascript
export const cacheConfig = {
  // Hot data - frequently accessed, short stale time
  currentSession: {
    staleTime: 1000 * 60 * 1,     // 1 minute
    gcTime: 1000 * 60 * 5,        // 5 minutes
    refetchOnWindowFocus: true,
  },

  // Warm data - occasionally accessed, medium stale time
  sessionHistory: {
    staleTime: 1000 * 60 * 5,     // 5 minutes
    gcTime: 1000 * 60 * 30,       // 30 minutes
    refetchOnWindowFocus: false,
  },

  // Cold data - rarely changes, long stale time
  userSettings: {
    staleTime: 1000 * 60 * 30,    // 30 minutes
    gcTime: 1000 * 60 * 60 * 2,   // 2 hours
    refetchOnWindowFocus: false,
  },
};

// Smart invalidation on mutations
export function useInvalidationStrategy() {
  const queryClient = useQueryClient();

  return {
    invalidateSession: (userId: string) => {
      queryClient.invalidateQueries(['session', 'current', userId]);
      queryClient.invalidateQueries(['sessions', 'history', userId]);
      queryClient.invalidateQueries(['sessions', 'stats', userId]);
    },

    invalidateUserData: (userId: string) => {
      queryClient.invalidateQueries(['user', userId]);
      queryClient.invalidateQueries(['settings', userId]);
    },

    invalidateAll: () => {
      queryClient.invalidateQueries();
    },
  };
}
```

## 📈 Performance Optimizations

### 1. Selective Sync
Only sync changed fields to reduce bandwidth:

```javascript
export class OptimizedSyncService {
  static async updateSession(sessionId: string, updates: Partial<ChastitySession>) {
    const localSession = await DexieStorage.sessions.get(sessionId);
    if (!localSession) throw new Error('Session not found locally');

    // Calculate diff to only send changed fields
    const diff = this.calculateDiff(localSession, updates);

    if (Object.keys(diff).length === 0) {
      return localSession; // No changes to sync
    }

    // Update locally first
    const updatedSession = { ...localSession, ...updates, lastUpdated: new Date() };
    await DexieStorage.sessions.put(updatedSession);

    // Sync only changed fields to Firebase
    await FirebaseAPI.sessions.update(sessionId, {
      ...diff,
      lastUpdated: updatedSession.lastUpdated,
    });

    return updatedSession;
  }

  private static calculateDiff(original: any, updates: any): any {
    const diff: any = {};

    for (const [key, value] of Object.entries(updates)) {
      if (JSON.stringify(original[key]) !== JSON.stringify(value)) {
        diff[key] = value;
      }
    }

    return diff;
  }
}
```

### 2. Batch Operations
Group multiple operations for efficiency:

```javascript
export class BatchOperationService {
  private static pendingOperations: Map<string, any[]> = new Map();
  private static batchTimeout: NodeJS.Timeout | null = null;

  static addToBatch(type: string, operation: any) {
    if (!this.pendingOperations.has(type)) {
      this.pendingOperations.set(type, []);
    }

    this.pendingOperations.get(type)!.push(operation);

    // Debounce batch execution
    if (this.batchTimeout) clearTimeout(this.batchTimeout);

    this.batchTimeout = setTimeout(() => {
      this.executeBatch();
    }, 1000); // 1 second debounce
  }

  private static async executeBatch() {
    for (const [type, operations] of this.pendingOperations) {
      if (operations.length === 0) continue;

      try {
        await this.executeBatchedOperations(type, operations);
      } catch (error) {
        console.error(`Batch ${type} failed:`, error);
        // Handle batch failure - maybe retry individual operations
      }
    }

    this.pendingOperations.clear();
    this.batchTimeout = null;
  }

  private static async executeBatchedOperations(type: string, operations: any[]) {
    switch (type) {
      case 'events':
        await FirebaseAPI.events.createBatch(operations);
        break;
      case 'sessionUpdates':
        await FirebaseAPI.sessions.updateBatch(operations);
        break;
      default:
        throw new Error(`Unknown batch type: ${type}`);
    }
  }
}
```

## 🔍 Monitoring and Debugging

### Data Flow Tracing
```javascript
export class DataFlowTracer {
  private static traces: DataFlowTrace[] = [];

  static trace(operation: string, source: string, target: string, data: any) {
    if (process.env.NODE_ENV === 'development') {
      this.traces.push({
        timestamp: new Date(),
        operation,
        source,
        target,
        dataSize: JSON.stringify(data).length,
        data: process.env.VITE_TRACE_DATA === 'true' ? data : undefined,
      });

      console.group(`🔄 DataFlow: ${operation}`);
      console.log(`${source} → ${target}`);
      console.log(`Data size: ${JSON.stringify(data).length} bytes`);
      if (process.env.VITE_TRACE_DATA === 'true') {
        console.log('Data:', data);
      }
      console.groupEnd();
    }
  }

  static getTraces(filter?: Partial<DataFlowTrace>): DataFlowTrace[] {
    if (!filter) return this.traces;

    return this.traces.filter(trace =>
      Object.entries(filter).every(([key, value]) => trace[key] === value)
    );
  }

  static clearTraces() {
    this.traces = [];
  }
}

interface DataFlowTrace {
  timestamp: Date;
  operation: string;
  source: string;
  target: string;
  dataSize: number;
  data?: any;
}
```

This data flow architecture ensures:
- **Consistency**: Single source of truth with predictable updates
- **Performance**: Optimistic updates with background sync
- **Reliability**: Conflict resolution and retry mechanisms
- **Developer Experience**: Clear patterns and debugging tools