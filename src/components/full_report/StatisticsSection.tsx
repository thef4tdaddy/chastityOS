import React, { useMemo } from "react";
import type { DBSession, DBEvent, DBTask, DBGoal } from "../../types/database";
import {
  FaPlay,
  FaStop,
  FaClock,
  FaPause,
  FaTrophy,
  FaChartBar,
  FaHistory,
} from "../../utils/iconImport";
import { Card } from "@/components/ui";
import { useCountUp } from "../../hooks/useCountUp";
import { useStaggerAnimation } from "../../hooks/useStaggerAnimation";
import { logger } from "@/utils/logging";

// Helper function to calculate statistics with error handling
const useStatistics = (
  sessions: DBSession[],
  events: DBEvent[],
  tasks: DBTask[],
  goals: DBGoal[],
) => {
  return useMemo(() => {
    try {
      // Validate input arrays
      const validSessions = Array.isArray(sessions) ? sessions : [];
      const validEvents = Array.isArray(events) ? events : [];
      const validTasks = Array.isArray(tasks) ? tasks : [];
      const validGoals = Array.isArray(goals) ? goals : [];

      const completedSessions = validSessions.filter((s) => s?.endTime);

      const totalChastityTime = completedSessions.reduce((acc, session) => {
        if (session?.endTime && session?.startTime) {
          try {
            const duration = Math.floor(
              (session.endTime.getTime() - session.startTime.getTime()) / 1000,
            );
            const pauseTime = session.accumulatedPauseTime || 0;
            return acc + Math.max(0, duration - pauseTime);
          } catch {
            // Skip invalid session data
            return acc;
          }
        }
        return acc;
      }, 0);

      const totalPauseTime = validSessions.reduce(
        (acc, session) => acc + (session?.accumulatedPauseTime || 0),
        0,
      );

      const completedTasks = validTasks.filter(
        (t) => t?.status === "completed",
      ).length;

      const completedGoals = validGoals.filter((g) => g?.isCompleted).length;

      const longestSession =
        completedSessions.length > 0
          ? Math.max(
              ...completedSessions.map((s) => {
                if (s?.endTime && s?.startTime) {
                  try {
                    const duration = Math.floor(
                      (s.endTime.getTime() - s.startTime.getTime()) / 1000,
                    );
                    const pauseTime = s.accumulatedPauseTime || 0;
                    return Math.max(0, duration - pauseTime);
                  } catch {
                    return 0;
                  }
                }
                return 0;
              }),
              0,
            )
          : 0;

      return {
        totalSessions: validSessions.length,
        completedSessions: completedSessions.length,
        totalChastityTime,
        totalPauseTime,
        completedTasks,
        completedGoals,
        longestSession,
        totalEvents: validEvents.length,
      };
    } catch (error) {
      // Return safe defaults on error
      logger.error("Error calculating statistics", { error });
      return {
        totalSessions: 0,
        completedSessions: 0,
        totalChastityTime: 0,
        totalPauseTime: 0,
        completedTasks: 0,
        completedGoals: 0,
        longestSession: 0,
        totalEvents: 0,
      };
    }
  }, [sessions, events, tasks, goals]);
};

// Helper function to format duration
const formatDuration = (seconds: number) => {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

// Statistics Item Component with animations
const StatItem: React.FC<{
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  numericValue?: number;
  isVisible: boolean;
  index: number;
}> = ({ label, value, icon: Icon, numericValue, isVisible, index }) => {
  // Use counting animation for numeric values
  const animatedCount = useCountUp(numericValue || 0, 1200, 0);
  const displayValue =
    typeof numericValue === "number" && numericValue === animatedCount
      ? value
      : typeof numericValue === "number"
        ? animatedCount
        : value;

  return (
    <div
      className={`text-center stat-card-hover p-3 sm:p-4 rounded-lg bg-white/5 ${
        isVisible
          ? `animate-scale-in stagger-${Math.min(index + 1, 8)}`
          : "opacity-0"
      }`}
      role="article"
      aria-label={`${label}: ${value}`}
    >
      <Icon
        className="text-nightly-aquamarine text-xl sm:text-2xl mb-1 sm:mb-2 mx-auto"
        aria-hidden="true"
      />
      <div
        className="text-base sm:text-lg font-semibold text-nightly-honeydew mb-0.5 sm:mb-1 break-words"
        aria-live="polite"
      >
        {displayValue}
      </div>
      <div className="text-xs sm:text-sm text-nightly-celadon leading-tight">
        {label}
      </div>
    </div>
  );
};

// Main Statistics Section Component (Memoized to prevent unnecessary re-renders)
const StatisticsSectionComponent: React.FC<{
  sessions: DBSession[];
  events: DBEvent[];
  tasks: DBTask[];
  goals: DBGoal[];
}> = ({ sessions, events, tasks, goals }) => {
  const stats = useStatistics(sessions, events, tasks, goals);

  // Memoize stat items array to prevent recreation on every render
  const statItems = useMemo(
    () => [
      {
        label: "Total Sessions",
        value: stats.totalSessions,
        numericValue: stats.totalSessions,
        icon: FaPlay,
      },
      {
        label: "Completed Sessions",
        value: stats.completedSessions,
        numericValue: stats.completedSessions,
        icon: FaStop,
      },
      {
        label: "Total Chastity Time",
        value: formatDuration(stats.totalChastityTime),
        icon: FaClock,
      },
      {
        label: "Total Pause Time",
        value: formatDuration(stats.totalPauseTime),
        icon: FaPause,
      },
      {
        label: "Longest Session",
        value: formatDuration(stats.longestSession),
        icon: FaTrophy,
      },
      {
        label: "Completed Tasks",
        value: stats.completedTasks,
        numericValue: stats.completedTasks,
        icon: FaChartBar,
      },
      {
        label: "Completed Goals",
        value: stats.completedGoals,
        numericValue: stats.completedGoals,
        icon: FaTrophy,
      },
      {
        label: "Total Events",
        value: stats.totalEvents,
        numericValue: stats.totalEvents,
        icon: FaHistory,
      },
    ],
    [stats],
  );

  // Stagger animation for stat items
  const visibleItems = useStaggerAnimation(statItems.length, 80) ?? [];

  return (
    <Card variant="glass" className="mb-4 sm:mb-6 animate-fade-in-up">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <FaChartBar
          className="text-nightly-lavender-floral text-lg sm:text-xl"
          aria-hidden="true"
        />
        <h2
          id="statistics-heading"
          className="text-lg sm:text-xl font-semibold text-nightly-honeydew"
        >
          Statistics
        </h2>
      </div>

      <div
        className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
        role="list"
        aria-label="Session statistics"
      >
        {statItems.map((item, index) => (
          <StatItem
            key={index}
            label={item.label}
            value={item.value}
            numericValue={item.numericValue}
            icon={item.icon}
            isVisible={visibleItems[index]}
            index={index}
          />
        ))}
      </div>
    </Card>
  );
};

// Export memoized version to prevent unnecessary re-renders
export const StatisticsSection = React.memo(
  StatisticsSectionComponent,
) as React.FC<{
  sessions: DBSession[];
  events: DBEvent[];
  tasks: DBTask[];
  goals: DBGoal[];
}>;
export default StatisticsSection;
