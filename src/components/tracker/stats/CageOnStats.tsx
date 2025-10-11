import React from "react";
import type { useTrackerStats } from "../../../hooks/tracker/useTrackerStats";
import { Card } from "@/components/ui";

interface CageOnStatsProps {
  displayData: ReturnType<typeof useTrackerStats>["displayData"];
  stats: ReturnType<typeof useTrackerStats>["stats"];
}

export const CageOnStats: React.FC<CageOnStatsProps> = ({
  displayData,
  stats,
}) => {
  // Determine animation classes based on state
  const getAnimationClasses = () => {
    if (!displayData.isActive) return "";
    if (displayData.isPaused) return "tracker-glow-yellow";
    return "tracker-glow-green timer-pulse";
  };

  return (
    <Card
      variant="glass"
      padding="sm"
      className={`
        bg-lavender_web/10 dark:bg-lavender_web/5 backdrop-blur-md 
        transition-all duration-500 h-full flex flex-col
        tracker-card-hover tracker-state-transition
        ${
          displayData.isActive
            ? displayData.isPaused
              ? "border-2 border-nightly-deep_rose/50 shadow-lg shadow-nightly-deep_rose/20"
              : "border-2 border-green-500/50 shadow-lg shadow-green-500/20"
            : "border border-rose_quartz/30"
        }
        ${getAnimationClasses()}
      `}
    >
      <p className="text-sm md:text-lg font-medium mb-3 text-lavender_web">
        Current Session In Chastity {displayData.isPaused ? "(Paused)" : ""}:
      </p>
      <p
        className={`
          text-2xl md:text-4xl font-bold mb-2 number-update
          ${
            displayData.isActive
              ? displayData.isPaused
                ? "text-nightly-deep_rose"
                : "text-green-400"
              : "text-lavender_web"
          }
        `}
      >
        {stats.currentSessionFormatted}
      </p>
    </Card>
  );
};
