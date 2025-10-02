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
      className={`glass-card bg-lavender_web/10 dark:bg-lavender_web/5 backdrop-blur-md rounded-lg p-4 transition-all duration-500 h-full flex flex-col ${
        displayData.isActive
          ? displayData.isPaused
            ? "border-2 border-nightly-deep_rose/50 shadow-lg shadow-nightly-deep_rose/20"
            : "border-2 border-green-500/50 shadow-lg shadow-green-500/20"
          : "border border-rose_quartz/30"
      }`}
    >
      <p className="text-sm md:text-lg font-medium mb-3 text-lavender_web">
        Current Session In Chastity {displayData.isPaused ? "(Paused)" : ""}:
      </p>
      <p
        className={`text-2xl md:text-4xl font-bold mb-2 ${
          displayData.isActive
            ? displayData.isPaused
              ? "text-nightly-deep_rose"
              : "text-green-400"
            : "text-lavender_web"
        }`}
      >
        {stats.currentSessionFormatted}
      </p>
    </div>
  );
};
