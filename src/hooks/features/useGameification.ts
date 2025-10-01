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
  PlayerTitle,
  ChallengeDifficulty,
  ChallengeType,
  LeaderboardCategory,
  LeaderboardPeriod,
  BadgeCategory,
  ExperienceEvent,
} from "../../types/gamification";
import { logger } from "../../utils/logging";

// Storage keys
const STORAGE_KEYS = {
  PLAYER_PROFILE: "chastity-gamification-profile",
  CHALLENGES: "chastity-gamification-challenges",
  LEADERBOARDS: "chastity-gamification-leaderboards",
  SOCIAL_FEATURES: "chastity-gamification-social",
  EXPERIENCE_HISTORY: "chastity-gamification-experience",
};

// Experience values by source
const _EXPERIENCE_VALUES = {
  [ExperienceSource.SESSION_COMPLETE]: 100,
  [ExperienceSource.CHALLENGE_COMPLETE]: 250,
  [ExperienceSource.MILESTONE_REACHED]: 150,
  [ExperienceSource.BEHAVIOR_IMPROVEMENT]: 75,
  [ExperienceSource.DAILY_CHECK_IN]: 25,
  [ExperienceSource.SOCIAL_INTERACTION]: 50,
  [ExperienceSource.GOAL_ACHIEVEMENT]: 200,
};

// Level thresholds
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000, 13000, 16500,
  20500, 25000, 30000, 35500, 41500, 48000, 55000, 62500,
];

// Default player profile
const DEFAULT_PLAYER_PROFILE: PlayerProfile = {
  level: 1,
  experience: 0,
  experienceToNext: 100,
  title: PlayerTitle.NOVICE,
  badges: [],
  stats: {
    totalExperience: 0,
    challengesCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalDuration: 0,
    badgesEarned: 0,
    leaderboardRank: {
      [LeaderboardCategory.EXPERIENCE]: 0,
      [LeaderboardCategory.DURATION]: 0,
      [LeaderboardCategory.CHALLENGES]: 0,
      [LeaderboardCategory.STREAKS]: 0,
      [LeaderboardCategory.SOCIAL]: 0,
    },
    socialConnections: 0,
    achievementPoints: 0,
  },
  preferences: {
    showLevel: true,
    showBadges: true,
    participateInLeaderboards: true,
    allowSocialFeatures: true,
    notificationSettings: {
      levelUp: true,
      badgeEarned: true,
      challengeComplete: true,
      leaderboardUpdate: false,
      socialActivity: true,
      seasonalEvents: true,
    },
  },
  joinedAt: new Date(),
  lastActive: new Date(),
};

// Sample challenges
const SAMPLE_CHALLENGES: Challenge[] = [
  {
    id: "challenge-streak-7",
    type: ChallengeType.DURATION,
    name: "7-Day Streak",
    description: "Maintain a 7-day consecutive streak",
    difficulty: ChallengeDifficulty.BEGINNER,
    requirements: [
      {
        id: "req-1",
        type: "duration",
        description: "Complete 7 consecutive days",
        targetValue: 7,
        currentValue: 0,
        completed: false,
      },
    ],
    rewards: [
      {
        type: "experience",
        value: 500,
        description: "500 XP",
        claimed: false,
      },
      {
        type: "badge",
        value: 1,
        description: "Streak Master Badge",
        claimed: false,
      },
    ],
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    progress: {
      percentage: 0,
      requirementsCompleted: 0,
      totalRequirements: 1,
      lastUpdated: new Date(),
      milestones: [],
    },
    isCompleted: false,
    participants: 247,
    isPublic: true,
  },
];

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
        const stored = localStorage.getItem(STORAGE_KEYS.PLAYER_PROFILE);
        return stored
          ? { ...DEFAULT_PLAYER_PROFILE, ...JSON.parse(stored) }
          : DEFAULT_PLAYER_PROFILE;
      },
      enabled: Boolean(userId),
      staleTime: 30 * 1000,
    });

  // Get active challenges
  const { data: activeChallenges = [] } = useQuery<Challenge[]>({
    queryKey: ["gamification", "challenges", userId],
    queryFn: () => {
      const stored = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
      const userChallenges = stored ? JSON.parse(stored) : [];
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
      const stored = localStorage.getItem(STORAGE_KEYS.SOCIAL_FEATURES);
      return stored
        ? JSON.parse(stored)
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
      const stored = localStorage.getItem(STORAGE_KEYS.EXPERIENCE_HISTORY);
      return stored ? JSON.parse(stored) : [];
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
      localStorage.setItem(
        STORAGE_KEYS.CHALLENGES,
        JSON.stringify(updatedChallenges),
      );

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
      localStorage.setItem(
        STORAGE_KEYS.PLAYER_PROFILE,
        JSON.stringify(updatedProfile),
      );
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
      if (newExperience >= LEVEL_THRESHOLDS[i]) {
        newLevel = i + 1;
      } else {
        break;
      }
    }

    const experienceToNext =
      newLevel < LEVEL_THRESHOLDS.length
        ? LEVEL_THRESHOLDS[newLevel] - newExperience
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
    localStorage.setItem(
      STORAGE_KEYS.EXPERIENCE_HISTORY,
      JSON.stringify(updatedHistory),
    );
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

    localStorage.setItem(
      STORAGE_KEYS.PLAYER_PROFILE,
      JSON.stringify(updatedProfile),
    );
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

  // Helper functions
  const generateSampleLeaderboards = (): Leaderboard[] => [
    {
      id: "exp-weekly",
      category: LeaderboardCategory.EXPERIENCE,
      period: LeaderboardPeriod.WEEKLY,
      name: "Weekly Experience Leaders",
      description: "Top experience earners this week",
      entries: Array.from({ length: 10 }, (_, i) => ({
        rank: i + 1,
        userId: `user-${i}`,
        displayName: `Player ${i + 1}`,
        value: Math.floor(Math.random() * 5000),
        change: Math.floor(Math.random() * 10) - 5,
        badge: i < 3 ? ["gold", "silver", "bronze"][i] : undefined,
      })),
      lastUpdated: new Date(),
      totalParticipants: 1247,
    },
  ];

  const generateSeasonalRewards = (): SeasonalReward[] => [
    {
      id: "winter-badge",
      name: "Winter Warrior",
      description: "Complete 10 challenges during winter season",
      type: "badge",
      requirement: {
        type: "challenges",
        value: 10,
        description: "Complete 10 challenges",
      },
      claimed: false,
      exclusive: true,
    },
  ];

  const createBadgeFromReward = (reward: ChallengeReward): Badge => ({
    id: `badge-${reward.value}`,
    name: reward.description,
    description: reward.description,
    category: BadgeCategory.ACHIEVEMENT,
    iconUrl: "/badges/achievement.png",
    rarity: "common",
    earnedAt: new Date(),
    requirements: [],
    hidden: false,
  });

  const generateLevelRewards = (level: number) => [
    {
      type: "badge" as const,
      value: `level-${level}`,
      description: `Level ${level} Achievement Badge`,
    },
  ];

  const getPlayerTitle = (level: number): PlayerTitle => {
    if (level >= 20) return PlayerTitle.LEGEND;
    if (level >= 15) return PlayerTitle.GRANDMASTER;
    if (level >= 12) return PlayerTitle.MASTER;
    if (level >= 10) return PlayerTitle.EXPERT;
    if (level >= 8) return PlayerTitle.ADEPT;
    if (level >= 6) return PlayerTitle.PRACTITIONER;
    if (level >= 4) return PlayerTitle.APPRENTICE;
    return PlayerTitle.NOVICE;
  };

  const getUnlockedFeatures = (level: number): string[] => {
    const features = [];
    if (level >= 3) features.push("Custom Challenges");
    if (level >= 5) features.push("Friend System");
    if (level >= 8) features.push("Group Challenges");
    if (level >= 10) features.push("Advanced Analytics");
    return features;
  };

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
    leaderboards.length > 0
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
