/**
 * useGameification Hook - Enhanced Gamification System
 *
 * Comprehensive gamification system beyond basic achievements, including challenges,
 * leaderboards, seasons, and social features.
 */

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlayerProfile,
  Challenge,
  Leaderboard,
  Season,
  SocialGameFeatures,
  Badge,
  ExperienceSource,
  LevelResult,
  LevelUpResult,
  ChallengeCompletion,
  LeaderboardRank,
  FriendComparison,
  SeasonalReward,
  ExperienceEvent,
} from "../../types/gamification";
import { logger } from "../../utils/logging";
import { GamificationStorageService } from "../../services/gamificationStorage";
import {
  DEFAULT_PLAYER_PROFILE,
  LEVEL_THRESHOLDS,
  SAMPLE_CHALLENGES,
} from "./gamification-constants";
import {
  generateSampleLeaderboards,
  generateSeasonalRewards,
  createBadgeFromReward,
  generateLevelRewards,
  getPlayerTitle,
  getUnlockedFeatures,
} from "./gamification-utils";

/**
 * Enhanced Gamification Hook
 * Complex gamification logic with multiple queries, mutations, and game mechanics
 */
// eslint-disable-next-line max-statements, complexity
export const useGameification = (userId: string) => {
  const queryClient = useQueryClient();

  // Get player profile
  const { data: playerProfile = DEFAULT_PLAYER_PROFILE } =
    useQuery<PlayerProfile>({
      queryKey: ["gamification", "profile", userId],
      queryFn: () => {
        const stored =
          GamificationStorageService.getPlayerProfile<PlayerProfile>();
        return stored
          ? { ...DEFAULT_PLAYER_PROFILE, ...stored }
          : DEFAULT_PLAYER_PROFILE;
      },
      enabled: Boolean(userId),
      staleTime: 30 * 1000,
    });

  // Get active challenges
  const { data: activeChallenges = [] } = useQuery<Challenge[]>({
    queryKey: ["gamification", "challenges", userId],
    queryFn: () => {
      const userChallenges =
        GamificationStorageService.getChallenges<Challenge>();
      return [...SAMPLE_CHALLENGES, ...userChallenges].filter(
        (c) => !c.isCompleted,
      );
    },
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });

  // Get leaderboards
  const { data: leaderboards = [] } = useQuery<Leaderboard[]>({
    queryKey: ["gamification", "leaderboards"],
    queryFn: async () => {
      // Simulate leaderboard data
      return generateSampleLeaderboards();
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  // Get current season
  const { data: currentSeason } = useQuery<Season | null>({
    queryKey: ["gamification", "season"],
    queryFn: () => {
      return {
        id: "season-winter-2024",
        name: "Winter Challenge 2024",
        description:
          "Embrace the cold season with special winter-themed challenges",
        theme: "winter",
        startDate: new Date("2024-12-01"),
        endDate: new Date("2024-02-28"),
        rewards: generateSeasonalRewards(),
        challenges: ["winter-endurance", "cold-discipline"],
        leaderboards: ["winter-champions"],
        isActive: true,
      };
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Get social features
  const { data: socialFeatures } = useQuery<SocialGameFeatures>({
    queryKey: ["gamification", "social", userId],
    queryFn: () => {
      const stored =
        GamificationStorageService.getSocialFeatures<SocialGameFeatures>();
      return stored
        ? stored
        : {
            friends: [],
            pendingRequests: [],
            recentActivity: [],
            groups: [],
            comparisons: [],
          };
    },
    enabled: Boolean(userId) && playerProfile.preferences.allowSocialFeatures,
    staleTime: 2 * 60 * 1000,
  });

  // Get experience history
  const { data: experienceHistory = [] } = useQuery<ExperienceEvent[]>({
    queryKey: ["gamification", "experience", userId],
    queryFn: () => {
      return GamificationStorageService.getExperienceHistory<ExperienceEvent>();
    },
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });

  // Accept challenge mutation
  const acceptChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const challenge = activeChallenges.find((c) => c.id === challengeId);
      if (!challenge) throw new Error("Challenge not found");

      logger.info("Challenge accepted", { challengeId, userId });

      // In a real implementation, this would register the user for the challenge
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
  });

  // Complete challenge mutation
  const completeChallengeMutation = useMutation({
    mutationFn: async (challengeId: string): Promise<ChallengeCompletion> => {
      const challenge = activeChallenges.find((c) => c.id === challengeId);
      if (!challenge) throw new Error("Challenge not found");

      logger.info("Challenge completed", { challengeId, userId });

      // Mark challenge as completed
      const updatedChallenges = activeChallenges.map((c) =>
        c.id === challengeId
          ? {
              ...c,
              isCompleted: true,
              progress: { ...c.progress, percentage: 100 },
            }
          : c,
      );
      GamificationStorageService.setChallenges(updatedChallenges);

      // Calculate rewards
      const experienceGained = challenge.rewards.reduce(
        (total, reward) =>
          reward.type === "experience" ? total + reward.value : total,
        0,
      );

      // Add experience
      const levelResult = await addExperienceInternal(
        experienceGained,
        ExperienceSource.CHALLENGE_COMPLETE,
      );

      // Create completion result
      const completion: ChallengeCompletion = {
        challengeId,
        completedAt: new Date(),
        rewards: challenge.rewards,
        experience: experienceGained,
        newBadges: challenge.rewards
          .filter((r) => r.type === "badge")
          .map((r) => createBadgeFromReward(r)),
        levelUp: levelResult.leveledUp
          ? {
              newLevel: levelResult.newLevel,
              rewards: [],
              unlockedFeatures: [],
            }
          : undefined,
      };

      // Update stats
      const updatedProfile = {
        ...playerProfile,
        stats: {
          ...playerProfile.stats,
          challengesCompleted: playerProfile.stats.challengesCompleted + 1,
          totalExperience:
            playerProfile.stats.totalExperience + experienceGained,
        },
      };
      GamificationStorageService.setPlayerProfile(updatedProfile);
      queryClient.setQueryData(
        ["gamification", "profile", userId],
        updatedProfile,
      );

      return completion;
    },
  });

  // Add experience mutation
  const addExperienceMutation = useMutation({
    mutationFn: async ({
      amount,
      source,
    }: {
      amount: number;
      source: ExperienceSource;
    }): Promise<LevelResult> => {
      return addExperienceInternal(amount, source);
    },
  });

  // Internal add experience function
  const addExperienceInternal = async (
    amount: number,
    source: ExperienceSource,
  ): Promise<LevelResult> => {
    const oldLevel = playerProfile.level;
    const newExperience = playerProfile.experience + amount;

    // Calculate new level
    let newLevel = oldLevel;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
      const threshold = LEVEL_THRESHOLDS[i];
      if (threshold !== undefined && newExperience >= threshold) {
        newLevel = i + 1;
      } else {
        break;
      }
    }

    const experienceToNext =
      newLevel < LEVEL_THRESHOLDS.length
        ? (LEVEL_THRESHOLDS[newLevel] ?? 0) - newExperience
        : 0;

    // Create experience event
    const experienceEvent: ExperienceEvent = {
      id: `exp-${Date.now()}`,
      source,
      amount,
      description: `Gained ${amount} XP from ${source}`,
      timestamp: new Date(),
    };

    // Update experience history
    const updatedHistory = [experienceEvent, ...experienceHistory].slice(
      0,
      100,
    );
    GamificationStorageService.setExperienceHistory(updatedHistory);
    queryClient.setQueryData(
      ["gamification", "experience", userId],
      updatedHistory,
    );

    // Update profile
    const updatedProfile = {
      ...playerProfile,
      level: newLevel,
      experience: newExperience,
      experienceToNext,
      stats: {
        ...playerProfile.stats,
        totalExperience: playerProfile.stats.totalExperience + amount,
      },
      lastActive: new Date(),
    };

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

    return {
      leveledUp: newLevel > oldLevel,
      oldLevel,
      newLevel,
      experience: amount,
    };
  };

  // Check level up
  const checkLevelUp = useCallback(async (): Promise<LevelUpResult | null> => {
    const _currentLevelThreshold =
      LEVEL_THRESHOLDS[playerProfile.level - 1] || 0;
    const nextLevelThreshold =
      LEVEL_THRESHOLDS[playerProfile.level] || Infinity;

    if (playerProfile.experience >= nextLevelThreshold) {
      const newLevel = playerProfile.level + 1;
      const rewards = generateLevelRewards(newLevel);

      return {
        newLevel,
        rewards,
        newTitle: getPlayerTitle(newLevel),
        unlockedFeatures: getUnlockedFeatures(newLevel),
      };
    }

    return null;
  }, [playerProfile]);

  // Get leaderboard rank
  const getLeaderboardRank = useCallback(
    async (leaderboardId: string): Promise<LeaderboardRank> => {
      const leaderboard = leaderboards.find((l) => l.id === leaderboardId);
      if (!leaderboard) throw new Error("Leaderboard not found");

      // Find user's rank (simulated)
      const userRank =
        Math.floor(Math.random() * leaderboard.totalParticipants) + 1;
      const percentile =
        ((leaderboard.totalParticipants - userRank) /
          leaderboard.totalParticipants) *
        100;

      return {
        category: leaderboard.category,
        period: leaderboard.period,
        rank: userRank,
        totalParticipants: leaderboard.totalParticipants,
        percentile,
        value: playerProfile.stats.totalExperience,
      };
    },
    [leaderboards, playerProfile],
  );

  // Compare with friends
  const compareWithFriends = useCallback(async (): Promise<
    FriendComparison[]
  > => {
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

  // Send challenge to friend
  const sendChallenge = useCallback(
    async (friendId: string, challengeId: string) => {
      logger.info("Challenge sent to friend", {
        friendId,
        challengeId,
        userId,
      });
      // In a real implementation, this would create a challenge invitation
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    [userId],
  );

  // Get seasonal rewards
  const getSeasonalRewards = useCallback(async (): Promise<
    SeasonalReward[]
  > => {
    return currentSeason?.rewards || [];
  }, [currentSeason]);

  // Claim seasonal reward
  const claimSeasonalReward = useCallback(
    async (rewardId: string) => {
      logger.info("Seasonal reward claimed", { rewardId, userId });
      // In a real implementation, this would claim the reward and update user data
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    [userId],
  );

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
    leaderboards.length > 0 && leaderboards[0]
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
    acceptChallenge: acceptChallengeMutation.mutate,
    completeChallenge: completeChallengeMutation.mutate,
    getChallengeProgress: (challengeId: string) => {
      const challenge = activeChallenges.find((c) => c.id === challengeId);
      return challenge?.progress;
    },

    // Experience and leveling
    addExperience: addExperienceMutation.mutate,
    checkLevelUp,

    // Leaderboard features
    getLeaderboardRank,
    joinLeaderboard: async (leaderboardId: string) => {
      logger.info("Joined leaderboard", { leaderboardId, userId });
    },
    leaveLeaderboard: async (leaderboardId: string) => {
      logger.info("Left leaderboard", { leaderboardId, userId });
    },

    // Social features
    compareWithFriends,
    sendChallenge,

    // Seasonal events
    getSeasonalRewards,
    claimSeasonalReward,

    // Loading states
    isAcceptingChallenge: acceptChallengeMutation.isPending,
    isCompletingChallenge: completeChallengeMutation.isPending,
    isAddingExperience: addExperienceMutation.isPending,

    // Results
    lastChallengeCompletion: completeChallengeMutation.data,
    lastLevelResult: addExperienceMutation.data,

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
    error:
      acceptChallengeMutation.error ||
      completeChallengeMutation.error ||
      addExperienceMutation.error,
  };
};
