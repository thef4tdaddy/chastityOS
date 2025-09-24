/**
 * Predefined Achievements
 * All achievements specified in the requirements
 */

import {
  DBAchievement,
  AchievementCategory,
  AchievementDifficulty,
} from "../types";

export const PREDEFINED_ACHIEVEMENTS: Omit<
  DBAchievement,
  "id" | "syncStatus" | "lastModified" | "userId"
>[] = [
  // ==================== SESSION MILESTONES ====================
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

  // ==================== CONSISTENCY BADGES ====================
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

  // ==================== STREAK ACHIEVEMENTS ====================
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

  // ==================== GOAL-BASED ACHIEVEMENTS ====================
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

  // ==================== TASK COMPLETION ====================
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

  // ==================== SPECIAL ACHIEVEMENTS ====================
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

  // ==================== HIDDEN ACHIEVEMENTS ====================
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

// Helper function to generate achievement IDs
export const generateAchievementId = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
};

// Generate achievements with IDs
export const ACHIEVEMENTS_WITH_IDS = PREDEFINED_ACHIEVEMENTS.map(
  (achievement) => ({
    ...achievement,
    id: generateAchievementId(achievement.name),
  }),
);
