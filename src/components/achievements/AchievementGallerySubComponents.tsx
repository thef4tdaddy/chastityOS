/**
 * Achievement Gallery Sub-Components
 * Reusable components extracted from AchievementGallery
 */

import React from "react";
import {
  FaTrophy,
  FaLock,
  FaEyeSlash,
  FaEye,
  FaSearch,
} from "../../utils/iconImport";
import {
  DBAchievement,
  AchievementCategory,
  DBUserAchievement,
} from "../../types";
import { AchievementDifficulty } from "../../types/achievements";
import { Button, Checkbox, Input } from "@/components/ui";

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

interface StatsHeaderProps {
  stats: {
    totalEarned: number;
    totalVisible: number;
    totalPoints: number;
    completionPercentage: number;
  };
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({ stats }) => (
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

    <div className="w-full bg-gray-700 rounded-full h-2">
      <div
        className="bg-gradient-to-r from-nightly-aquamarine to-nightly-lavender-floral h-2 rounded-full transition-all duration-300"
        style={{ width: `${stats.completionPercentage}%` }}
      />
    </div>
  </div>
);

interface FiltersProps {
  searchTerm: string;
  selectedCategory: AchievementCategory | "all";
  selectedDifficulty: AchievementDifficulty | "all";
  showOnlyEarned: boolean;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: AchievementCategory | "all") => void;
  onDifficultyChange: (value: AchievementDifficulty | "all") => void;
  onEarnedFilterChange: (value: boolean) => void;
  getCategoryName: (category: AchievementCategory) => string;
}

export const Filters: React.FC<FiltersProps> = ({
  searchTerm,
  selectedCategory,
  selectedDifficulty,
  showOnlyEarned,
  onSearchChange,
  onCategoryChange,
  onDifficultyChange,
  onEarnedFilterChange,
  getCategoryName,
}) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
    <div className="flex flex-wrap gap-4 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Search achievements..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nightly-aquamarine"
        />
      </div>

      <Select
        value={selectedCategory}
        onChange={(e) =>
          onCategoryChange(e.target.value as AchievementCategory | "all")
        }
        className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-nightly-aquamarine"
      >
        <option value="all">All Categories</option>
        {(Object.values(AchievementCategory) as AchievementCategory[]).map(
          (category) => (
            <option key={category} value={category}>
              {getCategoryName(category)}
            </option>
          ),
        )}
      </Select>

      <Select
        value={selectedDifficulty}
        onChange={(e) =>
          onDifficultyChange(e.target.value as AchievementDifficulty | "all")
        }
        className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-nightly-aquamarine"
      >
        <option value="all">All Difficulties</option>
        {(Object.values(AchievementDifficulty) as AchievementDifficulty[]).map(
          (difficulty) => (
            <option key={difficulty} value={difficulty}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </option>
          ),
        )}
      </Select>

      <Checkbox
        checked={showOnlyEarned}
        onChange={onEarnedFilterChange}
        label="Earned Only"
      />
    </div>
  </div>
);

interface EmptyStateProps {
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = "No achievements found matching your filters.",
}) => (
  <div className="text-center py-12 text-nightly-celadon">
    <FaTrophy className="mx-auto text-4xl mb-4 opacity-50" />
    <p>{message}</p>
  </div>
);

interface AchievementCardProps {
  item: AchievementWithProgress;
  onToggleVisibility?: (achievementId: string) => void;
  isOwnGallery: boolean;
  getDifficultyColor: (difficulty: AchievementDifficulty) => string;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  item,
  onToggleVisibility,
  isOwnGallery,
  getDifficultyColor,
}) => {
  const { achievement, progress, isEarned, isVisible } = item;

  const getCardClasses = (): string => {
    const baseClasses =
      "relative p-4 rounded-lg border-2 transition-all duration-200";

    // Map string difficulty to enum for getDifficultyColor
    const difficultyMap: Record<string, AchievementDifficulty> = {
      common: AchievementDifficulty.COMMON,
      uncommon: AchievementDifficulty.UNCOMMON,
      rare: AchievementDifficulty.RARE,
      epic: AchievementDifficulty.EPIC,
      legendary: AchievementDifficulty.LEGENDARY,
    };

    const earnedClasses = isEarned
      ? `${getDifficultyColor(difficultyMap[achievement.difficulty] || AchievementDifficulty.COMMON)} shadow-lg`
      : "border-gray-600 bg-gray-800/50";
    const opacityClass = !isEarned ? "opacity-75" : "";
    return `${baseClasses} ${earnedClasses} ${opacityClass}`;
  };

  return (
    <div className={getCardClasses()}>
      <VisibilityToggle
        achievement={achievement}
        isEarned={isEarned}
        isVisible={isVisible}
        isOwnGallery={isOwnGallery}
        onToggleVisibility={onToggleVisibility}
      />

      <div className="flex items-start space-x-3">
        <div className="text-3xl">{achievement.icon}</div>
        <div className="flex-1">
          <AchievementInfo achievement={achievement} isEarned={isEarned} />
          <ProgressBar progress={progress} isEarned={isEarned} />
          <HiddenIndicator achievement={achievement} isEarned={isEarned} />
        </div>
      </div>
    </div>
  );
};

interface VisibilityToggleProps {
  achievement: DBAchievement;
  isEarned: boolean;
  isVisible: boolean;
  isOwnGallery: boolean;
  onToggleVisibility?: (achievementId: string) => void;
}

const VisibilityToggle: React.FC<VisibilityToggleProps> = ({
  achievement,
  isEarned,
  isVisible,
  isOwnGallery,
  onToggleVisibility,
}) => {
  if (!isOwnGallery || !isEarned || !onToggleVisibility) {
    return null;
  }

  return (
    <Button
      onClick={() => onToggleVisibility(achievement.id)}
      className="absolute top-2 right-2 p-1 rounded text-gray-400 hover:text-white transition-colors"
    >
      {isVisible ? <FaEye /> : <FaEyeSlash />}
    </Button>
  );
};

interface AchievementInfoProps {
  achievement: DBAchievement;
  isEarned: boolean;
}

const AchievementInfo: React.FC<AchievementInfoProps> = ({
  achievement,
  isEarned,
}) => {
  const getTitleClasses = () =>
    `font-bold ${isEarned ? "text-gray-800" : "text-nightly-honeydew"}`;

  const getDescriptionClasses = () =>
    `text-sm mt-1 ${isEarned ? "text-gray-600" : "text-nightly-celadon"}`;

  const getBadgeClasses = (type: "points" | "difficulty") => {
    const baseClasses = "text-xs px-2 py-1 rounded font-semibold";
    const colorClasses = isEarned
      ? type === "points"
        ? "bg-yellow-200 text-yellow-800"
        : "bg-blue-200 text-blue-800"
      : "bg-gray-700 text-gray-300";
    const extraClasses = type === "difficulty" ? "capitalize" : "";
    return `${baseClasses} ${colorClasses} ${extraClasses}`;
  };

  return (
    <>
      <h4 className={getTitleClasses()}>{achievement.name}</h4>
      <p className={getDescriptionClasses()}>{achievement.description}</p>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center space-x-2">
          <span className={getBadgeClasses("points")}>
            {achievement.points} pts
          </span>
          <span className={getBadgeClasses("difficulty")}>
            {achievement.difficulty}
          </span>
        </div>

        {isEarned && (
          <FaTrophy className="text-yellow-600" title="Achievement Earned!" />
        )}
      </div>
    </>
  );
};

interface ProgressBarProps {
  progress: AchievementWithProgress["progress"];
  isEarned: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, isEarned }) => {
  if (!progress || isEarned) {
    return null;
  }

  return (
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
  );
};

interface HiddenIndicatorProps {
  achievement: DBAchievement;
  isEarned: boolean;
}

const HiddenIndicator: React.FC<HiddenIndicatorProps> = ({
  achievement,
  isEarned,
}) => {
  if (!achievement.isHidden || isEarned) {
    return null;
  }

  return (
    <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500">
      <FaLock />
      <span>Hidden Achievement</span>
    </div>
  );
};
