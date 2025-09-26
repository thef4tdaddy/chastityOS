/**
 * Session Milestone Achievements
 * Time-based achievements for session duration milestones
 */

import {
  DBAchievement,
  AchievementCategory,
  AchievementDifficulty,
} from "../../types";

export const MILESTONE_ACHIEVEMENTS: Omit<
  DBAchievement,
  "id" | "syncStatus" | "lastModified"
>[] = [
  {
    name: "First Session",
    description: "Complete your first chastity session",
    category: AchievementCategory.SESSION_MILESTONES,
    icon: "🔐",
    difficulty: AchievementDifficulty.COMMON,
    points: 10,
    requirements: [
      {
        type: "session_count",
        value: 1,
        unit: "count",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "First Week",
    description: "Complete a 7-day session",
    category: AchievementCategory.SESSION_MILESTONES,
    icon: "🎯",
    difficulty: AchievementDifficulty.COMMON,
    points: 50,
    requirements: [
      {
        type: "session_duration",
        value: 7 * 24 * 60 * 60, // 7 days in seconds
        unit: "seconds",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "Two Weeks Strong",
    description: "Complete a 14-day session",
    category: AchievementCategory.SESSION_MILESTONES,
    icon: "💪",
    difficulty: AchievementDifficulty.UNCOMMON,
    points: 100,
    requirements: [
      {
        type: "session_duration",
        value: 14 * 24 * 60 * 60, // 14 days in seconds
        unit: "seconds",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "Monthly Dedication",
    description: "Complete a 30-day session",
    category: AchievementCategory.SESSION_MILESTONES,
    icon: "🌟",
    difficulty: AchievementDifficulty.RARE,
    points: 200,
    requirements: [
      {
        type: "session_duration",
        value: 30 * 24 * 60 * 60, // 30 days in seconds
        unit: "seconds",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "Quarterly Commitment",
    description: "Complete a 90-day session",
    category: AchievementCategory.SESSION_MILESTONES,
    icon: "🏆",
    difficulty: AchievementDifficulty.EPIC,
    points: 500,
    requirements: [
      {
        type: "session_duration",
        value: 90 * 24 * 60 * 60, // 90 days in seconds
        unit: "seconds",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "Half Year Hero",
    description: "Complete a 180-day session",
    category: AchievementCategory.SESSION_MILESTONES,
    icon: "👑",
    difficulty: AchievementDifficulty.LEGENDARY,
    points: 1000,
    requirements: [
      {
        type: "session_duration",
        value: 180 * 24 * 60 * 60, // 180 days in seconds
        unit: "seconds",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "Annual Achievement",
    description: "Complete a 365-day session",
    category: AchievementCategory.SESSION_MILESTONES,
    icon: "💎",
    difficulty: AchievementDifficulty.LEGENDARY,
    points: 2000,
    requirements: [
      {
        type: "session_duration",
        value: 365 * 24 * 60 * 60, // 365 days in seconds
        unit: "seconds",
      },
    ],
    isHidden: false,
    isActive: true,
  },
];