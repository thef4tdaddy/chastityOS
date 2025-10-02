import React from "react";
import type { useTrackerStats } from "../../../hooks/tracker/useTrackerStats";

interface CageOnStatsProps {
  displayData: ReturnType<typeof useTrackerStats>["displayData"];
  stats: ReturnType<typeof useTrackerStats>["stats"];
}

export const CageOnStats: React.FC<CageOnStatsProps> = ({
  displayData,
  stats,
}) => {
  return (
    <div
      className={`bg-lavender_web dark:bg-dark_purple rounded-lg p-4 transition-all duration-500 ${
        displayData.isActive
          ? displayData.isPaused
            ? "border-2 border-nightly-deep_rose/50 shadow-lg shadow-nightly-deep_rose/20"
            : "border-2 border-green-500/50 shadow-lg shadow-green-500/20"
          : "border border-rose_quartz/30"
      }`}
    >
      <p className="text-sm md:text-lg font-medium mb-3 text-dark_purple dark:text-lavender_web">
        Current Session In Chastity {displayData.isPaused ? "(Paused)" : ""}:
      </p>
      <p
        className={`text-2xl md:text-4xl font-bold mb-2 ${
          displayData.isActive
            ? displayData.isPaused
              ? "text-nightly-deep_rose"
              : "text-green-600 dark:text-green-400"
            : "text-dark_purple dark:text-lavender_web"
        }`}
      >
        {stats.currentSessionFormatted}
      </p>
    </div>
  );
};
