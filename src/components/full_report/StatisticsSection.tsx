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

// Helper function to calculate statistics
const useStatistics = (
  sessions: DBSession[],
  events: DBEvent[],
  tasks: DBTask[],
  goals: DBGoal[],
) => {
  return useMemo(() => {
    const completedSessions = sessions.filter((s) => s.endTime);
    const totalChastityTime = completedSessions.reduce((acc, session) => {
      if (session.endTime) {
        const duration = Math.floor(
          (session.endTime.getTime() - session.startTime.getTime()) / 1000,
        );
        return acc + Math.max(0, duration - session.accumulatedPauseTime);
      }
      return acc;
    }, 0);

    const totalPauseTime = sessions.reduce(
      (acc, session) => acc + session.accumulatedPauseTime,
      0,
    );
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const completedGoals = goals.filter((g) => g.isCompleted).length;

    const longestSession = Math.max(
      ...completedSessions.map((s) => {
        if (s.endTime) {
          const duration = Math.floor(
            (s.endTime.getTime() - s.startTime.getTime()) / 1000,
          );
          return Math.max(0, duration - s.accumulatedPauseTime);
        }
        return 0;
      }),
      0,
    );

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      totalChastityTime,
      totalPauseTime,
      completedTasks,
      completedGoals,
      longestSession,
      totalEvents: events.length,
    };
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

// Statistics Item Component
const StatItem: React.FC<{
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}> = ({ label, value, icon: Icon }) => (
  <div className="text-center">
    <Icon className="text-nightly-aquamarine text-2xl mb-2 mx-auto" />
    <div className="text-lg font-semibold text-nightly-honeydew mb-1">
      {value}
    </div>
    <div className="text-sm text-nightly-celadon">{label}</div>
  </div>
);

// Main Statistics Section Component
export const StatisticsSection: React.FC<{
  sessions: DBSession[];
  events: DBEvent[];
  tasks: DBTask[];
  goals: DBGoal[];
}> = ({ sessions, events, tasks, goals }) => {
  const stats = useStatistics(sessions, events, tasks, goals);

  const statItems = [
    { label: "Total Sessions", value: stats.totalSessions, icon: FaPlay },
    {
      label: "Completed Sessions",
      value: stats.completedSessions,
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
    { label: "Completed Tasks", value: stats.completedTasks, icon: FaChartBar },
    { label: "Completed Goals", value: stats.completedGoals, icon: FaTrophy },
    { label: "Total Events", value: stats.totalEvents, icon: FaHistory },
  ];

  return (
    <Card variant="glass" className="mb-6">
      <div className="flex items-center gap-3 mb-6">
        <FaChartBar className="text-nightly-lavender-floral" />
        <h2 className="text-xl font-semibold text-nightly-honeydew">
          Statistics
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((item, index) => (
          <StatItem
            key={index}
            label={item.label}
            value={item.value}
            icon={item.icon}
          />
        ))}
      </div>
    </Card>
  );
};

export default StatisticsSection;
