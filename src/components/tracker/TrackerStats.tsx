import React from "react";
import { formatElapsedTime } from "../../utils";
import type { DBSession } from "../../types/database";
import { useTrackerStats } from "../../hooks/tracker/useTrackerStats";

interface TrackerStatsProps {
  // New props for real-time timer
  currentSession?: DBSession | null;
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

// Sub-component for current session stats
const CurrentSessionStats: React.FC<{
  displayData: ReturnType<typeof useTrackerStats>["displayData"];
  stats: ReturnType<typeof useTrackerStats>["stats"];
  currentSession?: DBSession | null;
  accumulatedPauseTimeThisSession?: number;
}> = ({
  displayData,
  stats,
  currentSession,
  accumulatedPauseTimeThisSession,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
    <div
      className={`glass-card transition-all duration-500 ${
        displayData.isActive
          ? displayData.isPaused
            ? "glass-card-accent border-yellow-400/30 shadow-yellow-400/20"
            : "border-green-400/30 shadow-green-400/20"
          : "glass-card-primary"
      }`}
    >
      <p className="text-sm md:text-lg font-medium mb-3 text-gray-200">
        Current Session In Chastity {displayData.isPaused ? "(Paused)" : ""}:
      </p>
      <p
        className={`text-2xl md:text-4xl font-bold mb-2 ${
          displayData.isActive
            ? displayData.isPaused
              ? "text-yellow-300"
              : "text-green-300"
            : "text-white"
        }`}
      >
        {stats.currentSessionFormatted}
      </p>
      {displayData.isPaused && (
        <p className="text-xs text-yellow-200 bg-yellow-400/10 px-2 py-1 rounded-md">
          Currently paused for: {displayData.currentPauseDuration}
        </p>
      )}
      {displayData.isActive &&
        (currentSession
          ? currentSession.accumulatedPauseTime > 0
          : accumulatedPauseTimeThisSession! > 0) && (
          <p className="text-xs text-yellow-200 bg-yellow-400/10 px-2 py-1 rounded-md mt-2">
            Total time paused this session:{" "}
            {currentSession
              ? formatElapsedTime(currentSession.accumulatedPauseTime)
              : displayData.accumulatedPause}
          </p>
        )}
    </div>

    <div
      className={`glass-card transition-all duration-500 ${
        !displayData.isActive && displayData.timeCageOff > 0
          ? "border-red-400/30 shadow-red-400/20"
          : "glass-card-primary"
      }`}
    >
      <p className="text-sm md:text-lg font-medium mb-3 text-gray-200">
        Current Session Cage Off:
      </p>
      <p
        className={`text-2xl md:text-4xl font-bold ${
          !displayData.isActive && displayData.timeCageOff > 0
            ? "text-red-300"
            : "text-white"
        }`}
      >
        {stats.cageOffTimeFormatted}
      </p>
    </div>
  </div>
);

// Sub-component for total stats
const TotalStats: React.FC<{
  stats: ReturnType<typeof useTrackerStats>["stats"];
}> = ({ stats }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
    <div className="glass-card glass-hover">
      <p className="text-sm md:text-lg font-medium mb-3 text-gray-200">
        Total Time In Chastity:
      </p>
      <p className="text-2xl md:text-4xl font-bold text-white">
        {stats.totalChastityTimeFormatted}
      </p>
    </div>
    <div className="glass-card glass-hover">
      <p className="text-sm md:text-lg font-medium mb-3 text-gray-200">
        Total Time Cage Off:
      </p>
      <p className="text-2xl md:text-4xl font-bold text-white">
        {stats.totalCageOffTimeFormatted}
      </p>
    </div>
  </div>
);

export const TrackerStats: React.FC<TrackerStatsProps> = (props) => {
  const { displayData, stats } = useTrackerStats(props);

  return (
    <div className="space-y-6 mb-8">
      {/* Top stat card with enhanced glass effect */}
      <div className="glass-card-primary text-center glass-float">
        <p className="text-blue-200 text-sm md:text-lg font-medium mb-2">
          {stats.topBoxLabel}
        </p>
        <p className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">
          {stats.totalElapsedFormatted}
        </p>
      </div>

      <CurrentSessionStats
        displayData={displayData}
        stats={stats}
        currentSession={props.currentSession}
        accumulatedPauseTimeThisSession={props.accumulatedPauseTimeThisSession}
      />

      <TotalStats stats={stats} />
    </div>
  );
};
