/**
 * Goal-Based Achievements
 * Achievements related to personal goal completion and performance
 */

import {
  DBAchievement,
  AchievementCategory,
  AchievementDifficulty,
} from "../../types";

export const GOAL_ACHIEVEMENTS: Omit<
  DBAchievement,
  "id" | "syncStatus" | "lastModified"
>[] = [
  {
    name: "Goal Getter",
    description: "Achieve your first personal goal",
    category: AchievementCategory.GOAL_BASED,
    icon: "🎯",
    difficulty: AchievementDifficulty.COMMON,
    points: 40,
    requirements: [
      {
        type: "goal_completion",
        value: 1,
        unit: "count",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "Goal Crusher",
    description: "Achieve 5 personal goals",
    category: AchievementCategory.GOAL_BASED,
    icon: "💥",
    difficulty: AchievementDifficulty.UNCOMMON,
    points: 200,
    requirements: [
      {
        type: "goal_completion",
        value: 5,
        unit: "count",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "Target Master",
    description: "Achieve 10 personal goals",
    category: AchievementCategory.GOAL_BASED,
    icon: "🏹",
    difficulty: AchievementDifficulty.RARE,
    points: 400,
    requirements: [
      {
        type: "goal_completion",
        value: 10,
        unit: "count",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "Overachiever",
    description: "Exceed a goal by 50% or more",
    category: AchievementCategory.GOAL_BASED,
    icon: "🚀",
    difficulty: AchievementDifficulty.UNCOMMON,
    points: 75,
    requirements: [
      {
        type: "special_condition",
        value: 1,
        unit: "count",
        condition: "exceed_goal_by_50_percent",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "Perfect Planner",
    description: "Achieve exactly your goal time (within 1 hour)",
    category: AchievementCategory.GOAL_BASED,
    icon: "⏰",
    difficulty: AchievementDifficulty.RARE,
    points: 100,
    requirements: [
      {
        type: "special_condition",
        value: 1,
        unit: "count",
        condition: "exact_goal_achievement",
      },
    ],
    isHidden: false,
    isActive: true,
  },
];