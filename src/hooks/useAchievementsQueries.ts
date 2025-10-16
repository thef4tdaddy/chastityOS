import { useQuery } from "@tanstack/react-query";
import { achievementDBService } from "../services";
import { DBUserAchievement } from "../types";
import { logger } from "../utils/logging";
import { getRecentAchievements } from "../utils/achievements/achievementsHelpers";

export interface AchievementStats {
  totalEarned: number;
  totalPoints: number;
  completionPercentage: number;
  categoryCounts: Record<string, number>;
  recentAchievements: DBUserAchievement[];
}

export const useAchievementsQueries = (userId?: string) => {
  // ==================== QUERIES ====================

  /**
   * Get all available achievements
   */
  const {
    data: allAchievements = [],
    isLoading: isLoadingAchievements,
    error: achievementsError,
  } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      try {
        return await achievementDBService.getAllAchievements();
      } catch (error) {
        logger.error("Failed to load achievements", error, "useAchievements");
        throw new Error("Failed to load achievements");
      }
    },
    enabled: true,
    staleTime: 10 * 60 * 1000, // 10 minutes - achievements rarely change
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 3, // Retry failed requests
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * Get user's earned achievements
   */
  const {
    data: userAchievements = [],
    isLoading: isLoadingUserAchievements,
    error: userAchievementsError,
  } = useQuery({
    queryKey: ["achievements", "user", userId],
    queryFn: async () => {
      try {
        return await achievementDBService.getUserAchievements(userId!);
      } catch (error) {
        logger.error(
          "Failed to load user achievements",
          error,
          "useAchievements",
        );
        throw new Error("Failed to load user achievements");
      }
    },
    enabled: Boolean(userId),
    staleTime: 2 * 60 * 1000, // 2 minutes - balance freshness with performance
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * Get user's visible achievements (for public profile)
   */
  const { data: visibleAchievements = [] } = useQuery({
    queryKey: ["achievements", "visible", userId],
    queryFn: () => achievementDBService.getUserVisibleAchievements(userId!),
    enabled: Boolean(userId),
    staleTime: 60 * 1000, // 1 minute
  });

  /**
   * Get user's achievement progress
   */
  const { data: achievementProgress = [], isLoading: isLoadingProgress } =
    useQuery({
      queryKey: ["achievements", "progress", userId],
      queryFn: () => achievementDBService.getUserAchievementProgress(userId!),
      enabled: Boolean(userId),
      staleTime: 1 * 60 * 1000, // 1 minute - progress updates less frequently than notifications
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    });

  /**
   * Get unread notifications
   */
  const { data: unreadNotifications = [], isLoading: isLoadingNotifications } =
    useQuery({
      queryKey: ["achievements", "notifications", userId],
      queryFn: () => achievementDBService.getUserUnreadNotifications(userId!),
      enabled: Boolean(userId),
      staleTime: 30 * 1000, // Fresh for 30 seconds
      refetchInterval: 60 * 1000, // Check every minute instead of 30 seconds - reduce polling
      refetchIntervalInBackground: false, // Don't poll when tab is in background
    });

  /**
   * Get achievement statistics
   */
  const {
    data: achievementStats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery({
    queryKey: ["achievements", "stats", userId],
    queryFn: async (): Promise<AchievementStats> => {
      if (!userId) throw new Error("User ID required");

      try {
        const [stats, achievements] = await Promise.all([
          achievementDBService.getUserAchievementStats(userId),
          achievementDBService.getUserAchievements(userId),
        ]);

        // Validate stats to prevent NaN or invalid calculations
        const validatedStats = {
          ...stats,
          completionPercentage: Number.isFinite(stats.completionPercentage)
            ? Math.min(Math.max(stats.completionPercentage, 0), 100)
            : 0,
          totalEarned: Number.isFinite(stats.totalEarned)
            ? Math.max(stats.totalEarned, 0)
            : 0,
          totalPoints: Number.isFinite(stats.totalPoints)
            ? Math.max(stats.totalPoints, 0)
            : 0,
          recentAchievements: getRecentAchievements(achievements, 5),
        };

        return validatedStats;
      } catch (error) {
        logger.error(
          "Failed to load achievement statistics",
          error,
          "useAchievements",
        );
        throw new Error("Failed to calculate achievement statistics");
      }
    },
    enabled: Boolean(userId),
    staleTime: 3 * 60 * 1000, // 3 minutes - stats change infrequently
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 20000),
  });

  return {
    // Data
    allAchievements,
    userAchievements,
    visibleAchievements,
    achievementProgress,
    unreadNotifications,
    achievementStats,

    // Loading states
    isLoadingAchievements,
    isLoadingUserAchievements,
    isLoadingProgress,
    isLoadingNotifications,
    isLoadingStats,

    // Error states
    achievementsError,
    userAchievementsError,
    statsError,
  };
};
