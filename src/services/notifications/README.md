# Notification Services

Centralized notification services for ChastityOS, handling all notification types across sessions, tasks, keyholder interactions, and system events.

## Services Overview

### NotificationService
Main notification service handling:
- **Session notifications**: ending soon, completed, pause cooldown
- **Keyholder notifications**: session events, emergency unlock, requests, goals
- **System notifications**: sync status, updates, achievements

### TaskNotificationService
Specialized service for task workflow notifications:
- Task assignments, submissions, approvals, rejections
- Deadline warnings and overdue reminders

Both services use the notification store for in-app toast notifications and are structured for future push notification support.

---

## NotificationService

### Session Notifications

#### Session Ending Soon
Warns user 5 minutes before session ends.
```typescript
await NotificationService.notifySessionEndingSoon({
  sessionId: 'session-123',
  userId: 'user-123',
  minutesRemaining: 5,
});
```

#### Session Completed
Celebrates session completion.
```typescript
await NotificationService.notifySessionCompleted({
  sessionId: 'session-123',
  userId: 'user-123',
  duration: 72, // hours
});
```

#### Pause Cooldown Expired
Notifies when ready to resume.
```typescript
await NotificationService.notifyPauseCooldownExpired({
  sessionId: 'session-123',
  userId: 'user-123',
});
```

#### Emergency Unlock
Urgent notification to keyholder.
```typescript
await NotificationService.notifyEmergencyUnlock({
  sessionId: 'session-123',
  userId: 'user-123',
  keyholderUserId: 'keyholder-456',
  submissiveName: 'Pet',
  reason: 'Medical emergency',
});
```

### Keyholder Notifications

#### Session Events
Notifies keyholder of session start/pause/resume.
```typescript
await NotificationService.notifySessionStarted({
  sessionId: 'session-123',
  userId: 'user-123',
  keyholderUserId: 'keyholder-456',
  submissiveName: 'Pet',
});
```

#### Keyholder Request
Notifies about new relationship requests.
```typescript
await NotificationService.notifyKeyholderRequest({
  userId: 'user-123',
  keyholderUserId: 'keyholder-456',
  submissiveName: 'Pet',
  requestType: 'invite', // or 'permission', 'general'
});
```

#### Goal Completed
Notifies keyholder when submissive completes a goal.
```typescript
await NotificationService.notifyGoalCompleted({
  userId: 'user-123',
  goalId: 'goal-789',
  goalTitle: '30-day streak',
  keyholderUserId: 'keyholder-456',
  submissiveName: 'Pet',
});
```

### System Notifications

#### Sync Completed
Confirms successful data sync (manual only).
```typescript
await NotificationService.notifySyncCompleted({
  userId: 'user-123',
  operationsCount: 15,
  wasManualSync: true,
});
```

#### Sync Failed
Alerts about sync failures with retry option.
```typescript
await NotificationService.notifySyncFailed({
  userId: 'user-123',
  errorMessage: 'Network error',
  retryable: true,
});
```

#### App Update Available
Notifies about new app versions.
```typescript
await NotificationService.notifyAppUpdateAvailable({
  version: '4.0.1',
  releaseNotes: 'Bug fixes and improvements',
});
```

#### Achievement Unlocked
Celebrates unlocked achievements.
```typescript
await NotificationService.notifyAchievementUnlocked({
  userId: 'user-123',
  achievementId: 'ach-001',
  achievementTitle: 'First Week',
  achievementDescription: 'Complete your first week in chastity',
  points: 100,
});
```

### Integration Points

NotificationService is integrated at key event points:
- `src/hooks/session/useSession.ts` - Session start/end
- `src/hooks/session/usePauseSessionActions.ts` - Pause/resume
- `src/services/database/EmergencyService.ts` - Emergency unlock
- `src/services/sync/FirebaseSync.ts` - Sync completion/failure
- `src/services/AchievementEngine.ts` - Achievement unlocks
- `src/services/KeyholderRelationshipService.ts` - Relationship requests
- `src/services/GoalTrackerService.ts` - Goal completion

---

## TaskNotificationService

Centralized service for handling all task-related notifications in ChastityOS.

### Overview

The `TaskNotificationService` provides a unified interface for sending task workflow notifications to users. It currently supports in-app toast notifications and is designed to be easily extended to support push notifications in the future.

## Features

- **Task Assigned**: Notify submissive when a task is assigned by keyholder
- **Task Submitted**: Notify keyholder when submissive submits a task for review
- **Task Approved**: Notify submissive when their task is approved
- **Task Rejected**: Notify submissive when their task is rejected (persistent)
- **Deadline Approaching**: Notify submissive when task deadline is within 24 hours
- **Task Overdue**: Notify both submissive and keyholder when task is overdue

## Usage

### Assigning a Task

```typescript
import { TaskNotificationService } from '@/services/notifications/TaskNotificationService';

// When a keyholder assigns a task to a submissive
await TaskNotificationService.notifyTaskAssigned({
  taskId: 'task-123',
  taskTitle: 'Clean the room',
  userId: 'submissive-user-id',
  keyholderName: 'Master John', // Optional
  dueDate: new Date('2024-12-31'), // Optional
});
```

### Submitting a Task

```typescript
// When a submissive submits a task for review
await TaskNotificationService.notifyTaskSubmitted({
  taskId: 'task-123',
  taskTitle: 'Clean the room',
  userId: 'submissive-user-id',
  keyholderUserId: 'keyholder-user-id',
  submissiveName: 'Pet', // Optional
  hasEvidence: true, // Whether attachments were included
});
```

### Approving a Task

```typescript
// When a keyholder approves a task
await TaskNotificationService.notifyTaskApproved({
  taskId: 'task-123',
  taskTitle: 'Clean the room',
  userId: 'submissive-user-id',
  points: 10, // Optional
  reviewNotes: 'Great job!', // Optional
});
```

### Rejecting a Task

```typescript
// When a keyholder rejects a task
await TaskNotificationService.notifyTaskRejected({
  taskId: 'task-123',
  taskTitle: 'Clean the room',
  userId: 'submissive-user-id',
  reason: 'Not thorough enough', // Optional
});
```

### Deadline Notifications

```typescript
// When a deadline is approaching (24h before)
await TaskNotificationService.notifyDeadlineApproaching({
  taskId: 'task-123',
  taskTitle: 'Clean the room',
  userId: 'submissive-user-id',
  hoursRemaining: 12,
});
```

### Overdue Notifications

```typescript
// When a task becomes overdue
await TaskNotificationService.notifyTaskOverdue({
  taskId: 'task-123',
  taskTitle: 'Clean the room',
  userId: 'submissive-user-id',
  keyholderUserId: 'keyholder-user-id',
});
```

## Integration with Task Mutations

The service is automatically integrated with task mutations in `useTaskMutations.ts`:

- `useAssignTask` → Triggers `notifyTaskAssigned`
- `useSubmitTaskForReview` → Triggers `notifyTaskSubmitted`
- `useApproveTask` → Triggers `notifyTaskApproved`
- `useRejectTask` → Triggers `notifyTaskRejected`

## Notification Metadata

All notifications include metadata that can be used for:
- Navigation to task details
- Task context information
- Analytics and logging
- Future features

Example metadata:
```typescript
{
  taskId: 'task-123',
  type: 'task_assigned',
  link: '/tasks/task-123',
  // ... additional metadata
}
```

## Notification Priorities

- **High**: Task submitted, rejected, overdue, deadline approaching
- **Medium**: Task approved, assigned (with due date)
- **Low**: Task assigned (without due date)
- **Urgent**: Currently unused (reserved for critical tasks)

## Notification Durations

- **0 (Persistent)**: Errors, rejections, overdue tasks
- **6000ms**: Assigned, approved
- **7000ms**: Submitted
- **8000ms**: Deadline approaching

## Future: Push Notifications

The service is designed to support push notifications in the future. To add push notification support:

1. Uncomment and implement the `sendPushNotification` method
2. Add Firebase Cloud Messaging (FCM) or another push service
3. Update each notification method to call both toast and push
4. Check user preferences with `shouldNotifyUser` before sending

Example structure:
```typescript
// In each notification method, add:
await this.sendPushNotification({
  userId: params.userId,
  title: "Task Assigned",
  body: "You have a new task...",
  data: { taskId: params.taskId },
});
```

## User Preferences

Task notification preferences are stored in the user settings:

```typescript
interface DBSettings {
  notifications: {
    tasks?: {
      assigned: boolean;
      submitted: boolean;
      approved: boolean;
      rejected: boolean;
      deadlineApproaching: boolean;
      overdue: boolean;
    };
    pushEnabled?: boolean;
  };
}
```

Currently, all notifications are enabled by default. Future implementation will check these preferences before sending notifications.

## Testing

Unit tests are located in `__tests__/TaskNotificationService.test.ts` and cover:
- All notification types
- Parameter variations
- Priority levels
- Message formatting
- Error handling

Run tests:
```bash
npm run test src/services/notifications/__tests__/TaskNotificationService.test.ts
```

## Architecture

```
TaskNotificationService (Static)
    ↓
useNotificationStore (Zustand)
    ↓
Toast UI Component
```

Future:
```
TaskNotificationService (Static)
    ├→ useNotificationStore (Zustand) → Toast UI
    └→ Push Notification Service → Native Push
```

## Error Handling

All notification methods return `string | null` (notification ID or null on error). Errors are logged but don't throw, so task operations won't fail if notifications fail.

## Best Practices

1. **Always provide task context**: Include taskId, taskTitle, and userId
2. **Use optional fields wisely**: Names and dates enhance UX when available
3. **Handle errors gracefully**: Notification failures shouldn't break task operations
4. **Log important events**: Service logs all notifications for debugging
5. **Test thoroughly**: Verify notifications in different scenarios

## Contributing

When adding new notification types:
1. Add interface for parameters
2. Create static method following existing patterns
3. Add comprehensive tests
4. Update this documentation
5. Consider both toast and future push notifications
