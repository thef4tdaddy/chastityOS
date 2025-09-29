/**
 * Achievement CRUD Service
 * Handles basic CRUD operations for achievement definitions
 */

import { db } from "../../storage/ChastityDB";
import { DBAchievement, AchievementCategory } from "../../../types";
import { logger } from "../../../utils/logging";

export class AchievementCRUDService {
  private achievementsTable = db.achievements;

  private generateId(): string {
    return `ach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async queueSync(
    collection: string,
    operation: string,
    id: string,
    __data: Record<string, unknown>,
  ): Promise<void> {
    // Simplified sync queue - would normally integrate with proper sync service
    logger.debug(`Queued sync: ${operation} ${collection}/${id}`);
  }

  /**
   * Create or update achievement definition
   */
  async createAchievement(
    achievement: Omit<DBAchievement, "id" | "syncStatus" | "lastModified">,
  ): Promise<string> {
    try {
      const achievementData: DBAchievement = {
        ...achievement,
        id: this.generateId(),
        syncStatus: "pending",
        lastModified: new Date(),
      };

      await this.achievementsTable.add(achievementData);
      await this.queueSync(
        "achievements",
        "create",
        achievementData.id,
        achievementData,
      );

      logger.info(
        `Achievement created: ${achievementData.name}`,
        "AchievementCRUDService",
      );
      return achievementData.id;
    } catch (error) {
      logger.error(
        "Failed to create achievement",
        error,
        "AchievementCRUDService",
      );
      throw error;
    }
  }

  /**
   * Get all achievements (for system reference)
   */
  async getAllAchievements(): Promise<DBAchievement[]> {
    try {
      return await this.achievementsTable.where("isActive").equals(1).toArray();
    } catch (error) {
      logger.error(
        "Failed to get achievements",
        error,
        "AchievementCRUDService",
      );
      return [];
    }
  }

  /**
   * Get achievement by ID
   */
  async getAchievementById(id: string): Promise<DBAchievement | null> {
    try {
      const achievement = await this.achievementsTable.get(id);
      return achievement || null;
    } catch (error) {
      logger.error(
        "Failed to get achievement by ID",
        error,
        "AchievementCRUDService",
      );
      return null;
    }
  }

  /**
   * Get achievements by category
   */
  async getAchievementsByCategory(
    category: AchievementCategory,
  ): Promise<DBAchievement[]> {
    try {
      return await this.achievementsTable
        .where("category")
        .equals(category)
        .and((achievement) => achievement.isActive)
        .toArray();
    } catch (error) {
      logger.error(
        "Failed to get achievements by category",
        error,
        "AchievementCRUDService",
      );
      return [];
    }
  }
}

// Export singleton instance
export const achievementCRUDService = new AchievementCRUDService();
