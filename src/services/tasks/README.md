# Recurring Task Service

This directory contains the recurring task functionality for ChastityOS.

## Overview

The recurring task system automatically creates new task instances when recurring tasks are approved, based on configured frequency patterns.

## Files

- `RecurringTaskService.ts` - Core service for recurring task logic
- `__tests__/RecurringTaskService.test.ts` - Comprehensive unit tests

## Features

### Recurring Frequencies

1. **Daily** - Tasks repeat every day or every N days
2. **Weekly** - Tasks repeat on specific days of the week (e.g., Mon/Wed/Fri)
3. **Monthly** - Tasks repeat on a specific day of the month (e.g., 15th)
4. **Custom** - Tasks repeat every N days with custom interval

### Date Calculation Logic

The service includes robust date calculation methods that handle:

- Month boundaries (e.g., Jan 31 → Feb 1)
- Leap years
- Week wraparounds (e.g., Sunday when current day is Monday)
- Invalid month days (e.g., Feb 30)

### Automatic Instance Creation

When a recurring task is approved via `useApproveTask` hook:

1. The service calculates the next due date
2. Creates a new task instance with incremented instance number
3. Links the new instance to the parent task and series
4. Preserves all task properties (title, description, priority, etc.)

## Usage

### Creating a Recurring Task

```typescript
import type { RecurringConfig } from "@/types/database";

// Daily task - every day
const dailyConfig: RecurringConfig = {
  frequency: "daily",
  interval: 1,
};

// Weekly task - Mon/Wed/Fri
const weeklyConfig: RecurringConfig = {
  frequency: "weekly",
  daysOfWeek: [1, 3, 5], // 0=Sun, 1=Mon, ..., 6=Sat
};

// Monthly task - 15th of each month
const monthlyConfig: RecurringConfig = {
  frequency: "monthly",
  dayOfMonth: 15,
};

// Custom interval - every 14 days
const customConfig: RecurringConfig = {
  frequency: "custom",
  interval: 14,
};

// Create task with recurring config
const task = await taskDBService.createTask({
  userId: "user-id",
  text: "Daily exercise",
  status: "pending",
  priority: "medium",
  assignedBy: "keyholder",
  isRecurring: true,
  recurringConfig: dailyConfig,
});
```

### Calculating Next Due Date

```typescript
import { RecurringTaskService } from "@/services/tasks/RecurringTaskService";

const config: RecurringConfig = {
  frequency: "weekly",
  daysOfWeek: [1, 3, 5],
};

const nextDueDate = RecurringTaskService.calculateNextDueDate(config);
console.log("Next task due:", nextDueDate);
```

### Creating Next Instance

```typescript
// After approving a recurring task
const parentTask = await taskDBService.findById(taskId);

if (parentTask.isRecurring && parentTask.recurringConfig) {
  const nextInstanceId =
    await RecurringTaskService.createNextInstance(parentTask);
  console.log("Created next instance:", nextInstanceId);
}
```

### Managing Recurring Series

```typescript
// Get all instances in a series
const seriesId = task.recurringSeriesId;
const allInstances = await RecurringTaskService.getRecurringSeries(seriesId);

console.log(`Found ${allInstances.length} instances in series`);

// Stop a recurring series (cancel all pending instances)
await RecurringTaskService.stopRecurringSeries(seriesId);
```

## UI Components

### RecurringTaskBadge

Display recurring indicator on task items:

```tsx
import { RecurringTaskBadge } from "@/components/tasks";

<RecurringTaskBadge task={task} showInstanceNumber={true} />;
```

### RecurringTaskForm

Configure recurring task settings:

```tsx
import { RecurringTaskForm } from "@/components/keyholder/RecurringTaskForm";

<RecurringTaskForm
  onSave={(config) => setRecurringConfig(config)}
  initialConfig={existingConfig}
/>;
```

### TaskCreationWithRecurring

Example integration of recurring task creation:

```tsx
import { TaskCreationWithRecurring } from "@/components/keyholder/TaskCreationWithRecurring";

<TaskCreationWithRecurring
  onCreateTask={(taskData) => {
    // Handle task creation with recurring config
    console.log(taskData.isRecurring, taskData.recurringConfig);
  }}
/>;
```

## Integration Points

### Task Approval Hook

The `useApproveTask` hook in `src/hooks/api/useTaskMutations.ts` automatically creates the next instance when approving a recurring task:

```typescript
// In useApproveTask mutation
if (updatedTask?.isRecurring && updatedTask?.recurringConfig) {
  const { RecurringTaskService } = await import(
    "@/services/tasks/RecurringTaskService"
  );
  await RecurringTaskService.createNextInstance(updatedTask);
}
```

### Database Types

Recurring task types are defined in:

- `src/types/core.ts` - Firestore Task type with RecurringConfig
- `src/types/database.ts` - Local DBTask type with RecurringConfig

## Testing

The service includes comprehensive unit tests covering:

- ✅ Daily recurrence calculations
- ✅ Weekly recurrence with multiple days
- ✅ Monthly recurrence across month boundaries
- ✅ Custom interval calculations
- ✅ Edge cases (week wraparounds, month boundaries)
- ✅ Default value handling

Run tests:

```bash
npm test -- src/services/tasks/__tests__/RecurringTaskService.test.ts
```

## Future Enhancements

Potential improvements for future versions:

- [ ] End date for recurring series
- [ ] Skip/reschedule individual instances
- [ ] Recurring task templates
- [ ] Bulk edit recurring series
- [ ] Advanced recurrence patterns (e.g., "last Friday of month")
- [ ] Notification when next instance is created
- [ ] Statistics/history view for recurring series
