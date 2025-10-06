import React from "react";
import type { useTrackerStats } from "../../../hooks/tracker/useTrackerStats";
import { logger } from "@/utils/logging";

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

  // Debug logging
  logger.debug("CageOffStats state", {
    isActive: displayData.isActive,
    isPaused: displayData.isPaused,
    isTickingOff,
    timeCageOff: displayData.timeCageOff,
  });

  // Determine color based on state
  let timeColor = "!text-lavender_web"; // default when active (not ticking)
  let borderClass = "border border-rose_quartz/30";

  if (isTickingOff) {
    if (isPaused) {
      // Yellow when paused
      timeColor = "!text-yellow-500";
      borderClass =
        "border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20";
    } else {
      // Red when off
      timeColor = "!text-nightly-deep_rose";
      borderClass =
        "border-2 border-nightly-deep_rose/50 shadow-lg shadow-nightly-deep_rose/20";
    }
  }

  return (
    <div
      className={`glass-card bg-lavender_web/10 dark:bg-lavender_web/5 backdrop-blur-md rounded-lg p-4 transition-all duration-500 h-full flex flex-col ${borderClass}`}
    >
      <p className="text-sm md:text-lg font-medium mb-3 text-lavender_web">
        Current Time Off: {isTickingOff ? (isPaused ? "🟡" : "🔴") : "💜"}
      </p>
      <p className={`text-2xl md:text-4xl font-bold ${timeColor}`}>
        {stats.cageOffTimeFormatted}
      </p>
    </div>
  );
};
