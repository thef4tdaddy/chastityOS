/**
 * Gamification Constants and Sample Data
 * Extracted from useGameification for better code organization
 */

import {
  Challenge,
  ChallengeType,
  ChallengeDifficulty,
  PlayerProfile,
  PlayerTitle,
  LeaderboardCategory,
  BadgeCategory as _BadgeCategory,
  ExperienceSource,
} from "../../types/gamification";

// Experience values by source
export const EXPERIENCE_VALUES = {
  [ExperienceSource.SESSION_COMPLETE]: 100,
  [ExperienceSource.CHALLENGE_COMPLETE]: 250,
  [ExperienceSource.MILESTONE_REACHED]: 150,
  [ExperienceSource.BEHAVIOR_IMPROVEMENT]: 75,
  [ExperienceSource.DAILY_CHECK_IN]: 25,
  [ExperienceSource.SOCIAL_INTERACTION]: 50,
  [ExperienceSource.GOAL_ACHIEVEMENT]: 200,
};

// Level thresholds
export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000, 13000, 16500,
  20500, 25000, 30000, 35500, 41500, 48000, 55000, 62500,
];

// Default player profile
export const DEFAULT_PLAYER_PROFILE: PlayerProfile = {
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
export const SAMPLE_CHALLENGES: Challenge[] = [
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
