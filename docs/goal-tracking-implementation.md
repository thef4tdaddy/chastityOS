# Goal Tracking Implementation - App Parity

## Overview
This document describes the basic personal goal tracking functionality implemented for app parity with the original ChastityOS application.

## What Was Implemented

### 1. Automatic Goal Progress Tracking
- Goals automatically update when sessions complete
- Session duration (excluding pauses) is added to goal progress
- Multiple active goals can be tracked simultaneously

### 2. Goal Completion Detection
- Automatically detects when a goal's target is reached
- Marks goal as completed
- Logs completion event for the user's timeline

### 3. Progress Calculation
- Calculates progress percentage (0-100%)
- Handles edge cases (zero targets, over-completion)
- Provides accurate statistics

## Architecture

### Core Service: `GoalTrackerService`

Located in `src/services/GoalTrackerService.ts`, this service provides:

```typescript
// Main tracking function - called when sessions end
GoalTrackerService.trackSessionCompletion(session: DBSession)

// Statistics for the user
GoalTrackerService.getGoalStatistics(userId: string)

// Progress calculations
GoalTrackerService.calculateProgress(goal: DBGoal)
GoalTrackerService.isGoalCompleted(goal: DBGoal)
```

### Integration Point: `SessionDBService`

When a session ends, the system:
1. Updates the session record
2. Logs the session end event
3. **Calls `GoalTrackerService.trackSessionCompletion()`** ← NEW
4. Broadcasts the session end event

This ensures goals are updated automatically without requiring manual intervention.

### Query Hooks

```typescript
// Get user's active personal goal
const { data: goal } = usePersonalGoalQuery(userId);

// Get goal statistics
const { data: stats } = useGoalStatisticsQuery(userId);

// Create/update/delete goals
const { createPersonalGoal, updatePersonalGoal, deletePersonalGoal } = 
  usePersonalGoalMutations();
```

## Data Flow

```
User completes session
        ↓
SessionDBService.endSession()
        ↓
GoalTrackerService.trackSessionCompletion()
        ↓
    ┌───────────────────────────────────┐
    │  1. Get all active duration goals │
    │  2. Calculate session duration    │
    │  3. Update each goal's progress   │
    │  4. Check for completion          │
    │  5. Log completion event if done  │
    └───────────────────────────────────┘
        ↓
TanStack Query cache invalidated
        ↓
UI updates automatically
```

## Database Schema

Goals are stored in the `goals` table with this structure:

```typescript
interface DBGoal {
  id: string;                    // Unique goal ID
  userId: string;                // Owner of the goal
  type: "duration" | ...;        // Goal type
  title: string;                 // Goal title
  description?: string;          // Optional description
  targetValue: number;           // Target in seconds
  currentValue: number;          // Current progress in seconds
  unit: "seconds";               // Unit of measurement
  isCompleted: boolean;          // Completion status
  completedAt?: Date;            // When completed
  createdAt: Date;               // When created
  createdBy: "submissive" | "keyholder";  // Who created it
  // ... plus sync metadata
}
```

## Features

### ✅ Implemented
- Personal goal creation with duration target
- Automatic progress tracking from sessions
- Goal completion detection
- Completion event logging
- Progress percentage calculations
- Goal statistics (total, active, completed, completion rate)
- Pause-aware time tracking (excludes paused time)
- Multiple simultaneous goals support
- Keyholder-created goals (via `createdBy` field)

### ❌ Not Implemented (Out of Scope)
- Task-based goals
- Behavioral goals
- Achievement-based goals
- Streak tracking
- Recurring goals
- Advanced analytics/charts
- Goal assignment workflow
- Reward system integration
- Achievement unlock integration

## Testing

### Automated Tests
12 comprehensive tests cover all functionality:
- Session completion tracking
- Progress updates
- Completion detection
- Pause handling
- Statistics calculations
- Edge cases

Run tests with:
```bash
npm run test:unit -- src/services/__tests__/GoalTrackerService.test.ts
```

### Manual Testing Checklist

1. **Create a Personal Goal**
   - Navigate to Settings → Personal Goal
   - Click "Create Personal Goal"
   - Enter title: "Test Goal"
   - Set duration: 1 hour (or more for longer testing)
   - Click "Create Goal"
   - Verify goal appears with 0% progress

2. **Start and Complete a Session**
   - Start a new chastity session
   - Let it run for some time (or use time manipulation for testing)
   - End the session
   - Verify goal progress updates automatically

3. **Check Progress Updates**
   - Goal progress should reflect the session duration
   - Progress percentage should be calculated correctly
   - Progress bar should update visually

4. **Complete the Goal**
   - Complete enough sessions to reach the goal target
   - When target is reached:
     - Goal should be marked as completed (✓ Completed badge)
     - Completion date should be set
     - Event should appear in the user's timeline

5. **Test Paused Sessions**
   - Start a session
   - Pause it for some time
   - Resume and complete
   - Verify only active time counts toward goal (paused time excluded)

6. **Test Multiple Goals**
   - Create multiple personal goals
   - Complete a session
   - Verify all goals update correctly

7. **Test Keyholder Goals** (if applicable)
   - Have keyholder set a required duration
   - Complete sessions
   - Verify keyholder goal tracks separately

## API Examples

### Creating a Goal

```typescript
import { useCreatePersonalGoal } from '@/hooks/api/usePersonalGoalQueries';

const createGoal = useCreatePersonalGoal();

// Create a 7-day goal
createGoal.mutate({
  userId: 'user-123',
  title: '7 Day Challenge',
  targetDuration: 7 * 24 * 3600, // 7 days in seconds
  description: 'Complete a full week in chastity'
});
```

### Getting Goal Progress

```typescript
import { usePersonalGoalQuery } from '@/hooks/api/usePersonalGoalQueries';

const { data: goal } = usePersonalGoalQuery(userId);

if (goal) {
  const progress = (goal.currentValue / goal.targetValue) * 100;
  console.log(`Goal is ${progress.toFixed(1)}% complete`);
}
```

### Getting Statistics

```typescript
import { useGoalStatisticsQuery } from '@/hooks/api/usePersonalGoalQueries';

const { data: stats } = useGoalStatisticsQuery(userId);

if (stats) {
  console.log(`Active goals: ${stats.active}`);
  console.log(`Completed: ${stats.completed}`);
  console.log(`Completion rate: ${stats.completionRate}%`);
}
```

## Error Handling

The goal tracker includes comprehensive error handling:
- Invalid sessions are skipped (no userId, no endTime, etc.)
- Goal tracking errors don't break session completion
- Failed progress updates are logged but don't throw
- Database errors are caught and logged

## Performance Considerations

- Goal tracking is asynchronous (doesn't block session completion)
- Only active duration goals are queried (not all goals)
- Completed goals are skipped automatically
- Progress calculations are simple math operations (very fast)

## Future Enhancements

When implementing the full goal system (issue #409043e5):
- Add task-based goal tracking
- Implement streak detection
- Add recurring goals with auto-reset
- Create achievement integration
- Build advanced analytics dashboard
- Add notification system integration
- Implement reward point system

## Troubleshooting

### Goal progress not updating
1. Check that the session completed successfully
2. Verify the goal is active (`isCompleted: false`)
3. Check that the goal type is `"duration"`
4. Look for errors in the console/logs

### Progress calculation seems wrong
1. Verify the session duration is correct
2. Check if paused time is being excluded correctly
3. Ensure target value is in seconds
4. Check that multiple sessions are accumulating correctly

### Completion not detected
1. Verify `currentValue >= targetValue`
2. Check that `isCompleted` is being set to `true`
3. Look for completion event in the events table
4. Check TanStack Query cache is invalidating

## Related Files

- `src/services/GoalTrackerService.ts` - Core service
- `src/services/__tests__/GoalTrackerService.test.ts` - Tests
- `src/services/database/SessionDBService.ts` - Integration point
- `src/services/database/GoalDBService.ts` - Database operations
- `src/hooks/api/usePersonalGoalQueries.ts` - Query hooks
- `src/hooks/api/usePersonalGoalMutations.ts` - Mutation hooks
- `src/components/settings/PersonalGoalSection.tsx` - Main UI
- `src/components/settings/PersonalGoalCard.tsx` - Goal display
- `src/components/settings/CreatePersonalGoalForm.tsx` - Goal creation
- `src/types/database.ts` - Type definitions
