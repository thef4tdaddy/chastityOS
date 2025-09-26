/**
 * Achievement Gallery Component
 * Displays all achievements with progress and earned status
 */

import React, { useState, useMemo } from "react";
import {
  FaTrophy,
  FaLock,
  FaEyeSlash,
  FaEye,
  FaFilter,
  FaSearch,
} from "../../utils/iconImport";
import {
  DBAchievement,
  DBUserAchievement,
  AchievementCategory,
  AchievementDifficulty,
} from "../../types";

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

interface AchievementGalleryProps {
  achievementsWithProgress: AchievementWithProgress[];
  onToggleVisibility?: (achievementId: string) => void;
  isOwnGallery?: boolean;
}

const getDifficultyColor = (difficulty: AchievementDifficulty): string => {
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

const getCategoryName = (category: AchievementCategory): string => {
  switch (category) {
    case AchievementCategory.SESSION_MILESTONES:
      return "Session Milestones";
    case AchievementCategory.CONSISTENCY_BADGES:
      return "Consistency Badges";
    case AchievementCategory.STREAK_ACHIEVEMENTS:
      return "Streak Achievements";
    case AchievementCategory.GOAL_BASED:
      return "Goal-Based";
    case AchievementCategory.TASK_COMPLETION:
      return "Task Completion";
    case AchievementCategory.SPECIAL_ACHIEVEMENTS:
      return "Special Achievements";
    default:
      return "Unknown";
  }
};

export const AchievementGallery: React.FC<AchievementGalleryProps> = ({
  achievementsWithProgress,
  onToggleVisibility,
  isOwnGallery = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    AchievementCategory | "all"
  >("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    AchievementDifficulty | "all"
  >("all");
  const [showOnlyEarned, setShowOnlyEarned] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
      const categoryName = getCategoryName(item.achievement.category);
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(item);
    });

    return groups;
  }, [filteredAchievements]);

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

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-nightly-honeydew">
            Achievement Gallery
          </h2>
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-nightly-celadon">
              {stats.totalEarned} / {stats.totalVisible} Earned
            </span>
            <span className="text-nightly-aquamarine font-semibold">
              {stats.totalPoints} Points
            </span>
            <span className="text-nightly-lavender-floral">
              {stats.completionPercentage.toFixed(1)}% Complete
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-nightly-aquamarine to-nightly-lavender-floral h-2 rounded-full transition-all duration-300"
            style={{ width: `${stats.completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search achievements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nightly-aquamarine"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(e.target.value as AchievementCategory | "all")
            }
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-nightly-aquamarine"
          >
            <option value="all">All Categories</option>
            {Object.values(AchievementCategory).map((category) => (
              <option key={category} value={category}>
                {getCategoryName(category)}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) =>
              setSelectedDifficulty(
                e.target.value as AchievementDifficulty | "all",
              )
            }
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-nightly-aquamarine"
          >
            <option value="all">All Difficulties</option>
            {Object.values(AchievementDifficulty).map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </option>
            ))}
          </select>

          {/* Earned Filter */}
          <label className="flex items-center space-x-2 text-nightly-celadon">
            <input
              type="checkbox"
              checked={showOnlyEarned}
              onChange={(e) => setShowOnlyEarned(e.target.checked)}
              className="rounded border-white/20 bg-white/10 text-nightly-aquamarine focus:ring-nightly-aquamarine"
            />
            <span>Earned Only</span>
          </label>
        </div>
      </div>

      {/* Achievement Groups */}
      <div className="space-y-6">
        {Object.entries(groupedAchievements).map(
          ([categoryName, achievements]) => (
            <div key={categoryName} className="space-y-4">
              <h3 className="text-xl font-semibold text-nightly-honeydew border-b border-white/20 pb-2">
                {categoryName} ({achievements.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((item) => (
                  <AchievementCard
                    key={item.achievement.id}
                    item={item}
                    onToggleVisibility={onToggleVisibility}
                    isOwnGallery={isOwnGallery}
                  />
                ))}
              </div>
            </div>
          ),
        )}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12 text-nightly-celadon">
          <FaTrophy className="mx-auto text-4xl mb-4 opacity-50" />
          <p>No achievements found matching your filters.</p>
        </div>
      )}
    </div>
  );
};

interface AchievementCardProps {
  item: AchievementWithProgress;
  onToggleVisibility?: (achievementId: string) => void;
  isOwnGallery: boolean;
}

const AchievementCard: React.FC<AchievementCardProps> = ({
  item,
  onToggleVisibility,
  isOwnGallery,
}) => {
  const { achievement, progress, isEarned, isVisible } = item;

  return (
    <div
      className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
        isEarned
          ? `${getDifficultyColor(achievement.difficulty)} shadow-lg`
          : "border-gray-600 bg-gray-800/50"
      } ${!isEarned ? "opacity-75" : ""}`}
    >
      {/* Visibility Toggle */}
      {isOwnGallery && isEarned && onToggleVisibility && (
        <button
          onClick={() => onToggleVisibility(achievement.id)}
          className="absolute top-2 right-2 p-1 rounded text-gray-400 hover:text-white transition-colors"
        >
          {isVisible ? <FaEye /> : <FaEyeSlash />}
        </button>
      )}

      {/* Achievement Icon */}
      <div className="flex items-start space-x-3">
        <div className="text-3xl">{achievement.icon}</div>
        <div className="flex-1">
          {/* Achievement Name */}
          <h4
            className={`font-bold ${isEarned ? "text-gray-800" : "text-nightly-honeydew"}`}
          >
            {achievement.name}
          </h4>

          {/* Achievement Description */}
          <p
            className={`text-sm mt-1 ${isEarned ? "text-gray-600" : "text-nightly-celadon"}`}
          >
            {achievement.description}
          </p>

          {/* Points and Difficulty */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-2">
              <span
                className={`text-xs px-2 py-1 rounded font-semibold ${
                  isEarned
                    ? "bg-yellow-200 text-yellow-800"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                {achievement.points} pts
              </span>
              <span
                className={`text-xs px-2 py-1 rounded capitalize ${
                  isEarned
                    ? "bg-blue-200 text-blue-800"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                {achievement.difficulty}
              </span>
            </div>

            {isEarned && (
              <FaTrophy
                className="text-yellow-600"
                title="Achievement Earned!"
              />
            )}
          </div>

          {/* Progress Bar */}
          {progress && !isEarned && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-nightly-celadon mb-1">
                <span>Progress</span>
                <span>
                  {progress.currentValue} / {progress.targetValue}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-nightly-aquamarine to-nightly-lavender-floral h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Hidden Achievement Indicator */}
          {achievement.isHidden && !isEarned && (
            <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500">
              <FaLock />
              <span>Hidden Achievement</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementGallery;
