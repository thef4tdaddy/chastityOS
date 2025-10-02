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
      className={`bg-lavender_web dark:bg-dark_purple rounded-lg p-4 transition-all duration-500 ${
        displayData.isPaused ||
        (!displayData.isActive && displayData.timeCageOff > 0)
          ? "border-2 border-nightly-deep_rose/50 shadow-lg shadow-nightly-deep_rose/20"
          : "border border-rose_quartz/30"
      }`}
    >
      <p className="text-sm md:text-lg font-medium mb-3 text-dark_purple dark:text-lavender_web">
        Session Off Time:
      </p>

      {/* Currently Paused Indicator */}
      {displayData.isPaused && (
        <div className="mb-2">
          <span className="inline-block bg-nightly-deep_rose/20 text-nightly-deep_rose px-2 py-1 rounded text-xs font-semibold">
            [CURRENTLY PAUSED]
          </span>
        </div>
      )}

      {/* Current Session Off Time (Live Ticking) */}
      <div className="mb-3">
        <p className="text-xs text-rose_quartz mb-1">Current Off Time:</p>
        <p
          className={`text-xl md:text-2xl font-bold ${
            displayData.isPaused ||
            (!displayData.isActive && displayData.timeCageOff > 0)
              ? "text-nightly-deep_rose"
              : "text-dark_purple dark:text-lavender_web"
          }`}
        >
          {stats.cageOffTimeFormatted}
        </p>
      </div>

      {/* Pause Off Time */}
      {displayData.totalPauseTime > 0 && (
        <div className="mb-3">
          <p className="text-xs text-rose_quartz mb-1">Pause Off Time:</p>
          <p className="text-sm md:text-lg font-semibold text-nightly-deep_rose">
            {TimerService.formatDuration(displayData.totalPauseTime)}
          </p>
        </div>
      )}

      {/* Total Off Time */}
      <div className="pt-2 border-t border-rose_quartz/30">
        <p className="text-xs text-rose_quartz mb-1">Total Off Time:</p>
        <p className="text-lg md:text-xl font-bold text-nightly-deep_rose">
          {TimerService.formatDuration(totalOffTime)}
        </p>
      </div>
    </div>
  );
};
