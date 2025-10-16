/**
 * Achievement Gallery Component
 * Displays all achievements with progress and earned status
 */

import React from "react";
import { motion } from "framer-motion";
import { DBAchievement, DBUserAchievement } from "../../types";
import {
  useAchievementGallery,
  getCategoryName,
  getDifficultyColor,
} from "../../hooks/useAchievementGallery";
import { usePaginatedAchievements } from "../../hooks/usePaginatedAchievements";
import {
  StatsHeader,
  Filters,
  EmptyState,
  AchievementCard,
} from "./AchievementGallerySubComponents";
import { AchievementPagination } from "./AchievementPagination";
import {
  achievementStaggerVariants,
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

  // Flatten grouped achievements for pagination
  const flattenedAchievements = React.useMemo(
    () => Object.values(groupedAchievements).flat(),
    [groupedAchievements],
  );

  const {
    paginatedAchievements,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
  } = usePaginatedAchievements<AchievementWithProgress>(flattenedAchievements, {
    itemsPerPage: 12,
  });

  // Re-group paginated achievements by category
  const paginatedGroupedAchievements = React.useMemo(() => {
    const groups: Record<string, AchievementWithProgress[]> = {};
    paginatedAchievements.forEach((item) => {
      const categoryName = getCategoryName(item.achievement.category);
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(item);
    });
    return groups;
  }, [paginatedAchievements]);

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
      <div className="space-y-4 sm:space-y-6">
        {Object.entries(paginatedGroupedAchievements).map(
          ([categoryName, achievements]) => (
            <div key={categoryName} className="space-y-3 sm:space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold text-nightly-honeydew border-b border-white/20 pb-2">
                {categoryName} ({achievements.length})
              </h3>

              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
                variants={getAccessibleVariants(achievementStaggerVariants)}
                initial="initial"
                animate="animate"
              >
                {achievements.map((item) => (
                  <AchievementCard
                    key={item.achievement.id}
                    item={item}
                    onToggleVisibility={onToggleVisibility}
                    isOwnGallery={isOwnGallery}
                    getDifficultyColor={getDifficultyColor}
                  />
                ))}
              </motion.div>
            </div>
          ),
        )}
      </div>

      {filteredAchievements.length === 0 && <EmptyState />}

      {filteredAchievements.length > 0 && (
        <AchievementPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          onNextPage={nextPage}
          onPrevPage={prevPage}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
        />
      )}
    </div>
  );
};

export default AchievementGallery;
