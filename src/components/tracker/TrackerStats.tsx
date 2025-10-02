import React from "react";
import type { DBSession } from "../../types/database";
import { useTrackerStats } from "../../hooks/tracker/useTrackerStats";
import { CageOnStats, PauseStats, CageOffStats } from "./stats";

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
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    <CageOnStats displayData={displayData} stats={stats} />
    <PauseStats
      displayData={displayData}
      currentSession={currentSession}
      accumulatedPauseTimeThisSession={accumulatedPauseTimeThisSession}
    />
    <CageOffStats displayData={displayData} stats={stats} />
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
