/**
 * Gamification Utility Functions
 * Helper functions extracted from useGameification
 */

import {
  Badge,
  BadgeCategory,
  ChallengeReward,
  PlayerTitle,
  SeasonalReward,
  Leaderboard,
  LeaderboardCategory,
  LeaderboardPeriod,
} from "../../types/gamification";

/**
 * Create badge from challenge reward
 */
export const createBadgeFromReward = (reward: ChallengeReward): Badge => ({
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

/**
 * Generate level-based rewards
 */
export const generateLevelRewards = (level: number) => [
  {
    type: "badge" as const,
    value: `level-${level}`,
    description: `Level ${level} Achievement Badge`,
  },
];

/**
 * Get player title based on level
 */
export const getPlayerTitle = (level: number): PlayerTitle => {
  if (level >= 20) return PlayerTitle.LEGEND;
  if (level >= 15) return PlayerTitle.GRANDMASTER;
  if (level >= 12) return PlayerTitle.MASTER;
  if (level >= 10) return PlayerTitle.EXPERT;
  if (level >= 8) return PlayerTitle.ADEPT;
  if (level >= 6) return PlayerTitle.PRACTITIONER;
  if (level >= 4) return PlayerTitle.APPRENTICE;
  return PlayerTitle.NOVICE;
};

/**
 * Get unlocked features based on level
 */
export const getUnlockedFeatures = (level: number): string[] => {
  const features = [];
  if (level >= 3) features.push("Custom Challenges");
  if (level >= 5) features.push("Friend System");
  if (level >= 8) features.push("Group Challenges");
  if (level >= 10) features.push("Advanced Analytics");
  return features;
};

/**
 * Generate seasonal rewards
 */
export const generateSeasonalRewards = (): SeasonalReward[] => [
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

/**
 * Generate sample leaderboards
 */
export const generateSampleLeaderboards = (): Leaderboard[] => [
  {
    id: "experience-weekly",
    name: "Weekly Experience Leaders",
    description: "Top experience earners this week",
    category: LeaderboardCategory.EXPERIENCE,
    period: LeaderboardPeriod.WEEKLY,
    entries: generateLeaderboardEntries(50),
    totalParticipants: 50,
    lastUpdated: new Date(),
  },
  {
    id: "duration-monthly",
    name: "Monthly Duration Champions",
    description: "Top duration achievers this month",
    category: LeaderboardCategory.DURATION,
    period: LeaderboardPeriod.MONTHLY,
    entries: generateLeaderboardEntries(100),
    totalParticipants: 100,
    lastUpdated: new Date(),
  },
];

/**
 * Generate leaderboard entries (helper for sample data)
 */
function generateLeaderboardEntries(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    userId: `user-${i + 1}`,
    displayName: `Player ${i + 1}`,
    rank: i + 1,
    value: Math.floor(Math.random() * 10000),
    change: Math.floor(Math.random() * 10) - 5,
    avatar: undefined,
  }));
}
