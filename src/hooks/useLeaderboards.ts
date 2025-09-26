/**
 * useLeaderboards Hook
 * React hook for managing leaderboard data and user participation
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { achievementDBService } from "../services";
import {
  LeaderboardCategory,
  LeaderboardPeriod,
  DBLeaderboardEntry,
} from "../types";
import { logger } from "../utils/logging";

export interface LeaderboardEntry {
  id: string;
  displayName: string;
  value: number;
  rank: number;
  isCurrentUser: boolean;
}

export interface UserRankInfo {
  rank: number;
  value: number;
  totalParticipants: number;
}

export interface LeaderboardPrivacySettings {
  participateInGlobal: boolean;
  participateInMonthly: boolean;
  shareSessionTime: boolean;
  shareStreakData: boolean;
  shareAchievements: boolean;
  displayName: "real" | "username" | "anonymous";
  showOnPublicProfile: boolean;
}

export const useLeaderboards = (
  userId?: string,
  category: LeaderboardCategory = LeaderboardCategory.TOTAL_POINTS,
  period: LeaderboardPeriod = LeaderboardPeriod.ALL_TIME,
) => {
  const queryClient = useQueryClient();
  const [privacySettings, setPrivacySettings] =
    useState<LeaderboardPrivacySettings>({
      participateInGlobal: false,
      participateInMonthly: false,
      shareSessionTime: false,
      shareStreakData: false,
      shareAchievements: true,
      displayName: "anonymous",
      showOnPublicProfile: false,
    });

  // ==================== QUERIES ====================

  /**
   * Get leaderboard data for a specific category and period
   */
  const {
    data: rawLeaderboardData = [],
    isLoading: isLoadingLeaderboard,
    error: leaderboardError,
  } = useQuery({
    queryKey: ["leaderboards", category, period],
    queryFn: () => achievementDBService.getLeaderboard(category, period),
    enabled: true,
    staleTime: 60 * 1000, // 1 minute
  });

  /**
   * Get user's rank in the leaderboard
   */
  const { data: userRank, isLoading: isLoadingUserRank } = useQuery({
    queryKey: ["leaderboards", "rank", userId, category, period],
    queryFn: () =>
      achievementDBService.getUserLeaderboardRank(userId!, category, period),
    enabled: Boolean(userId),
    staleTime: 60 * 1000, // 1 minute
  });

  /**
   * Get user's leaderboard privacy settings
   */
  const { data: userPrivacySettings } = useQuery({
    queryKey: ["leaderboards", "privacy", userId],
    queryFn: () => achievementDBService.getLeaderboardPrivacy(userId!),
    enabled: Boolean(userId),
    onSuccess: (data) => {
      if (data) {
        setPrivacySettings(data);
      }
    },
  });

  // ==================== MUTATIONS ====================

  /**
   * Opt into leaderboards
   */
  const optInMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("User ID required");

      const defaultSettings: LeaderboardPrivacySettings = {
        participateInGlobal: true,
        participateInMonthly: true,
        shareSessionTime: true,
        shareStreakData: true,
        shareAchievements: true,
        displayName: "anonymous",
        showOnPublicProfile: false,
      };

      await achievementDBService.updateLeaderboardPrivacy(
        userId,
        defaultSettings,
      );
      return defaultSettings;
    },
    onSuccess: (data) => {
      setPrivacySettings(data);
      queryClient.invalidateQueries({ queryKey: ["leaderboards"] });
      logger.info("User opted into leaderboards", "useLeaderboards");
    },
    onError: (error) => {
      logger.error("Failed to opt into leaderboards", error, "useLeaderboards");
    },
  });

  /**
   * Opt out of leaderboards
   */
  const optOutMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("User ID required");

      const optOutSettings: LeaderboardPrivacySettings = {
        participateInGlobal: false,
        participateInMonthly: false,
        shareSessionTime: false,
        shareStreakData: false,
        shareAchievements: false,
        displayName: "anonymous",
        showOnPublicProfile: false,
      };

      await achievementDBService.updateLeaderboardPrivacy(
        userId,
        optOutSettings,
      );
      return optOutSettings;
    },
    onSuccess: (data) => {
      setPrivacySettings(data);
      queryClient.invalidateQueries({ queryKey: ["leaderboards"] });
      logger.info("User opted out of leaderboards", "useLeaderboards");
    },
    onError: (error) => {
      logger.error(
        "Failed to opt out of leaderboards",
        error,
        "useLeaderboards",
      );
    },
  });

  /**
   * Update leaderboard privacy settings
   */
  const updatePrivacyMutation = useMutation({
    mutationFn: async (settings: Partial<LeaderboardPrivacySettings>) => {
      if (!userId) throw new Error("User ID required");

      const newSettings = { ...privacySettings, ...settings };
      await achievementDBService.updateLeaderboardPrivacy(userId, newSettings);
      return newSettings;
    },
    onSuccess: (data) => {
      setPrivacySettings(data);
      queryClient.invalidateQueries({ queryKey: ["leaderboards"] });
      logger.info("Updated leaderboard privacy settings", "useLeaderboards");
    },
    onError: (error) => {
      logger.error(
        "Failed to update privacy settings",
        error,
        "useLeaderboards",
      );
    },
  });

  // ==================== PROCESSED DATA ====================

  /**
   * Process raw leaderboard data into displayable format
   */
  const leaderboardData: LeaderboardEntry[] = rawLeaderboardData.map(
    (entry, index) => ({
      id: entry.id,
      displayName: getDisplayName(entry),
      value: entry.value,
      rank: index + 1,
      isCurrentUser: entry.userId === userId,
    }),
  );

  /**
   * Generate display name based on privacy settings
   */
  function getDisplayName(entry: DBLeaderboardEntry): string {
    if (entry.userId === userId) {
      return "You";
    }

    switch (entry.displayNameType) {
      case "real":
        return entry.displayName || "Unknown User";
      case "username":
        return entry.displayName || `User_${entry.userId.slice(-6)}`;
      case "anonymous":
      default:
        return `ChastityUser_${entry.userId.slice(-4)}`;
    }
  }

  // ==================== PUBLIC API ====================

  return {
    // Data
    leaderboardData,
    userRank,
    privacySettings,

    // Loading states
    isLoading: isLoadingLeaderboard || isLoadingUserRank,
    error: leaderboardError,

    // Actions
    optInToLeaderboards: optInMutation.mutateAsync,
    optOutFromLeaderboards: optOutMutation.mutateAsync,
    updateLeaderboardPrivacy: updatePrivacyMutation.mutateAsync,

    // Status
    isOptedIn:
      privacySettings.participateInGlobal ||
      privacySettings.participateInMonthly,
    isOptingIn: optInMutation.isPending,
    isOptingOut: optOutMutation.isPending,
    isUpdatingPrivacy: updatePrivacyMutation.isPending,
  };
};

export default useLeaderboards;
