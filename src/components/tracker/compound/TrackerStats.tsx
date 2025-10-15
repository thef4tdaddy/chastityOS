/**
 * TrackerStats - Sub-component for displaying statistics
 */

import React from "react";
import { useTrackerContext } from "./TrackerContext";
import { CageOnStats, CageOffStats } from "../stats";
import type { useTrackerStats } from "@/hooks/tracker/useTrackerStats";

export const TrackerStats: React.FC = () => {
  const {
    isActive,
    isPaused,
    session: _session,
    totalChastityTime: _totalChastityTime,
    totalCageOffTime: _totalCageOffTime,
    personalGoal: _personalGoal,
  } = useTrackerContext();

  // Mock the hook return for now - this should be replaced with actual hook usage
  const mockDisplayData: ReturnType<typeof useTrackerStats>["displayData"] = {
    isActive,
    isPaused,
    timeCageOff: 0, // This should come from actual calculation
    effectiveTime: "",
    currentPauseDuration: "",
    accumulatedPause: "",
    totalElapsed: "",
    totalPauseTime: 0,
  };

  const mockStats: ReturnType<typeof useTrackerStats>["stats"] = {
    currentSessionFormatted: "",
    cageOffTimeFormatted: "",
    topBoxLabel: "",
    topBoxTimestamp: "",
    totalElapsedFormatted: "",
    totalChastityTimeFormatted: "",
    totalCageOffTimeFormatted: "",
  };

  return (
    <div className="space-y-4">
      {/* Cage On Stats */}
      <CageOnStats displayData={mockDisplayData} stats={mockStats} />

      {/* Cage Off Stats */}
      <CageOffStats displayData={mockDisplayData} stats={mockStats} />
    </div>
  );
};
