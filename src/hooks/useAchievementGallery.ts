/**
 * Custom hook for Achievement Gallery state and logic
 */

import { useState, useMemo } from "react";
import {
  DBAchievement,
  DBUserAchievement,
  AchievementDifficulty,
} from "../types";
import { AchievementCategory } from "../types/achievements";
import { getCategoryName } from "@/utils/achievements/gallery";

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

export const useAchievementGallery = (
  achievementsWithProgress: AchievementWithProgress[],
) => {
  const [selectedCategory, setSelectedCategory] = useState<
    AchievementCategory | "all"
  >("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    AchievementDifficulty | "all"
  >("all");
  const [showOnlyEarned, setShowOnlyEarned] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Calculate stats - optimized with single pass
  const stats = useMemo(() => {
    let totalEarned = 0;
    let totalPoints = 0;

    for (const achievement of achievementsWithProgress) {
      if (achievement.isEarned) {
        totalEarned++;
        totalPoints += achievement.achievement.points;
      }
    }

    const totalVisible = achievementsWithProgress.length;

    return {
      totalEarned,
      totalVisible,
      totalPoints,
      completionPercentage:
        totalVisible > 0 ? (totalEarned / totalVisible) * 100 : 0,
    };
  }, [achievementsWithProgress]);

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    return achievementsWithProgress.filter((item) => {
      const { achievement, isEarned } = item;

      // Category filter
      if (
        selectedCategory !== "all" &&
        achievement.category !== selectedCategory
      ) {
        return false;
      }

      // Difficulty filter
      if (
        selectedDifficulty !== "all" &&
        achievement.difficulty !== selectedDifficulty
      ) {
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
        !achievement.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Show all achievements, including locked/hidden ones
      // Hidden achievements will display with a lock icon when not earned
      return true;
    });
  }, [
    achievementsWithProgress,
    selectedCategory,
    selectedDifficulty,
    showOnlyEarned,
    searchTerm,
  ]);

  // Group by category - optimized with Map for better performance
  const groupedAchievements = useMemo(() => {
    const groups: Record<string, AchievementWithProgress[]> = {};

    // Pre-allocate arrays based on category count
    for (const item of filteredAchievements) {
      const categoryName = getCategoryName(
        item.achievement.category as AchievementCategory,
      );
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(item);
    }

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

// Re-export utility functions from achievement gallery utils
export {
  getCategoryName,
  getDifficultyColor,
} from "@/utils/achievements/gallery";
