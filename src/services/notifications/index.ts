/**
 * Notification Services Index
 * Central export for all notification services
 */

export { TaskNotificationService } from "./TaskNotificationService";
export type {
  TaskNotificationParams,
  TaskAssignedParams,
  TaskSubmittedParams,
  TaskApprovedParams,
  TaskRejectedParams,
  TaskDeadlineParams,
  TaskOverdueParams,
} from "./TaskNotificationService";

export { NotificationService } from "./NotificationService";
export type {
  BaseNotificationParams,
  SessionEndingSoonParams,
  SessionCompletedParams,
  PauseCooldownExpiredParams,
  EmergencyUnlockParams,
  SessionStartedParams,
  SessionPausedParams,
  SessionResumedParams,
  KeyholderRequestParams,
  GoalCompletedParams,
  SyncCompletedParams,
  SyncFailedParams,
  AppUpdateAvailableParams,
  AchievementUnlockedParams,
} from "./NotificationService";

export { FCMService } from "./FCMService";
export type { FCMServiceConfig } from "./FCMService";
