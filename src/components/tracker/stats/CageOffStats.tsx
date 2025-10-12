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

  // Get status for aria-label
  const getStatusLabel = () => {
    if (isPaused) return "paused";
    if (!displayData.isActive) return "cage off";
    return "active in chastity";
  };

  const getStatusEmoji = () => {
    if (isTickingOff) {
      return isPaused ? "🟡" : "🔴";
    }
    return "💜";
  };

  const getEmojiAriaLabel = () => {
    if (isTickingOff) {
      return isPaused ? "yellow indicator, paused" : "red indicator, cage off";
    }
    return "purple indicator, active";
  };

  return (
    <Card
      variant="glass"
      padding="sm"
      className={`
        bg-lavender_web/10 dark:bg-lavender_web/5 backdrop-blur-md 
        transition-all duration-500 h-full flex flex-col
        tracker-card-hover tracker-state-transition
        ${borderClass}
      `}
      role="region"
      aria-label={`Current cage off time, status: ${getStatusLabel()}`}
    >
      <p
        className="text-xs sm:text-sm md:text-base lg:text-lg font-medium mb-2 md:mb-3 text-gray-200 leading-tight"
        id="cage-off-label"
      >
        Current Time Off:{" "}
        <span aria-label={getEmojiAriaLabel()} role="img">
          {getStatusEmoji()}
        </span>
      </p>
      <p
        className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold number-update"
        style={textColorStyle}
        role="timer"
        aria-live="polite"
        aria-atomic="true"
        aria-labelledby="cage-off-label"
      >
        {stats.cageOffTimeFormatted}
      </p>
    </Card>
  );
};
