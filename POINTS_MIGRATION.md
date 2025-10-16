# Points System Migration Guide

## Database Schema Changes

This update adds a new points and rewards system for task completion. The database schema has been upgraded to version 8.

### New Table: `userStats`

A new table has been added to track user statistics:

```typescript
{
  id: string;
  userId: string;
  totalPoints: number;
  tasksCompleted: number;
  tasksApproved: number;
  tasksRejected: number;
  currentStreak: number;
  longestStreak: number;
  lastTaskCompletedAt?: Date;
  syncStatus: SyncStatus;
  lastModified: Date;
}
```

### Updated Table: `tasks`

Three new optional fields have been added to the tasks table:

```typescript
{
  // ... existing fields
  pointValue?: number;          // Points awarded for completion
  pointsAwarded?: boolean;      // Flag to prevent duplicate awards
  pointsAwardedAt?: Date;       // When points were awarded
}
```

## Migration

### Automatic Migration

The database migration is **automatic** and will occur when users first load the updated application. No manual intervention is required.

### What Happens During Migration

1. Database version is upgraded from 7 to 8
2. New `userStats` table is created with indexes
3. Existing tasks remain unchanged (new fields are optional)
4. User stats are initialized with zeros when first accessed

### Data Preservation

- **All existing data is preserved**: Tasks, sessions, events, and settings remain intact
- **Backward compatible**: Old data works seamlessly with the new schema
- **No data loss**: The migration only adds new tables and fields

### For Existing Users

- **Points start at 0**: Existing users will start with 0 points and must complete new tasks to earn points
- **Historical tasks**: Previously completed tasks do not retroactively award points
- **No disruption**: Users can continue using the app without any changes to their workflow

### For New Users

- Fresh installation automatically includes the points system
- Stats tracking begins immediately upon first task completion

## Rollback

If you need to roll back to the previous version:

1. The old version will still work with the new database schema (backward compatible)
2. New fields and tables will simply be ignored
3. No data loss occurs during rollback

## Testing

To verify the migration:

1. Check browser console for database version: Should show "ChastityOS database ready, version: 8"
2. Verify user stats are accessible without errors
3. Create and approve a task with points to test the system

## Support

If you encounter any issues during migration:

1. Clear browser cache and IndexedDB (Settings → Data Management → Clear Local Data)
2. Re-login to reinitialize the database
3. Report issues on GitHub with browser console logs
