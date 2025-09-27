/**
 * Achievement Notification Service
 * Handles achievement notifications and alerts
 */

import { ChastityDB, db } from "../../storage/ChastityDB";
import { DBAchievementNotification } from "../../../types";
import { logger } from "../../../utils/logging";

export class AchievementNotificationService {
  private achievementNotificationsTable = db.achievementNotifications;

  private generateId(): string {
    return `an_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async queueSync(
    collection: string,
    operation: string,
    id: string,
    _data: any,
  ): Promise<void> {
    // Simplified sync queue - would normally integrate with proper sync service
    logger.debug(`Queued sync: ${operation} ${collection}/${id}`);
  }

  /**
   * Create achievement notification
   */
  async createNotification(
    userId: string,
    achievementId: string,
    type: "earned" | "progress" | "milestone",
    title: string,
    message: string,
  ): Promise<string> {
    try {
      const notification: DBAchievementNotification = {
        id: this.generateId(),
        userId,
        achievementId,
        type,
        title,
        message,
        isRead: false,
        createdAt: new Date(),
        syncStatus: "pending",
        lastModified: new Date(),
      };

      await this.achievementNotificationsTable.add(notification);
      await this.queueSync(
        "achievementNotifications",
        "create",
        notification.id,
        notification,
      );

      logger.info(
        `Achievement notification created for user ${userId}`,
        "AchievementNotificationService",
      );
      return notification.id;
    } catch (error) {
      logger.error(
        "Failed to create achievement notification",
        error,
        "AchievementNotificationService",
      );
      throw error;
    }
  }

  /**
   * Get user's unread notifications
   */
  async getUserUnreadNotifications(
    userId: string,
  ): Promise<DBAchievementNotification[]> {
    try {
      return await this.achievementNotificationsTable
        .where("userId")
        .equals(userId)
        .and((n) => !n.isRead)
        .reverse()
        .sortBy("createdAt");
    } catch (error) {
      logger.error(
        "Failed to get user unread notifications",
        error,
        "AchievementNotificationService",
      );
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    try {
      const notification =
        await this.achievementNotificationsTable.get(notificationId);
      if (notification) {
        notification.isRead = true;
        notification.lastModified = new Date();
        notification.syncStatus = "pending";

        await this.achievementNotificationsTable.put(notification);
        await this.queueSync(
          "achievementNotifications",
          "update",
          notification.id,
          notification,
        );
      }
    } catch (error) {
      logger.error(
        "Failed to mark notification as read",
        error,
        "AchievementNotificationService",
      );
      throw error;
    }
  }
}

// Export singleton instance
export const achievementNotificationService =
  new AchievementNotificationService();
