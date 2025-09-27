/**
 * Custom hook for Achievement Gallery state and logic
 */

import { useState, useMemo } from "react";
import {
  DBAchievement,
  DBUserAchievement,
  AchievementCategory,
  AchievementDifficulty,
} from "../types";

interface AchievementWithProgress {
  achievement: DBAchievement;
  userAchievement?: DBUserAchievement;
  progress: {
    currentValue: number;
    targetValue: number;
    percentage: number;
    isCompleted: boolean;
  } | null;
  isEarned: boolean;
  isVisible: boolean;
}

export const useAchievementGallery = (achievementsWithProgress: AchievementWithProgress[]) => {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | "all">("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<AchievementDifficulty | "all">("all");
  const [showOnlyEarned, setShowOnlyEarned] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Calculate stats
  const stats = useMemo(() => {
    const totalEarned = achievementsWithProgress.filter((a) => a.isEarned).length;
    const totalVisible = achievementsWithProgress.filter((a) => !a.achievement.isHidden).length;
    const totalPoints = achievementsWithProgress
      .filter((a) => a.isEarned)
      .reduce((sum, a) => sum + a.achievement.points, 0);

    return {
      totalEarned,
      totalVisible,
      totalPoints,
      completionPercentage: totalVisible > 0 ? (totalEarned / totalVisible) * 100 : 0,
    };
  }, [achievementsWithProgress]);

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    return achievementsWithProgress.filter((item) => {
      const { achievement, isEarned } = item;

      // Category filter
      if (selectedCategory !== "all" && achievement.category !== selectedCategory) {
        return false;
      }

      // Difficulty filter
      if (selectedDifficulty !== "all" && achievement.difficulty !== selectedDifficulty) {
        return false;
      }

      // Earned filter
      if (showOnlyEarned && !isEarned) {
        return false;
      }

      // Search filter
      if (
        searchTerm &&
        !achievement.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !achievement.description.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Hide hidden achievements if not earned
      if (achievement.isHidden && !isEarned) {
        return false;
      }

      return true;
    });
  }, [achievementsWithProgress, selectedCategory, selectedDifficulty, showOnlyEarned, searchTerm]);

  // Group by category
  const groupedAchievements = useMemo(() => {
    const groups: Record<string, AchievementWithProgress[]> = {};

    filteredAchievements.forEach((item) => {
      const categoryName = getCategoryName(item.achievement.category);
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(item);
    });

    return groups;
  }, [filteredAchievements]);

  return {
    // State
    selectedCategory,
    selectedDifficulty,
    showOnlyEarned,
    searchTerm,
    
    // Setters
    setSelectedCategory,
    setSelectedDifficulty,
    setShowOnlyEarned,
    setSearchTerm,
    
    // Computed values
    stats,
    filteredAchievements,
    groupedAchievements,
  };
};

// Helper function to get category display name
export const getCategoryName = (category: AchievementCategory): string => {
  switch (category) {
    case AchievementCategory.CHASTITY:
      return "Chastity";
    case AchievementCategory.TASKS:
      return "Tasks";
    case AchievementCategory.SOCIAL:
      return "Social";
    case AchievementCategory.MILESTONES:
      return "Milestones";
    case AchievementCategory.SPECIAL:
      return "Special";
    default:
      return "Unknown";
  }
};

// Helper function to get difficulty color styling
export const getDifficultyColor = (difficulty: AchievementDifficulty): string => {
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