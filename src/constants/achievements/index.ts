/**
 * Achievements Index
 * Re-exports all achievement categories and provides consolidated collections
 */

import { MILESTONE_ACHIEVEMENTS } from "./milestone-achievements";
import { CONSISTENCY_ACHIEVEMENTS } from "./consistency-achievements";
import { STREAK_ACHIEVEMENTS } from "./streak-achievements";
import { GOAL_ACHIEVEMENTS } from "./goal-achievements";
import { TASK_ACHIEVEMENTS } from "./task-achievements";
import { SPECIAL_ACHIEVEMENTS } from "./special-achievements";

// Re-export individual achievement collections
export { MILESTONE_ACHIEVEMENTS } from "./milestone-achievements";
export { CONSISTENCY_ACHIEVEMENTS } from "./consistency-achievements";
export { STREAK_ACHIEVEMENTS } from "./streak-achievements";
export { GOAL_ACHIEVEMENTS } from "./goal-achievements";
export { TASK_ACHIEVEMENTS } from "./task-achievements";
export { SPECIAL_ACHIEVEMENTS } from "./special-achievements";

// Consolidated collection of all predefined achievements
export const PREDEFINED_ACHIEVEMENTS = [
  ...MILESTONE_ACHIEVEMENTS,
  ...CONSISTENCY_ACHIEVEMENTS,
  ...STREAK_ACHIEVEMENTS,
  ...GOAL_ACHIEVEMENTS,
  ...TASK_ACHIEVEMENTS,
  ...SPECIAL_ACHIEVEMENTS,
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