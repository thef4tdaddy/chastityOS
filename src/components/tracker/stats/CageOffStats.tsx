import React from "react";
import type { useTrackerStats } from "../../../hooks/tracker/useTrackerStats";

interface CageOffStatsProps {
  displayData: ReturnType<typeof useTrackerStats>["displayData"];
  stats: ReturnType<typeof useTrackerStats>["stats"];
}

export const CageOffStats: React.FC<CageOffStatsProps> = ({
  displayData,
  stats,
}) => {
  // Determine if time off is actively ticking
  const isTickingOff = !displayData.isActive || displayData.isPaused;
  const isPaused = displayData.isPaused;

  return (
    <div
      className={`glass-card bg-lavender_web/10 dark:bg-lavender_web/5 backdrop-blur-md rounded-lg p-4 transition-all duration-500 h-full flex flex-col ${
        isTickingOff
          ? isPaused
            ? "border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20"
            : "border-2 border-nightly-deep_rose/50 shadow-lg shadow-nightly-deep_rose/20"
          : "border border-rose_quartz/30"
      }`}
    >
      <p className="text-sm md:text-lg font-medium mb-3 text-lavender_web">
        Current Time Off:
      </p>
      <p
        className={`text-2xl md:text-4xl font-bold ${
          isTickingOff
            ? isPaused
              ? "text-yellow-500"
              : "text-nightly-deep_rose"
            : "text-lavender_web"
        }`}
      >
        {stats.cageOffTimeFormatted}
      </p>
    </div>
  );
};
