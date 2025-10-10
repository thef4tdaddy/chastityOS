import React from "react";
import type { DBSession, DBGoal } from "../../types/database";
import { useTrackerStats } from "../../hooks/tracker/useTrackerStats";
import { CageOnStats, CageOffStats } from "./stats";
import { FaBullseye, FaLock } from "../../utils/iconImport";
import { Card } from "@/components/ui";

interface TrackerStatsProps {
  // New props for real-time timer
  currentSession?: DBSession | null;
  personalGoal?: DBGoal | null; // Personal goal for display
  // Legacy props for backward compatibility
  topBoxLabel?: string;
  topBoxTime?: string;
  mainChastityDisplayTime?: number;
  isPaused?: boolean;
  livePauseDuration?: number;
  accumulatedPauseTimeThisSession?: number;
  isCageOn?: boolean;
  timeCageOff?: number;
  totalChastityTime?: number;
  totalTimeCageOff?: number;
}

// Sub-component for personal goal display
const PersonalGoalDisplay: React.FC<{ goal: DBGoal }> = ({ goal }) => {
  const progressPercent = goal.progress || 0;
  const isHardcoreMode = goal.isHardcoreMode || false;

  // Format remaining time
  const remaining = goal.targetValue - goal.currentValue;
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);

  const remainingFormatted =
    days > 0
      ? `${days}d ${hours}h ${minutes}m`
      : hours > 0
        ? `${hours}h ${minutes}m`
        : `${minutes}m`;

  return (
    <Card
      variant="glass"
      className={isHardcoreMode ? "border-2 border-red-500/50" : ""}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FaBullseye className="text-nightly-aquamarine" />
          <h3 className="text-lg font-semibold text-nightly-honeydew">
            {goal.title}
          </h3>
        </div>
        {isHardcoreMode && (
          <div className="flex items-center gap-1 bg-red-500/20 px-2 py-1 rounded">
            <FaLock className="text-red-400 text-sm" />
            <span className="text-xs text-red-400 font-semibold">HARDCORE</span>
          </div>
        )}
      </div>

      {goal.description && (
        <p className="text-sm text-nightly-celadon mb-3">{goal.description}</p>
      )}

      {/* Progress bar */}
      <div className="mb-2">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isHardcoreMode
                ? "bg-gradient-to-r from-red-500 to-red-600"
                : "bg-gradient-to-r from-nightly-aquamarine to-nightly-spring-green"
            }`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-nightly-celadon">
          Progress: {progressPercent.toFixed(1)}%
        </span>
        <span className="text-nightly-honeydew font-semibold">
          {remaining > 0 ? `${remainingFormatted} remaining` : "Goal Complete!"}
        </span>
      </div>
    </Card>
  );
};

// Sub-component for current session stats
const CurrentSessionStats: React.FC<{
  displayData: ReturnType<typeof useTrackerStats>["displayData"];
  stats: ReturnType<typeof useTrackerStats>["stats"];
}> = ({ displayData, stats }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
    <CageOnStats displayData={displayData} stats={stats} />
    <CageOffStats displayData={displayData} stats={stats} />
  </div>
);

// Sub-component for total stats
const TotalStats: React.FC<{
  stats: ReturnType<typeof useTrackerStats>["stats"];
}> = ({ stats }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
    <Card variant="glass" className="glass-hover">
      <p className="text-sm md:text-lg font-medium mb-3 text-gray-200">
        Total Time In Chastity:
      </p>
      <p className="text-2xl md:text-4xl font-bold text-white">
        {stats.totalChastityTimeFormatted}
      </p>
    </Card>
    <Card variant="glass" className="glass-hover">
      <p className="text-sm md:text-lg font-medium mb-3 text-gray-200">
        Total Time Cage Off:
      </p>
      <p className="text-2xl md:text-4xl font-bold text-white">
        {stats.totalCageOffTimeFormatted}
      </p>
    </Card>
  </div>
);

export const TrackerStats: React.FC<TrackerStatsProps> = (props) => {
  const { displayData, stats } = useTrackerStats(props);
  const { personalGoal } = props;

  return (
    <div className="space-y-6 mb-8">
      {/* Top stat card with timestamp info */}
      {stats.topBoxLabel && stats.topBoxTimestamp && (
        <div className="primary-stat-card text-center glass-float">
          <p className="text-blue-200 text-sm md:text-lg font-medium mb-2">
            {stats.topBoxLabel}:
          </p>
          <p className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">
            {stats.topBoxTimestamp}
          </p>
        </div>
      )}

      {/* Personal Goal Display */}
      {personalGoal && <PersonalGoalDisplay goal={personalGoal} />}

      <CurrentSessionStats displayData={displayData} stats={stats} />

      <TotalStats stats={stats} />
    </div>
  );
};
