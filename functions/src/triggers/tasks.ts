import * as functions from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { sendNotificationToUser } from "../notifications";

interface Task {
  text: string;
  title?: string;
  status: "pending" | "submitted" | "approved" | "rejected" | "completed" | "cancelled";
  assignedBy: "submissive" | "keyholder";
  createdAt: Date;
  dueDate?: Date;
  submittedAt?: Date;
  approvedAt?: Date;
  keyholderFeedback?: string;
  pointValue?: number;
  userId: string;
  keyholderUserId?: string;
}

/**
 * Trigger when a task is assigned (created)
 * Notifies the assignee (submissive) about the new task
 */
export const onTaskAssigned = functions.onDocumentCreated(
  "users/{userId}/tasks/{taskId}",
  async (event) => {
    const task = event.data?.data() as Task | undefined;
    const userId = event.params.userId;
    const taskId = event.params.taskId;

    if (!task) {
      logger.warn("Task data not found", { userId, taskId });
      return;
    }

    logger.info("Task assigned trigger", {
      userId,
      taskId,
      assignedBy: task.assignedBy,
    });

    // Only notify if assigned by keyholder to submissive
    if (task.assignedBy === "keyholder") {
      const taskTitle = task.title || task.text;
      const dueDateStr = task.dueDate
        ? ` (due ${new Date(task.dueDate).toLocaleDateString()})`
        : "";

      await sendNotificationToUser(
        userId,
        "New Task Assigned",
        `You have a new task: ${taskTitle}${dueDateStr}`,
        {
          type: "task_assigned",
          taskId,
          userId,
        }
      );
    }
  }
);

/**
 * Trigger when task status changes to "submitted"
 * Notifies the keyholder that a task is ready for review
 */
export const onTaskSubmitted = functions.onDocumentUpdated(
  "users/{userId}/tasks/{taskId}",
  async (event) => {
    const beforeTask = event.data?.before.data() as Task | undefined;
    const afterTask = event.data?.after.data() as Task | undefined;
    const userId = event.params.userId;
    const taskId = event.params.taskId;

    if (!beforeTask || !afterTask) {
      logger.warn("Task data not found", { userId, taskId });
      return;
    }

    // Check if status changed to submitted
    if (beforeTask.status !== "submitted" && afterTask.status === "submitted") {
      logger.info("Task submitted trigger", {
        userId,
        taskId,
      });

      // Notify keyholder if there is one
      if (afterTask.keyholderUserId) {
        const taskTitle = afterTask.title || afterTask.text;
        
        await sendNotificationToUser(
          afterTask.keyholderUserId,
          "Task Submitted for Review",
          `A task has been submitted: ${taskTitle}`,
          {
            type: "task_submitted",
            taskId,
            userId,
          }
        );
      }
    }
  }
);

/**
 * Trigger when task status changes to "approved"
 * Notifies the submissive that their task was approved
 */
export const onTaskApproved = functions.onDocumentUpdated(
  "users/{userId}/tasks/{taskId}",
  async (event) => {
    const beforeTask = event.data?.before.data() as Task | undefined;
    const afterTask = event.data?.after.data() as Task | undefined;
    const userId = event.params.userId;
    const taskId = event.params.taskId;

    if (!beforeTask || !afterTask) {
      logger.warn("Task data not found", { userId, taskId });
      return;
    }

    // Check if status changed to approved
    if (beforeTask.status !== "approved" && afterTask.status === "approved") {
      logger.info("Task approved trigger", {
        userId,
        taskId,
      });

      const taskTitle = afterTask.title || afterTask.text;
      const pointsStr = afterTask.pointValue ? ` (+${afterTask.pointValue} points)` : "";
      const feedbackStr = afterTask.keyholderFeedback
        ? ` - ${afterTask.keyholderFeedback}`
        : "";

      await sendNotificationToUser(
        userId,
        "Task Approved! ✅",
        `${taskTitle} was approved${pointsStr}${feedbackStr}`,
        {
          type: "task_approved",
          taskId,
          userId,
          points: afterTask.pointValue?.toString() || "0",
        }
      );
    }
  }
);

/**
 * Trigger when task status changes to "rejected"
 * Notifies the submissive that their task was rejected
 */
export const onTaskRejected = functions.onDocumentUpdated(
  "users/{userId}/tasks/{taskId}",
  async (event) => {
    const beforeTask = event.data?.before.data() as Task | undefined;
    const afterTask = event.data?.after.data() as Task | undefined;
    const userId = event.params.userId;
    const taskId = event.params.taskId;

    if (!beforeTask || !afterTask) {
      logger.warn("Task data not found", { userId, taskId });
      return;
    }

    // Check if status changed to rejected
    if (beforeTask.status !== "rejected" && afterTask.status === "rejected") {
      logger.info("Task rejected trigger", {
        userId,
        taskId,
      });

      const taskTitle = afterTask.title || afterTask.text;
      const reasonStr = afterTask.keyholderFeedback
        ? ` Reason: ${afterTask.keyholderFeedback}`
        : "";

      await sendNotificationToUser(
        userId,
        "Task Rejected",
        `${taskTitle} was rejected.${reasonStr}`,
        {
          type: "task_rejected",
          taskId,
          userId,
        }
      );
    }
  }
);
