# Points Service

This service handles the points and rewards system for task completion in ChastityOS.

## Overview

The Points Service automatically awards points to submissives when tasks are approved by keyholders. It integrates with the user stats system to track progress and achievements.

## Features

- **Automatic Point Awarding**: Points are awarded when tasks are approved
- **Configurable Point Values**: Keyholders can set custom point values for each task
- **Smart Point Calculation**: Default points calculated based on priority, evidence, and deadline
- **Streak Tracking**: Tracks consecutive days of task completion
- **Achievement Integration**: Ready for future integration with achievement system

## Usage

### Awarding Points

Points are automatically awarded when a task is approved through the `useApproveTask` mutation hook:

```typescript
import { useApproveTask } from "@/hooks/api/useTaskMutations";

const { mutateAsync: approveTask } = useApproveTask();

await approveTask({
  taskId: "task-123",
  userId: "user-456",
  feedback: "Great work!",
});
// Points are automatically awarded if task has pointValue
```

### Setting Point Values

Keyholders can set point values when creating tasks:

```typescript
import { useAssignTask } from "@/hooks/api/useTaskMutations";

const { mutateAsync: assignTask } = useAssignTask();

await assignTask({
  userId: "user-456",
  title: "Complete daily checklist",
  description: "All items on daily checklist",
  priority: "high",
  pointValue: 25, // Optional: custom point value
});
```

### Calculating Default Points

If no point value is specified, points can be calculated automatically:

```typescript
import { PointsService } from "@/services/points";

const points = PointsService.calculateTaskPoints({
  priority: "high", // high = 2x multiplier
  hasEvidence: true, // +5 bonus
  dueDate: futureDate, // +5 if before deadline
});
// Returns: 25 points (10 * 2 + 5 + 5)
```

## Point Calculation Formula

Base points: **10**

### Priority Multipliers

- **Critical**: 3x (30 points)
- **High**: 2x (20 points)
- **Medium**: 1x (10 points)
- **Low**: 0.5x (5 points)

### Bonuses

- **Evidence Attached**: +5 points
- **Completed Before Deadline**: +5 points

### Examples

1. Medium priority, no evidence, no deadline: **10 points**
2. High priority, with evidence: **25 points** (20 + 5)
3. Critical priority, with evidence, before deadline: **40 points** (30 + 5 + 5)

## User Stats

The service tracks the following statistics:

- `totalPoints`: Total points earned
- `tasksCompleted`: Total tasks completed
- `tasksApproved`: Tasks approved by keyholder
- `tasksRejected`: Tasks rejected by keyholder
- `currentStreak`: Current consecutive days of task completion
- `longestStreak`: Best streak achieved

### Accessing User Stats

```typescript
import { useUserStats } from "@/hooks/api/useUserStats";

const { data: stats } = useUserStats(userId);

console.log(`Total Points: ${stats.totalPoints}`);
console.log(
  `Approval Rate: ${(stats.tasksApproved / (stats.tasksApproved + stats.tasksRejected)) * 100}%`,
);
```

## Components

### TaskStatsCard

Display user statistics in a card format:

```typescript
import { TaskStatsCard } from "@/components/stats/TaskStatsCard";

<TaskStatsCard userId={userId} />
```

## Event Logging

All point awards are logged in the event system:

```typescript
{
  type: "points_awarded",
  action: "points_awarded",
  title: "Points Awarded",
  description: "Earned 25 points for completing 'Daily Task'",
  metadata: {
    taskId: "task-123",
    taskTitle: "Daily Task",
    points: 25,
    newTotal: 125,
    tasksCompleted: 15
  }
}
```

## Database Schema

### User Stats Table

```typescript
interface DBUserStats {
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

### Task Fields

```typescript
interface DBTask {
  // ... other fields
  pointValue?: number; // Points awarded for completion
  pointsAwarded?: boolean; // Flag to prevent duplicate awards
  pointsAwardedAt?: Date; // When points were awarded
}
```

## Testing

Run the test suite:

```bash
npm test -- src/services/points/__tests__/PointsService.test.ts
```

## Future Enhancements

- [ ] Achievement integration
- [ ] Leaderboard support
- [ ] Point decay/expiry
- [ ] Bonus multipliers for special events
- [ ] Point exchange/rewards catalog
