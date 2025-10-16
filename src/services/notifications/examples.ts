/* eslint-disable no-console */
/**
 * Task Notification Service - Usage Examples
 *
 * This file contains examples of how to use the TaskNotificationService
 * in different scenarios throughout the application.
 */

import { TaskNotificationService } from "./TaskNotificationService";

/**
 * Example 1: Keyholder assigns a task to submissive
 */
export async function exampleAssignTask() {
  // In a keyholder view component or hook
  const notificationId = await TaskNotificationService.notifyTaskAssigned({
    taskId: "task-abc123",
    taskTitle: "Complete daily exercises",
    userId: "submissive-user-id",
    keyholderName: "Master Alex",
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due in 24 hours
  });

  console.log("Notification sent:", notificationId);
}

/**
 * Example 2: Submissive submits a task for review
 */
export async function exampleSubmitTask() {
  // In a submissive task submission component
  const notificationId = await TaskNotificationService.notifyTaskSubmitted({
    taskId: "task-abc123",
    taskTitle: "Complete daily exercises",
    userId: "submissive-user-id",
    keyholderUserId: "keyholder-user-id",
    submissiveName: "Pet",
    hasEvidence: true, // Photos or files attached
  });

  console.log("Submission notification sent to keyholder:", notificationId);
}

/**
 * Example 3: Keyholder approves a task
 */
export async function exampleApproveTask() {
  // In a keyholder review component
  const notificationId = await TaskNotificationService.notifyTaskApproved({
    taskId: "task-abc123",
    taskTitle: "Complete daily exercises",
    userId: "submissive-user-id",
    points: 15,
    reviewNotes: "Excellent work! Very thorough.",
  });

  console.log("Approval notification sent:", notificationId);
}

/**
 * Example 4: Keyholder rejects a task
 */
export async function exampleRejectTask() {
  // In a keyholder review component
  const notificationId = await TaskNotificationService.notifyTaskRejected({
    taskId: "task-abc123",
    taskTitle: "Complete daily exercises",
    userId: "submissive-user-id",
    reason: "Evidence photos are not clear enough. Please retake.",
  });

  console.log("Rejection notification sent:", notificationId);
}

/**
 * Example 5: Deadline approaching (background scheduler)
 */
export async function exampleDeadlineCheck() {
  // In a background scheduler or interval check
  const tasks = [
    {
      id: "task-1",
      title: "Morning routine",
      userId: "user-1",
      dueDate: new Date(),
    },
  ];

  for (const task of tasks) {
    const now = new Date();
    const hoursUntilDue =
      (task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDue > 0 && hoursUntilDue <= 24) {
      await TaskNotificationService.notifyDeadlineApproaching({
        taskId: task.id,
        taskTitle: task.title,
        userId: task.userId,
        hoursRemaining: Math.round(hoursUntilDue),
      });
    }
  }
}

/**
 * Example 6: Task overdue (background scheduler)
 */
export async function exampleOverdueCheck() {
  // In a background scheduler or interval check
  const overdueTasks = [
    {
      id: "task-1",
      title: "Morning routine",
      userId: "user-1",
      keyholderUserId: "keyholder-1",
    },
  ];

  for (const task of overdueTasks) {
    const result = await TaskNotificationService.notifyTaskOverdue({
      taskId: task.id,
      taskTitle: task.title,
      userId: task.userId,
      keyholderUserId: task.keyholderUserId,
    });

    console.log("Overdue notifications sent:", result);
  }
}

/**
 * Example 7: Using in a React component with mutation
 */
export function ExampleComponent() {
  // This is how it's used in the actual useTaskMutations hook

  // In useAssignTask mutation's onSuccess callback:
  // TaskNotificationService.notifyTaskAssigned({
  //   taskId: data,
  //   taskTitle: variables.title,
  //   userId: variables.userId,
  //   keyholderName: variables.keyholderName,
  //   dueDate: variables.dueDate,
  // }).catch((error) => {
  //   logger.warn("Failed to send task assigned notification", { error });
  // });

  return null; // This is just an example
}

/**
 * Example 8: Batch notifications for multiple tasks
 */
export async function exampleBatchNotifications() {
  // When assigning multiple tasks at once
  const tasksToAssign = [
    { id: "task-1", title: "Task 1", userId: "user-1" },
    { id: "task-2", title: "Task 2", userId: "user-1" },
    { id: "task-3", title: "Task 3", userId: "user-1" },
  ];

  const notificationPromises = tasksToAssign.map((task) =>
    TaskNotificationService.notifyTaskAssigned({
      taskId: task.id,
      taskTitle: task.title,
      userId: task.userId,
      keyholderName: "Master Alex",
    }),
  );

  const results = await Promise.allSettled(notificationPromises);
  console.log("Batch notifications sent:", results);
}

/**
 * Example 9: Conditional notifications based on user preferences
 */
export async function exampleConditionalNotification() {
  // Future implementation with user preferences
  const userId = "user-123";
  const shouldNotify = await TaskNotificationService.shouldNotifyUser(
    userId,
    "task_assigned",
  );

  if (shouldNotify) {
    await TaskNotificationService.notifyTaskAssigned({
      taskId: "task-abc123",
      taskTitle: "New task",
      userId: userId,
    });
  }
}

/**
 * Example 10: Error handling
 */
export async function exampleErrorHandling() {
  try {
    const notificationId = await TaskNotificationService.notifyTaskAssigned({
      taskId: "task-abc123",
      taskTitle: "New task",
      userId: "user-123",
    });

    if (!notificationId) {
      console.warn("Notification failed to send but task was created");
      // Task operation continues even if notification fails
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    // Handle gracefully - don't let notification errors break task operations
  }
}
