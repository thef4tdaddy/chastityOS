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
  // Calculate total off time (cage off + pause off)
  const totalOffTime = displayData.timeCageOff + displayData.totalPauseTime;

  return (
    <div
      className={`glass-card bg-lavender_web/10 dark:bg-lavender_web/5 backdrop-blur-md rounded-lg p-4 transition-all duration-500 ${
        displayData.isPaused ||
        (!displayData.isActive && displayData.timeCageOff > 0)
          ? "border-2 border-nightly-deep_rose/50 shadow-lg shadow-nightly-deep_rose/20"
          : "border border-rose_quartz/30"
      }`}
    >
      <p className="text-sm md:text-lg font-medium mb-1 text-lavender_web">
        Session Time Off:
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
        className={`text-2xl md:text-4xl font-bold mb-3 ${
          displayData.isPaused ||
          (!displayData.isActive && displayData.timeCageOff > 0)
            ? "text-nightly-deep_rose"
            : "text-lavender_web"
        }`}
      >
        {stats.cageOffTimeFormatted}
      </p>

      {/* Pause Off Time */}
      {displayData.totalPauseTime > 0 && (
        <div className="mb-2">
          <p className="text-xs text-rose_quartz mb-1">Pause Off Time:</p>
          <p className="text-sm md:text-lg font-semibold text-nightly-deep_rose">
            {TimerService.formatDuration(displayData.totalPauseTime)}
          </p>
        </div>
      )}

      {/* Total Off Time */}
      <div className="pt-2 border-t border-lavender_web/20">
        <p className="text-xs text-rose_quartz mb-1">Total Off Time:</p>
        <p className="text-lg md:text-xl font-bold text-nightly-deep_rose">
          {TimerService.formatDuration(totalOffTime)}
        </p>
      </div>
    </div>
  );
};
