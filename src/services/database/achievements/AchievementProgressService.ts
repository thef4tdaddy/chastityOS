/**
 * Achievement Progress Service
 * Handles progress tracking and updates for achievements
 */

import { ChastityDB } from "../../storage/ChastityDB";
import { DBAchievementProgress } from "../../../types";
import { logger } from "../../../utils/logging";

export class AchievementProgressService {
  private achievementProgressTable = ChastityDB.achievementProgress;

  private generateId(): string {
    return `ap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  constructor(
    private badgeService?: {
      awardAchievement: (
        userId: string,
        achievementId: string,
        progress: number,
      ) => Promise<string>;
    },
  ) {}

  /**
   * Update achievement progress
   */
  async updateAchievementProgress(
    userId: string,
    achievementId: string,
    currentValue: number,
    targetValue: number,
  ): Promise<void> {
    try {
      const existing = await this.achievementProgressTable
        .where("userId")
        .equals(userId)
        .and((ap) => ap.achievementId === achievementId)
        .first();

      const progressData: DBAchievementProgress = {
        id: existing?.id || this.generateId(),
        userId,
        achievementId,
        currentValue,
        targetValue,
        isCompleted: currentValue >= targetValue,
        syncStatus: "pending",
        lastModified: new Date(),
      };

      if (existing) {
        await this.achievementProgressTable.put(progressData);
        await this.queueSync(
          "achievementProgress",
          "update",
          progressData.id,
          progressData,
        );
      } else {
        await this.achievementProgressTable.add(progressData);
        await this.queueSync(
          "achievementProgress",
          "create",
          progressData.id,
          progressData,
        );
      }

      // If completed, award the achievement (requires badge service)
      if (
        progressData.isCompleted &&
        !existing?.isCompleted &&
        this.badgeService
      ) {
        await this.badgeService.awardAchievement(userId, achievementId, 100);
      }

      logger.debug(
        `Progress updated for ${achievementId}: ${currentValue}/${targetValue}`,
        "AchievementProgressService",
      );
    } catch (error) {
      logger.error(
        "Failed to update achievement progress",
        error,
        "AchievementProgressService",
      );
      throw error;
    }
  }

  /**
   * Get user's achievement progress
   */
  async getUserAchievementProgress(
    userId: string,
  ): Promise<DBAchievementProgress[]> {
    try {
      return await this.achievementProgressTable
        .where("userId")
        .equals(userId)
        .toArray();
    } catch (error) {
      logger.error(
        "Failed to get user achievement progress",
        error,
        "AchievementProgressService",
      );
      return [];
    }
  }

  /**
   * Get progress for specific achievement
   */
  async getAchievementProgress(
    userId: string,
    achievementId: string,
  ): Promise<DBAchievementProgress | null> {
    try {
      const progress = await this.achievementProgressTable
        .where("userId")
        .equals(userId)
        .and((ap) => ap.achievementId === achievementId)
        .first();

      return progress || null;
    } catch (error) {
      logger.error(
        "Failed to get achievement progress",
        error,
        "AchievementProgressService",
      );
      return null;
    }
  }
}

// Export singleton instance
export const achievementProgressService = new AchievementProgressService();
