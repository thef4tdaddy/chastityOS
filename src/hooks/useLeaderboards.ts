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

// Default privacy settings for opting in
const DEFAULT_OPT_IN_SETTINGS: LeaderboardPrivacySettings = {
  participateInGlobal: true,
  participateInMonthly: true,
  shareSessionTime: true,
  shareStreakData: true,
  shareAchievements: true,
  displayName: "anonymous",
  showOnPublicProfile: false,
};

// Default privacy settings for opting out
const DEFAULT_OPT_OUT_SETTINGS: LeaderboardPrivacySettings = {
  participateInGlobal: false,
  participateInMonthly: false,
  shareSessionTime: false,
  shareStreakData: false,
  shareAchievements: false,
  displayName: "anonymous",
  showOnPublicProfile: false,
};

// Initial privacy settings state
const INITIAL_PRIVACY_SETTINGS: LeaderboardPrivacySettings = {
  participateInGlobal: false,
  participateInMonthly: false,
  shareSessionTime: false,
  shareStreakData: false,
  shareAchievements: true,
  displayName: "anonymous",
  showOnPublicProfile: false,
};

/**
 * Generate display name based on privacy settings
 */
function getDisplayName(
  entry: DBLeaderboardEntry,
  currentUserId?: string,
): string {
  if (entry.userId === currentUserId) {
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

/**
 * Process raw leaderboard data into displayable format
 */
function processLeaderboardData(
  rawData: DBLeaderboardEntry[],
  userId?: string,
): LeaderboardEntry[] {
  return rawData.map((entry, index) => ({
    id: entry.id,
    displayName: getDisplayName(entry, userId),
    value: entry.value,
    rank: index + 1,
    isCurrentUser: entry.userId === userId,
  }));
}

/**
 * Create mutation callbacks for privacy settings updates
 */
function createPrivacyMutationCallbacks(
  setPrivacySettings: (settings: LeaderboardPrivacySettings) => void,
  queryClient: ReturnType<typeof useQueryClient>,
  actionName: string,
) {
  return {
    onSuccess: (data: LeaderboardPrivacySettings) => {
      setPrivacySettings(data);
      queryClient.invalidateQueries({ queryKey: ["leaderboards"] });
      logger.info(actionName, "useLeaderboards");
    },
    onError: (error: Error) => {
      logger.error(`Failed: ${actionName}`, error, "useLeaderboards");
    },
  };
}

/**
 * Create opt-in/opt-out mutation function
 */
function createPrivacyUpdateMutation(
  userId: string | undefined,
  settings: LeaderboardPrivacySettings,
) {
  return async () => {
    if (!userId) throw new Error("User ID required");
    await achievementDBService.updateLeaderboardPrivacy(userId, settings);
    return settings;
  };
}

export const useLeaderboards = (
  userId?: string,
  category: LeaderboardCategory = LeaderboardCategory.ACHIEVEMENT_POINTS,
  period: LeaderboardPeriod = LeaderboardPeriod.ALL_TIME,
) => {
  const queryClient = useQueryClient();
  const [privacySettings, setPrivacySettings] =
    useState<LeaderboardPrivacySettings>(INITIAL_PRIVACY_SETTINGS);

  // Get leaderboard data for a specific category and period
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

  // Get user's rank in the leaderboard
  const { data: userRank, isLoading: isLoadingUserRank } = useQuery({
    queryKey: ["leaderboards", "rank", userId, category, period],
    queryFn: () =>
      achievementDBService.getUserLeaderboardRank(userId!, category, period),
    enabled: Boolean(userId),
    staleTime: 60 * 1000, // 1 minute
  });

  // Get user's leaderboard privacy settings
  const { data: userPrivacySettings } = useQuery({
    queryKey: ["leaderboards", "privacy", userId],
    queryFn: () => achievementDBService.getLeaderboardPrivacy(userId!),
    enabled: Boolean(userId),
  });

  // Update privacy settings when data changes
  useEffect(() => {
    if (userPrivacySettings) {
      setPrivacySettings(userPrivacySettings);
    }
  }, [userPrivacySettings]);

  // Opt into leaderboards
  const optInMutation = useMutation({
    mutationFn: createPrivacyUpdateMutation(userId, DEFAULT_OPT_IN_SETTINGS),
    ...createPrivacyMutationCallbacks(
      setPrivacySettings,
      queryClient,
      "User opted into leaderboards",
    ),
  });

  // Opt out of leaderboards
  const optOutMutation = useMutation({
    mutationFn: createPrivacyUpdateMutation(userId, DEFAULT_OPT_OUT_SETTINGS),
    ...createPrivacyMutationCallbacks(
      setPrivacySettings,
      queryClient,
      "User opted out of leaderboards",
    ),
  });

  // Update leaderboard privacy settings
  const updatePrivacyMutation = useMutation({
    mutationFn: async (settings: Partial<LeaderboardPrivacySettings>) => {
      if (!userId) throw new Error("User ID required");

      const newSettings = { ...privacySettings, ...settings };
      await achievementDBService.updateLeaderboardPrivacy(userId, newSettings);
      return newSettings;
    },
    ...createPrivacyMutationCallbacks(
      setPrivacySettings,
      queryClient,
      "Updated leaderboard privacy settings",
    ),
  });

  const leaderboardData = processLeaderboardData(rawLeaderboardData, userId);

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

// Named export only - hook files should only export hooks starting with 'use'
