# ChastityOS Database Services

This directory contains the complete Dexie-based local database implementation for ChastityOS, providing offline-first data storage with sync capabilities.

## Architecture Overview

The database layer follows a service-oriented architecture with:

- **ChastityDB**: Main Dexie database instance with schema definition
- **BaseDBService**: Abstract base class providing common CRUD operations
- **Specialized Services**: Domain-specific services for each data type
- **Migration Service**: Handles schema migrations and data transformations
- **Performance Service**: Monitors and optimizes database performance

## Core Components

### Database Schema (`ChastityDB.ts`)

The main database class extends Dexie and defines:

- **Tables**: users, sessions, events, tasks, goals, settings, syncMeta, offlineQueue
- **Indexes**: Compound indexes optimized for common query patterns
- **Hooks**: Automatic timestamp and sync status management
- **Utilities**: Initialization, statistics, and cleanup methods

```typescript
import { db } from "@/services/database";

// Database is automatically initialized
await db.initialize();

// Get database statistics
const stats = await db.getStats();
```

### Base Service (`BaseDBService.ts`)

Provides common functionality for all data services:

```typescript
// All services inherit these methods
await service.findById(id);
await service.findByUserId(userId);
await service.create(data);
await service.update(id, updates);
await service.delete(id);
await service.getPendingSync();
await service.markAsSynced(id);
await service.paginate(userId, offset, limit);
```

## Service Usage Examples

### Session Management

```typescript
import { sessionDBService } from "@/services/database";

// Start a new session
const sessionId = await sessionDBService.startSession(userId, {
  goalDuration: 3600, // 1 hour
  isHardcoreMode: false,
  notes: "Weekly goal session",
});

// Get current active session
const currentSession = await sessionDBService.getCurrentSession(userId);

// Pause/resume session
await sessionDBService.pauseSession(sessionId);
await sessionDBService.resumeSession(sessionId);

// End session
await sessionDBService.endSession(sessionId, new Date(), "Goal completed");

// Get session statistics
const stats = await sessionDBService.getSessionStats(userId);
```

### Event Logging

```typescript
import { eventDBService } from "@/services/database";

// Log a new event
const eventId = await eventDBService.logEvent(
  userId,
  "orgasm",
  { intensity: 8, notes: "Post-session reward" },
  { sessionId, isPrivate: false },
);

// Get events by type
const orgasmEvents = await eventDBService.getEventsByType(userId, "orgasm");

// Get events in date range
const events = await eventDBService.getEventsInDateRange(
  userId,
  new Date("2024-01-01"),
  new Date("2024-01-31"),
);
```

### Task Management

```typescript
import { taskDBService } from "@/services/database";

// Add a new task
const taskId = await taskDBService.addTask(userId, "Complete daily exercises", {
  description: "Physical fitness routine",
  priority: "high",
  assignedBy: "keyholder",
  dueDate: new Date("2024-12-31"),
});

// Update task status
await taskDBService.updateTaskStatus(taskId, "submitted", {
  submissiveNote: "Completed as requested",
});

// Get overdue tasks
const overdueTasks = await taskDBService.getOverdueTasks(userId);
```

### Goal Tracking

```typescript
import { goalDBService } from "@/services/database";

// Create a new goal
const goalId = await goalDBService.addGoal(userId, {
  type: "duration",
  title: "Complete 7 days locked",
  targetValue: 604800, // 7 days in seconds
  unit: "seconds",
  createdBy: "submissive",
});

// Update progress
await goalDBService.updateProgress(goalId, 432000); // 5 days progress

// Get active goals
const activeGoals = await goalDBService.getActiveGoals(userId);
```

### Settings Management

```typescript
import { settingsDBService } from "@/services/database";

// Get user settings (creates defaults if none exist)
const settings = await settingsDBService.getUserSettings(userId);

// Update settings
await settingsDBService.updateSettings(userId, {
  theme: "light",
  notifications: {
    enabled: true,
    sessionReminders: true,
    taskDeadlines: true,
  },
});
```

## Database Migrations

The migration service handles schema changes and data transformations:

```typescript
import { DBMigrationService } from "@/services/database";

// Check if migrations are needed
const needed = await DBMigrationService.checkMigrationsNeeded();

// Run all pending migrations
await DBMigrationService.runMigrations();

// Create backup before migration
const backup = await DBMigrationService.createBackup();

// Validate database integrity
const validation = await DBMigrationService.validateDatabaseIntegrity();
```

## Performance Monitoring

Monitor and optimize database performance:

```typescript
import { DBPerformanceService } from "@/services/database";

// Generate performance report
const report = DBPerformanceService.generateReport();

// Run benchmarks
const benchmarks = await DBPerformanceService.runBenchmarks();

// Analyze database size
const sizeAnalysis = await DBPerformanceService.analyzeDatabaseSize();

// Wrap operations for automatic monitoring
const result = await DBPerformanceService.wrapOperation(
  "query",
  "sessions",
  () => sessionDBService.getSessionHistory(userId),
);
```

## Sync Status Management

All database records include sync status tracking:

- **pending**: Record has local changes not yet synced
- **synced**: Record is synchronized with remote storage
- **conflict**: Conflicting changes detected during sync

```typescript
// Get all records pending sync
const pendingEvents = await eventDBService.getPendingSync(userId);

// Mark records as synced after successful sync
await eventDBService.bulkMarkAsSynced(syncedIds);
```

## Error Handling

All services include comprehensive error handling and logging:

```typescript
try {
  await sessionDBService.startSession(userId);
} catch (error) {
  // Detailed error logging is handled automatically
  console.error("Failed to start session:", error);
}
```

## Testing

Comprehensive unit tests are available in `/tests/database.test.ts`:

```bash
npm test -- tests/database.test.ts
```

Tests cover:

- All CRUD operations
- Specialized service methods
- Error handling
- Sync status management
- Performance characteristics

## Integration with ChastityOS

The database services integrate with existing ChastityOS components:

1. **Hooks**: Use services within React hooks for real-time data
2. **Sync**: Automatic synchronization with Firebase when online
3. **Offline**: Full functionality when offline with sync on reconnection
4. **Migration**: Seamless data migration from existing storage

## Performance Considerations

- **Compound Indexes**: Optimized for common query patterns
- **Pagination**: Built-in pagination support for large datasets
- **Bulk Operations**: Efficient bulk updates and sync operations
- **Monitoring**: Automatic performance monitoring and recommendations
- **Cleanup**: Regular maintenance and archiving suggestions

## Best Practices

1. Always use the service layer, never access tables directly
2. Handle async operations with proper error catching
3. Use pagination for large result sets
4. Monitor performance metrics regularly
5. Run migrations during app initialization
6. Validate data integrity after major changes

## Schema Version History

- **v1**: Initial schema with core tables and indexes
- **v2**: Added sync status to existing records, offline queue
- **v3**: Added isPrivate field to events

## Contributing

When adding new features:

1. Add appropriate indexes to the schema
2. Update type definitions in `/types/database.ts`
3. Create comprehensive unit tests
4. Document new methods and usage patterns
5. Consider performance implications
6. Add migration steps if schema changes are needed
