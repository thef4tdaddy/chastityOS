import { useCallback } from "react";
import {
  DBAchievement,
  DBUserAchievement,
  DBAchievementProgress,
  AchievementCategory,
} from "../types";
import {
  findAchievementById,
  checkHasAchievement,
  findProgressForAchievement,
  filterAchievementsByCategory,
  filterUserAchievementsByCategory,
  mapAchievementsWithProgress,
} from "../utils/achievements/achievementsHelpers";

export const useAchievementsHelpers = (
  allAchievements: DBAchievement[],
  userAchievements: DBUserAchievement[],
  achievementProgress: DBAchievementProgress[],
) => {
  /**
   * Get achievement by ID
   */
  const getAchievementById = useCallback(
    (achievementId: string): DBAchievement | undefined => {
      return findAchievementById(allAchievements, achievementId);
    },
    [allAchievements],
  );

  /**
   * Check if user has specific achievement
   */
  const hasAchievement = useCallback(
    (achievementId: string): boolean => {
      return checkHasAchievement(userAchievements, achievementId);
    },
    [userAchievements],
  );

  /**
   * Get progress for specific achievement
   */
  const getProgressForAchievement = useCallback(
    (achievementId: string): DBAchievementProgress | undefined => {
      return findProgressForAchievement(achievementProgress, achievementId);
    },
    [achievementProgress],
  );

  /**
   * Get achievements by category
   */
  const getAchievementsByCategory = useCallback(
    (category: AchievementCategory): DBAchievement[] => {
      return filterAchievementsByCategory(allAchievements, category);
    },
    [allAchievements],
  );

  /**
   * Get user's achievements by category
   */
  const getUserAchievementsByCategory = useCallback(
    (category: AchievementCategory): DBUserAchievement[] => {
      return filterUserAchievementsByCategory(
        allAchievements,
        userAchievements,
        category,
      );
    },
    [allAchievements, userAchievements],
  );

  /**
   * Get achievements with progress information
   */
  const getAchievementsWithProgress = useCallback(() => {
    return mapAchievementsWithProgress(
      allAchievements,
      userAchievements,
      achievementProgress,
    );
  }, [allAchievements, userAchievements, achievementProgress]);

  return {
    getAchievementById,
    hasAchievement,
    getProgressForAchievement,
    getAchievementsByCategory,
    getUserAchievementsByCategory,
    getAchievementsWithProgress,
  };
};
