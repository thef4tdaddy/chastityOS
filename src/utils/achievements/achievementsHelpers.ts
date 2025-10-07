/**
 * Helper functions for achievement operations
 */

import {
  DBAchievement,
  DBUserAchievement,
  DBAchievementProgress,
  AchievementCategory,
} from "../../types";

/**
 * Find achievement by ID
 */
export function findAchievementById(
  achievements: DBAchievement[],
  achievementId: string,
): DBAchievement | undefined {
  return achievements.find((a) => a.id === achievementId);
}

/**
 * Check if user has earned a specific achievement
 */
export function checkHasAchievement(
  userAchievements: DBUserAchievement[],
  achievementId: string,
): boolean {
  return userAchievements.some((ua) => ua.achievementId === achievementId);
}

/**
 * Find progress for a specific achievement
 */
export function findProgressForAchievement(
  achievementProgress: DBAchievementProgress[],
  achievementId: string,
): DBAchievementProgress | undefined {
  return achievementProgress.find((ap) => ap.achievementId === achievementId);
}

/**
 * Filter achievements by category
 */
export function filterAchievementsByCategory(
  achievements: DBAchievement[],
  category: AchievementCategory,
): DBAchievement[] {
  return achievements.filter((a) => a.category === category);
}

/**
 * Get user's achievements in a specific category
 */
export function filterUserAchievementsByCategory(
  allAchievements: DBAchievement[],
  userAchievements: DBUserAchievement[],
  category: AchievementCategory,
): DBUserAchievement[] {
  const categoryAchievementIds = allAchievements
    .filter((a) => a.category === category)
    .map((a) => a.id);

  return userAchievements.filter((ua) =>
    categoryAchievementIds.includes(ua.achievementId),
  );
}

/**
 * Calculate achievement progress percentage
 */
export function calculateProgressPercentage(
  currentValue: number,
  targetValue: number,
): number {
  return Math.min((currentValue / targetValue) * 100, 100);
}

/**
 * Map achievements with their progress information
 */
export function mapAchievementsWithProgress(
  allAchievements: DBAchievement[],
  userAchievements: DBUserAchievement[],
  achievementProgress: DBAchievementProgress[],
) {
  return allAchievements.map((achievement) => {
    const userAchievement = userAchievements.find(
      (ua) => ua.achievementId === achievement.id,
    );
    const progress = achievementProgress.find(
      (ap) => ap.achievementId === achievement.id,
    );

    return {
      achievement,
      userAchievement,
      progress: progress
        ? {
            currentValue: progress.currentValue,
            targetValue: progress.targetValue,
            percentage: calculateProgressPercentage(
              progress.currentValue,
              progress.targetValue,
            ),
            isCompleted: progress.isCompleted,
          }
        : null,
      isEarned: Boolean(userAchievement),
      isVisible: userAchievement?.isVisible ?? true,
    };
  });
}

/**
 * Get recent achievements sorted by earned date
 */
export function getRecentAchievements(
  achievements: DBUserAchievement[],
  count: number = 5,
): DBUserAchievement[] {
  return achievements
    .sort((a, b) => b.earnedAt.getTime() - a.earnedAt.getTime())
    .slice(0, count);
}
