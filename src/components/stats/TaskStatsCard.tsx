/**
 * Task Stats Card Component
 * Displays user's task completion statistics and points
 */
import React from "react";
import { useUserStats } from "@/hooks/api/useUserStats";

interface TaskStatsCardProps {
  userId: string;
}

export const TaskStatsCard: React.FC<TaskStatsCardProps> = ({ userId }) => {
  const { data: stats, isLoading, error } = useUserStats(userId);

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-900/50 border-2 border-primary rounded-2xl shadow-lg">
        <h3 className="text-xl font-bold text-primary mb-4">Task Stats</h3>
        <p className="text-gray-400">Loading stats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-gray-900/50 border-2 border-red-500 rounded-2xl shadow-lg">
        <h3 className="text-xl font-bold text-red-400 mb-4">Task Stats</h3>
        <p className="text-red-400">Error loading stats</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const calculateApprovalRate = () => {
    const totalReviewed = stats.tasksApproved + stats.tasksRejected;
    if (totalReviewed === 0) return 0;
    return Math.round((stats.tasksApproved / totalReviewed) * 100);
  };

  return (
    <div className="p-3 sm:p-4 bg-gray-900/50 border-2 border-primary rounded-2xl shadow-lg shadow-primary/20">
      <h3 className="text-lg sm:text-xl font-bold text-primary mb-3 sm:mb-4">
        📊 Task Stats
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {/* Total Points */}
        <div className="flex justify-between items-center p-2 sm:p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <span className="text-gray-300 font-medium text-sm sm:text-base">
            Total Points
          </span>
          <span className="text-xl sm:text-2xl font-bold text-yellow-400">
            {stats.totalPoints}
          </span>
        </div>

        {/* Tasks Completed */}
        <div className="flex justify-between items-center p-2 sm:p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <span className="text-gray-300 font-medium text-sm sm:text-base">
            Tasks Completed
          </span>
          <span className="text-lg sm:text-xl font-bold text-green-400">
            {stats.tasksCompleted}
          </span>
        </div>

        {/* Approval Rate */}
        <div className="flex justify-between items-center p-2 sm:p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <span className="text-gray-300 font-medium text-sm sm:text-base">
            Approval Rate
          </span>
          <span className="text-lg sm:text-xl font-bold text-blue-400">
            {calculateApprovalRate()}%
          </span>
        </div>

        {/* Current Streak */}
        <div className="flex justify-between items-center p-2 sm:p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <span className="text-gray-300 font-medium text-sm sm:text-base">
            Current Streak
          </span>
          <span className="text-lg sm:text-xl font-bold text-purple-400">
            {stats.currentStreak} {stats.currentStreak === 1 ? "day" : "days"}
          </span>
        </div>

        {/* Longest Streak */}
        {stats.longestStreak > 0 && (
          <div className="flex justify-between items-center p-2 sm:p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg sm:col-span-2">
            <span className="text-gray-300 font-medium text-sm sm:text-base">
              Best Streak
            </span>
            <span className="text-lg sm:text-xl font-bold text-orange-400">
              {stats.longestStreak} {stats.longestStreak === 1 ? "day" : "days"}
            </span>
          </div>
        )}
      </div>

      {/* Additional Details */}
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-700/50">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs">Approved</p>
            <p className="text-green-400 font-semibold text-sm sm:text-base">
              {stats.tasksApproved}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Rejected</p>
            <p className="text-red-400 font-semibold text-sm sm:text-base">
              {stats.tasksRejected}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
