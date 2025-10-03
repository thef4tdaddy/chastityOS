/**
 * useProfileAchievements Hook
 * Handles achievement filtering and display logic for profiles
 */

import { useMemo } from "react";
import { useAchievements } from "../useAchievements";
import {
  AchievementCategory,
  DBUserAchievement,
  DBAchievement,
} from "../../types";
import { getTypeStyles } from "@/utils/achievements/profile";

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
      ? allAchievements.filter((a: DBAchievement) => {
          const userAchievement = visibleAchievements.find(
            (ua: DBUserAchievement) => ua.achievementId === a.id,
          );
          return userAchievement !== undefined;
        })
      : visibleAchievements;

    return (achievementsToShow as DBUserAchievement[])
      .map((userAchievement: DBUserAchievement) => {
        const achievement = allAchievements.find(
          (a: DBAchievement) => a.id === userAchievement.achievementId,
        );
        return achievement
          ? {
              id: achievement.id,
              name: achievement.name,
              description: achievement.description,
              earnedDate: userAchievement.earnedAt.toDate(),
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
        (a: DBUserAchievement, b: DBUserAchievement) =>
          b.earnedAt.toDate().getTime() - a.earnedAt.toDate().getTime(),
      )
      .slice(0, 5)
      .map((userAchievement: DBUserAchievement) => {
        const achievement = allAchievements.find(
          (a: DBAchievement) => a.id === userAchievement.achievementId,
        );
        return achievement
          ? {
              id: achievement.id,
              title: achievement.name,
              date: userAchievement.earnedAt.toDate(),
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
