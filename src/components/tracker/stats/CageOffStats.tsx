import React from "react";
import type { useTrackerStats } from "../../../hooks/tracker/useTrackerStats";
import { logger } from "@/utils/logging";
import { Card } from "@/components/ui";

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

  // Determine color based on state - using inline styles for guaranteed override
  let textColorStyle: React.CSSProperties = {};
  let borderClass = "border border-rose_quartz/30";

  if (isTickingOff) {
    if (isPaused) {
      // Yellow when paused
      textColorStyle = { color: "#eab308" }; // yellow-500
      borderClass =
        "border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20";
    } else {
      // Red when off
      textColorStyle = { color: "#b32066" }; // nightly-deep_rose
      borderClass =
        "border-2 border-nightly-deep_rose/50 shadow-lg shadow-nightly-deep_rose/20";
    }
  } else {
    // White when active (not ticking) - matches Total stats
    textColorStyle = { color: "#ffffff" }; // white
  }

  return (
    <Card
      variant="glass"
      padding="sm"
      className={`bg-lavender_web/10 dark:bg-lavender_web/5 backdrop-blur-md transition-all duration-500 h-full flex flex-col ${borderClass}`}
    >
      <p className="text-sm md:text-lg font-medium mb-3 text-gray-200">
        Current Time Off: {isTickingOff ? (isPaused ? "🟡" : "🔴") : "💜"}
      </p>
      <p className="text-2xl md:text-4xl font-bold" style={textColorStyle}>
        {stats.cageOffTimeFormatted}
      </p>
    </Card>
  );
};
