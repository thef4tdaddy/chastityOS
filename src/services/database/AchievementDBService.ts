/**
 * Achievement Database Service
 * Backward compatibility wrapper for the new modular achievement services
 * @deprecated Use individual services from './achievements/' for new code
 */

import { BaseDBService } from "./BaseDBService";
import { db } from "../storage/ChastityDB";
import {
  DBAchievement,
  DBUserAchievement,
  DBAchievementProgress,
  DBAchievementNotification,
  DBLeaderboardEntry,
  AchievementCategory,
  AchievementDifficulty,
  LeaderboardPrivacy,
} from "../../types";
import { logger } from "../../utils/logging";
import { eventDBService } from "./EventDBService";

interface UpdateLeaderboardEntryOptions {
  userId: string;
  category: string;
  period: string;
  value: number;
  displayName?: string;
  displayNameType?: "real" | "username" | "anonymous";
}

export class AchievementDBService extends BaseDBService<DBAchievement> {
  protected db = db; // Use the db instance instead of ChastityDB.getInstance()
  protected achievementsTable = this.db.achievements;
  protected userAchievementsTable = this.db.userAchievements;
  protected achievementProgressTable = this.db.achievementProgress;
  protected achievementNotificationsTable = this.db.achievementNotifications;
  protected leaderboardEntriesTable = this.db.leaderboardEntries;

  constructor() {
    super(db.achievements);
  }

  /**
   * Generate a unique ID for achievement-related records
   */
  private generateId(): string {
    return `ach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Queue sync operation (placeholder for sync functionality)
   */
  private queueSync(operation: string, data: Record<string, unknown>): void {
    // TODO: Implement sync queue functionality
    logger.debug("Queuing sync operation", { operation, data });
  }

  // ==================== ACHIEVEMENT CRUD ====================

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
        "achievements:create",
        achievementData as unknown as Record<string, unknown>,
      );

      logger.info(
        `Achievement created: ${achievementData.name}`,
        "AchievementDBService",
      );
      return achievementData.id;
    } catch (error) {
      logger.error(
        "Failed to create achievement",
        error,
        "AchievementDBService",
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
      logger.error("Failed to get achievements", error, "AchievementDBService");
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
        "AchievementDBService",
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
        .and((achievement: DBAchievement) => achievement.isActive)
        .toArray();
    } catch (error) {
      logger.error(
        "Failed to get achievements by category",
        error,
        "AchievementDBService",
      );
      return [];
    }
  }

  // ==================== USER ACHIEVEMENT CRUD ====================

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
        .and((ua: DBUserAchievement) => ua.achievementId === achievementId)
        .first();

      if (existing) {
        logger.warn(
          `User ${userId} already has achievement ${achievementId}`,
          "AchievementDBService",
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
        "userAchievements:create",
        userAchievement as unknown as Record<string, unknown>,
      );

      logger.info(
        `Achievement ${achievementId} awarded to user ${userId}`,
        "AchievementDBService",
      );

      // Get achievement details for logging
      const achievement = await this.getAchievementById(achievementId);

      // AUTO-LOG: Achievement unlocked
      await eventDBService.logEvent(
        userId,
        "achievement",
        {
          action: "unlocked",
          title: "Achievement Unlocked",
          description: achievement
            ? `Unlocked: ${achievement.name}`
            : `Achievement unlocked: ${achievementId}`,
          metadata: {
            achievementId,
            achievementName: achievement?.name,
            category: achievement?.category,
            difficulty: achievement?.difficulty,
            points: achievement?.points,
            progress,
          },
        },
        {},
      );

      return userAchievement.id;
    } catch (error) {
      logger.error(
        "Failed to award achievement",
        error,
        "AchievementDBService",
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
        "AchievementDBService",
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
        .and((ua: DBUserAchievement) => ua.isVisible)
        .toArray();
    } catch (error) {
      logger.error(
        "Failed to get user visible achievements",
        error,
        "AchievementDBService",
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
        .and((ua: DBUserAchievement) => ua.achievementId === achievementId)
        .first();

      if (!userAchievement) {
        throw new Error("User achievement not found");
      }

      userAchievement.isVisible = !userAchievement.isVisible;
      userAchievement.lastModified = new Date();
      userAchievement.syncStatus = "pending";

      await this.userAchievementsTable.put(userAchievement);
      await this.queueSync(
        "userAchievements:update",
        userAchievement as unknown as Record<string, unknown>,
      );

      logger.info(
        `Achievement ${achievementId} visibility toggled for user ${userId}`,
        "AchievementDBService",
      );
    } catch (error) {
      logger.error(
        "Failed to toggle achievement visibility",
        error,
        "AchievementDBService",
      );
      throw error;
    }
  }

  // ==================== PROGRESS TRACKING ====================

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
        .and((ap: DBAchievementProgress) => ap.achievementId === achievementId)
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
          "achievementProgress:update",
          progressData as unknown as Record<string, unknown>,
        );
      } else {
        await this.achievementProgressTable.add(progressData);
        await this.queueSync(
          "achievementProgress:create",
          progressData as unknown as Record<string, unknown>,
        );
      }

      // If completed, award the achievement
      if (progressData.isCompleted && !existing?.isCompleted) {
        await this.awardAchievement(userId, achievementId, 100);
      }

      logger.debug(
        `Progress updated for ${achievementId}: ${currentValue}/${targetValue}`,
        "AchievementDBService",
      );
    } catch (error) {
      logger.error(
        "Failed to update achievement progress",
        error,
        "AchievementDBService",
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
        "AchievementDBService",
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
        "AchievementDBService",
      );
      return null;
    }
  }

  // ==================== NOTIFICATIONS ====================

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
        "achievementNotifications:create",
        notification as unknown as Record<string, unknown>,
      );

      logger.info(
        `Achievement notification created for user ${userId}`,
        "AchievementDBService",
      );
      return notification.id;
    } catch (error) {
      logger.error(
        "Failed to create achievement notification",
        error,
        "AchievementDBService",
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
        "AchievementDBService",
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
          "achievementNotifications:update",
          notification as unknown as Record<string, unknown>,
        );
      }
    } catch (error) {
      logger.error(
        "Failed to mark notification as read",
        error,
        "AchievementDBService",
      );
      throw error;
    }
  }

  // ==================== STATISTICS ====================

  /**
   * Get user achievement statistics
   */
  async getUserAchievementStats(userId: string): Promise<{
    totalEarned: number;
    totalPoints: number;
    completionPercentage: number;
    categoryCounts: Record<AchievementCategory, number>;
    difficultyBreakdown: Record<AchievementDifficulty, number>;
  }> {
    try {
      const [userAchievements, allAchievements] = await Promise.all([
        this.getUserAchievements(userId),
        this.getAllAchievements(),
      ]);

      const achievementMap = new Map(allAchievements.map((a) => [a.id, a]));

      const totalPoints = userAchievements.reduce((sum, ua) => {
        const achievement = achievementMap.get(ua.achievementId);
        return sum + (achievement?.points || 0);
      }, 0);

      const categoryCounts = {} as Record<AchievementCategory, number>;
      const difficultyBreakdown = {} as Record<AchievementDifficulty, number>;

      // Initialize counts
      Object.values(AchievementCategory).forEach(
        (cat) => (categoryCounts[cat] = 0),
      );
      Object.values(AchievementDifficulty).forEach(
        (diff) => (difficultyBreakdown[diff] = 0),
      );

      userAchievements.forEach((ua) => {
        const achievement = achievementMap.get(ua.achievementId);
        if (achievement) {
          categoryCounts[achievement.category]++;
          difficultyBreakdown[achievement.difficulty]++;
        }
      });

      return {
        totalEarned: userAchievements.length,
        totalPoints,
        completionPercentage:
          allAchievements.length > 0
            ? (userAchievements.length / allAchievements.length) * 100
            : 0,
        categoryCounts,
        difficultyBreakdown,
      };
    } catch (error) {
      logger.error(
        "Failed to get user achievement stats",
        error,
        "AchievementDBService",
      );
      throw error;
    }
  }

  // ==================== LEADERBOARD METHODS ====================

  /**
   * Get leaderboard entries for a category and period
   */
  async getLeaderboard(
    category: string,
    period: string,
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
      logger.error("Failed to get leaderboard", error, "AchievementDBService");
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
        "AchievementDBService",
      );
      return null;
    }
  }

  /**
   * Update user's leaderboard entry
   */
  async updateLeaderboardEntry(
    options: UpdateLeaderboardEntryOptions,
  ): Promise<void> {
    const {
      userId,
      category,
      period,
      value,
      displayName = "Anonymous",
      displayNameType = "anonymous",
    } = options;
    try {
      const entryData: DBLeaderboardEntry = {
        id: this.generateId(),
        userId,
        category: category as
          | "session_count"
          | "total_chastity_time"
          | "longest_single_session"
          | "current_streak"
          | "achievement_points"
          | "goal_achievements",
        period: period as "this_week" | "this_month" | "this_year" | "all_time",
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
        "leaderboardEntries:create",
        entryData as unknown as Record<string, unknown>,
      );

      logger.info(
        `Updated leaderboard entry for user ${userId}`,
        "AchievementDBService",
      );
    } catch (error) {
      logger.error(
        "Failed to update leaderboard entry",
        error,
        "AchievementDBService",
      );
      throw error;
    }
  }

  /**
   * Get user's leaderboard privacy settings
   */
  async getLeaderboardPrivacy(_userId: string): Promise<LeaderboardPrivacy> {
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
    userId: string,
    _settings: LeaderboardPrivacy,
  ): Promise<void> {
    try {
      // This would typically update user settings
      // For now, just log the action
      logger.info(
        `Updated leaderboard privacy for user ${userId}`,
        "AchievementDBService",
      );
    } catch (error) {
      logger.error(
        "Failed to update leaderboard privacy",
        error,
        "AchievementDBService",
      );
      throw error;
    }
  }
}

// Export singleton instance
export const achievementDBService = new AchievementDBService();
