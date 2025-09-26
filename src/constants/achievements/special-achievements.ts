/**
 * Special Achievements
 * Time-based, holiday, and hidden achievements for unique circumstances
 */

import {
  DBAchievement,
  AchievementCategory,
  AchievementDifficulty,
} from "../../types";

export const SPECIAL_ACHIEVEMENTS: Omit<
  DBAchievement,
  "id" | "syncStatus" | "lastModified"
>[] = [
  {
    name: "Early Bird",
    description: "Start 10 sessions before 8 AM",
    category: AchievementCategory.SPECIAL_ACHIEVEMENTS,
    icon: "🌅",
    difficulty: AchievementDifficulty.UNCOMMON,
    points: 80,
    requirements: [
      {
        type: "special_condition",
        value: 10,
        unit: "count",
        condition: "sessions_before_8am",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "Night Owl",
    description: "Start 10 sessions after 10 PM",
    category: AchievementCategory.SPECIAL_ACHIEVEMENTS,
    icon: "🦉",
    difficulty: AchievementDifficulty.UNCOMMON,
    points: 80,
    requirements: [
      {
        type: "special_condition",
        value: 10,
        unit: "count",
        condition: "sessions_after_10pm",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "Weekend Warrior",
    description: "Start sessions on 10 different weekends",
    category: AchievementCategory.SPECIAL_ACHIEVEMENTS,
    icon: "🎉",
    difficulty: AchievementDifficulty.UNCOMMON,
    points: 100,
    requirements: [
      {
        type: "special_condition",
        value: 10,
        unit: "count",
        condition: "weekend_sessions",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "Holiday Dedication",
    description: "Maintain session during major holidays",
    category: AchievementCategory.SPECIAL_ACHIEVEMENTS,
    icon: "🎄",
    difficulty: AchievementDifficulty.RARE,
    points: 150,
    requirements: [
      {
        type: "special_condition",
        value: 1,
        unit: "count",
        condition: "holiday_session",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "New Year, New Me",
    description: "Start session on January 1st",
    category: AchievementCategory.SPECIAL_ACHIEVEMENTS,
    icon: "🎊",
    difficulty: AchievementDifficulty.RARE,
    points: 100,
    requirements: [
      {
        type: "special_condition",
        value: 1,
        unit: "count",
        condition: "new_year_session",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "The Explorer",
    description: "Discovered a hidden achievement",
    category: AchievementCategory.SPECIAL_ACHIEVEMENTS,
    icon: "🔍",
    difficulty: AchievementDifficulty.RARE,
    points: 200,
    requirements: [
      {
        type: "special_condition",
        value: 1,
        unit: "count",
        condition: "found_hidden_achievement",
      },
    ],
    isHidden: true,
    isActive: true,
  },
  {
    name: "Beta Tester",
    description: "Participated in the beta program",
    category: AchievementCategory.SPECIAL_ACHIEVEMENTS,
    icon: "🧪",
    difficulty: AchievementDifficulty.EPIC,
    points: 500,
    requirements: [
      {
        type: "special_condition",
        value: 1,
        unit: "count",
        condition: "beta_participation",
      },
    ],
    isHidden: true,
    isActive: true,
  },
];