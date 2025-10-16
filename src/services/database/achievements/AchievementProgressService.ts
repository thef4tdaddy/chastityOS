/**
 * Achievement Progress Service
 * Handles progress tracking and updates for achievements
 */

import { db } from "../../storage/ChastityDB";
import { DBAchievementProgress } from "../../../types";
import { logger } from "../../../utils/logging";

export class AchievementProgressService {
  private achievementProgressTable = db.achievementProgress;
  private progressCache = new Map<string, DBAchievementProgress>();
  private cacheExpiry = 30000; // 30 seconds cache

  private generateId(): string {
    return `ap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async queueSync(
    collection: string,
    operation: string,
    id: string,
    _data: Record<string, unknown> | DBAchievementProgress,
  ): Promise<void> {
    // Simplified sync queue - would normally integrate with proper sync service
    logger.debug(`Queued sync: ${operation} ${collection}/${id}`);
  }

  private getCacheKey(userId: string, achievementId: string): string {
    return `${userId}:${achievementId}`;
  }

  private getCachedProgress(
    userId: string,
    achievementId: string,
  ): DBAchievementProgress | null {
    const cacheKey = this.getCacheKey(userId, achievementId);
    const cached = this.progressCache.get(cacheKey);
    if (
      cached &&
      Date.now() - cached.lastModified.getTime() < this.cacheExpiry
    ) {
      return cached;
    }
    return null;
  }

  private setCachedProgress(progress: DBAchievementProgress): void {
    const cacheKey = this.getCacheKey(progress.userId, progress.achievementId);
    this.progressCache.set(cacheKey, progress);
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
      // Validate input parameters
      if (!userId || !achievementId) {
        throw new Error("userId and achievementId are required");
      }

      // Handle edge cases for numeric values
      if (!Number.isFinite(currentValue) || !Number.isFinite(targetValue)) {
        logger.error(
          `Invalid numeric values for achievement progress: currentValue=${currentValue}, targetValue=${targetValue}`,
          null,
          "AchievementProgressService",
        );
        throw new Error(
          "Achievement progress calculation failed: Invalid numeric values",
        );
      }

      // Ensure non-negative values
      const sanitizedCurrentValue = Math.max(0, currentValue);
      const sanitizedTargetValue = Math.max(1, targetValue); // Ensure target is at least 1 to avoid division by zero

      // Check cache first for performance
      let existing: DBAchievementProgress | null = this.getCachedProgress(
        userId,
        achievementId,
      );

      if (!existing) {
        const result = await this.achievementProgressTable
          .where("userId")
          .equals(userId)
          .and((ap) => ap.achievementId === achievementId)
          .first();
        existing = result || null;
      }

      const progressData: DBAchievementProgress = {
        id: existing?.id || this.generateId(),
        userId,
        achievementId,
        currentValue: sanitizedCurrentValue,
        targetValue: sanitizedTargetValue,
        isCompleted: sanitizedCurrentValue >= sanitizedTargetValue,
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

      // Update cache
      this.setCachedProgress(progressData);

      // If completed, award the achievement (requires badge service)
      if (
        progressData.isCompleted &&
        !existing?.isCompleted &&
        this.badgeService
      ) {
        try {
          await this.badgeService.awardAchievement(userId, achievementId, 100);
        } catch (awardError) {
          logger.error(
            "Failed to award achievement, but progress was saved",
            awardError,
            "AchievementProgressService",
          );
          // Don't throw - progress is saved, award can be retried
        }
      }

      logger.debug(
        `Progress updated for ${achievementId}: ${sanitizedCurrentValue}/${sanitizedTargetValue}`,
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
