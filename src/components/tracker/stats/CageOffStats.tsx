import React from "react";
import type { useTrackerStats } from "../../../hooks/tracker/useTrackerStats";
import { TimerService } from "../../../services/TimerService";

interface CageOffStatsProps {
  displayData: ReturnType<typeof useTrackerStats>["displayData"];
  stats: ReturnType<typeof useTrackerStats>["stats"];
}

export const CageOffStats: React.FC<CageOffStatsProps> = ({
  displayData,
  stats,
}) => {
  return (
    <div
      className={`glass-card bg-lavender_web/10 dark:bg-lavender_web/5 backdrop-blur-md rounded-lg p-4 transition-all duration-500 h-full flex flex-col ${
        displayData.isPaused ||
        (!displayData.isActive && displayData.timeCageOff > 0)
          ? "border-2 border-nightly-deep_rose/50 shadow-lg shadow-nightly-deep_rose/20"
          : "border border-rose_quartz/30"
      }`}
    >
      <p className="text-sm md:text-lg font-medium mb-3 text-lavender_web">
        Current Time Off:
      </p>

      {/* Currently Paused Indicator */}
      {displayData.isPaused && (
        <div className="mb-2">
          <span className="inline-block bg-nightly-deep_rose/20 text-nightly-deep_rose px-2 py-1 rounded text-xs font-semibold">
            [CURRENTLY PAUSED]
          </span>
        </div>
      )}

      {/* Main Time Display (Live Ticking) */}
      <p
        className={`text-2xl md:text-4xl font-bold ${
          displayData.isPaused ||
          (!displayData.isActive && displayData.timeCageOff > 0)
            ? "text-nightly-deep_rose"
            : "text-lavender_web"
        }`}
      >
        {stats.cageOffTimeFormatted}
      </p>
    </div>
  );
};
