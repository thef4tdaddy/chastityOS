/**
 * Achievement Leaderboard Service
 * Handles leaderboard operations and rankings
 */

import { db } from "../../storage/ChastityDB";
import { DBLeaderboardEntry } from "../../../types";
import { logger } from "../../../utils/logging";

type LeaderboardCategory = DBLeaderboardEntry["category"];
type LeaderboardPeriod = DBLeaderboardEntry["period"];

export class AchievementLeaderboardService {
  private leaderboardEntriesTable = db.leaderboardEntries;

  private generateId(): string {
    return `le_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async queueSync(
    collection: string,
    operation: string,
    id: string,
    _data: Record<string, unknown>,
  ): Promise<void> {
    // Simplified sync queue - would normally integrate with proper sync service
    logger.debug(`Queued sync: ${operation} ${collection}/${id}`);
  }

  /**
   * Get leaderboard entries for a category and period
   */
  async getLeaderboard(
    category: LeaderboardCategory,
    period: LeaderboardPeriod,
    limit: number = 50,
  ): Promise<DBLeaderboardEntry[]> {
    try {
      return await this.leaderboardEntriesTable
        .where("[category+period]")
        .equals([category, period])
        .reverse()
        .sortBy("rank")
        .then((entries) => entries.slice(0, limit));
    } catch (error) {
      logger.error(
        "Failed to get leaderboard",
        error,
        "AchievementLeaderboardService",
      );
      return [];
    }
  }

  /**
   * Get user's rank in a specific leaderboard
   */
  async getUserLeaderboardRank(
    userId: string,
    category: string,
    period: string,
  ): Promise<{
    rank: number;
    value: number;
    totalParticipants: number;
  } | null> {
    try {
      const userEntry = await this.leaderboardEntriesTable
        .where("[userId+category+period]")
        .equals([userId, category, period])
        .first();

      if (!userEntry) return null;

      // Get total participants count
      const totalParticipants = await this.leaderboardEntriesTable
        .where("[category+period]")
        .equals([category, period])
        .count();

      return {
        rank: userEntry.rank,
        value: userEntry.value,
        totalParticipants,
      };
    } catch (error) {
      logger.error(
        "Failed to get user leaderboard rank",
        error,
        "AchievementLeaderboardService",
      );
      return null;
    }
  }

  /**
   * Update user's leaderboard entry
   */
  async updateLeaderboardEntry(
    userId: string,
    category: LeaderboardCategory,
    period: LeaderboardPeriod,
    value: number,
    displayName: string = "Anonymous",
    displayNameType: "real" | "username" | "anonymous" = "anonymous",
  ): Promise<void> {
    try {
      const entryData: DBLeaderboardEntry = {
        id: this.generateId(),
        userId,
        category,
        period,
        value,
        rank: 0, // Will be calculated by ranking algorithm
        displayName,
        displayNameType,
        isAnonymous: displayNameType === "anonymous",
        syncStatus: "pending",
        lastModified: new Date(),
      };

      // Upsert the entry
      await this.leaderboardEntriesTable.put(entryData);

      await this.queueSync(
        "leaderboardEntries",
        "create",
        entryData.id,
        entryData,
      );

      logger.info(
        `Updated leaderboard entry for user ${userId}`,
        "AchievementLeaderboardService",
      );
    } catch (error) {
      logger.error(
        "Failed to update leaderboard entry",
        error,
        "AchievementLeaderboardService",
      );
      throw error;
    }
  }

  /**
   * Get user's leaderboard privacy settings
   */
  async getLeaderboardPrivacy(_userId: string): Promise<{
    participateInGlobal: boolean;
    participateInMonthly: boolean;
    shareSessionTime: boolean;
    showRealName: boolean;
  }> {
    // This would typically be stored in user settings
    // For now, return default settings
    return {
      participateInGlobal: false,
      participateInMonthly: false,
      shareSessionTime: false,
      shareStreakData: false,
      shareAchievements: false,
      displayName: "anonymous",
      showOnPublicProfile: false,
    };
  }

  /**
   * Update user's leaderboard privacy settings
   */
  async updateLeaderboardPrivacy(
    _userId: string,
    _settings: {
      participateInGlobal?: boolean;
      participateInMonthly?: boolean;
      shareSessionTime?: boolean;
      showRealName?: boolean;
    },
  ): Promise<void> {
    try {
      // This would typically update user settings
      // For now, just log the action
      logger.info(
        `Updated leaderboard privacy for user ${_userId}`,
        "AchievementLeaderboardService",
      );
    } catch (error) {
      logger.error(
        "Failed to update leaderboard privacy",
        error,
        "AchievementLeaderboardService",
      );
      throw error;
    }
  }
}

// Export singleton instance
export const achievementLeaderboardService =
  new AchievementLeaderboardService();
