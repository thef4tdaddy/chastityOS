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
} from "../../utils/gamification/gamificationHelpers";
import { useGamificationMutations } from "./useGamificationMutations";
import { useGamificationData } from "./useGamificationData";
import { useLeaderboardSystem } from "./useLeaderboardSystem";
import { useSocialGameFeatures } from "./useSocialGameFeatures";
import { useSeasonalRewards } from "./useSeasonalRewards";

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

  // Leaderboard operations
  const { getLeaderboardRank, joinLeaderboard, leaveLeaderboard, rank } =
    useLeaderboardSystem(leaderboards, playerProfile, userId);

  // Social features
  const { compareWithFriends, sendChallenge } = useSocialGameFeatures(
    socialFeatures,
    playerProfile,
    userId,
  );

  // Seasonal rewards
  const { getSeasonalRewards, claimSeasonalReward, hasUnclaimedRewards } =
    useSeasonalRewards(currentSeason, userId);

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

  // Computed values
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
    joinLeaderboard,
    leaveLeaderboard,
    compareWithFriends,
    sendChallenge,
    getSeasonalRewards,
    claimSeasonalReward,
    isAcceptingChallenge: acceptChallengeMutation.isPending,
    isCompletingChallenge: completeChallengeMutation.isPending,
    isAddingExperience: addExperienceMutation.isPending,
    lastChallengeCompletion: completeChallengeMutation.data,
    lastLevelResult: addExperienceMutation.data,
    currentLevel: playerProfile.level,
    progressToNext: calculateProgressToNext(
      playerProfile.level,
      playerProfile.experience,
      playerProfile.experienceToNext,
    ),
    activeChallengeCount: activeChallenges.length,
    completedChallengesThisWeek: playerProfile.stats.challengesCompleted,
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
