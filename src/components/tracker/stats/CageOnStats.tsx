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
      className={`glass-card transition-all duration-500 ${
        displayData.isActive
          ? displayData.isPaused
            ? "glass-card-accent border-yellow-400/30 shadow-yellow-400/20"
            : "border-green-400/30 shadow-green-400/20"
          : "glass-card-primary"
      }`}
    >
      <p className="text-sm md:text-lg font-medium mb-3 text-gray-200">
        Current Session In Chastity {displayData.isPaused ? "(Paused)" : ""}:
      </p>
      <p
        className={`text-2xl md:text-4xl font-bold mb-2 ${
          displayData.isActive
            ? displayData.isPaused
              ? "text-yellow-300"
              : "text-green-300"
            : "text-white"
        }`}
      >
        {stats.currentSessionFormatted}
      </p>
    </div>
  );
};
