/**
 * Achievement Gallery Component
 * Displays all achievements with progress and earned status
 */

import React from "react";
import { DBAchievement, DBUserAchievement } from "../../types";
import {
  useAchievementGallery,
  getCategoryName,
  getDifficultyColor,
} from "../../hooks/useAchievementGallery";
import {
  StatsHeader,
  Filters,
  EmptyState,
  AchievementCard,
} from "./AchievementGallerySubComponents";

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

export const AchievementGallery: React.FC<AchievementGalleryProps> = ({
  achievementsWithProgress,
  onToggleVisibility,
  isOwnGallery = false,
}) => {
  const {
    selectedCategory,
    selectedDifficulty,
    showOnlyEarned,
    searchTerm,
    setSelectedCategory,
    setSelectedDifficulty,
    setShowOnlyEarned,
    setSearchTerm,
    stats,
    filteredAchievements,
    groupedAchievements,
  } = useAchievementGallery(achievementsWithProgress);

  return (
    <div className="space-y-6">
      <StatsHeader stats={stats} />

      <Filters
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        selectedDifficulty={selectedDifficulty}
        showOnlyEarned={showOnlyEarned}
        onSearchChange={setSearchTerm}
        onCategoryChange={setSelectedCategory}
        onDifficultyChange={setSelectedDifficulty}
        onEarnedFilterChange={setShowOnlyEarned}
        getCategoryName={getCategoryName}
      />
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
                    getDifficultyColor={getDifficultyColor}
                  />
                ))}
              </div>
            </div>
          ),
        )}
      </div>

      {filteredAchievements.length === 0 && <EmptyState />}
    </div>
  );
};

export default AchievementGallery;
