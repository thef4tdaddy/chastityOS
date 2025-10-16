/**
 * Task Notification Service
 * Handles all task-related notifications with support for future push notifications
 */
import { useNotificationStore } from "@/stores/notificationStore";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("TaskNotificationService");

export interface TaskNotificationParams {
  taskId: string;
  taskTitle: string;
  userId: string;
  metadata?: Record<string, unknown>;
}

export interface TaskAssignedParams extends TaskNotificationParams {
  keyholderName?: string;
  dueDate?: Date;
}

export interface TaskSubmittedParams extends TaskNotificationParams {
  keyholderUserId: string;
  submissiveName?: string;
  hasEvidence: boolean;
}

export interface TaskApprovedParams extends TaskNotificationParams {
  points?: number;
  reviewNotes?: string;
}

export interface TaskRejectedParams extends TaskNotificationParams {
  reason?: string;
}

export interface TaskDeadlineParams extends TaskNotificationParams {
  hoursRemaining: number;
}

export interface TaskOverdueParams extends TaskNotificationParams {
  keyholderUserId: string;
}

/**
 * Task Notification Service
 * Provides centralized notification handling for task workflow events
 *
 * Design: This service uses the existing notification store for toast notifications
 * but is structured to easily support push notifications in the future by adding
 * additional notification channels alongside the toast notifications.
 */
export class TaskNotificationService {
  /**
   * Notify submissive that task was assigned
   */
  static async notifyTaskAssigned(
    params: TaskAssignedParams,
  ): Promise<string | null> {
    try {
      const keyholderName = params.keyholderName || "Your Keyholder";
      const dueText = params.dueDate
        ? ` (due ${params.dueDate.toLocaleDateString()})`
        : "";

      logger.info("Sending task assigned notification", {
        taskId: params.taskId,
        userId: params.userId,
      });

      // Send in-app notification (toast)
      const notificationId = useNotificationStore.getState().addNotification({
        type: "info",
        priority: params.dueDate ? "high" : "medium",
        title: "New Task Assigned",
        message: `${keyholderName} assigned you: "${params.taskTitle}"${dueText}`,
        duration: 6000,
        metadata: {
          taskId: params.taskId,
          link: `/tasks/${params.taskId}`,
          type: "task_assigned",
          ...params.metadata,
        },
      });

      // Future: Add push notification here
      // await this.sendPushNotification({ ... });

      return notificationId;
    } catch (error) {
      logger.error("Failed to send task assigned notification", { error });
      return null;
    }
  }

  /**
   * Notify keyholder that task was submitted
   */
  static async notifyTaskSubmitted(
    params: TaskSubmittedParams,
  ): Promise<string | null> {
    try {
      const submissiveName = params.submissiveName || "Your submissive";
      const evidenceText = params.hasEvidence ? " with evidence" : "";

      logger.info("Sending task submitted notification", {
        taskId: params.taskId,
        keyholderUserId: params.keyholderUserId,
      });

      // Send in-app notification (toast)
      const notificationId = useNotificationStore.getState().addNotification({
        type: "info",
        priority: "high",
        title: "Task Submitted for Review",
        message: `${submissiveName} submitted: "${params.taskTitle}"${evidenceText}`,
        duration: 7000,
        metadata: {
          taskId: params.taskId,
          link: `/keyholder/tasks/${params.taskId}`,
          type: "task_submitted",
          ...params.metadata,
        },
      });

      // Future: Add push notification here
      // await this.sendPushNotification({ userId: params.keyholderUserId, ... });

      return notificationId;
    } catch (error) {
      logger.error("Failed to send task submitted notification", { error });
      return null;
    }
  }

  /**
   * Notify submissive that task was approved
   */
  static async notifyTaskApproved(
    params: TaskApprovedParams,
  ): Promise<string | null> {
    try {
      const pointsText = params.points ? ` +${params.points} points!` : "";

      logger.info("Sending task approved notification", {
        taskId: params.taskId,
        userId: params.userId,
      });

      // Send in-app notification (toast)
      const notificationId = useNotificationStore.getState().addNotification({
        type: "success",
        priority: "medium",
        title: "Task Approved! ✅",
        message: `"${params.taskTitle}" was approved${pointsText}`,
        duration: 6000,
        metadata: {
          taskId: params.taskId,
          points: params.points,
          reviewNotes: params.reviewNotes,
          type: "task_approved",
          ...params.metadata,
        },
      });

      // Future: Add push notification here
      // await this.sendPushNotification({ ... });

      return notificationId;
    } catch (error) {
      logger.error("Failed to send task approved notification", { error });
      return null;
    }
  }

  /**
   * Notify submissive that task was rejected
   */
  static async notifyTaskRejected(
    params: TaskRejectedParams,
  ): Promise<string | null> {
    try {
      const reasonText = params.reason ? `: ${params.reason}` : "";

      logger.info("Sending task rejected notification", {
        taskId: params.taskId,
        userId: params.userId,
      });

      // Send in-app notification (toast)
      const notificationId = useNotificationStore.getState().addNotification({
        type: "warning",
        priority: "high",
        title: "Task Needs Revision",
        message: `"${params.taskTitle}" was rejected${reasonText}`,
        duration: 0, // Persistent for rejected tasks
        metadata: {
          taskId: params.taskId,
          reason: params.reason,
          link: `/tasks/${params.taskId}`,
          type: "task_rejected",
          ...params.metadata,
        },
      });

      // Future: Add push notification here
      // await this.sendPushNotification({ ... });

      return notificationId;
    } catch (error) {
      logger.error("Failed to send task rejected notification", { error });
      return null;
    }
  }

  /**
   * Notify about approaching deadline
   */
  static async notifyDeadlineApproaching(
    params: TaskDeadlineParams,
  ): Promise<string | null> {
    try {
      logger.info("Sending deadline approaching notification", {
        taskId: params.taskId,
        userId: params.userId,
        hoursRemaining: params.hoursRemaining,
      });

      // Send in-app notification (toast)
      const notificationId = useNotificationStore.getState().addNotification({
        type: "warning",
        priority: "high",
        title: "Task Deadline Approaching",
        message: `"${params.taskTitle}" is due in ${params.hoursRemaining} hours`,
        duration: 8000,
        metadata: {
          taskId: params.taskId,
          link: `/tasks/${params.taskId}`,
          type: "task_deadline",
          hoursRemaining: params.hoursRemaining,
          ...params.metadata,
        },
      });

      // Future: Add push notification here
      // await this.sendPushNotification({ ... });

      return notificationId;
    } catch (error) {
      logger.error("Failed to send deadline approaching notification", {
        error,
      });
      return null;
    }
  }

  /**
   * Notify about overdue task
   */
  static async notifyTaskOverdue(params: TaskOverdueParams): Promise<{
    submissiveNotificationId: string | null;
    keyholderNotificationId: string | null;
  }> {
    try {
      logger.info("Sending task overdue notifications", {
        taskId: params.taskId,
        userId: params.userId,
        keyholderUserId: params.keyholderUserId,
      });

      // Notify submissive
      const submissiveNotificationId = useNotificationStore
        .getState()
        .addNotification({
          type: "error",
          priority: "high",
          title: "Task Overdue",
          message: `"${params.taskTitle}" is past its deadline`,
          duration: 0, // Persistent for overdue tasks
          metadata: {
            taskId: params.taskId,
            link: `/tasks/${params.taskId}`,
            type: "task_overdue",
            ...params.metadata,
          },
        });

      // Notify keyholder
      const keyholderNotificationId = useNotificationStore
        .getState()
        .addNotification({
          type: "warning",
          priority: "medium",
          title: "Task Overdue",
          message: `Assigned task "${params.taskTitle}" is overdue`,
          duration: 7000,
          metadata: {
            taskId: params.taskId,
            link: `/keyholder/tasks/${params.taskId}`,
            type: "task_overdue_keyholder",
            ...params.metadata,
          },
        });

      // Future: Add push notifications here for both users
      // await this.sendPushNotification({ userId: params.userId, ... });
      // await this.sendPushNotification({ userId: params.keyholderUserId, ... });

      return { submissiveNotificationId, keyholderNotificationId };
    } catch (error) {
      logger.error("Failed to send task overdue notifications", { error });
      return { submissiveNotificationId: null, keyholderNotificationId: null };
    }
  }

  /**
   * Future: Send push notification
   * This method is a placeholder for future push notification support
   */
  // private static async sendPushNotification(params: {
  //   userId: string;
  //   title: string;
  //   body: string;
  //   data?: Record<string, unknown>;
  // }): Promise<void> {
  //   // Implementation for push notifications will go here
  //   // Could use Firebase Cloud Messaging (FCM) or other push service
  // }

  /**
   * Check if user has task notifications enabled
   * Future: Read from user settings
   */
  static async shouldNotifyUser(
    _userId: string,
    _notificationType: string,
  ): Promise<boolean> {
    // Future: Check user preferences from settings
    // For now, always return true
    return true;
  }
}

export default TaskNotificationService;
