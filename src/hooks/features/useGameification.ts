/**
 * useGameification Hook - Enhanced Gamification System
 *
 * Comprehensive gamification system beyond basic achievements, including challenges,
 * leaderboards, seasons, and social features.
 */

import { LEVEL_THRESHOLDS } from "../../constants/gamification";
import { useGameificationData } from "./useGameificationData";
import { useGameificationMutations } from "./useGameificationMutations";
import { useGameificationAnalytics } from "./useGameificationAnalytics";
import { useGameificationSeasonal } from "./useGameificationSeasonal";

/**
 * Enhanced Gamification Hook
 * Complex gamification logic with multiple queries, mutations, and game mechanics
 */
export const useGameification = (userId: string) => {
  // Load all gamification data
  const {
    playerProfile,
    activeChallenges,
    leaderboards,
    currentSeason,
    socialFeatures,
    experienceHistory,
  } = useGameificationData(userId);

  // Challenge and experience mutations
  const {
    acceptChallenge,
    completeChallenge,
    addExperience,
    isAcceptingChallenge,
    isCompletingChallenge,
    isAddingExperience,
    lastChallengeCompletion,
    lastLevelResult,
    mutationError,
  } = useGameificationMutations({
    userId,
    playerProfile,
    activeChallenges,
    experienceHistory,
  });

  // Analytics features
  const { checkLevelUp, getLeaderboardRank, compareWithFriends } =
    useGameificationAnalytics({
      playerProfile,
      leaderboards,
      socialFeatures,
    });

  // Seasonal features
  const {
    sendChallenge,
    getSeasonalRewards,
    claimSeasonalReward,
    joinLeaderboard,
    leaveLeaderboard,
  } = useGameificationSeasonal({
    userId,
    currentSeason,
  });

  // Computed properties
  const currentLevel = playerProfile.level;
  const progressToNext =
    playerProfile.experienceToNext > 0
      ? ((playerProfile.experience -
          (LEVEL_THRESHOLDS[playerProfile.level - 1] || 0)) /
          ((LEVEL_THRESHOLDS[playerProfile.level] ||
            playerProfile.experienceToNext) -
            (LEVEL_THRESHOLDS[playerProfile.level - 1] || 0))) *
        100
      : 100;

  const activeChallengeCount = activeChallenges.length;
  const completedChallengesThisWeek = playerProfile.stats.challengesCompleted; // Simplified

  const rank =
    leaderboards.length > 0 && leaderboards[0]?.entries
      ? leaderboards[0].entries.findIndex((e) => e.userId === userId) + 1 || 0
      : 0;

  const hasUnclaimedRewards =
    currentSeason?.rewards.some((r) => !r.claimed) || false;

  return {
    // Player state
    playerProfile,
    activeChallenges,
    leaderboards,
    currentSeason,
    socialFeatures,
    experienceHistory,

    // Challenge management
    acceptChallenge,
    completeChallenge,
    getChallengeProgress: (challengeId: string) => {
      const challenge = activeChallenges.find((c) => c.id === challengeId);
      return challenge?.progress;
    },

    // Experience and leveling
    addExperience,
    checkLevelUp,

    // Leaderboard features
    getLeaderboardRank,
    joinLeaderboard,
    leaveLeaderboard,

    // Social features
    compareWithFriends,
    sendChallenge,

    // Seasonal events
    getSeasonalRewards,
    claimSeasonalReward,

    // Loading states
    isAcceptingChallenge,
    isCompletingChallenge,
    isAddingExperience,

    // Results
    lastChallengeCompletion,
    lastLevelResult,

    // Computed properties
    currentLevel,
    progressToNext,
    activeChallengeCount,
    completedChallengesThisWeek,
    rank,
    hasUnclaimedRewards,

    // Quick stats
    totalExperience: playerProfile.stats.totalExperience,
    totalBadges: playerProfile.badges.length,
    currentStreak: playerProfile.stats.currentStreak,

    // Errors
    error: mutationError,
  };
};
