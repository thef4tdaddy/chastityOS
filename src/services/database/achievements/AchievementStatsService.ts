/**
 * Achievement Statistics Service
 * Handles statistics aggregation and reporting
 */

import { AchievementCategory, AchievementDifficulty } from "../../../types";
import { logger } from "../../../utils/logging";

export class AchievementStatsService {
  constructor(
    private crudService?: { getAllAchievements: () => Promise<any[]> },
    private badgeService?: {
      getUserAchievements: (userId: string) => Promise<any[]>;
    },
  ) {}

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
      if (!this.crudService || !this.badgeService) {
        throw new Error("Required services not injected");
      }

      const [userAchievements, allAchievements] = await Promise.all([
        this.badgeService.getUserAchievements(userId),
        this.crudService.getAllAchievements(),
      ]);

      const achievementMap = new Map(
        allAchievements.map((a: any) => [a.id, a]),
      );

      const totalPoints = userAchievements.reduce((sum: number, ua: any) => {
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

      userAchievements.forEach((ua: any) => {
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
        "AchievementStatsService",
      );
      throw error;
    }
  }
}

// Export singleton instance
export const achievementStatsService = new AchievementStatsService();
