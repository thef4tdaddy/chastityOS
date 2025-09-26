/**
 * Streak Achievements
 * Achievements for consecutive day streaks
 */

import {
  DBAchievement,
  AchievementCategory,
  AchievementDifficulty,
} from "../../types";

export const STREAK_ACHIEVEMENTS: Omit<
  DBAchievement,
  "id" | "syncStatus" | "lastModified"
>[] = [
  {
    name: "Streak Starter",
    description: "Maintain a 3-day streak",
    category: AchievementCategory.STREAK_ACHIEVEMENTS,
    icon: "🔥",
    difficulty: AchievementDifficulty.COMMON,
    points: 30,
    requirements: [
      {
        type: "streak_days",
        value: 3,
        unit: "days",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    category: AchievementCategory.STREAK_ACHIEVEMENTS,
    icon: "⚡",
    difficulty: AchievementDifficulty.UNCOMMON,
    points: 70,
    requirements: [
      {
        type: "streak_days",
        value: 7,
        unit: "days",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "Consistency King",
    description: "Maintain a 14-day streak",
    category: AchievementCategory.STREAK_ACHIEVEMENTS,
    icon: "👑",
    difficulty: AchievementDifficulty.RARE,
    points: 140,
    requirements: [
      {
        type: "streak_days",
        value: 14,
        unit: "days",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "Dedication Diamond",
    description: "Maintain a 30-day streak",
    category: AchievementCategory.STREAK_ACHIEVEMENTS,
    icon: "💎",
    difficulty: AchievementDifficulty.EPIC,
    points: 300,
    requirements: [
      {
        type: "streak_days",
        value: 30,
        unit: "days",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "Legendary Streak",
    description: "Maintain a 60-day streak",
    category: AchievementCategory.STREAK_ACHIEVEMENTS,
    icon: "🌟",
    difficulty: AchievementDifficulty.LEGENDARY,
    points: 600,
    requirements: [
      {
        type: "streak_days",
        value: 60,
        unit: "days",
      },
    ],
    isHidden: false,
    isActive: true,
  },
];