import { AchievementCategory, AchievementDifficulty } from "../../types";

/**
 * Achievement Gallery Utilities
 * Helper functions for achievement display and formatting
 */

// Helper function to get category display name
export const getCategoryName = (category: AchievementCategory): string => {
  switch (category) {
    case AchievementCategory.SESSION_MILESTONES:
      return "Session Milestones";
    case AchievementCategory.CONSISTENCY_BADGES:
      return "Consistency";
    case AchievementCategory.STREAK_ACHIEVEMENTS:
      return "Streaks";
    case AchievementCategory.GOAL_BASED:
      return "Goals";
    case AchievementCategory.TASK_COMPLETION:
      return "Tasks";
    case AchievementCategory.SPECIAL_ACHIEVEMENTS:
      return "Special";
    default:
      return "Unknown";
  }
};

// Helper function to get difficulty color styling
export const getDifficultyColor = (
  difficulty: AchievementDifficulty,
): string => {
  switch (difficulty) {
    case AchievementDifficulty.COMMON:
      return "border-gray-400 bg-gray-50";
    case AchievementDifficulty.UNCOMMON:
      return "border-green-400 bg-green-50";
    case AchievementDifficulty.RARE:
      return "border-blue-400 bg-blue-50";
    case AchievementDifficulty.EPIC:
      return "border-purple-400 bg-purple-50";
    case AchievementDifficulty.LEGENDARY:
      return "border-yellow-400 bg-yellow-50";
    default:
      return "border-gray-400 bg-gray-50";
  }
};
