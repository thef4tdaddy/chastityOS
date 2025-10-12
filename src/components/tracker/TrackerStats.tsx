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
// Memoized to prevent unnecessary re-renders
const PersonalGoalDisplay = React.memo<{ goal: DBGoal }>(({ goal }) => {
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
      aria-label={`Personal goal: ${goal.title}, ${progressPercent.toFixed(1)} percent complete${isHardcoreMode ? ", hardcore mode enabled" : ""}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <FaBullseye
            className="text-nightly-aquamarine text-base sm:text-lg"
            aria-hidden="true"
          />
          <h3
            className="text-base sm:text-lg md:text-xl font-semibold text-nightly-honeydew"
            id={`goal-title-${goal.id || "current"}`}
          >
            {goal.title}
          </h3>
        </div>
        {isHardcoreMode && (
          <div
            className="flex items-center gap-1 bg-red-500/20 px-2 py-1 rounded flex-shrink-0"
            role="status"
            aria-label="Hardcore mode active"
          >
            <FaLock
              className="text-red-400 text-xs sm:text-sm"
              aria-hidden="true"
            />
            <span className="text-xs sm:text-sm text-red-400 font-semibold">
              HARDCORE
            </span>
          </div>
        )}
      </div>

      {goal.description && (
        <p className="text-xs sm:text-sm text-nightly-celadon mb-3 leading-relaxed">
          {goal.description}
        </p>
      )}

      {/* Progress bar */}
      <div
        className="mb-2"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-labelledby={`goal-title-${goal.id || "current"}`}
      >
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 progress-fill-animated ${
              isHardcoreMode
                ? "bg-gradient-to-r from-red-500 to-red-600"
                : "bg-gradient-to-r from-nightly-aquamarine to-nightly-spring-green"
            }`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-xs sm:text-sm">
        <span
          className="text-nightly-celadon"
          aria-label={`Progress: ${progressPercent.toFixed(1)} percent`}
        >
          Progress: {progressPercent.toFixed(1)}%
        </span>
        <span
          className="text-nightly-honeydew font-semibold"
          role="status"
          aria-live="polite"
        >
          {remaining > 0 ? `${remainingFormatted} remaining` : "Goal Complete!"}
        </span>
      </div>
    </Card>
  );
});
PersonalGoalDisplay.displayName = "PersonalGoalDisplay";

// Subcomponent for current session stats
// Memoized to prevent unnecessary re-renders
const CurrentSessionStats = React.memo<{
  displayData: ReturnType<typeof useTrackerStats>["displayData"];
  stats: ReturnType<typeof useTrackerStats>["stats"];
}>(({ displayData, stats }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
    <CageOnStats displayData={displayData} stats={stats} />
    <CageOffStats displayData={displayData} stats={stats} />
  </div>
));
CurrentSessionStats.displayName = "CurrentSessionStats";

// Subcomponent for total stats
// Memoized to prevent unnecessary re-renders
const TotalStats = React.memo<{
  stats: ReturnType<typeof useTrackerStats>["stats"];
}>(({ stats }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
    <Card
      variant="glass"
      className="glass-hover tracker-card-hover tracker-state-transition"
      aria-label="Total time in chastity statistics"
    >
      <p
        className="text-xs sm:text-sm md:text-base lg:text-lg font-medium mb-2 md:mb-3 text-gray-200"
        id="total-chastity-label"
      >
        Total Time In Chastity:
      </p>
      <p
        className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white number-update"
        aria-labelledby="total-chastity-label"
      >
        {stats.totalChastityTimeFormatted}
      </p>
    </Card>
    <Card
      variant="glass"
      className="glass-hover tracker-card-hover tracker-state-transition"
      aria-label="Total time cage off statistics"
    >
      <p
        className="text-xs sm:text-sm md:text-base lg:text-lg font-medium mb-2 md:mb-3 text-gray-200"
        id="total-cage-off-label"
      >
        Total Time Cage Off:
      </p>
      <p
        className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white number-update"
        aria-labelledby="total-cage-off-label"
      >
        {stats.totalCageOffTimeFormatted}
      </p>
    </Card>
  </div>
));
TotalStats.displayName = "TotalStats";

export const TrackerStats = React.memo<TrackerStatsProps>((props) => {
  const { displayData, stats } = useTrackerStats(props);
  const { personalGoal } = props;

  return (
    <div
      className="space-y-3 sm:space-y-4 md:space-y-6 mb-6 md:mb-8"
      role="region"
      aria-label="Chastity tracking statistics"
    >
      {/* Top stat card with timestamp info */}
      {stats.topBoxLabel && stats.topBoxTimestamp && (
        <div
          className="primary-stat-card text-center glass-float tracker-state-transition"
          role="region"
          aria-label={`${stats.topBoxLabel}: ${stats.topBoxTimestamp}`}
        >
          <p
            className="text-blue-200 text-xs sm:text-sm md:text-base lg:text-lg font-medium mb-1 md:mb-2"
            id="top-stat-label"
          >
            {stats.topBoxLabel}:
          </p>
          <p
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent number-update"
            aria-labelledby="top-stat-label"
          >
            {stats.topBoxTimestamp}
          </p>
        </div>
      )}

      {/* Personal Goal Display */}
      {personalGoal && (
        <div className="tracker-state-transition">
          <PersonalGoalDisplay goal={personalGoal} />
        </div>
      )}

      <CurrentSessionStats displayData={displayData} stats={stats} />

      <TotalStats stats={stats} />
    </div>
  );
});
TrackerStats.displayName = "TrackerStats";
