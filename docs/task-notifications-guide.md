# Task Notifications User Guide

This guide explains how task notifications work in ChastityOS and what users will experience.

## Overview

Task notifications provide real-time feedback for task workflow actions. They appear as toast messages in the application, keeping users informed about task status changes.

## Notification Types

### 1. Task Assigned (Submissive)

**When**: A keyholder assigns a new task to a submissive

**Example Notification**:

```
ℹ️ New Task Assigned
Master Alex assigned you: "Complete daily exercises" (due 12/31/2024)
```

**Details**:

- **Type**: Info
- **Priority**: High (if due date set), Medium (otherwise)
- **Duration**: 6 seconds
- **Actions**: Click to view task details

---

### 2. Task Submitted (Keyholder)

**When**: A submissive submits a task for review

**Example Notification**:

```
ℹ️ Task Submitted for Review
Pet submitted: "Complete daily exercises" with evidence
```

**Details**:

- **Type**: Info
- **Priority**: High
- **Duration**: 7 seconds
- **Actions**: Click to review task

---

### 3. Task Approved (Submissive)

**When**: A keyholder approves a submitted task

**Example Notification**:

```
✅ Task Approved! ✅
"Complete daily exercises" was approved +15 points!
```

**Details**:

- **Type**: Success (green)
- **Priority**: Medium
- **Duration**: 6 seconds
- **Actions**: Click to view details

---

### 4. Task Rejected (Submissive)

**When**: A keyholder rejects a submitted task

**Example Notification**:

```
⚠️ Task Needs Revision
"Complete daily exercises" was rejected: Evidence photos are not clear enough
```

**Details**:

- **Type**: Warning (yellow/orange)
- **Priority**: High
- **Duration**: Persistent (must be dismissed)
- **Actions**: Click to revise task

---

### 5. Deadline Approaching (Submissive)

**When**: A task deadline is within 24 hours

**Example Notification**:

```
⚠️ Task Deadline Approaching
"Complete daily exercises" is due in 12 hours
```

**Details**:

- **Type**: Warning
- **Priority**: High
- **Duration**: 8 seconds
- **Actions**: Click to complete task

---

### 6. Task Overdue (Both Users)

**When**: A task passes its deadline

**For Submissive**:

```
❌ Task Overdue
"Complete daily exercises" is past its deadline
```

**For Keyholder**:

```
⚠️ Task Overdue
Assigned task "Complete daily exercises" is overdue
```

**Details**:

- **Type**: Error (red) for submissive, Warning for keyholder
- **Priority**: High for submissive, Medium for keyholder
- **Duration**: Persistent for submissive, 7 seconds for keyholder
- **Actions**: Click to view task

---

## Notification Appearance

Notifications appear as toast messages in the top-right corner of the screen (by default). They include:

1. **Icon**: Visual indicator (ℹ️, ✅, ⚠️, ❌)
2. **Title**: Bold heading describing the action
3. **Message**: Details about the task and action
4. **Close Button**: X to dismiss (for dismissible notifications)

### Visual Priority

- **Urgent**: Flashing border, requires immediate attention
- **High**: Bold colors, prominent positioning
- **Medium**: Standard colors and positioning
- **Low**: Subtle colors, smaller size

---

## User Settings

### Configuring Notifications

Future feature: Users will be able to configure task notifications in Settings:

```typescript
Settings > Notifications > Tasks
  ☑ Task Assigned
  ☑ Task Submitted
  ☑ Task Approved
  ☑ Task Rejected
  ☑ Deadline Approaching
  ☑ Task Overdue
  ☐ Enable Push Notifications (Future)
```

By default, all task notifications are enabled.

---

## Notification Behavior

### Auto-Dismissal

Most notifications automatically disappear after their duration expires:

- Info notifications: 6-7 seconds
- Warning notifications: 8 seconds
- Success notifications: 6 seconds

### Persistent Notifications

Some notifications require manual dismissal:

- Task rejections (submissive needs to take action)
- Task overdue (submissive needs to address)
- Critical errors

### Multiple Notifications

Multiple notifications stack vertically, with the most recent appearing on top. Priority determines the order within the stack.

### Offline Behavior

Notifications are generated when mutations succeed locally. Even offline, users will see notifications for their own actions. Notifications for other users' actions will appear when back online and data syncs.

---

## Developer Notes

### Triggering Notifications

Notifications are automatically triggered by task mutations:

```typescript
// Assign task → Notification sent automatically
const { mutate: assignTask } = useAssignTask();
assignTask({
  userId: submissiveId,
  title: "Clean the room",
  keyholderName: "Master Alex",
  dueDate: new Date(),
});
```

### Custom Notifications

For custom scenarios, use the service directly:

```typescript
import { TaskNotificationService } from "@/services/notifications";

await TaskNotificationService.notifyTaskAssigned({
  taskId: "task-123",
  taskTitle: "Custom task",
  userId: "user-456",
});
```

---

## Troubleshooting

### Notifications Not Appearing

1. **Check notification permissions**: Ensure browser allows notifications
2. **Check user settings**: Verify notifications are enabled
3. **Check console**: Look for error messages
4. **Check notification store**: Use React DevTools to inspect zustand store

### Duplicate Notifications

If seeing duplicate notifications, check:

1. Multiple components calling the same mutation
2. StrictMode in development (causes double renders)
3. Mutation being called multiple times

### Notification Not Dismissed

For persistent notifications:

1. Click the X button to dismiss
2. Or click the notification body to navigate and it will auto-dismiss

---

## Future Enhancements

### Push Notifications

Coming soon: Native push notifications for mobile/desktop:

- Receive notifications even when app is closed
- Configurable per notification type
- Sound and vibration options
- Rich content with images

### Smart Notifications

Planned features:

- Notification grouping (e.g., "3 tasks due today")
- Snooze functionality
- Notification history
- Read/unread states
- Action buttons (Approve, Reject from notification)

### Analytics

Track notification engagement:

- Click-through rates
- Dismiss rates
- Most effective notification times
- User preferences analysis

---

## Best Practices

### For Users

1. **Enable notifications** to stay informed about task activities
2. **Act on persistent notifications** promptly (rejections, overdue)
3. **Review notification settings** to customize your experience
4. **Use notification links** to quickly navigate to tasks

### For Developers

1. **Always include task context** (ID, title, user)
2. **Set appropriate priorities** based on urgency
3. **Test offline scenarios** to ensure proper behavior
4. **Handle errors gracefully** - don't let notifications break tasks
5. **Log important events** for debugging and analytics

---

## Support

For issues or questions about task notifications:

1. Check the [Task Notification README](../src/services/notifications/README.md)
2. Review [usage examples](../src/services/notifications/examples.ts)
3. Check [unit tests](../src/services/notifications/__tests__/TaskNotificationService.test.ts)
4. Submit feedback through the app's Feedback form
5. Report bugs on GitHub issues

---

## Technical Details

### Architecture

```
User Action
    ↓
Task Mutation (useTaskMutations.ts)
    ↓
Task Database Update (TaskDBService)
    ↓
onSuccess Callback
    ↓
TaskNotificationService
    ↓
useNotificationStore (Zustand)
    ↓
NotificationContainer Component
    ↓
NotificationToast Component
    ↓
User Sees Notification
```

### Data Flow

```typescript
// 1. User assigns task
assignTask({ title: "Task", userId: "user-123" })

// 2. Task saved to database
taskDBService.createTask({ ... })

// 3. Notification triggered
TaskNotificationService.notifyTaskAssigned({ ... })

// 4. Store updated
useNotificationStore.addNotification({ ... })

// 5. UI updates
<NotificationContainer> renders <NotificationToast>

// 6. User sees notification
Toast appears in top-right corner
```

---

## Version History

- **v4.0.0-nightly.1**: Initial implementation of task notifications
  - All 6 notification types implemented
  - Integration with task mutations
  - Unit tests and documentation
  - Ready for push notification support

---

## Related Documentation

- [Task Management Workflow](../docs/task-management.md)
- [Notification Store](../src/stores/notificationStore.ts)
- [Task Mutations](../src/hooks/api/useTaskMutations.ts)
- [Database Types](../src/types/database.ts)
