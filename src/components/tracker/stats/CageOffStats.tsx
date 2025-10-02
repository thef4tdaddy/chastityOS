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
      className={`glass-card transition-all duration-500 ${
        displayData.isPaused ||
        (!displayData.isActive && displayData.timeCageOff > 0)
          ? "border-red-400/30 shadow-red-400/20"
          : "glass-card-primary"
      }`}
    >
      <p className="text-sm md:text-lg font-medium mb-3 text-gray-200">
        Session Off Time:
      </p>

      {/* Currently Paused Indicator */}
      {displayData.isPaused && (
        <div className="mb-2">
          <span className="inline-block bg-yellow-400/20 text-yellow-200 px-2 py-1 rounded text-xs font-semibold">
            [CURRENTLY PAUSED]
          </span>
        </div>
      )}

      {/* Current Session Off Time (Live Ticking) */}
      <div className="mb-3">
        <p className="text-xs text-gray-400 mb-1">Current Off Time:</p>
        <p
          className={`text-xl md:text-2xl font-bold ${
            displayData.isPaused ||
            (!displayData.isActive && displayData.timeCageOff > 0)
              ? "text-red-300"
              : "text-white"
          }`}
        >
          {stats.cageOffTimeFormatted}
        </p>
      </div>

      {/* Pause Off Time */}
      {displayData.totalPauseTime > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-400 mb-1">Pause Off Time:</p>
          <p className="text-sm md:text-lg font-semibold text-yellow-200">
            {TimerService.formatDuration(displayData.totalPauseTime)}
          </p>
        </div>
      )}

      {/* Total Off Time */}
      <div className="pt-2 border-t border-gray-600">
        <p className="text-xs text-gray-400 mb-1">Total Off Time:</p>
        <p className="text-lg md:text-xl font-bold text-red-400">
          {TimerService.formatDuration(totalOffTime)}
        </p>
      </div>
    </div>
  );
};
