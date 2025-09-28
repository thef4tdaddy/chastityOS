/**
 * Consistency Badge Achievements
 * Achievements based on session completion counts
 */

import {
  DBAchievement,
  AchievementCategory,
  AchievementDifficulty,
} from "../../types";

export const CONSISTENCY_ACHIEVEMENTS: Omit<
  DBAchievement,
  "id" | "syncStatus" | "lastModified"
>[] = [
  {
    name: "Steady Start",
    description: "Complete 5 sessions",
    category: AchievementCategory.CONSISTENCY_BADGES,
    icon: "🚀",
    difficulty: AchievementDifficulty.COMMON,
    points: 25,
    requirements: [
      {
        type: "session_count",
        value: 5,
        unit: "count",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "Getting Consistent",
    description: "Complete 10 sessions",
    category: AchievementCategory.CONSISTENCY_BADGES,
    icon: "📈",
    difficulty: AchievementDifficulty.COMMON,
    points: 50,
    requirements: [
      {
        type: "session_count",
        value: 10,
        unit: "count",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "Dedicated User",
    description: "Complete 25 sessions",
    category: AchievementCategory.CONSISTENCY_BADGES,
    icon: "🎖️",
    difficulty: AchievementDifficulty.UNCOMMON,
    points: 125,
    requirements: [
      {
        type: "session_count",
        value: 25,
        unit: "count",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "Commitment Champion",
    description: "Complete 50 sessions",
    category: AchievementCategory.CONSISTENCY_BADGES,
    icon: "🏅",
    difficulty: AchievementDifficulty.RARE,
    points: 250,
    requirements: [
      {
        type: "session_count",
        value: 50,
        unit: "count",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "Lifetime Member",
    description: "Complete 100 sessions",
    category: AchievementCategory.CONSISTENCY_BADGES,
    icon: "👑",
    difficulty: AchievementDifficulty.LEGENDARY,
    points: 500,
    requirements: [
      {
        type: "session_count",
        value: 100,
        unit: "count",
      },
    ],
    isHidden: false,
    isActive: true,
  },
];
