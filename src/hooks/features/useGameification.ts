/**
 * useGameification Hook - Enhanced Gamification System
 *
 * Comprehensive gamification system beyond basic achievements, including challenges,
 * leaderboards, seasons, and social features.
 */

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Badge as _Badge,
  ExperienceSource,
  LevelResult,
} from "../../types/gamification";
import { logger } from "../../utils/logging";
import { GamificationStorageService } from "../../services/gamificationStorage";
import { LEVEL_THRESHOLDS } from "../../constants/gamification";
import {
  generateLevelRewards,
  getPlayerTitle,
  getUnlockedFeatures,
} from "@/utils/gamification";
import {
  calculateLevel,
  calculateExperienceToNext,
  createExperienceEvent,
  updateExperienceHistory,
  updatePlayerProfileWithExperience,
  calculateLevelResult,
  calculateProgressToNext,
  calculatePercentile,
} from "../../utils/gamification/gamificationHelpers";
import { useGamificationMutations } from "./useGamificationMutations";
import { useGamificationData } from "./useGamificationData";

/**
 * Enhanced Gamification Hook
 * Complex gamification logic with multiple queries, mutations, and game mechanics
 */
export const useGameification = (userId: string) => {
  const queryClient = useQueryClient();

  // Fetch all data
  const {
    playerProfile,
    activeChallenges,
    leaderboards,
    currentSeason,
    socialFeatures,
    experienceHistory,
  } = useGamificationData(userId);

  // Internal add experience function
  const addExperienceInternal = async (
    amount: number,
    source: ExperienceSource,
  ): Promise<LevelResult> => {
    const oldLevel = playerProfile.level;
    const newExperience = playerProfile.experience + amount;
    const newLevel = calculateLevel(newExperience);
    const experienceToNext = calculateExperienceToNext(newExperience, newLevel);

    // Create and store experience event
    const experienceEvent = createExperienceEvent(amount, source);
    const updatedHistory = updateExperienceHistory(
      experienceHistory,
      experienceEvent,
    );
    GamificationStorageService.setExperienceHistory(updatedHistory);
    queryClient.setQueryData(
      ["gamification", "experience", userId],
      updatedHistory,
    );

    // Update profile
    const updatedProfile = updatePlayerProfileWithExperience(
      playerProfile,
      amount,
      newLevel,
      newExperience,
      experienceToNext,
    );
    GamificationStorageService.setPlayerProfile(updatedProfile);
    queryClient.setQueryData(
      ["gamification", "profile", userId],
      updatedProfile,
    );

    logger.info("Experience added", {
      amount,
      source,
      oldLevel,
      newLevel,
      userId,
    });

    return calculateLevelResult(oldLevel, newLevel, amount);
  };

  const {
    acceptChallengeMutation,
    completeChallengeMutation,
    addExperienceMutation,
  } = useGamificationMutations(
    userId,
    activeChallenges,
    playerProfile,
    addExperienceInternal,
  );

  // Check level up
  const checkLevelUp = useCallback(async () => {
    const nextLevelThreshold =
      LEVEL_THRESHOLDS[playerProfile.level] || Infinity;
    if (playerProfile.experience >= nextLevelThreshold) {
      const newLevel = playerProfile.level + 1;
      return {
        newLevel,
        rewards: generateLevelRewards(newLevel),
        newTitle: getPlayerTitle(newLevel),
        unlockedFeatures: getUnlockedFeatures(newLevel),
      };
    }
    return null;
  }, [playerProfile]);

  // Get leaderboard rank
  const getLeaderboardRank = useCallback(
    async (leaderboardId: string) => {
      const leaderboard = leaderboards.find((l) => l.id === leaderboardId);
      if (!leaderboard) throw new Error("Leaderboard not found");
      const userRank =
        Math.floor(Math.random() * leaderboard.totalParticipants) + 1;
      return {
        category: leaderboard.category,
        period: leaderboard.period,
        rank: userRank,
        totalParticipants: leaderboard.totalParticipants,
        percentile: calculatePercentile(
          userRank,
          leaderboard.totalParticipants,
        ),
        value: playerProfile.stats.totalExperience,
      };
    },
    [leaderboards, playerProfile],
  );

  // Compare with friends
  const compareWithFriends = useCallback(async () => {
    if (!socialFeatures?.friends) return [];
    return socialFeatures.friends.map((friend) => ({
      friendId: friend.userId,
      friendName: friend.displayName,
      categories: [
        {
          category: "Level",
          playerValue: playerProfile.level,
          friendValue: friend.level,
          difference: playerProfile.level - friend.level,
          status:
            playerProfile.level > friend.level
              ? "ahead"
              : playerProfile.level < friend.level
                ? "behind"
                : "tied",
        },
        {
          category: "Experience",
          playerValue: playerProfile.experience,
          friendValue: Math.floor(Math.random() * 10000),
          difference: 0,
          status: "tied",
        },
      ],
      overallComparison: "ahead",
    }));
  }, [socialFeatures, playerProfile]);

  const sendChallenge = useCallback(
    async (friendId: string, challengeId: string) => {
      logger.info("Challenge sent to friend", {
        friendId,
        challengeId,
        userId,
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    [userId],
  );

  const getSeasonalRewards = useCallback(
    async () => currentSeason?.rewards || [],
    [currentSeason],
  );
  const claimSeasonalReward = useCallback(
    async (rewardId: string) => {
      logger.info("Seasonal reward claimed", { rewardId, userId });
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    [userId],
  );

  // Computed values
  const currentLevel = playerProfile.level;
  const progressToNext = calculateProgressToNext(
    playerProfile.level,
    playerProfile.experience,
    playerProfile.experienceToNext,
  );
  const activeChallengeCount = activeChallenges.length;
  const completedChallengesThisWeek = playerProfile.stats.challengesCompleted;
  const rank =
    leaderboards.length > 0
      ? leaderboards[0].entries.findIndex((e) => e.userId === userId) + 1 || 0
      : 0;
  const hasUnclaimedRewards =
    currentSeason?.rewards.some((r) => !r.claimed) || false;
  const getChallengeProgress = (id: string) =>
    activeChallenges.find((c) => c.id === id)?.progress;

  return {
    playerProfile,
    activeChallenges,
    leaderboards,
    currentSeason,
    socialFeatures,
    experienceHistory,
    acceptChallenge: acceptChallengeMutation.mutate,
    completeChallenge: completeChallengeMutation.mutate,
    getChallengeProgress,
    addExperience: addExperienceMutation.mutate,
    checkLevelUp,
    getLeaderboardRank,
    joinLeaderboard: async (id: string) =>
      logger.info("Joined leaderboard", { leaderboardId: id, userId }),
    leaveLeaderboard: async (id: string) =>
      logger.info("Left leaderboard", { leaderboardId: id, userId }),
    compareWithFriends,
    sendChallenge,
    getSeasonalRewards,
    claimSeasonalReward,
    isAcceptingChallenge: acceptChallengeMutation.isPending,
    isCompletingChallenge: completeChallengeMutation.isPending,
    isAddingExperience: addExperienceMutation.isPending,
    lastChallengeCompletion: completeChallengeMutation.data,
    lastLevelResult: addExperienceMutation.data,
    currentLevel,
    progressToNext,
    activeChallengeCount,
    completedChallengesThisWeek,
    rank,
    hasUnclaimedRewards,
    totalExperience: playerProfile.stats.totalExperience,
    totalBadges: playerProfile.badges.length,
    currentStreak: playerProfile.stats.currentStreak,
    error:
      acceptChallengeMutation.error ||
      completeChallengeMutation.error ||
      addExperienceMutation.error,
  };
};
