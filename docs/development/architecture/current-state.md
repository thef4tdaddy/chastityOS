# Current State Documentation

This document describes the current state of ChastityOS directories and files as of v4.0.0-nightly.1, including what exists and what needs to be migrated.

## 📁 Current Directory State

### `/src/utils/` - Utility Functions (Partially Populated)

#### Existing Files:
- **`eventTypes.js`** - Event type definitions and validation
- **`hash.js`** - Hashing utilities for data integrity
- **`logging.js`** - Centralized logging utility (already following patterns!)
- **`publicProfile.js`** - Public profile data handling

#### Created Subdirectories (Ready for Organization):
- **`constants/`** - App constants and enums (empty, ready for migration)
- **`formatting/`** - Data formatting utilities (empty, ready for migration)
- **`helpers/`** - General helper functions (empty, ready for migration)
- **`validation/`** - Form and data validation (empty, ready for migration)

### `/src/services/` - Business Logic Layer (Structure Created)

#### Created Subdirectories (Ready for Implementation):
- **`api/`** - Firebase API services (empty, ready for implementation)
- **`auth/`** - Authentication services (empty, ready for implementation)
- **`storage/`** - Dexie local storage services (empty, ready for implementation)
- **`sync/`** - Firebase ↔ Dexie sync services (empty, ready for implementation)

## 🔍 Current File Analysis

### `src/utils/logging.js` ✅ Already Following Patterns
```javascript
// This file already follows our architectural patterns!
const isDevelopment = import.meta.env.DEV;

export const logger = {
  debug: (message, ...args) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },

  info: (message, ...args) => {
    console.log(`[INFO] ${message}`, ...args);
  },

  warn: (message, ...args) => {
    console.warn(`[WARN] ${message}`, ...args);
  },

  error: (message, ...args) => {
    console.error(`[ERROR] ${message}`, ...args);
    // Could send to error reporting service in production
  }
};
```

### `src/utils/eventTypes.js` - Event Type Definitions
```javascript
// Current content - needs organization into constants/
export const EVENT_TYPES = {
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  SESSION_PAUSE: 'session_pause',
  SESSION_RESUME: 'session_resume',
  ORGASM: 'orgasm',
  AROUSAL_LEVEL: 'arousal_level',
  // ... more event types
};
```

### `src/utils/hash.js` - Hashing Utilities
```javascript
// Current content - cryptographic utilities
export function generateHash(data) {
  // SHA-256 hashing implementation
}

export function verifyHash(data, hash) {
  // Hash verification
}
```

### `src/utils/publicProfile.js` - Public Profile Logic
```javascript
// Current content - business logic that should move to services/
export function createPublicProfile(userData) {
  // This should move to services/api/profile-service.js
}

export function validateProfileData(data) {
  // This should move to utils/validation/profile-validation.js
}
```

## 🔄 Migration Needed

### Files That Need Reorganization:

#### 1. `eventTypes.js` → `utils/constants/event-types.js`
```javascript
// Move to: src/utils/constants/event-types.js
export const EVENT_TYPES = {
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  // ... rest of constants
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];
```

#### 2. `publicProfile.js` → Split into Services and Validation
```javascript
// Business logic → src/services/api/profile-service.js
export class ProfileService {
  static async createPublicProfile(userData: UserData): Promise<PublicProfile> {
    // Business logic here
  }
}

// Validation → src/utils/validation/profile-validation.js
export function validateProfileData(data: ProfileFormData): ValidationResult {
  // Pure validation logic here
}
```

### Components That Need Service Layer Migration:

#### Current State Analysis:
Most components currently contain business logic that should be moved to services:

```javascript
// CURRENT: Business logic in components (needs migration)
function SessionTracker() {
  const [session, setSession] = useState(null);

  const startSession = async () => {
    // This business logic should move to SessionService
    const sessionData = {
      id: generateId(),
      startTime: new Date(),
      userId: auth.currentUser.uid
    };

    await firebase.firestore()
      .collection('sessions')
      .add(sessionData);

    setSession(sessionData);
  };
}

// TARGET: Pure UI component using service layer
function SessionTracker() {
  const { data: session } = useCurrentSession();
  const { mutate: startSession } = useStartSessionMutation();

  return <button onClick={() => startSession()}>Start</button>;
}
```

## 📋 Phase 2 Implementation Plan

### Step 1: Reorganize Existing Utils
- [ ] Move `eventTypes.js` → `utils/constants/event-types.js`
- [ ] Split `publicProfile.js` into service and validation parts
- [ ] Keep `logging.js` and `hash.js` in place (already well organized)

### Step 2: Create Core Services
- [ ] **SessionService** - Session management business logic
- [ ] **TaskService** - Task management business logic
- [ ] **EventService** - Event logging business logic
- [ ] **AuthService** - Authentication business logic
- [ ] **ProfileService** - Profile management business logic

### Step 3: Implement Storage Layer
- [ ] **DexieService** - Local storage abstraction
- [ ] **FirebaseService** - Firebase API abstraction
- [ ] **SyncService** - Data synchronization between Firebase and Dexie

### Step 4: Create TanStack Query Hooks
- [ ] **useSessionQuery** - Session data queries
- [ ] **useSessionMutations** - Session mutations
- [ ] **useTaskQueries** - Task data queries
- [ ] **useEventMutations** - Event logging mutations

### Step 5: Create Zustand Stores
- [ ] **UIStore** - Modal states, form states, UI preferences
- [ ] **NotificationStore** - App notifications and alerts
- [ ] **ThemeStore** - Theme and appearance settings

### Step 6: Refactor Components
- [ ] Remove business logic from all components
- [ ] Replace direct Firebase calls with service hooks
- [ ] Implement proper error handling with logger
- [ ] Add loading and error states

## 🎯 Current Architectural Compliance

### ✅ Already Following Patterns:
- **Logging utility** - `utils/logging.js` implements centralized logging
- **Directory structure** - Organized subdirectories created
- **Configuration organization** - All configs moved to `configs/` directory

### ⚠️ Needs Migration:
- **Business logic in components** - Most components contain Firebase calls
- **Direct API calls** - Components directly call Firebase instead of using services
- **Mixed responsibilities** - `publicProfile.js` contains both business logic and validation
- **No state management** - Currently using basic React state instead of TanStack Query + Zustand

### 🚫 Current Anti-Patterns:
```javascript
// Anti-pattern: Business logic in components
useEffect(() => {
  firebase.firestore().collection('sessions').get()... // Should use service
}, []);

// Anti-pattern: Direct state management
const [sessions, setSessions] = useState([]); // Should use TanStack Query

// Anti-pattern: Manual loading states
const [loading, setLoading] = useState(false); // TanStack Query handles this

// Anti-pattern: Console.log usage
console.log('Session started'); // Should use logger utility
```

## 🔧 Immediate Actions Available

### Ready for Implementation:
1. **Service Layer Creation** - Empty service directories are ready
2. **Utils Organization** - Subdirectories created for proper organization
3. **TanStack Query Integration** - Can start implementing query hooks
4. **Zustand Store Creation** - Can start with UI state management

### Prerequisites Complete:
- ✅ Directory structure created
- ✅ Documentation written
- ✅ Architectural patterns defined
- ✅ Migration strategy planned
- ✅ Quality tools configured (ESLint, Prettier)

The foundation is solid and ready for Phase 2 implementation of the data layer modernization!