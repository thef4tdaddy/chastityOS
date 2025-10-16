/**
 * Achievement Gallery Sub-Components
 * Reusable components extracted from AchievementGallery
 */

import React from "react";
import { motion } from "framer-motion";
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
import { Input, Select, SelectOption, Checkbox, Button } from "@/components/ui";
import {
  achievementCardVariants,
  trophyBounceVariants,
  badgeAppearVariants,
  shineVariants,
  getAccessibleVariants,
} from "../../utils/animations";

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

const StatsHeaderComponent: React.FC<StatsHeaderProps> = ({ stats }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-3">
      <h2 className="text-xl sm:text-2xl font-bold text-nightly-honeydew">
        Achievement Gallery
      </h2>
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
        <span className="text-nightly-celadon whitespace-nowrap">
          {stats.totalEarned} / {stats.totalVisible} Earned
        </span>
        <span className="text-nightly-aquamarine font-semibold whitespace-nowrap">
          {stats.totalPoints} Points
        </span>
        <span className="text-nightly-lavender-floral whitespace-nowrap">
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
StatsHeaderComponent.displayName = "StatsHeader";
export const StatsHeader = React.memo(StatsHeaderComponent);

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

const FiltersComponent: React.FC<FiltersProps> = ({
  searchTerm,
  selectedCategory,
  selectedDifficulty,
  showOnlyEarned,
  onSearchChange,
  onCategoryChange,
  onDifficultyChange,
  onEarnedFilterChange,
  getCategoryName,
}) => {
  const categoryOptions: SelectOption[] = [
    { value: "all", label: "All Categories" },
    ...(Object.values(AchievementCategory) as AchievementCategory[]).map(
      (category) => ({
        value: category,
        label: getCategoryName(category),
      }),
    ),
  ];

  const difficultyOptions: SelectOption[] = [
    { value: "all", label: "All Difficulties" },
    ...(Object.values(AchievementDifficulty) as AchievementDifficulty[]).map(
      (difficulty) => ({
        value: difficulty,
        label: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
      }),
    ),
  ];

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center">
        <div className="relative flex-1 min-w-full sm:min-w-[200px]">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search achievements..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nightly-aquamarine"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
          <Select
            value={selectedCategory}
            onChange={(value) =>
              onCategoryChange(value as AchievementCategory | "all")
            }
            options={categoryOptions}
            size="sm"
            fullWidth={false}
          />

          <Select
            value={selectedDifficulty}
            onChange={(value) =>
              onDifficultyChange(value as AchievementDifficulty | "all")
            }
            options={difficultyOptions}
            size="sm"
            fullWidth={false}
          />

          <Checkbox
            checked={showOnlyEarned}
            onChange={onEarnedFilterChange}
            label="Earned Only"
          />
        </div>
      </div>
    </div>
  );
};
FiltersComponent.displayName = "Filters";
export const Filters = React.memo(FiltersComponent);

interface EmptyStateProps {
  message?: string;
}

const EmptyStateComponent: React.FC<EmptyStateProps> = ({
  message = "No achievements found matching your filters.",
}) => (
  <div className="text-center py-12 text-nightly-celadon">
    <FaTrophy className="mx-auto text-4xl mb-4 opacity-50" />
    <p>{message}</p>
  </div>
);
EmptyStateComponent.displayName = "EmptyState";
export const EmptyState = React.memo(EmptyStateComponent);

interface AchievementCardProps {
  item: AchievementWithProgress;
  onToggleVisibility?: (achievementId: string) => void;
  isOwnGallery: boolean;
  getDifficultyColor: (difficulty: AchievementDifficulty) => string;
}

const AchievementCardComponent: React.FC<AchievementCardProps> = ({
  item,
  onToggleVisibility,
  isOwnGallery,
  getDifficultyColor,
}) => {
  const { achievement, progress, isEarned, isVisible } = item;

  const getCardClasses = (): string => {
    const baseClasses =
      "relative p-3 sm:p-4 rounded-lg border-2 touch-manipulation overflow-hidden";

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
    <motion.div
      className={getCardClasses()}
      variants={getAccessibleVariants(achievementCardVariants)}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      layout
    >
      {/* Shine effect for newly earned achievements */}
      {isEarned && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
          variants={getAccessibleVariants(shineVariants)}
          initial="initial"
          animate="animate"
        />
      )}

      <VisibilityToggle
        achievement={achievement}
        isEarned={isEarned}
        isVisible={isVisible}
        isOwnGallery={isOwnGallery}
        onToggleVisibility={onToggleVisibility}
      />

      <div className="flex items-start space-x-2 sm:space-x-3">
        <div className="text-2xl sm:text-3xl flex-shrink-0">
          {achievement.icon}
        </div>
        <div className="flex-1 min-w-0">
          <AchievementInfo achievement={achievement} isEarned={isEarned} />
          <ProgressBar progress={progress} isEarned={isEarned} />
          <HiddenIndicator achievement={achievement} isEarned={isEarned} />
        </div>
      </div>
    </motion.div>
  );
};
AchievementCardComponent.displayName = "AchievementCard";
export const AchievementCard = React.memo(
  AchievementCardComponent,
  (prevProps, nextProps) => {
    // Custom comparison function to optimize re-renders
    return (
      prevProps.item.achievement.id === nextProps.item.achievement.id &&
      prevProps.item.isEarned === nextProps.item.isEarned &&
      prevProps.item.isVisible === nextProps.item.isVisible &&
      prevProps.item.progress?.currentValue ===
        nextProps.item.progress?.currentValue &&
      prevProps.isOwnGallery === nextProps.isOwnGallery
    );
  },
);

interface VisibilityToggleProps {
  achievement: DBAchievement;
  isEarned: boolean;
  isVisible: boolean;
  isOwnGallery: boolean;
  onToggleVisibility?: (achievementId: string) => void;
}

const VisibilityToggleComponent: React.FC<VisibilityToggleProps> = ({
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
      className="absolute top-2 right-2 p-2 sm:p-1 rounded text-gray-400 hover:text-white transition-colors touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
    >
      {isVisible ? <FaEye /> : <FaEyeSlash />}
    </Button>
  );
};
VisibilityToggleComponent.displayName = "VisibilityToggle";
const VisibilityToggle = React.memo(VisibilityToggleComponent);

interface AchievementInfoProps {
  achievement: DBAchievement;
  isEarned: boolean;
}

const AchievementInfoComponent: React.FC<AchievementInfoProps> = ({
  achievement,
  isEarned,
}) => {
  const getTitleClasses = () =>
    `text-sm sm:text-base font-bold truncate ${isEarned ? "text-gray-800" : "text-nightly-honeydew"}`;

  const getDescriptionClasses = () =>
    `text-xs sm:text-sm mt-1 line-clamp-2 ${isEarned ? "text-gray-600" : "text-nightly-celadon"}`;

  const getBadgeClasses = (type: "points" | "difficulty") => {
    const baseClasses =
      "text-xs px-2 py-1 rounded font-semibold whitespace-nowrap";
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

      <div className="flex items-center justify-between mt-2 sm:mt-3 gap-2">
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <motion.span
            className={getBadgeClasses("points")}
            variants={getAccessibleVariants(badgeAppearVariants)}
            initial="initial"
            animate="animate"
          >
            {achievement.points} pts
          </motion.span>
          <motion.span
            className={getBadgeClasses("difficulty")}
            variants={getAccessibleVariants(badgeAppearVariants)}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1 }}
          >
            {achievement.difficulty}
          </motion.span>
        </div>

        {isEarned && (
          <motion.div
            variants={getAccessibleVariants(trophyBounceVariants)}
            initial="initial"
            animate="animate"
          >
            <FaTrophy
              className="text-yellow-600 flex-shrink-0 text-sm sm:text-base"
              title="Achievement Earned!"
            />
          </motion.div>
        )}
      </div>
    </>
  );
};
AchievementInfoComponent.displayName = "AchievementInfo";
const AchievementInfo = React.memo(AchievementInfoComponent);

interface ProgressBarProps {
  progress: AchievementWithProgress["progress"];
  isEarned: boolean;
}

const ProgressBarComponent: React.FC<ProgressBarProps> = ({
  progress,
  isEarned,
}) => {
  if (!progress || isEarned) {
    return null;
  }

  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-nightly-celadon mb-1">
        <span>Progress</span>
        <motion.span
          key={progress.currentValue}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {progress.currentValue} / {progress.targetValue}
        </motion.span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          className="bg-gradient-to-r from-nightly-aquamarine to-nightly-lavender-floral h-2 rounded-full"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: Math.min(progress.percentage, 100) / 100 }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
          }}
          style={{ originX: 0 }}
        />
      </div>
    </div>
  );
};
ProgressBarComponent.displayName = "ProgressBar";
const ProgressBar = React.memo(ProgressBarComponent);

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
