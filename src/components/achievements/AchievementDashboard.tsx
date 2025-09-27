/**
 * Achievement Dashboard Component
 * Overview of user's achievement progress and recent unlocks
 */

import React from "react";
import { Link } from "react-router-dom";
import {
  FaTrophy,
  FaFire,
  FaBullseye,
  FaClock,
  FaStar,
  FaArrowRight,
} from "../../utils/iconImport";
import { useAchievements } from "../../hooks/useAchievements";
import { useAuthState } from "../../contexts";
import { AchievementCategory, UserAchievement, Achievement } from "../../types";

export const AchievementDashboard: React.FC = () => {
  const { user } = useAuthState();
  const {
    achievementStats,
    userAchievements,
    unreadNotifications,
    allAchievements,
    getAchievementsByCategory,
    isLoading,
  } = useAchievements(user?.uid);

  if (isLoading || !achievementStats) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const recentAchievements = userAchievements
    .sort(
      (a: UserAchievement, b: UserAchievement) =>
        b.earnedAt.getTime() - a.earnedAt.getTime(),
    )
    .slice(0, 3);

  const categories: AchievementCategory[] = [
    AchievementCategory.SESSION_MILESTONES,
    AchievementCategory.CONSISTENCY_BADGES,
    AchievementCategory.STREAK_ACHIEVEMENTS,
    AchievementCategory.GOAL_BASED,
    AchievementCategory.TASK_COMPLETION,
    AchievementCategory.SPECIAL_ACHIEVEMENTS,
  ];

  const categoryProgress = categories.map((category) => {
    const categoryAchievements = getAchievementsByCategory(category);
    const earned = achievementStats.categoryCounts[category] || 0;
    const total = categoryAchievements.length;
    const percentage = total > 0 ? (earned / total) * 100 : 0;

    return {
      category,
      earned,
      total,
      percentage,
      name: getCategoryDisplayName(category),
      icon: getCategoryIcon(category),
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FaTrophy className="text-2xl text-nightly-lavender-floral" />
          <h2 className="text-2xl font-bold text-nightly-honeydew">
            Achievements
          </h2>
        </div>
        <Link
          to="/achievements"
          className="flex items-center space-x-2 text-nightly-aquamarine hover:text-nightly-lavender-floral transition-colors"
        >
          <span>View All</span>
          <FaArrowRight />
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-nightly-aquamarine/20 to-nightly-aquamarine/10 rounded-lg p-4 border border-nightly-aquamarine/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-nightly-celadon">Total Earned</p>
              <p className="text-2xl font-bold text-nightly-honeydew">
                {achievementStats.totalEarned}
              </p>
            </div>
            <FaTrophy className="text-2xl text-nightly-aquamarine" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-nightly-lavender-floral/20 to-nightly-lavender-floral/10 rounded-lg p-4 border border-nightly-lavender-floral/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-nightly-celadon">Total Points</p>
              <p className="text-2xl font-bold text-nightly-honeydew">
                {achievementStats.totalPoints}
              </p>
            </div>
            <FaStar className="text-2xl text-nightly-lavender-floral" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-nightly-spring-green/20 to-nightly-spring-green/10 rounded-lg p-4 border border-nightly-spring-green/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-nightly-celadon">Completion</p>
              <p className="text-2xl font-bold text-nightly-honeydew">
                {achievementStats.completionPercentage.toFixed(0)}%
              </p>
            </div>
            <FaBullseye className="text-2xl text-nightly-spring-green" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500/20 to-red-500/10 rounded-lg p-4 border border-red-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-nightly-celadon">New Unlocks</p>
              <p className="text-2xl font-bold text-nightly-honeydew">
                {unreadNotifications.length}
              </p>
            </div>
            <FaFire className="text-2xl text-red-400" />
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-semibold text-nightly-honeydew mb-4">
            Recent Achievements
          </h3>
          <div className="space-y-3">
            {recentAchievements.map((userAchievement: UserAchievement) => {
              const achievement = allAchievements.find(
                (a: Achievement) => a.id === userAchievement.achievementId,
              );
              if (!achievement) return null;

              return (
                <div
                  key={userAchievement.id}
                  className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg"
                >
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-nightly-honeydew">
                      {achievement.name}
                    </h4>
                    <p className="text-sm text-nightly-celadon">
                      {achievement.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                        +{achievement.points} points
                      </span>
                      <span className="text-xs text-nightly-celadon">
                        {formatDate(userAchievement.earnedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Progress */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <h3 className="text-lg font-semibold text-nightly-honeydew mb-4">
          Progress by Category
        </h3>
        <div className="space-y-4">
          {categoryProgress.map((category) => (
            <div key={category.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {category.icon}
                  <span className="text-nightly-celadon">{category.name}</span>
                </div>
                <span className="text-sm text-nightly-celadon">
                  {category.earned} / {category.total}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-nightly-aquamarine to-nightly-lavender-floral h-2 rounded-full transition-all duration-300"
                  style={{ width: `${category.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function getCategoryDisplayName(category: AchievementCategory): string {
  switch (category) {
    case "session_milestones":
      return "Session Milestones";
    case "consistency_badges":
      return "Consistency";
    case "streak_achievements":
      return "Streaks";
    case "goal_based":
      return "Goals";
    case "task_completion":
      return "Tasks";
    case "special_achievements":
      return "Special";
    default:
      return "Unknown";
  }
}

function getCategoryIcon(category: AchievementCategory) {
  switch (category) {
    case "session_milestones":
      return <FaClock className="text-nightly-aquamarine" />;
    case "consistency_badges":
      return <FaBullseye className="text-nightly-lavender-floral" />;
    case "streak_achievements":
      return <FaFire className="text-red-400" />;
    case "goal_based":
      return <FaTrophy className="text-yellow-400" />;
    case "task_completion":
      return <FaStar className="text-green-400" />;
    case "special_achievements":
      return <FaStar className="text-purple-400" />;
    default:
      return <FaTrophy className="text-gray-400" />;
  }
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return "Today";
  } else if (diffInDays === 1) {
    return "Yesterday";
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export default AchievementDashboard;
