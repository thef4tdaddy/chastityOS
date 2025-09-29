# SessionService API Documentation

The SessionService manages chastity session data with Firebase sync, local caching via Dexie, and optimistic updates through TanStack Query.

## 🏗️ Architecture

```
Component → Hook → SessionService → Dexie ↔ Firebase
                                     ↓
                               TanStack Query Cache
```

## 📊 Core Methods

### `getCurrentSession(userId: string): Promise<ChastitySession | null>`

Gets the current active session for a user with local-first optimization.

**Parameters:**

- `userId: string` - The user's Firebase UID

**Returns:**

- `Promise<ChastitySession | null>` - The active session or null if no active session

**Behavior:**

1. Checks local Dexie storage first for speed
2. Returns local data if fresh (within 5 minutes)
3. Fetches from Firebase if stale or missing
4. Updates local storage with Firebase data
5. Automatically handles offline scenarios

**Example:**

```typescript
const session = await SessionService.getCurrentSession("user123");
if (session) {
  console.log("Session started:", session.startTime);
  console.log("Duration:", session.getEffectiveDuration());
}
```

### `startSession(data: StartSessionData): Promise<ChastitySession>`

Starts a new chastity session with optimistic updates.

**Parameters:**

```typescript
interface StartSessionData {
  userId: string;
  goalDuration?: number; // Optional goal in milliseconds
  keyholderRequired?: boolean;
  notes?: string;
}
```

**Returns:**

- `Promise<ChastitySession>` - The created session

**Behavior:**

1. Creates optimistic session immediately in Dexie
2. Updates UI instantly with temporary ID
3. Syncs to Firebase in background
4. Replaces optimistic data with real Firebase data
5. Handles conflicts and errors gracefully

**Example:**

```typescript
const session = await SessionService.startSession({
  userId: "user123",
  goalDuration: 24 * 60 * 60 * 1000, // 24 hours
  keyholderRequired: true,
  notes: "Starting new challenge",
});
```

### `endSession(sessionId: string, reason?: string): Promise<ChastitySession>`

Ends an active session.

**Parameters:**

- `sessionId: string` - ID of the session to end
- `reason?: string` - Optional reason for ending

**Returns:**

- `Promise<ChastitySession>` - The ended session

**Example:**

```typescript
const endedSession = await SessionService.endSession(
  "session456",
  "Completed goal duration",
);
```

### `pauseSession(sessionId: string, reason: string): Promise<ChastitySession>`

Pauses an active session with cooldown protection.

**Parameters:**

- `sessionId: string` - ID of the session to pause
- `reason: string` - Required reason for pausing

**Returns:**

- `Promise<ChastitySession>` - The paused session

**Cooldown Logic:**

- First pause: Immediate
- Subsequent pauses: 4-hour cooldown
- Emergency pauses: Available with longer cooldown

**Example:**

```typescript
const pausedSession = await SessionService.pauseSession(
  "session456",
  "Medical appointment",
);
```

### `resumeSession(sessionId: string): Promise<ChastitySession>`

Resumes a paused session.

**Parameters:**

- `sessionId: string` - ID of the session to resume

**Returns:**

- `Promise<ChastitySession>` - The resumed session

**Example:**

```typescript
const resumedSession = await SessionService.resumeSession("session456");
```

### `getSessionHistory(userId: string, options?: HistoryOptions): Promise<ChastitySession[]>`

Retrieves session history with pagination and filtering.

**Parameters:**

```typescript
interface HistoryOptions {
  limit?: number;
  startAfter?: string; // Session ID for pagination
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: SessionStatus[];
}
```

**Returns:**

- `Promise<ChastitySession[]>` - Array of sessions

**Example:**

```typescript
const recentSessions = await SessionService.getSessionHistory("user123", {
  limit: 10,
  dateRange: {
    start: new Date("2024-01-01"),
    end: new Date(),
  },
});
```

### `updateSession(sessionId: string, updates: Partial<ChastitySession>): Promise<ChastitySession>`

Updates session data with validation.

**Parameters:**

- `sessionId: string` - ID of the session to update
- `updates: Partial<ChastitySession>` - Fields to update

**Returns:**

- `Promise<ChastitySession>` - The updated session

**Validation:**

- Immutable fields cannot be changed (id, userId, startTime)
- Status transitions must be valid
- End time must be after start time

**Example:**

```typescript
const updatedSession = await SessionService.updateSession("session456", {
  notes: "Updated notes",
  goalDuration: 48 * 60 * 60 * 1000, // Extended to 48 hours
});
```

### `deleteSession(sessionId: string): Promise<void>`

Deletes a session (admin only, with confirmation).

**Parameters:**

- `sessionId: string` - ID of the session to delete

**Returns:**

- `Promise<void>`

**Security:**

- Only session owner can delete
- Confirmation required for active sessions
- Audit log entry created

**Example:**

```typescript
await SessionService.deleteSession("session456");
```

## 📈 Analytics Methods

### `getSessionStats(userId: string, period?: StatsPeriod): Promise<SessionStats>`

Gets aggregated session statistics.

**Parameters:**

```typescript
type StatsPeriod = "week" | "month" | "quarter" | "year" | "all";

interface SessionStats {
  totalSessions: number;
  totalDuration: number;
  effectiveDuration: number;
  averageDuration: number;
  longestSession: number;
  goalCompletionRate: number;
  pauseFrequency: number;
  streaks: {
    current: number;
    longest: number;
  };
}
```

**Example:**

```typescript
const stats = await SessionService.getSessionStats("user123", "month");
console.log(`Completion rate: ${stats.goalCompletionRate}%`);
```

### `getSessionTrends(userId: string, granularity: TrendGranularity): Promise<TrendData[]>`

Gets session trend data for charts.

**Parameters:**

```typescript
type TrendGranularity = "daily" | "weekly" | "monthly";

interface TrendData {
  date: Date;
  sessions: number;
  totalDuration: number;
  averageDuration: number;
  goalsMet: number;
}
```

## 🔄 Sync Methods

### `syncPendingChanges(): Promise<SyncResult>`

Manually triggers sync of pending local changes.

**Returns:**

```typescript
interface SyncResult {
  success: boolean;
  syncedSessions: number;
  failedSessions: string[];
  errors: Error[];
}
```

**Example:**

```typescript
const result = await SessionService.syncPendingChanges();
if (!result.success) {
  console.error("Sync errors:", result.errors);
}
```

### `resolveSyncConflicts(conflicts: SyncConflict[]): Promise<void>`

Resolves data conflicts between local and Firebase.

**Parameters:**

```typescript
interface SyncConflict {
  sessionId: string;
  localData: ChastitySession;
  firebaseData: ChastitySession;
  conflictType: "timestamp" | "status" | "data";
}
```

## 🔍 Query Methods (for TanStack Query)

### `getSessionQueryKey(userId: string, sessionId?: string): QueryKey`

Generates consistent query keys for caching.

**Returns:**

- Current session: `['session', 'current', userId]`
- Specific session: `['session', sessionId]`
- Session history: `['sessions', 'history', userId]`
- Session stats: `['sessions', 'stats', userId, period]`

### `getSessionQueryOptions(userId: string): UseQueryOptions`

Pre-configured query options for session data.

**Configuration:**

```typescript
{
  staleTime: 1000 * 60 * 5, // 5 minutes
  gcTime: 1000 * 60 * 30,   // 30 minutes
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
}
```

## 🎯 Hook Integration

### Example: useCurrentSession Hook

```typescript
export function useCurrentSession(userId: string) {
  return useQuery({
    queryKey: SessionService.getSessionQueryKey(userId),
    queryFn: () => SessionService.getCurrentSession(userId),
    ...SessionService.getSessionQueryOptions(userId),
    enabled: !!userId,
  });
}
```

### Example: useStartSessionMutation Hook

```typescript
export function useStartSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: SessionService.startSession,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(["session", "current", variables.userId]);

      // Optimistic update
      const optimisticSession = {
        id: generateTempId(),
        ...variables,
        startTime: new Date(),
        status: "active" as const,
        syncStatus: "pending" as const,
      };

      queryClient.setQueryData(
        ["session", "current", variables.userId],
        optimisticSession,
      );

      return { optimisticSession };
    },
    onSuccess: (data, variables) => {
      // Update with real data
      queryClient.setQueryData(["session", "current", variables.userId], data);
      queryClient.invalidateQueries(["sessions", "history", variables.userId]);
      queryClient.invalidateQueries(["sessions", "stats", variables.userId]);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      queryClient.setQueryData(
        ["session", "current", variables.userId],
        context?.previousSession,
      );
    },
  });
}
```

## 🛡️ Error Handling

### SessionService Errors

```typescript
class SessionServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
  ) {
    super(message);
    this.name = "SessionServiceError";
  }
}

// Error codes:
// 'session-not-found' - Session doesn't exist
// 'session-already-active' - User already has active session
// 'invalid-session-data' - Data validation failed
// 'cooldown-active' - Pause cooldown still active
// 'sync-failed' - Firebase sync failed
// 'permission-denied' - User lacks permission
// 'rate-limited' - Too many requests
```

### Example Error Handling

```typescript
try {
  const session = await SessionService.startSession(data);
} catch (error) {
  if (error instanceof SessionServiceError) {
    switch (error.code) {
      case "session-already-active":
        toast.error("You already have an active session");
        break;
      case "sync-failed":
        toast.warning("Session saved locally, will sync when online");
        break;
      default:
        toast.error(`Failed to start session: ${error.message}`);
    }
  } else {
    logger.error("Unexpected error starting session", error);
    toast.error("An unexpected error occurred");
  }
}
```

## 🔧 Configuration

### Environment Variables

```env
# Firebase configuration
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_API_KEY=your-api-key

# Session defaults
VITE_SESSION_PAUSE_COOLDOWN=14400000  # 4 hours in milliseconds
VITE_SESSION_MAX_DURATION=2592000000  # 30 days in milliseconds
VITE_SESSION_CACHE_TTL=300000         # 5 minutes in milliseconds
```

### Service Configuration

```typescript
const SessionServiceConfig = {
  cache: {
    staleTime: Number(import.meta.env.VITE_SESSION_CACHE_TTL) || 300000,
    gcTime: 1800000, // 30 minutes
  },
  sync: {
    retryAttempts: 3,
    retryDelay: [1000, 2000, 4000], // Exponential backoff
    batchSize: 10, // Max operations per batch
  },
  validation: {
    maxPausesPerDay: 5,
    pauseCooldown:
      Number(import.meta.env.VITE_SESSION_PAUSE_COOLDOWN) || 14400000,
    maxSessionDuration:
      Number(import.meta.env.VITE_SESSION_MAX_DURATION) || 2592000000,
  },
};
```

This SessionService provides robust session management with offline-first operation, optimistic updates, and comprehensive error handling while maintaining excellent developer experience through clear APIs and TypeScript support.
