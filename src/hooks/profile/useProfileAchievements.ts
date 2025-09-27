/**
 * useProfileAchievements Hook
 * Handles achievement filtering and display logic for profiles
 */

import { useMemo } from "react";
import { useAchievements } from "../useAchievements";
import { AchievementCategory, UserAchievement, Achievement } from "../../types";

// Helper function for achievement type mapping
const getAchievementType = (
  category: AchievementCategory,
): "milestone" | "streak" | "goal" => {
  switch (category) {
    case AchievementCategory.SESSION_MILESTONES:
    case AchievementCategory.CONSISTENCY_BADGES:
      return "milestone";
    case AchievementCategory.STREAK_ACHIEVEMENTS:
      return "streak";
    case AchievementCategory.GOAL_BASED:
    case AchievementCategory.TASK_COMPLETION:
      return "goal";
    default:
      return "milestone";
  }
};

export const getTypeStyles = (type: string): string => {
  switch (type) {
    case "milestone":
      return "bg-nightly-aquamarine/20 text-nightly-aquamarine";
    case "streak":
      return "bg-red-400/20 text-red-400";
    case "goal":
      return "bg-nightly-lavender-floral/20 text-nightly-lavender-floral";
    default:
      return "bg-gray-400/20 text-gray-400";
  }
};

export interface ProfileBadge {
  id: string;
  name: string;
  description: string;
  earnedDate: Date;
  icon: string;
}

export interface ProfileAchievement {
  id: string;
  title: string;
  date: Date;
  type: "milestone" | "streak" | "goal";
  icon: string;
}

export const useProfileAchievements = (
  userId: string,
  isOwnProfile: boolean,
) => {
  const { visibleAchievements, allAchievements, isLoading } =
    useAchievements(userId);

  // Process badges
  const badges: ProfileBadge[] = useMemo(() => {
    const achievementsToShow = isOwnProfile
      ? allAchievements.filter((a: Achievement) => {
          const userAchievement = visibleAchievements.find(
            (ua: UserAchievement) => ua.achievementId === a.id,
          );
          return userAchievement !== undefined;
        })
      : visibleAchievements;

    return achievementsToShow
      .map((userAchievement: UserAchievement) => {
        const achievement = allAchievements.find(
          (a: Achievement) => a.id === userAchievement.achievementId,
        );
        return achievement
          ? {
              id: achievement.id,
              name: achievement.name,
              description: achievement.description,
              earnedDate: userAchievement.earnedAt,
              icon: achievement.icon,
            }
          : null;
      })
      .filter(
        (item: ProfileBadge | null): item is ProfileBadge => item !== null,
      );
  }, [visibleAchievements, allAchievements, isOwnProfile]);

  // Process recent achievements
  const recentAchievements: ProfileAchievement[] = useMemo(() => {
    return visibleAchievements
      .sort(
        (a: UserAchievement, b: UserAchievement) =>
          b.earnedAt.getTime() - a.earnedAt.getTime(),
      )
      .slice(0, 5)
      .map((userAchievement: UserAchievement) => {
        const achievement = allAchievements.find(
          (a: Achievement) => a.id === userAchievement.achievementId,
        );
        return achievement
          ? {
              id: achievement.id,
              title: achievement.name,
              date: userAchievement.earnedAt,
              type: getAchievementType(achievement.category),
              icon: achievement.icon,
            }
          : null;
      })
      .filter(
        (item: ProfileAchievement | null): item is ProfileAchievement =>
          item !== null,
      );
  }, [visibleAchievements, allAchievements]);

  return {
    badges,
    recentAchievements,
    isLoading,
    getTypeStyles,
  };
};
