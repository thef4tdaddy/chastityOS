/**
 * Achievement Badge Service
 * Handles user achievements, badges, and their visibility
 */

import { db } from "../../storage/ChastityDB";
import { DBUserAchievement } from "../../../types";
import { logger } from "../../../utils/logging";

export class AchievementBadgeService {
  private userAchievementsTable = db.userAchievements;

  private generateId(): string {
    return `ua_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
   * Award achievement to user
   */
  async awardAchievement(
    userId: string,
    achievementId: string,
    progress: number = 100,
    metadata?: Record<string, unknown>,
  ): Promise<string> {
    try {
      // Check if user already has this achievement
      const existing = await this.userAchievementsTable
        .where("userId")
        .equals(userId)
        .and((ua) => ua.achievementId === achievementId)
        .first();

      if (existing) {
        logger.warn(
          `User ${userId} already has achievement ${achievementId}`,
          "AchievementBadgeService",
        );
        return existing.id;
      }

      const userAchievement: DBUserAchievement = {
        id: this.generateId(),
        userId,
        achievementId,
        earnedAt: new Date(),
        progress,
        metadata,
        isVisible: true,
        syncStatus: "pending",
        lastModified: new Date(),
      };

      await this.userAchievementsTable.add(userAchievement);
      await this.queueSync(
        "userAchievements",
        "create",
        userAchievement.id,
        userAchievement,
      );

      logger.info(
        `Achievement ${achievementId} awarded to user ${userId}`,
        "AchievementBadgeService",
      );
      return userAchievement.id;
    } catch (error) {
      logger.error(
        "Failed to award achievement",
        error,
        "AchievementBadgeService",
      );
      throw error;
    }
  }

  /**
   * Get user's earned achievements
   */
  async getUserAchievements(userId: string): Promise<DBUserAchievement[]> {
    try {
      return await this.userAchievementsTable
        .where("userId")
        .equals(userId)
        .toArray();
    } catch (error) {
      logger.error(
        "Failed to get user achievements",
        error,
        "AchievementBadgeService",
      );
      return [];
    }
  }

  /**
   * Get user's visible achievements (for public profile)
   */
  async getUserVisibleAchievements(
    userId: string,
  ): Promise<DBUserAchievement[]> {
    try {
      return await this.userAchievementsTable
        .where("userId")
        .equals(userId)
        .and((ua) => ua.isVisible)
        .toArray();
    } catch (error) {
      logger.error(
        "Failed to get user visible achievements",
        error,
        "AchievementBadgeService",
      );
      return [];
    }
  }

  /**
   * Toggle achievement visibility
   */
  async toggleAchievementVisibility(
    userId: string,
    achievementId: string,
  ): Promise<void> {
    try {
      const userAchievement = await this.userAchievementsTable
        .where("userId")
        .equals(userId)
        .and((ua) => ua.achievementId === achievementId)
        .first();

      if (!userAchievement) {
        throw new Error("User achievement not found");
      }

      userAchievement.isVisible = !userAchievement.isVisible;
      userAchievement.lastModified = new Date();
      userAchievement.syncStatus = "pending";

      await this.userAchievementsTable.put(userAchievement);
      await this.queueSync(
        "userAchievements",
        "update",
        userAchievement.id,
        userAchievement,
      );

      logger.info(
        `Achievement ${achievementId} visibility toggled for user ${userId}`,
        "AchievementBadgeService",
      );
    } catch (error) {
      logger.error(
        "Failed to toggle achievement visibility",
        error,
        "AchievementBadgeService",
      );
      throw error;
    }
  }
}

// Export singleton instance
export const achievementBadgeService = new AchievementBadgeService();
