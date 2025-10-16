/**
 * useAchievements Hook
 * React hook for managing achievements and progress
 */

import { useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { achievementDBService, achievementEngine } from "../services";
import {
  DBAchievement,
  DBUserAchievement,
  DBAchievementProgress,
  AchievementCategory,
} from "../types";
import { logger } from "../utils/logging";
import {
  findAchievementById,
  checkHasAchievement,
  findProgressForAchievement,
  filterAchievementsByCategory,
  filterUserAchievementsByCategory,
  mapAchievementsWithProgress,
  getRecentAchievements,
} from "../utils/achievements/achievementsHelpers";
import { useAchievementMutations } from "./useAchievementMutations";

export interface AchievementStats {
  totalEarned: number;
  totalPoints: number;
  completionPercentage: number;
  categoryCounts: Record<AchievementCategory, number>;
  recentAchievements: DBUserAchievement[];
}

export const useAchievements = (userId?: string) => {
  const {
    toggleVisibilityMutation,
    markNotificationReadMutation,
    performFullCheckMutation,
  } = useAchievementMutations(userId);

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

  // ==================== HELPER FUNCTIONS ====================

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

  // ==================== ACTIONS ====================

  const toggleAchievementVisibility = useCallback(
    (achievementId: string) => {
      if (!userId) return;
      toggleVisibilityMutation.mutate({ achievementId });
    },
    [userId, toggleVisibilityMutation],
  );

  const markNotificationRead = useCallback(
    (notificationId: string) => {
      markNotificationReadMutation.mutate(notificationId);
    },
    [markNotificationReadMutation],
  );

  const performFullCheck = useCallback(() => {
    if (!userId) return;
    performFullCheckMutation.mutate();
  }, [userId, performFullCheckMutation]);

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
    allAchievements,
    userAchievements,
    visibleAchievements,
    achievementProgress,
    unreadNotifications,
    achievementStats,

    // Loading states
    isLoading: isLoadingAchievements || isLoadingUserAchievements,
    isLoadingProgress,
    isLoadingNotifications,
    isLoadingStats,

    // Error states
    errors: {
      achievementsError,
      userAchievementsError,
      statsError,
    },
    hasError: Boolean(achievementsError || userAchievementsError || statsError),

    // Helper functions
    getAchievementById,
    hasAchievement,
    getProgressForAchievement,
    getAchievementsByCategory,
    getUserAchievementsByCategory,
    getAchievementsWithProgress,

    // Actions
    toggleAchievementVisibility,
    markNotificationRead,
    performFullCheck,

    // Mutation states
    isTogglingVisibility: toggleVisibilityMutation.isPending,
    isMarkingRead: markNotificationReadMutation.isPending,
    isPerformingCheck: performFullCheckMutation.isPending,
  };
};

/**
 * Hook for achievement notifications (can be used globally)
 */
export const useAchievementNotifications = (userId?: string) => {
  const { unreadNotifications, markNotificationRead, isLoadingNotifications } =
    useAchievements(userId);

  return {
    notifications: unreadNotifications,
    isLoading: isLoadingNotifications,
    markAsRead: markNotificationRead,
    hasUnread: unreadNotifications.length > 0,
    unreadCount: unreadNotifications.length,
  };
};
