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
  return (
    <div
      className={`glass-card transition-all duration-500 ${
        !displayData.isActive && displayData.timeCageOff > 0
          ? "border-red-400/30 shadow-red-400/20"
          : "glass-card-primary"
      }`}
    >
      <p className="text-sm md:text-lg font-medium mb-3 text-gray-200">
        Current Session Cage Off:
      </p>
      <p
        className={`text-2xl md:text-4xl font-bold ${
          !displayData.isActive && displayData.timeCageOff > 0
            ? "text-red-300"
            : "text-white"
        }`}
      >
        {stats.cageOffTimeFormatted}
      </p>
    </div>
  );
};
