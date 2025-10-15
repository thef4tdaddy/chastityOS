/* eslint-disable max-lines */
/**
 * Notification Service
 * Centralized service for handling all push notifications in ChastityOS
 * Includes session, keyholder, and system notifications
 *
 * Note: This file exceeds the max-lines limit due to comprehensive notification types.
 * Consider refactoring into smaller modules in the future.
 */
import { useNotificationStore } from "@/stores/notificationStore";
import { serviceLogger } from "@/utils/logging";
import {
  sanitizeNotificationContent,
  shouldSendNotification,
} from "@/utils/notifications/privacy";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase";

const logger = serviceLogger("NotificationService");

// ============================================================================
// Type Definitions
// ============================================================================

export interface BaseNotificationParams {
  userId: string;
  metadata?: Record<string, unknown>;
}

// Session Notification Types
export interface SessionEndingSoonParams extends BaseNotificationParams {
  sessionId: string;
  minutesRemaining: number;
}

export interface SessionCompletedParams extends BaseNotificationParams {
  sessionId: string;
  duration: number; // in hours
  submissiveName?: string;
}

export interface PauseCooldownExpiredParams extends BaseNotificationParams {
  sessionId: string;
}

export interface EmergencyUnlockParams extends BaseNotificationParams {
  sessionId: string;
  keyholderUserId: string;
  submissiveName?: string;
  reason?: string;
}

// Keyholder Notification Types
export interface SessionStartedParams extends BaseNotificationParams {
  sessionId: string;
  keyholderUserId: string;
  submissiveName?: string;
}

export interface SessionPausedParams extends BaseNotificationParams {
  sessionId: string;
  keyholderUserId: string;
  submissiveName?: string;
}

export interface SessionResumedParams extends BaseNotificationParams {
  sessionId: string;
  keyholderUserId: string;
  submissiveName?: string;
}

export interface KeyholderRequestParams extends BaseNotificationParams {
  keyholderUserId: string;
  submissiveName?: string;
  requestType: "invite" | "permission" | "general";
}

export interface GoalCompletedParams extends BaseNotificationParams {
  goalId: string;
  goalTitle: string;
  keyholderUserId: string;
  submissiveName?: string;
}

// System Notification Types
export interface SyncCompletedParams extends BaseNotificationParams {
  operationsCount: number;
  wasManualSync: boolean;
}

export interface SyncFailedParams extends BaseNotificationParams {
  errorMessage: string;
  retryable: boolean;
}

export interface AppUpdateAvailableParams {
  version: string;
  releaseNotes?: string;
}

export interface AchievementUnlockedParams extends BaseNotificationParams {
  achievementId: string;
  achievementTitle: string;
  achievementDescription: string;
  points?: number;
}

// ============================================================================
// Notification Service
// ============================================================================

/**
 * Notification Service
 * Provides centralized notification handling for all app events
 *
 * Design: Currently supports in-app toast notifications via the notification store,
 * structured to easily add push notification support in the future.
 */
export class NotificationService {
  // ========================================================================
  // Privacy & Settings Helpers
  // ========================================================================

  /**
   * Get user's notification settings and privacy preferences
   */
  private static async getUserNotificationSettings(userId: string): Promise<{
    privacyMode: boolean;
    isAnonymous: boolean;
    preferences: {
      sessionNotifications: boolean;
      taskNotifications: boolean;
      keyholderNotifications: boolean;
      systemNotifications: boolean;
      pushEnabled: boolean;
      emailNotifications: boolean;
      emailOptOut: boolean;
    };
  }> {
    try {
      // Get notification settings from Firestore
      const settingsDoc = doc(db, "users", userId, "settings", "notifications");
      const docSnap = await getDoc(settingsDoc);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          privacyMode: data.privacyMode ?? false,
          isAnonymous: false, // Will be determined by auth state
          preferences: {
            sessionNotifications: data.sessionNotifications ?? true,
            taskNotifications: data.taskNotifications ?? true,
            keyholderNotifications: data.keyholderNotifications ?? true,
            systemNotifications: data.systemNotifications ?? true,
            pushEnabled: data.pushEnabled ?? false,
            emailNotifications: data.emailNotifications ?? true,
            emailOptOut: data.emailOptOut ?? false,
          },
        };
      }

      // Return defaults if no settings found
      return {
        privacyMode: false,
        isAnonymous: false,
        preferences: {
          sessionNotifications: true,
          taskNotifications: true,
          keyholderNotifications: true,
          systemNotifications: true,
          pushEnabled: false,
          emailNotifications: true,
          emailOptOut: false,
        },
      };
    } catch (error) {
      logger.error("Failed to get user notification settings", {
        error,
        userId,
      });
      // Return safe defaults on error
      return {
        privacyMode: false,
        isAnonymous: false,
        preferences: {
          sessionNotifications: true,
          taskNotifications: true,
          keyholderNotifications: true,
          systemNotifications: true,
          pushEnabled: false,
          emailNotifications: true,
          emailOptOut: false,
        },
      };
    }
  }

  /**
   * Check if notification should be sent based on user preferences
   */
  private static async shouldNotifyUser(
    userId: string,
    notificationType: string,
  ): Promise<boolean> {
    try {
      const settings = await this.getUserNotificationSettings(userId);

      return shouldSendNotification(notificationType, settings.preferences, {
        privacyMode: settings.privacyMode,
        anonymousMode: settings.isAnonymous,
        optedOut: settings.preferences.emailOptOut,
      });
    } catch (error) {
      logger.error("Error checking if should notify user", { error, userId });
      // Default to sending notification on error
      return true;
    }
  }

  // ========================================================================
  // Session Notifications
  // ========================================================================

  /**
   * Notify submissive that session is ending soon (5 min warning)
   */
  static async notifySessionEndingSoon(
    params: SessionEndingSoonParams,
  ): Promise<string | null> {
    try {
      // Check if user wants this notification
      const shouldNotify = await this.shouldNotifyUser(
        params.userId,
        "session_ending_soon",
      );
      if (!shouldNotify) {
        logger.debug("Notification skipped due to user preferences", {
          userId: params.userId,
          type: "session_ending_soon",
        });
        return null;
      }

      logger.info("Sending session ending soon notification", {
        sessionId: params.sessionId,
        userId: params.userId,
        minutesRemaining: params.minutesRemaining,
      });

      // Get user's privacy settings
      const settings = await this.getUserNotificationSettings(params.userId);

      // Prepare notification content
      const content = {
        title: "Session Ending Soon",
        message: `Your chastity session will end in ${params.minutesRemaining} minutes`,
        metadata: {
          sessionId: params.sessionId,
          link: `/tracker`,
          type: "session_ending_soon",
          ...params.metadata,
        },
      };

      // Apply privacy sanitization
      const sanitizedContent = sanitizeNotificationContent(
        content,
        settings.privacyMode,
        settings.isAnonymous,
      );

      const notificationId = useNotificationStore.getState().addNotification({
        type: "warning",
        priority: "high",
        title: sanitizedContent.title,
        message: sanitizedContent.message,
        duration: 0, // Persistent until dismissed
        metadata: sanitizedContent.metadata,
      });

      // Future: Add push notification here
      // await this.sendPushNotification({ ... });

      return notificationId;
    } catch (error) {
      logger.error("Failed to send session ending soon notification", {
        error,
      });
      return null;
    }
  }

  /**
   * Notify submissive that session has completed
   */
  static async notifySessionCompleted(
    params: SessionCompletedParams,
  ): Promise<string | null> {
    try {
      // Check if user wants this notification
      const shouldNotify = await this.shouldNotifyUser(
        params.userId,
        "session_completed",
      );
      if (!shouldNotify) {
        logger.debug("Notification skipped due to user preferences", {
          userId: params.userId,
          type: "session_completed",
        });
        return null;
      }

      logger.info("Sending session completed notification", {
        sessionId: params.sessionId,
        userId: params.userId,
      });

      // Get user's privacy settings
      const settings = await this.getUserNotificationSettings(params.userId);

      const durationText =
        params.duration > 24
          ? `${Math.round(params.duration / 24)} days`
          : `${Math.round(params.duration)} hours`;

      // Prepare notification content
      const content = {
        title: "Session Completed! 🎉",
        message: params.submissiveName
          ? `Congratulations, ${params.submissiveName}! You completed a ${durationText} session`
          : `Congratulations! You completed a ${durationText} session`,
        metadata: {
          sessionId: params.sessionId,
          link: `/tracker`,
          type: "session_completed",
          duration: params.duration,
          submissiveName: params.submissiveName,
          ...params.metadata,
        },
      };

      // Apply privacy sanitization
      const sanitizedContent = sanitizeNotificationContent(
        content,
        settings.privacyMode,
        settings.isAnonymous,
      );

      const notificationId = useNotificationStore.getState().addNotification({
        type: "success",
        priority: "high",
        title: sanitizedContent.title,
        message: sanitizedContent.message,
        duration: 0, // Persistent - achievement moment
        metadata: sanitizedContent.metadata,
      });

      return notificationId;
    } catch (error) {
      logger.error("Failed to send session completed notification", { error });
      return null;
    }
  }

  /**
   * Notify submissive that pause cooldown has expired and they can resume
   */
  static async notifyPauseCooldownExpired(
    params: PauseCooldownExpiredParams,
  ): Promise<string | null> {
    try {
      logger.info("Sending pause cooldown expired notification", {
        sessionId: params.sessionId,
        userId: params.userId,
      });

      const notificationId = useNotificationStore.getState().addNotification({
        type: "info",
        priority: "medium",
        title: "Ready to Resume",
        message:
          "Your pause cooldown has expired. You can now resume your session.",
        duration: 0, // Persistent until dismissed
        metadata: {
          sessionId: params.sessionId,
          link: `/tracker`,
          type: "pause_cooldown_expired",
          ...params.metadata,
        },
      });

      return notificationId;
    } catch (error) {
      logger.error("Failed to send pause cooldown expired notification", {
        error,
      });
      return null;
    }
  }

  /**
   * Notify keyholder that submissive has requested emergency unlock
   */
  static async notifyEmergencyUnlock(
    params: EmergencyUnlockParams,
  ): Promise<string | null> {
    try {
      const submissiveName = params.submissiveName || "Your submissive";

      logger.info("Sending emergency unlock notification", {
        sessionId: params.sessionId,
        keyholderUserId: params.keyholderUserId,
      });

      const notificationId = useNotificationStore.getState().addNotification({
        type: "error",
        priority: "urgent",
        title: "🚨 Emergency Unlock Requested",
        message: `${submissiveName} has triggered an emergency unlock${params.reason ? `: ${params.reason}` : ""}`,
        duration: 0, // Persistent - urgent
        requireInteraction: true,
        metadata: {
          sessionId: params.sessionId,
          link: `/keyholder/sessions/${params.sessionId}`,
          type: "emergency_unlock",
          reason: params.reason,
          ...params.metadata,
        },
      });

      return notificationId;
    } catch (error) {
      logger.error("Failed to send emergency unlock notification", { error });
      return null;
    }
  }

  // ========================================================================
  // Keyholder Notifications
  // ========================================================================

  /**
   * Notify keyholder that submissive started a session
   */
  static async notifySessionStarted(
    params: SessionStartedParams,
  ): Promise<string | null> {
    try {
      const submissiveName = params.submissiveName || "Your submissive";

      logger.info("Sending session started notification", {
        sessionId: params.sessionId,
        keyholderUserId: params.keyholderUserId,
      });

      const notificationId = useNotificationStore.getState().addNotification({
        type: "info",
        priority: "medium",
        title: "Session Started",
        message: `${submissiveName} has started a chastity session`,
        duration: 6000,
        metadata: {
          sessionId: params.sessionId,
          link: `/keyholder/sessions/${params.sessionId}`,
          type: "session_started",
          ...params.metadata,
        },
      });

      return notificationId;
    } catch (error) {
      logger.error("Failed to send session started notification", { error });
      return null;
    }
  }

  /**
   * Notify keyholder that submissive paused a session
   */
  static async notifySessionPaused(
    params: SessionPausedParams,
  ): Promise<string | null> {
    try {
      const submissiveName = params.submissiveName || "Your submissive";

      logger.info("Sending session paused notification", {
        sessionId: params.sessionId,
        keyholderUserId: params.keyholderUserId,
      });

      const notificationId = useNotificationStore.getState().addNotification({
        type: "warning",
        priority: "medium",
        title: "Session Paused",
        message: `${submissiveName} has paused their session`,
        duration: 6000,
        metadata: {
          sessionId: params.sessionId,
          link: `/keyholder/sessions/${params.sessionId}`,
          type: "session_paused",
          ...params.metadata,
        },
      });

      return notificationId;
    } catch (error) {
      logger.error("Failed to send session paused notification", { error });
      return null;
    }
  }

  /**
   * Notify keyholder that submissive resumed a session
   */
  static async notifySessionResumed(
    params: SessionResumedParams,
  ): Promise<string | null> {
    try {
      const submissiveName = params.submissiveName || "Your submissive";

      logger.info("Sending session resumed notification", {
        sessionId: params.sessionId,
        keyholderUserId: params.keyholderUserId,
      });

      const notificationId = useNotificationStore.getState().addNotification({
        type: "info",
        priority: "medium",
        title: "Session Resumed",
        message: `${submissiveName} has resumed their session`,
        duration: 6000,
        metadata: {
          sessionId: params.sessionId,
          link: `/keyholder/sessions/${params.sessionId}`,
          type: "session_resumed",
          ...params.metadata,
        },
      });

      return notificationId;
    } catch (error) {
      logger.error("Failed to send session resumed notification", { error });
      return null;
    }
  }

  /**
   * Notify keyholder about a new relationship request
   */
  static async notifyKeyholderRequest(
    params: KeyholderRequestParams,
  ): Promise<string | null> {
    try {
      const submissiveName = params.submissiveName || "A submissive";
      const requestTypeText =
        params.requestType === "invite"
          ? "keyholder invitation"
          : params.requestType === "permission"
            ? "permission request"
            : "request";

      logger.info("Sending keyholder request notification", {
        keyholderUserId: params.keyholderUserId,
        requestType: params.requestType,
      });

      const notificationId = useNotificationStore.getState().addNotification({
        type: "info",
        priority: "high",
        title: "New Request Received",
        message: `${submissiveName} sent you a ${requestTypeText}`,
        duration: 0, // Persistent
        metadata: {
          link: `/keyholder/requests`,
          type: "keyholder_request",
          requestType: params.requestType,
          ...params.metadata,
        },
      });

      return notificationId;
    } catch (error) {
      logger.error("Failed to send keyholder request notification", { error });
      return null;
    }
  }

  /**
   * Notify keyholder that submissive completed a goal
   */
  static async notifyGoalCompleted(
    params: GoalCompletedParams,
  ): Promise<string | null> {
    try {
      const submissiveName = params.submissiveName || "Your submissive";

      logger.info("Sending goal completed notification", {
        goalId: params.goalId,
        keyholderUserId: params.keyholderUserId,
      });

      const notificationId = useNotificationStore.getState().addNotification({
        type: "success",
        priority: "medium",
        title: "Goal Completed! 🎯",
        message: `${submissiveName} completed: "${params.goalTitle}"`,
        duration: 7000,
        metadata: {
          goalId: params.goalId,
          link: `/keyholder/goals/${params.goalId}`,
          type: "goal_completed",
          ...params.metadata,
        },
      });

      return notificationId;
    } catch (error) {
      logger.error("Failed to send goal completed notification", { error });
      return null;
    }
  }

  // ========================================================================
  // System Notifications
  // ========================================================================

  /**
   * Notify user that data sync completed
   */
  static async notifySyncCompleted(
    params: SyncCompletedParams,
  ): Promise<string | null> {
    try {
      logger.info("Sending sync completed notification", {
        userId: params.userId,
        operationsCount: params.operationsCount,
      });

      // Only show notification for manual syncs
      if (!params.wasManualSync) {
        return null;
      }

      const notificationId = useNotificationStore.getState().addNotification({
        type: "success",
        priority: "low",
        title: "Sync Complete",
        message: `Successfully synced ${params.operationsCount} item${params.operationsCount !== 1 ? "s" : ""}`,
        duration: 4000,
        metadata: {
          type: "sync_completed",
          operationsCount: params.operationsCount,
          ...params.metadata,
        },
      });

      return notificationId;
    } catch (error) {
      logger.error("Failed to send sync completed notification", { error });
      return null;
    }
  }

  /**
   * Notify user that data sync failed
   */
  static async notifySyncFailed(
    params: SyncFailedParams,
  ): Promise<string | null> {
    try {
      logger.info("Sending sync failed notification", {
        userId: params.userId,
        errorMessage: params.errorMessage,
      });

      const notificationId = useNotificationStore.getState().addNotification({
        type: "error",
        priority: "high",
        title: "Sync Failed",
        message: params.retryable
          ? `Sync failed: ${params.errorMessage}. Tap to retry.`
          : `Sync failed: ${params.errorMessage}`,
        duration: 0, // Persistent
        action: params.retryable
          ? {
              label: "Retry",
              onClick: () => {
                // Future: Trigger retry logic
                logger.info("User requested sync retry");
              },
            }
          : undefined,
        metadata: {
          type: "sync_failed",
          errorMessage: params.errorMessage,
          retryable: params.retryable,
          ...params.metadata,
        },
      });

      return notificationId;
    } catch (error) {
      logger.error("Failed to send sync failed notification", { error });
      return null;
    }
  }

  /**
   * Notify user that app update is available
   */
  static async notifyAppUpdateAvailable(
    params: AppUpdateAvailableParams,
  ): Promise<string | null> {
    try {
      logger.info("Sending app update available notification", {
        version: params.version,
      });

      const notificationId = useNotificationStore.getState().addNotification({
        type: "info",
        priority: "medium",
        title: "Update Available",
        message: `Version ${params.version} is ready to install`,
        duration: 0, // Persistent
        action: {
          label: "Update",
          onClick: () => {
            // Future: Trigger app update
            logger.info("User requested app update");
            window.location.reload();
          },
        },
        metadata: {
          type: "app_update",
          version: params.version,
          releaseNotes: params.releaseNotes,
        },
      });

      return notificationId;
    } catch (error) {
      logger.error("Failed to send app update notification", { error });
      return null;
    }
  }

  /**
   * Notify user that they unlocked an achievement
   */
  static async notifyAchievementUnlocked(
    params: AchievementUnlockedParams,
  ): Promise<string | null> {
    try {
      logger.info("Sending achievement unlocked notification", {
        achievementId: params.achievementId,
        userId: params.userId,
      });

      const pointsText = params.points ? ` +${params.points} points!` : "";

      const notificationId = useNotificationStore.getState().addNotification({
        type: "success",
        priority: "medium",
        title: "🏆 Achievement Unlocked!",
        message: `${params.achievementTitle}${pointsText}`,
        duration: 8000,
        metadata: {
          achievementId: params.achievementId,
          link: `/achievements/${params.achievementId}`,
          type: "achievement_unlocked",
          points: params.points,
          ...params.metadata,
        },
      });

      return notificationId;
    } catch (error) {
      logger.error("Failed to send achievement unlocked notification", {
        error,
      });
      return null;
    }
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Future: Send push notification
   * This method is a placeholder for future push notification support
   */
  // private static async sendPushNotification(params: {
  //   userId: string;
  //   title: string;
  //   body: string;
  //   icon?: string;
  //   badge?: string;
  //   data?: Record<string, unknown>;
  //   actions?: Array<{ action: string; title: string }>;
  // }): Promise<void> {
  //   // Implementation for push notifications will go here
  //   // Could use Service Worker Push API with proper registration
  // }
}

export default NotificationService;
