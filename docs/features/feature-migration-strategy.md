# Feature Migration Strategy

This document outlines how to migrate each ChastityOS feature from the current implementation to the new architecture while **preserving 100% functionality**.

## 🎯 Migration Principles

### Core Requirements

1. **Zero Feature Loss** - Every feature must work identically after migration
2. **Zero Downtime** - Features remain functional during migration process
3. **Incremental Migration** - Migrate one feature at a time for safety
4. **Rollback Capability** - Ability to revert any migration if issues arise
5. **Feature Validation** - Comprehensive testing after each migration

### Migration Approach

```
Current Implementation → Adapter Layer → New Implementation → Remove Adapter
                      (Feature works)  (Feature works)    (Feature works)
```

## 🔄 Feature-by-Feature Migration Plan

### Phase 1: Session Management Migration

#### Current State

```javascript
// Current: useChastitySession.js (150+ lines, mixed concerns)
const {
  isCageOn,
  sessionStartTime,
  handleToggleCage,
  handlePauseSession,
  handleResumeSession,
  // ... 20+ more properties/methods
} = useChastitySession();
```

#### Target State

```javascript
// New: Separated concerns with clean interfaces
const session = useCurrentSession(userId); // TanStack Query
const { startSession, endSession } = useSessionMutations(); // Mutations
const { pauseSession, resumeSession } = usePauseControls(); // Pause logic
const { isModalOpen, openModal } = useUIStore(); // UI state only
```

#### Migration Steps

1. **Create SessionService** - Pure business logic for session operations
2. **Create useSessionQuery** - TanStack Query hook for session data
3. **Create useSessionMutations** - Session CRUD operations
4. **Create Session Components** - Pure UI components
5. **Create Adapter Hook** - Bridge old interface to new implementation
6. **Test Feature Parity** - Ensure identical behavior
7. **Replace Old Implementation** - Switch components to use new hooks
8. **Remove Adapter** - Clean up bridging code

#### Implementation Example

```javascript
// Step 1: SessionService (business logic)
export class SessionService {
  static async startSession(userId: string, options: StartSessionOptions) {
    // 1. Validate user can start session
    // 2. Create session record in Dexie (optimistic)
    // 3. Sync to Firebase (background)
    // 4. Return session object
  }

  static async pauseSession(sessionId: string, reason: string) {
    // 1. Validate pause is allowed (cooldown check)
    // 2. Create pause record
    // 3. Update session status
    // 4. Sync changes
  }
}

// Step 2: TanStack Query Hook
export function useCurrentSession(userId: string) {
  return useQuery({
    queryKey: ['session', 'current', userId],
    queryFn: () => SessionService.getCurrentSession(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 30, // 30 seconds for live timer
  });
}

// Step 3: Mutation Hooks
export function useSessionMutations() {
  return {
    startSession: useMutation({
      mutationFn: SessionService.startSession,
      onSuccess: () => queryClient.invalidateQueries(['session']),
    }),
    endSession: useMutation({
      mutationFn: SessionService.endSession,
      onSuccess: () => queryClient.invalidateQueries(['session']),
    }),
  };
}

// Step 4: Adapter Hook (temporary bridge)
export function useChastitySessionAdapter() {
  const session = useCurrentSession(userId);
  const { startSession, endSession } = useSessionMutations();

  // Provide exact same interface as old hook
  return {
    isCageOn: session?.status === 'active',
    sessionStartTime: session?.startTime,
    handleToggleCage: session?.status === 'active' ? endSession : startSession,
    // ... map all old properties to new implementation
  };
}
```

### Phase 2: Task Management Migration

#### Current State

```javascript
// Current: useTasks.js (complex state management)
const {
  tasks,
  addTask,
  updateTask,
  submitTask,
  approveTask,
  // ... many more methods
} = useTasks();
```

#### Target State

```javascript
// New: Clean separation of concerns
const tasks = useTasksQuery(userId); // TanStack Query
const { createTask, updateTask } = useTaskMutations(); // Mutations
const { isCreating, setCreating } = useTaskUIStore(); // UI state
```

#### Migration Steps

1. **Create TaskService** - CRUD operations and business logic
2. **Create useTasksQuery** - Data fetching with TanStack Query
3. **Create useTaskMutations** - Task creation, updates, approvals
4. **Create Task Components** - Pure UI for task display and forms
5. **Create TaskUIStore** - UI state for forms, modals, filters
6. **Test Approval Workflow** - Ensure keyholder approval process works
7. **Migrate Task Pages** - Update TasksPage to use new hooks
8. **Validate Feature Parity** - Test all task workflows

### Phase 3: Event Logging Migration

#### Current State

```javascript
// Current: useEventLog.js (event management)
const {
  events,
  addEvent,
  updateEvent,
  deleteEvent,
  // ... more methods
} = useEventLog();
```

#### Target State

```javascript
// New: Event system with better organization
const events = useEventsQuery(userId, filters); // TanStack Query
const { logEvent, updateEvent } = useEventMutations(); // Mutations
const { selectedFilters } = useEventUIStore(); // UI state
```

#### Migration Steps

1. **Create EventService** - Event CRUD and categorization logic
2. **Create useEventsQuery** - Event fetching with filtering
3. **Create useEventMutations** - Event logging and updates
4. **Create Event Components** - Event forms and display components
5. **Migrate Event Pages** - Update LogEventPage and tables
6. **Test Event Types** - Ensure all event categories work
7. **Validate Export** - Test event data export functionality

### Phase 4: Authentication & Settings Migration

#### Current State

```javascript
// Current: useAuth.js and useSettings.js
const { user, signIn, signOut } = useAuth();
const { settings, updateSettings } = useSettings();
```

#### Target State

```javascript
// New: Separated auth and settings
const auth = useAuthQuery(); // TanStack Query
const { signIn, signOut } = useAuthMutations(); // Auth mutations
const settings = useSettingsQuery(userId); // Settings data
const { updateSettings } = useSettingsMutations(); // Settings updates
```

#### Migration Steps

1. **Create AuthService** - Authentication logic (Firebase Auth)
2. **Create SettingsService** - Settings CRUD operations
3. **Create Auth Hooks** - Authentication queries and mutations
4. **Create Settings Hooks** - Settings queries and mutations
5. **Update Auth Context** - Use new hooks in context provider
6. **Migrate Settings Pages** - Update all settings interfaces
7. **Test Auth Flows** - Anonymous and Google sign-in workflows

### Phase 5: Data Export Migration

#### Current State

```javascript
// Current: useDataManagement.js (large, complex hook)
const {
  exportData,
  importData,
  generateReport,
  // ... many export methods
} = useDataManagement();
```

#### Target State

```javascript
// New: Focused export system
const { exportSessions } = useSessionExport(); // Session exports
const { exportEvents } = useEventExport(); // Event exports
const { importData } = useDataImport(); // Data import
const { isExporting } = useExportUIStore(); // UI state
```

#### Migration Steps

1. **Create ExportService** - Data export logic for all formats
2. **Create ImportService** - Data import and validation
3. **Create Export Hooks** - Export mutations for different data types
4. **Create Import Hooks** - Import with validation and error handling
5. **Update Export UI** - Clean export interface with progress
6. **Test All Formats** - CSV, JSON, text reports
7. **Validate Import** - Test data restoration functionality

## 🔧 Migration Tools & Utilities

### Feature Migration Checklist

```typescript
interface FeatureMigrationChecklist {
  feature: string;
  steps: {
    serviceLayer: boolean; // Business logic extracted
    queryHooks: boolean; // TanStack Query implemented
    mutationHooks: boolean; // Mutations implemented
    uiComponents: boolean; // Pure UI components created
    uiState: boolean; // Zustand stores for UI state
    adapterCreated: boolean; // Temporary adapter for compatibility
    featureTested: boolean; // Comprehensive testing completed
    oldCodeRemoved: boolean; // Legacy code cleaned up
  };
  parityValidated: boolean; // Feature works identically
}
```

### Automated Testing Strategy

```typescript
// Feature parity tests to run during migration
describe("Feature Migration Tests", () => {
  describe("Session Management", () => {
    it("should start sessions identically to old implementation", () => {
      // Compare new vs old behavior
    });

    it("should handle pause/resume with same timing logic", () => {
      // Verify timing calculations remain identical
    });
  });
});
```

### Migration Monitoring

```typescript
// Track migration progress and validate functionality
class MigrationMonitor {
  static async validateFeatureParity(featureName: string) {
    const tests = await this.runParityTests(featureName);
    const performance = await this.measurePerformance(featureName);
    const userExperience = await this.validateUX(featureName);

    return {
      passing: tests.every((t) => t.passed),
      performance: performance.isAcceptable,
      ux: userExperience.isIdentical,
    };
  }
}
```

## 🎯 Migration Success Criteria

### Per-Feature Success Criteria

1. **Functional Parity** - Feature works exactly the same way
2. **Performance Parity** - Same or better performance
3. **UI Consistency** - User experience unchanged
4. **Data Integrity** - No data loss or corruption
5. **Error Handling** - Same error handling behavior

### Overall Success Criteria

1. **All Features Migrated** - No features left in old architecture
2. **Code Quality Improved** - Better separation of concerns
3. **Type Safety Added** - Full TypeScript coverage
4. **Testing Coverage** - Comprehensive test suite
5. **Documentation Updated** - All docs reflect new architecture

## 🚀 Migration Timeline

### Phase 1: Foundation (Weeks 1-2)

- Set up new architecture patterns
- Create first service layer (SessionService)
- Implement first TanStack Query hooks
- Create adapter patterns

### Phase 2: Core Features (Weeks 3-6)

- Migrate session management
- Migrate task system
- Migrate event logging
- Validate each feature before proceeding

### Phase 3: Supporting Features (Weeks 7-8)

- Migrate authentication system
- Migrate settings management
- Migrate data export/import

### Phase 4: Polish & Cleanup (Weeks 9-10)

- Remove all adapter code
- Clean up legacy implementations
- Complete testing and documentation
- Performance optimization

This migration strategy ensures that every feature is preserved exactly while modernizing the underlying architecture for better maintainability and expandability.
