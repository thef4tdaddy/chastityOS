/**
 * Achievement Services Index
 * Re-exports all achievement services and provides backward compatibility
 */

// Import all services
import {
  AchievementCRUDService,
  achievementCRUDService,
} from "./AchievementCRUDService";
import {
  AchievementBadgeService,
  achievementBadgeService,
} from "./AchievementBadgeService";
import {
  AchievementProgressService,
  achievementProgressService,
} from "./AchievementProgressService";
import {
  AchievementNotificationService,
  achievementNotificationService,
} from "./AchievementNotificationService";
import {
  AchievementStatsService,
  achievementStatsService,
} from "./AchievementStatsService";
import {
  AchievementLeaderboardService,
  achievementLeaderboardService,
} from "./AchievementLeaderboardService";

// Re-export service classes
export {
  AchievementCRUDService,
  AchievementBadgeService,
  AchievementProgressService,
  AchievementNotificationService,
  AchievementStatsService,
  AchievementLeaderboardService,
};

// Re-export service instances
export {
  achievementCRUDService,
  achievementBadgeService,
  achievementProgressService,
  achievementNotificationService,
  achievementStatsService,
  achievementLeaderboardService,
};

/**
 * Composite Achievement Service for backward compatibility
 * Maintains the original API while delegating to focused services
 */
export class AchievementDBService {
  constructor(
    private crudService = achievementCRUDService,
    private badgeService = achievementBadgeService,
    private progressService = achievementProgressService,
    private notificationService = achievementNotificationService,
    private statsService = achievementStatsService,
    private leaderboardService = achievementLeaderboardService,
  ) {
    // Inject dependencies for services that need them
    if ("badgeService" in this.progressService) {
      (
        this.progressService as typeof this.progressService & {
          badgeService: AchievementBadgeService;
        }
      ).badgeService = this.badgeService;
    }
    if ("crudService" in this.statsService) {
      (
        this.statsService as typeof this.statsService & {
          crudService: AchievementCRUDService;
        }
      ).crudService = this.crudService;
    }
    if ("badgeService" in this.statsService) {
      (
        this.statsService as typeof this.statsService & {
          badgeService: AchievementBadgeService;
        }
      ).badgeService = this.badgeService;
    }
  }

  // ==================== ACHIEVEMENT CRUD ====================
  async createAchievement(
    ...args: Parameters<typeof this.crudService.createAchievement>
  ) {
    return this.crudService.createAchievement(...args);
  }

  async getAllAchievements(
    ...args: Parameters<typeof this.crudService.getAllAchievements>
  ) {
    return this.crudService.getAllAchievements(...args);
  }

  async getAchievementById(
    ...args: Parameters<typeof this.crudService.getAchievementById>
  ) {
    return this.crudService.getAchievementById(...args);
  }

  async getAchievementsByCategory(
    ...args: Parameters<typeof this.crudService.getAchievementsByCategory>
  ) {
    return this.crudService.getAchievementsByCategory(...args);
  }

  // ==================== USER ACHIEVEMENT MANAGEMENT ====================
  async awardAchievement(
    ...args: Parameters<typeof this.badgeService.awardAchievement>
  ) {
    return this.badgeService.awardAchievement(...args);
  }

  async getUserAchievements(
    ...args: Parameters<typeof this.badgeService.getUserAchievements>
  ) {
    return this.badgeService.getUserAchievements(...args);
  }

  async getUserVisibleAchievements(
    ...args: Parameters<typeof this.badgeService.getUserVisibleAchievements>
  ) {
    return this.badgeService.getUserVisibleAchievements(...args);
  }

  async toggleAchievementVisibility(
    ...args: Parameters<typeof this.badgeService.toggleAchievementVisibility>
  ) {
    return this.badgeService.toggleAchievementVisibility(...args);
  }

  // ==================== PROGRESS TRACKING ====================
  async updateAchievementProgress(
    ...args: Parameters<typeof this.progressService.updateAchievementProgress>
  ) {
    return this.progressService.updateAchievementProgress(...args);
  }

  async getUserAchievementProgress(
    ...args: Parameters<typeof this.progressService.getUserAchievementProgress>
  ) {
    return this.progressService.getUserAchievementProgress(...args);
  }

  async getAchievementProgress(
    ...args: Parameters<typeof this.progressService.getAchievementProgress>
  ) {
    return this.progressService.getAchievementProgress(...args);
  }

  // ==================== NOTIFICATIONS ====================
  async createNotification(
    ...args: Parameters<typeof this.notificationService.createNotification>
  ) {
    return this.notificationService.createNotification(...args);
  }

  async getUserUnreadNotifications(
    ...args: Parameters<
      typeof this.notificationService.getUserUnreadNotifications
    >
  ) {
    return this.notificationService.getUserUnreadNotifications(...args);
  }

  async markNotificationRead(
    ...args: Parameters<typeof this.notificationService.markNotificationRead>
  ) {
    return this.notificationService.markNotificationRead(...args);
  }

  // ==================== STATISTICS ====================
  async getUserAchievementStats(
    ...args: Parameters<typeof this.statsService.getUserAchievementStats>
  ) {
    return this.statsService.getUserAchievementStats(...args);
  }

  // ==================== LEADERBOARD ====================
  async getLeaderboard(
    ...args: Parameters<typeof this.leaderboardService.getLeaderboard>
  ) {
    return this.leaderboardService.getLeaderboard(...args);
  }

  async getUserLeaderboardRank(
    ...args: Parameters<typeof this.leaderboardService.getUserLeaderboardRank>
  ) {
    return this.leaderboardService.getUserLeaderboardRank(...args);
  }

  async updateLeaderboardEntry(
    ...args: Parameters<typeof this.leaderboardService.updateLeaderboardEntry>
  ) {
    return this.leaderboardService.updateLeaderboardEntry(...args);
  }

  async getLeaderboardPrivacy(
    ...args: Parameters<typeof this.leaderboardService.getLeaderboardPrivacy>
  ) {
    return this.leaderboardService.getLeaderboardPrivacy(...args);
  }

  async updateLeaderboardPrivacy(
    ...args: Parameters<typeof this.leaderboardService.updateLeaderboardPrivacy>
  ) {
    return this.leaderboardService.updateLeaderboardPrivacy(...args);
  }
}

// Export singleton instance for backward compatibility
export const achievementDBService = new AchievementDBService();
