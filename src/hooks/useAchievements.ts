/**
 * useAchievements Hook
 * React hook for managing achievements and progress
 */

import { useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { achievementDBService, achievementEngine } from "../services";
import {
  DBAchievement,
  DBUserAchievement,
  DBAchievementProgress,
  AchievementCategory,
} from "../types";
import { logger } from "../utils/logging";

export interface AchievementStats {
  totalEarned: number;
  totalPoints: number;
  completionPercentage: number;
  categoryCounts: Record<AchievementCategory, number>;
  recentAchievements: DBUserAchievement[];
}

export const useAchievements = (userId?: string) => {
  const queryClient = useQueryClient();

  // ==================== QUERIES ====================

  /**
   * Get all available achievements
   */
  const { data: allAchievements = [], isLoading: isLoadingAchievements } =
    useQuery({
      queryKey: ["achievements"],
      queryFn: () => achievementDBService.getAllAchievements(),
      enabled: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });

  /**
   * Get user's earned achievements
   */
  const { data: userAchievements = [], isLoading: isLoadingUserAchievements } =
    useQuery({
      queryKey: ["achievements", "user", userId],
      queryFn: () => achievementDBService.getUserAchievements(userId!),
      enabled: Boolean(userId),
      staleTime: 30 * 1000, // 30 seconds
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
      staleTime: 30 * 1000, // 30 seconds
    });

  /**
   * Get unread notifications
   */
  const { data: unreadNotifications = [], isLoading: isLoadingNotifications } =
    useQuery({
      queryKey: ["achievements", "notifications", userId],
      queryFn: () => achievementDBService.getUserUnreadNotifications(userId!),
      enabled: Boolean(userId),
      refetchInterval: 30 * 1000, // Check every 30 seconds
    });

  /**
   * Get achievement statistics
   */
  const { data: achievementStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["achievements", "stats", userId],
    queryFn: async (): Promise<AchievementStats> => {
      if (!userId) throw new Error("User ID required");

      const [stats, achievements] = await Promise.all([
        achievementDBService.getUserAchievementStats(userId),
        achievementDBService.getUserAchievements(userId),
      ]);

      // Get recent achievements (last 5)
      const recentAchievements = achievements
        .sort((a: DBUserAchievement, b: DBUserAchievement) => b.earnedAt.getTime() - a.earnedAt.getTime())
        .slice(0, 5);

      return {
        ...stats,
        recentAchievements,
      };
    },
    enabled: Boolean(userId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // ==================== MUTATIONS ====================

  /**
   * Toggle achievement visibility
   */
  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ achievementId }: { achievementId: string }) =>
      achievementDBService.toggleAchievementVisibility(userId!, achievementId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["achievements", "visible", userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["achievements", "user", userId],
      });
    },
    onError: (error: Error) => {
      logger.error(
        "Failed to toggle achievement visibility",
        error,
        "useAchievements",
      );
    },
  });

  /**
   * Mark notification as read
   */
  const markNotificationReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      achievementDBService.markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["achievements", "notifications", userId],
      });
    },
    onError: (error: Error) => {
      logger.error(
        "Failed to mark notification as read",
        error,
        "useAchievements",
      );
    },
  });

  /**
   * Perform full achievement check
   */
  const performFullCheckMutation = useMutation({
    mutationFn: () => achievementEngine.performFullCheck(userId!),
    onSuccess: () => {
      // Invalidate all achievement-related queries
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
    },
    onError: (error) => {
      logger.error(
        "Failed to perform full achievement check",
        error,
        "useAchievements",
      );
    },
  });

  // ==================== HELPER FUNCTIONS ====================

  /**
   * Get achievement by ID
   */
  const getAchievementById = useCallback(
    (achievementId: string): DBAchievement | undefined => {
      return allAchievements.find((a: DBAchievement) => a.id === achievementId);
    },
    [allAchievements],
  );

  /**
   * Check if user has specific achievement
   */
  const hasAchievement = useCallback(
    (achievementId: string): boolean => {
      return userAchievements.some((ua: DBUserAchievement) => ua.achievementId === achievementId);
    },
    [userAchievements],
  );

  /**
   * Get progress for specific achievement
   */
  const getProgressForAchievement = useCallback(
    (achievementId: string): DBAchievementProgress | undefined => {
      return achievementProgress.find(
        (ap: DBAchievementProgress) => ap.achievementId === achievementId,
      );
    },
    [achievementProgress],
  );

  /**
   * Get achievements by category
   */
  const getAchievementsByCategory = useCallback(
    (category: AchievementCategory): DBAchievement[] => {
      return allAchievements.filter((a: DBAchievement) => a.category === category);
    },
    [allAchievements],
  );

  /**
   * Get user's achievements by category
   */
  const getUserAchievementsByCategory = useCallback(
    (category: AchievementCategory): DBUserAchievement[] => {
      const categoryAchievementIds = allAchievements
        .filter((a: DBAchievement) => a.category === category)
        .map((a: DBAchievement) => a.id);

      return userAchievements.filter((ua: DBUserAchievement) =>
        categoryAchievementIds.includes(ua.achievementId),
      );
    },
    [allAchievements, userAchievements],
  );

  /**
   * Get achievements with progress information
   */
  const getAchievementsWithProgress = useCallback(() => {
    return allAchievements.map((achievement: DBAchievement) => {
      const userAchievement = userAchievements.find(
        (ua: DBUserAchievement) => ua.achievementId === achievement.id,
      );
      const progress = achievementProgress.find(
        (ap: DBAchievementProgress) => ap.achievementId === achievement.id,
      );

      return {
        achievement,
        userAchievement,
        progress: progress
          ? {
              currentValue: progress.currentValue,
              targetValue: progress.targetValue,
              percentage: Math.min(
                (progress.currentValue / progress.targetValue) * 100,
                100,
              ),
              isCompleted: progress.isCompleted,
            }
          : null,
        isEarned: Boolean(userAchievement),
        isVisible: userAchievement?.isVisible ?? true,
      };
    });
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
