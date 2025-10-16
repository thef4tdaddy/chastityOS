/**
 * Constants and utilities for useGoals
 * Separated from types to comply with ESLint rules
 */
import {
  GoalTemplate,
  GoalCategory,
  GoalDifficulty,
  GoalType,
} from "../../types/goals";

// Storage keys
export const STORAGE_KEYS = {
  PERSONAL_GOALS: "chastity-goals-personal",
  COLLABORATIVE_GOALS: "chastity-goals-collaborative",
  GOAL_ANALYTICS: "chastity-goals-analytics",
  GOAL_TEMPLATES: "chastity-goals-templates",
};

// Sample templates
export const DEFAULT_TEMPLATES: GoalTemplate[] = [
  {
    id: "chastity-duration-30",
    name: "30-Day Chastity Challenge",
    description: "Complete 30 consecutive days in chastity",
    category: GoalCategory.CHASTITY,
    difficulty: GoalDifficulty.MEDIUM,
    template: {
      type: GoalType.DURATION,
      target: {
        type: "duration",
        value: 30,
        unit: "days",
        description: "30 consecutive days",
      },
      milestones: [
        {
          id: "milestone-1",
          name: "First Week",
          description: "Complete 7 days",
          target: 7,
          achieved: false,
        },
        {
          id: "milestone-2",
          name: "Two Weeks",
          description: "Complete 14 days",
          target: 14,
          achieved: false,
        },
        {
          id: "milestone-3",
          name: "Final Week",
          description: "Complete 30 days",
          target: 30,
          achieved: false,
        },
      ],
    },
    popularity: 85,
    successRate: 68,
  },
  {
    id: "behavior-improvement",
    name: "Behavioral Improvement",
    description: "Reduce unwanted behaviors through positive reinforcement",
    category: GoalCategory.BEHAVIOR,
    difficulty: GoalDifficulty.HARD,
    template: {
      type: GoalType.BEHAVIORAL,
      target: {
        type: "count",
        value: 0,
        unit: "incidents",
        description: "Zero incidents per week",
      },
    },
    popularity: 72,
    successRate: 54,
  },
];
