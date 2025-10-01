/**
 * Session Goals Templates
 * Pre-defined goal templates for common objectives
 */

import type { GoalTemplate } from "./types/SessionGoals";

/**
 * Default goal templates available to users
 */
export const DEFAULT_GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: "duration_24h",
    name: "24 Hour Challenge",
    description: "Complete a full 24-hour session without breaks",
    category: "session_length",
    defaultTarget: {
      value: 24,
      unit: "hours",
      comparison: "minimum",
    },
    difficulty: "intermediate",
    estimatedDuration: 1440,
    tags: ["endurance", "milestone"],
    isPopular: true,
  },
  {
    id: "consistency_7day",
    name: "7-Day Consistency",
    description: "Complete daily sessions for 7 consecutive days",
    category: "daily_goals",
    defaultTarget: {
      value: 7,
      unit: "days",
      comparison: "exact",
    },
    difficulty: "beginner",
    estimatedDuration: 10080,
    tags: ["consistency", "habit"],
    isPopular: true,
  },
];
