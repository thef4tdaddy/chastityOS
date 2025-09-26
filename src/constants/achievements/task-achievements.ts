/**
 * Task Completion Achievements
 * Achievements related to completing tasks and keyholder interactions
 */

import {
  DBAchievement,
  AchievementCategory,
  AchievementDifficulty,
} from "../../types";

export const TASK_ACHIEVEMENTS: Omit<
  DBAchievement,
  "id" | "syncStatus" | "lastModified"
>[] = [
  {
    name: "Task Tackler",
    description: "Complete your first task",
    category: AchievementCategory.TASK_COMPLETION,
    icon: "✅",
    difficulty: AchievementDifficulty.COMMON,
    points: 20,
    requirements: [
      {
        type: "task_completion",
        value: 1,
        unit: "count",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "Productive",
    description: "Complete 10 tasks",
    category: AchievementCategory.TASK_COMPLETION,
    icon: "📋",
    difficulty: AchievementDifficulty.COMMON,
    points: 100,
    requirements: [
      {
        type: "task_completion",
        value: 10,
        unit: "count",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "Task Master",
    description: "Complete 50 tasks",
    category: AchievementCategory.TASK_COMPLETION,
    icon: "🏆",
    difficulty: AchievementDifficulty.RARE,
    points: 250,
    requirements: [
      {
        type: "task_completion",
        value: 50,
        unit: "count",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "Keyholder's Favorite",
    description: "Achieve 95%+ task approval rate",
    category: AchievementCategory.TASK_COMPLETION,
    icon: "⭐",
    difficulty: AchievementDifficulty.EPIC,
    points: 300,
    requirements: [
      {
        type: "special_condition",
        value: 95,
        unit: "count",
        condition: "task_approval_rate",
      },
    ],
    isHidden: false,
    isActive: true,
  },
  {
    name: "Punctual",
    description: "Complete 20 tasks before deadline",
    category: AchievementCategory.TASK_COMPLETION,
    icon: "⏱️",
    difficulty: AchievementDifficulty.UNCOMMON,
    points: 150,
    requirements: [
      {
        type: "special_condition",
        value: 20,
        unit: "count",
        condition: "tasks_completed_early",
      },
    ],
    isHidden: false,
    isActive: true,
  },
];