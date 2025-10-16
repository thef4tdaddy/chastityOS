/**
 * useAchievements Hook
 * React hook for managing achievements and progress
 */

import { useEffect } from "react";
import { achievementEngine } from "../services";
import { DBUserAchievement } from "../types";
import { logger } from "../utils/logging";
import { useAchievementsQueries } from "./useAchievementsQueries";
import { useAchievementsHelpers } from "./useAchievementsHelpers";
import { useAchievementsActions } from "./useAchievementsActions";

export interface AchievementStats {
  totalEarned: number;
  totalPoints: number;
  completionPercentage: number;
  categoryCounts: Record<string, number>;
  recentAchievements: DBUserAchievement[];
}

export const useAchievements = (userId?: string) => {
  // Use the extracted hooks
  const queries = useAchievementsQueries(userId);
  const helpers = useAchievementsHelpers(
    queries.allAchievements,
    queries.userAchievements,
    queries.achievementProgress,
  );
  const actions = useAchievementsActions(userId);

  // ==================== EFFECTS ====================

  /**
   * Initialize achievement engine on mount
   */
  useEffect(() => {
    achievementEngine.initialize().catch((error) => {
      logger.error(
        "Failed to initialize achievement engine",
        error,
        "useAchievements",
      );
    });
  }, []);

  // ==================== RETURN ====================

  return {
    // Data
    allAchievements: queries.allAchievements,
    userAchievements: queries.userAchievements,
    visibleAchievements: queries.visibleAchievements,
    achievementProgress: queries.achievementProgress,
    unreadNotifications: queries.unreadNotifications,
    achievementStats: queries.achievementStats,

    // Loading states
    isLoading:
      queries.isLoadingAchievements || queries.isLoadingUserAchievements,
    isLoadingProgress: queries.isLoadingProgress,
    isLoadingNotifications: queries.isLoadingNotifications,
    isLoadingStats: queries.isLoadingStats,

    // Error states
    errors: {
      achievementsError: queries.achievementsError,
      userAchievementsError: queries.userAchievementsError,
      statsError: queries.statsError,
    },
    hasError: Boolean(
      queries.achievementsError ||
        queries.userAchievementsError ||
        queries.statsError,
    ),

    // Helper functions
    ...helpers,

    // Actions
    ...actions,
  };
};

// Re-export the notifications hook for backward compatibility
export { useAchievementNotifications } from "./useAchievementNotifications";
