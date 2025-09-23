# ChastityOS Architecture Overview

ChastityOS uses a modern, scalable architecture designed for offline-first operation, real-time sync, and maintainable code structure.

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                USER INTERFACE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  React Components (UI Only)  │  React Context (Auth/App)  │  Zustand (UI)  │
├─────────────────────────────────────────────────────────────────────────────┤
│                            BUSINESS LOGIC LAYER                            │
├─────────────────────────────────────────────────────────────────────────────┤
│     Custom Hooks (API)      │    Services Layer         │  TanStack Query  │
├─────────────────────────────────────────────────────────────────────────────┤
│                              DATA LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│    Firebase (Cloud)    ←→    Dexie (Local)    ←→    Cache (Memory)         │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Architecture

### Primary Data Flow
```
Firebase (Source of Truth) ↔ Dexie (Local Storage) ↔ TanStack Query (Cache) ↔ React Components
```

### State Management Flow
```
Server State: Firebase → Dexie → TanStack Query → Components
UI State:     User Action → Zustand Store → Components
Auth State:   Firebase Auth → React Context → Components
```

## 📊 Layer Responsibilities

### 1. Presentation Layer (React Components)
**Location**: `src/components/`
**Responsibility**: UI rendering and user interaction only

```javascript
// ✅ GOOD: UI component with proper separation
function SessionTracker() {
  const { data: session, isLoading } = useSessionQuery();
  const { isModalOpen, openModal } = useUIStore();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="session-tracker">
      <SessionTimer session={session} />
      <button onClick={openModal}>Settings</button>
    </div>
  );
}

// ❌ BAD: Business logic in component
function SessionTracker() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Don't put API calls in components
    firebase.firestore().collection('sessions').get()...
  }, []);

  const endSession = () => {
    // Don't put business logic in components
    const endTime = new Date();
    firebase.firestore()...
  };
}
```

**Rules**:
- NO business logic
- NO direct API calls
- NO data processing
- ONLY UI rendering and event handling

### 2. Business Logic Layer (Services & Hooks)
**Location**: `src/services/`, `src/hooks/`
**Responsibility**: All business logic, data processing, and API orchestration

```javascript
// Service Layer Example
export class SessionService {
  static async startSession(userId: string): Promise<ChastitySession> {
    const session = {
      id: generateId(),
      userId,
      startTime: new Date(),
      status: 'active',
      // ... business logic here
    };

    // Save to local storage first (optimistic)
    await DexieStorage.sessions.add(session);

    // Sync to Firebase
    await FirebaseAPI.sessions.create(session);

    return session;
  }
}

// Hook Layer Example
export function useSessionMutations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: SessionService.startSession,
    onSuccess: (newSession) => {
      // Update cache
      queryClient.setQueryData(['session', newSession.userId], newSession);

      // Optimistic updates
      queryClient.invalidateQueries(['sessions']);
    },
    onError: (error) => {
      // Handle errors, rollback if needed
      console.error('Failed to start session:', error);
    }
  });
}
```

### 3. Data Layer (Firebase + Dexie + Cache)

#### Firebase (Cloud Database)
**Responsibility**: Source of truth, multi-device sync, real-time updates

```javascript
// Firebase structure
{
  users: {
    [userId]: {
      profile: { name, email, preferences },
      sessions: {
        [sessionId]: { startTime, endTime, status, ... }
      },
      events: {
        [eventId]: { type, timestamp, data, ... }
      },
      tasks: {
        [taskId]: { title, status, assignedBy, ... }
      }
    }
  }
}
```

#### Dexie (Local Database)
**Responsibility**: Offline storage, fast queries, optimistic updates

```javascript
// Dexie schema
export class ChastityDatabase extends Dexie {
  sessions: Table<ChastitySession>;
  events: Table<SessionEvent>;
  tasks: Table<Task>;

  constructor() {
    super('ChastityOS');
    this.version(1).stores({
      sessions: '++id, userId, startTime, endTime, status',
      events: '++id, sessionId, type, timestamp',
      tasks: '++id, userId, status, createdAt',
    });
  }
}
```

#### TanStack Query (Cache Layer)
**Responsibility**: Server state management, background sync, optimistic updates

```javascript
// Query configuration
export const sessionQueries = {
  current: (userId: string) => ({
    queryKey: ['session', 'current', userId],
    queryFn: () => SessionService.getCurrentSession(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,   // 30 minutes
    retry: 3,
  }),

  history: (userId: string) => ({
    queryKey: ['sessions', 'history', userId],
    queryFn: () => SessionService.getSessionHistory(userId),
    staleTime: 1000 * 60 * 10, // 10 minutes
  }),
};
```

## 🎛️ State Management Strategy

### Server State (TanStack Query)
**Use for**: Data from Firebase/API, cached responses, server-driven state

```javascript
// ✅ GOOD: Server state management
const { data: sessions, isLoading, error } = useQuery({
  queryKey: ['sessions', userId],
  queryFn: () => SessionService.getSessions(userId),
});

const startSessionMutation = useMutation({
  mutationFn: SessionService.startSession,
  onSuccess: () => {
    queryClient.invalidateQueries(['sessions']);
  },
});
```

### UI State (Zustand)
**Use for**: Modal states, form states, UI preferences, temporary client state

```javascript
// ✅ GOOD: UI state management
interface UIStore {
  modals: {
    settings: boolean;
    confirmation: boolean;
  };
  forms: {
    sessionForm: Partial<SessionFormData>;
  };
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

const useUIStore = create<UIStore>((set) => ({
  modals: { settings: false, confirmation: false },
  forms: { sessionForm: {} },
  preferences: { theme: 'light', notifications: true },

  openModal: (modal: keyof UIStore['modals']) =>
    set((state) => ({ modals: { ...state.modals, [modal]: true } })),

  closeModal: (modal: keyof UIStore['modals']) =>
    set((state) => ({ modals: { ...state.modals, [modal]: false } })),
}));
```

### App State (React Context)
**Use for**: Authentication, global app state, theme context

```javascript
// ✅ GOOD: App state management
interface AuthContext {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const value = {
    user,
    isAuthenticated: !!user,
    login: async (credentials) => { /* auth logic */ },
    logout: async () => { /* logout logic */ },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

## 🔄 Data Synchronization Strategy

### Offline-First Architecture
1. **Write Local First**: All mutations go to Dexie immediately
2. **Optimistic Updates**: Update UI immediately with local data
3. **Background Sync**: Sync to Firebase in background
4. **Conflict Resolution**: Handle conflicts when coming back online

### Sync Flow
```
User Action → Local Update (Dexie) → UI Update → Background Sync (Firebase)
                     ↓                              ↓
               Optimistic UI                   Success/Error
                     ↓                              ↓
              Show Immediate Feedback         Update UI Status
```

### Implementation Example
```javascript
export class SyncService {
  static async createSession(sessionData: CreateSessionData) {
    const optimisticSession = {
      ...sessionData,
      id: generateTempId(),
      syncStatus: 'pending',
      createdAt: new Date(),
    };

    // 1. Save locally first
    await DexieStorage.sessions.add(optimisticSession);

    // 2. Update UI immediately
    queryClient.setQueryData(['sessions'], (old) => [optimisticSession, ...old]);

    try {
      // 3. Sync to Firebase in background
      const firebaseSession = await FirebaseAPI.sessions.create(sessionData);

      // 4. Update local record with Firebase ID
      await DexieStorage.sessions.update(optimisticSession.id, {
        id: firebaseSession.id,
        syncStatus: 'synced',
      });

      // 5. Update cache with real data
      queryClient.setQueryData(['sessions'], (old) =>
        old.map(s => s.id === optimisticSession.id ? firebaseSession : s)
      );

    } catch (error) {
      // 6. Handle sync failure
      await DexieStorage.sessions.update(optimisticSession.id, {
        syncStatus: 'failed',
        syncError: error.message,
      });

      // Show error to user, queue for retry
      SyncQueue.addFailedOperation('createSession', sessionData);
    }
  }
}
```

## 🔗 Inter-Layer Communication

### Component → Service Communication
```javascript
// Components call services through hooks
function SessionTracker() {
  const { mutate: startSession } = useStartSessionMutation();

  const handleStart = () => {
    startSession({ userId: user.id });
  };

  return <button onClick={handleStart}>Start Session</button>;
}
```

### Service → Data Communication
```javascript
// Services coordinate between data sources
export class SessionService {
  static async getCurrentSession(userId: string) {
    // Try local first for speed
    const localSession = await DexieStorage.sessions
      .where('userId').equals(userId)
      .and(s => s.status === 'active')
      .first();

    if (localSession && !this.needsRefresh(localSession)) {
      return localSession;
    }

    // Fetch from Firebase if needed
    const firebaseSession = await FirebaseAPI.sessions.getCurrent(userId);

    // Update local storage
    if (firebaseSession) {
      await DexieStorage.sessions.put(firebaseSession);
    }

    return firebaseSession;
  }
}
```

## 📐 Architectural Patterns

### Repository Pattern
```javascript
export interface SessionRepository {
  findById(id: string): Promise<ChastitySession | null>;
  findByUserId(userId: string): Promise<ChastitySession[]>;
  create(session: CreateSessionData): Promise<ChastitySession>;
  update(id: string, updates: Partial<ChastitySession>): Promise<void>;
  delete(id: string): Promise<void>;
}

export class FirebaseSessionRepository implements SessionRepository {
  // Firebase implementation
}

export class DexieSessionRepository implements SessionRepository {
  // Dexie implementation
}
```

### Service Layer Pattern
```javascript
export class SessionService {
  constructor(
    private firebaseRepo: FirebaseSessionRepository,
    private localRepo: DexieSessionRepository,
    private syncService: SyncService
  ) {}

  async startSession(userId: string): Promise<ChastitySession> {
    // Business logic here
    const session = await this.localRepo.create({ userId, startTime: new Date() });
    this.syncService.queueSync('sessions', session.id);
    return session;
  }
}
```

### Observer Pattern for Real-time Updates
```javascript
export class RealtimeService {
  private listeners = new Map<string, (data: any) => void>();

  subscribe(collection: string, callback: (data: any) => void) {
    this.listeners.set(collection, callback);

    // Firebase real-time listener
    return firebase.firestore()
      .collection(collection)
      .onSnapshot(callback);
  }

  notify(collection: string, data: any) {
    const callback = this.listeners.get(collection);
    if (callback) callback(data);
  }
}
```

## 🎯 Architecture Benefits

### Scalability
- **Horizontal**: Easy to add new features without touching existing code
- **Vertical**: Clear separation allows independent scaling of each layer

### Maintainability
- **Single Responsibility**: Each layer has one clear purpose
- **Dependency Injection**: Easy to swap implementations for testing
- **Type Safety**: TypeScript ensures contract compliance across layers

### Performance
- **Offline First**: App works without network connection
- **Optimistic Updates**: Immediate feedback to users
- **Smart Caching**: TanStack Query handles cache invalidation

### Developer Experience
- **Clear Boundaries**: Developers know exactly where code belongs
- **Predictable Patterns**: Consistent patterns across the application
- **Easy Testing**: Each layer can be tested independently

## 🔄 Migration Strategy

The architecture supports gradual migration from the current codebase:

1. **Phase 1**: Establish patterns, move configs, create foundation
2. **Phase 2**: Implement data layer (Dexie + TanStack Query)
3. **Phase 3**: Migrate components to service layer pattern
4. **Phase 4**: Add TypeScript and comprehensive testing
5. **Phase 5**: Performance optimization and polish

This allows maintaining 100% feature parity while modernizing the architecture incrementally.