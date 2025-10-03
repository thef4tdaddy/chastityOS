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

  // Calculate stats
  const stats = useMemo(() => {
    const totalEarned = achievementsWithProgress.filter(
      (a) => a.isEarned,
    ).length;
    const totalVisible = achievementsWithProgress.filter(
      (a) => !a.achievement.isHidden,
    ).length;
    const totalPoints = achievementsWithProgress
      .filter((a) => a.isEarned)
      .reduce((sum, a) => sum + a.achievement.points, 0);

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

      // Hide hidden achievements if not earned
      if (achievement.isHidden && !isEarned) {
        return false;
      }

      return true;
    });
  }, [
    achievementsWithProgress,
    selectedCategory,
    selectedDifficulty,
    showOnlyEarned,
    searchTerm,
  ]);

  // Group by category
  const groupedAchievements = useMemo(() => {
    const groups: Record<string, AchievementWithProgress[]> = {};

    filteredAchievements.forEach((item) => {
      const categoryName = getCategoryName(
        item.achievement.category as AchievementCategory,
      );
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

// Re-export utility functions from achievement gallery utils
export {
  getCategoryName,
  getDifficultyColor,
} from "@/utils/achievements/gallery";
