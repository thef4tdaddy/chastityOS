/**
 * User Stats Service
 * Handles user statistics for points and task completion tracking
 */
import { BaseDBService } from "./BaseDBService";
import { db } from "../storage/ChastityDB";
import { serviceLogger } from "@/utils/logging";
import { generateUUID } from "@/utils";

const logger = serviceLogger("UserStatsService");

export interface UserStats {
  userId: string;
  totalPoints: number;
  tasksCompleted: number;
  tasksApproved: number;
  tasksRejected: number;
  currentStreak: number;
  longestStreak: number;
  lastTaskCompletedAt?: Date;
}

class UserStatsService extends BaseDBService<{
  id: string;
  userId: string;
  totalPoints: number;
  tasksCompleted: number;
  tasksApproved: number;
  tasksRejected: number;
  currentStreak: number;
  longestStreak: number;
  lastTaskCompletedAt?: Date;
  syncStatus: "synced" | "pending" | "conflict";
  lastModified: Date;
}> {
  constructor() {
    super(db.userStats);
  }

  /**
   * Get or create user stats
   */
  async getStats(userId: string): Promise<UserStats> {
    try {
      let stats = await this.table.where("userId").equals(userId).first();

      // Create default stats if they don't exist
      if (!stats) {
        const statsId = generateUUID();
        const defaultStats = {
          id: statsId,
          userId,
          totalPoints: 0,
          tasksCompleted: 0,
          tasksApproved: 0,
          tasksRejected: 0,
          currentStreak: 0,
          longestStreak: 0,
        };

        await this.create(defaultStats);
        stats = await this.table.where("userId").equals(userId).first();

        if (!stats) {
          throw new Error("Failed to create user stats");
        }

        logger.info("Created default user stats", { userId });
      }

      return {
        userId: stats.userId,
        totalPoints: stats.totalPoints,
        tasksCompleted: stats.tasksCompleted,
        tasksApproved: stats.tasksApproved,
        tasksRejected: stats.tasksRejected,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        lastTaskCompletedAt: stats.lastTaskCompletedAt,
      };
    } catch (error) {
      logger.error("Failed to get user stats", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Update user stats
   */
  async updateStats(
    userId: string,
    updates: Partial<UserStats>,
  ): Promise<void> {
    try {
      const stats = await this.table.where("userId").equals(userId).first();

      if (!stats) {
        // Create stats if they don't exist
        await this.getStats(userId);
        // Retry update
        return this.updateStats(userId, updates);
      }

      await this.table.update(stats.id, updates);

      logger.info("Updated user stats", { userId, updates });
    } catch (error) {
      logger.error("Failed to update user stats", {
        error: error as Error,
        userId,
        updates,
      });
      throw error;
    }
  }

  /**
   * Calculate and update streak
   */
  async updateStreak(userId: string): Promise<void> {
    try {
      const stats = await this.getStats(userId);
      const now = new Date();
      const lastCompleted = stats.lastTaskCompletedAt;

      let newStreak = 1;

      if (lastCompleted) {
        const daysSinceLastTask = Math.floor(
          (now.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysSinceLastTask === 0) {
          // Same day, keep streak
          newStreak = stats.currentStreak;
        } else if (daysSinceLastTask === 1) {
          // Next day, increment streak
          newStreak = stats.currentStreak + 1;
        }
        // If more than 1 day, streak resets to 1 (already set above)
      }

      const longestStreak = Math.max(newStreak, stats.longestStreak);

      await this.updateStats(userId, {
        currentStreak: newStreak,
        longestStreak,
        lastTaskCompletedAt: now,
      });

      logger.debug("Updated user streak", {
        userId,
        currentStreak: newStreak,
        longestStreak,
      });
    } catch (error) {
      logger.error("Failed to update streak", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const userStatsService = new UserStatsService();
