# Directory Structure Documentation

This document explains the organized directory structure for ChastityOS and the purpose of each directory.

## 📁 Complete Project Structure

```
src/
├── components/           # UI components only (NO business logic)
│   ├── ui/              # Reusable UI components (buttons, inputs, etc.)
│   ├── forms/           # Form components
│   ├── modals/          # Modal components
│   └── layout/          # Layout components (header, nav, etc.)
├── hooks/               # Custom React hooks
│   ├── api/            # TanStack Query hooks (server state)
│   ├── state/          # Zustand store hooks (UI state)
│   ├── ui/             # UI-specific hooks
│   └── utils/          # Utility hooks
├── services/           # Business logic layer (NO UI)
│   ├── api/           # Firebase API services
│   ├── storage/       # Dexie local storage services
│   ├── auth/          # Authentication services
│   └── sync/          # Firebase ↔ Dexie sync services
├── stores/            # Zustand stores (UI state only)
│   ├── ui/           # UI state stores (modals, forms)
│   └── cache/        # Cache management stores
├── utils/            # Pure utility functions
│   ├── validation/   # Form validation utilities
│   ├── formatting/   # Data formatting utilities
│   ├── constants/    # App constants and enums
│   └── helpers/      # General helper functions
├── contexts/         # React contexts
│   ├── auth/        # Authentication context
│   └── app/         # App-level state context
└── types/           # TypeScript type definitions
    ├── api/         # API types
    ├── ui/          # UI component types
    └── core/        # Core business types
```

## 🏗️ Directory Purposes

### `/src/components/` - UI Only Layer
**Purpose**: Pure UI rendering and user interaction
**Rules**:
- NO business logic
- NO direct API calls
- NO data processing
- ONLY UI rendering and event handling

```javascript
// ✅ GOOD: Pure UI component
function SessionTracker({ session, onStart, onPause }) {
  return (
    <div className="session-tracker">
      <Timer duration={session?.duration} />
      <button onClick={onStart}>Start</button>
      <button onClick={onPause}>Pause</button>
    </div>
  );
}

// ❌ BAD: Business logic in component
function SessionTracker() {
  const startSession = async () => {
    const data = { /* session data */ };
    await firebase.firestore().collection('sessions').add(data); // NO!
  };
}
```

#### Subdirectories:
- **`ui/`**: Reusable components (Button, Input, Modal, Card, etc.)
- **`forms/`**: Form-specific components (SessionForm, TaskForm, etc.)
- **`modals/`**: Modal dialogs (ConfirmModal, SettingsModal, etc.)
- **`layout/`**: Layout components (Header, Navigation, Footer, etc.)

### `/src/services/` - Business Logic Layer
**Purpose**: All business logic, data operations, and API interactions
**Rules**:
- ALL Firebase interactions
- ALL data processing and validation
- ALL business rules and calculations
- NO UI components or JSX

```javascript
// ✅ GOOD: Service layer
export class SessionService {
  static async startSession(data: StartSessionData): Promise<ChastitySession> {
    // 1. Validate data
    this.validateSessionData(data);

    // 2. Save to local storage (optimistic)
    const localSession = await DexieStorage.sessions.add(data);

    // 3. Sync to Firebase
    const firebaseSession = await FirebaseAPI.sessions.create(data);

    return firebaseSession;
  }
}
```

#### Subdirectories:
- **`api/`**: Firebase API services (SessionService, TaskService, EventService)
- **`storage/`**: Dexie local storage services (DexieSessionStorage, etc.)
- **`auth/`**: Authentication services (AuthService, KeyholderService)
- **`sync/`**: Data synchronization services (SyncService, ConflictResolver)

### `/src/hooks/` - React Hooks Layer
**Purpose**: Connect React components to services and state management

#### Subdirectories:
- **`api/`**: TanStack Query hooks for server state
- **`state/`**: Zustand store hooks for UI state
- **`ui/`**: UI-specific hooks (useLocalStorage, useDebounce)
- **`utils/`**: Utility hooks (useAsync, useEventListener)

```javascript
// api/ - TanStack Query hooks
export function useCurrentSession(userId: string) {
  return useQuery({
    queryKey: ['session', 'current', userId],
    queryFn: () => SessionService.getCurrentSession(userId),
  });
}

// state/ - Zustand hooks
export function useUIStore() {
  return useStore(uiStore);
}
```

### `/src/stores/` - State Management Layer
**Purpose**: Zustand stores for UI state only

#### Subdirectories:
- **`ui/`**: UI state (modals, forms, preferences)
- **`cache/`**: Cache management (rarely used)

```javascript
// ui/ - UI state only
interface UIStore {
  modals: {
    settings: boolean;
    confirmation: boolean;
  };
  forms: {
    sessionForm: Partial<SessionFormData>;
  };
  openModal: (modal: string) => void;
  closeModal: (modal: string) => void;
}

// ❌ NEVER store server data in Zustand
interface BadStore {
  sessions: ChastitySession[]; // NO! Use TanStack Query
  currentUser: User;           // NO! Use React Context
}
```

### `/src/utils/` - Utility Functions Layer
**Purpose**: Pure utility functions with no side effects

#### Subdirectories:
- **`validation/`**: Form and data validation
- **`formatting/`**: Data formatting (dates, durations, etc.)
- **`constants/`**: App constants and enums
- **`helpers/`**: General helper functions

```javascript
// validation/
export function validateSessionData(data: SessionFormData): ValidationResult {
  const errors: string[] = [];

  if (!data.userId) errors.push('User ID is required');
  if (data.goalDuration && data.goalDuration < 0) {
    errors.push('Goal duration must be positive');
  }

  return { isValid: errors.length === 0, errors };
}

// formatting/
export function formatDuration(milliseconds: number): string {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

// constants/
export const SESSION_STATUSES = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  ENDED: 'ended',
} as const;

// helpers/
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
```

### `/src/contexts/` - React Context Layer
**Purpose**: App-level state (auth, global settings)

#### Subdirectories:
- **`auth/`**: Authentication context
- **`app/`**: App-level state context

```javascript
// auth/
interface AuthContext {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

// app/
interface AppContext {
  theme: 'light' | 'dark';
  isOnline: boolean;
  notifications: NotificationSettings;
}
```

### `/src/types/` - TypeScript Definitions
**Purpose**: TypeScript type definitions organized by domain

#### Subdirectories:
- **`api/`**: API request/response types
- **`ui/`**: UI component prop types
- **`core/`**: Core business domain types

```typescript
// core/
export interface ChastitySession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  status: SessionStatus;
  goalDuration?: number;
  pauseStates: PauseState[];
}

// api/
export interface CreateSessionRequest {
  userId: string;
  goalDuration?: number;
  notes?: string;
}

export interface SessionResponse {
  session: ChastitySession;
  success: boolean;
  message?: string;
}

// ui/
export interface SessionTrackerProps {
  session?: ChastitySession;
  onStart?: () => void;
  onPause?: () => void;
  className?: string;
}
```

## 🔄 Data Flow Between Directories

```
User Interaction → Components → Hooks → Services → Storage/API
                      ↑           ↑        ↑
                   UI State   Server    Business
                  (Zustand)   State     Logic
                             (TanStack)
```

### Example Flow: Starting a Session

1. **Component** (`/components/tracker/SessionTracker.jsx`):
   ```javascript
   function SessionTracker() {
     const { mutate: startSession } = useStartSessionMutation();
     return <button onClick={() => startSession()}>Start</button>;
   }
   ```

2. **Hook** (`/hooks/api/useSessionMutations.js`):
   ```javascript
   export function useStartSessionMutation() {
     return useMutation({
       mutationFn: SessionService.startSession,
       onSuccess: () => queryClient.invalidateQueries(['sessions']),
     });
   }
   ```

3. **Service** (`/services/api/session-service.js`):
   ```javascript
   export class SessionService {
     static async startSession(data) {
       await DexieStorage.sessions.add(data);
       return await FirebaseAPI.sessions.create(data);
     }
   }
   ```

4. **Storage** (`/services/storage/dexie-storage.js`):
   ```javascript
   export class DexieStorage {
     static sessions = {
       add: (data) => db.sessions.add(data),
       get: (id) => db.sessions.get(id),
     };
   }
   ```

## 🛡️ Architectural Enforcement

### ESLint Rules (Future)
```javascript
// Prevent business logic in components
'no-firebase-in-components': 'error',
'no-api-calls-in-components': 'error',
'require-service-layer': 'error',

// Enforce proper imports
'no-direct-storage-import': 'error', // Must go through services
'no-zustand-server-data': 'error',   // Zustand for UI only
```

### Import Restrictions
```javascript
// ✅ ALLOWED in components
import { useCurrentSession } from '../hooks/api/use-session-query';
import { useUIStore } from '../hooks/state/use-ui-store';

// ❌ FORBIDDEN in components
import { firebase } from '../firebase';           // Use services instead
import { DexieStorage } from '../storage/dexie'; // Use hooks instead
import { SessionService } from '../services';    // Use hooks instead
```

## 📋 Migration Strategy

### Phase 1: Structure Creation ✅
- Created directory structure
- Documented patterns and rules

### Phase 2: Service Layer Implementation
- Move business logic from components to services
- Implement TanStack Query hooks
- Create Zustand stores for UI state

### Phase 3: Component Refactoring
- Refactor components to be pure UI
- Remove direct API calls from components
- Implement proper error boundaries

### Phase 4: Type Safety
- Add comprehensive TypeScript types
- Implement strict ESLint rules
- Add architectural compliance tests

This directory structure enforces clean architecture patterns and makes the codebase more maintainable, testable, and scalable.