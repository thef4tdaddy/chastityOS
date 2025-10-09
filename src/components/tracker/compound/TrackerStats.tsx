/**
 * TrackerStats - Sub-component for displaying statistics
 */

import React from "react";
import { useTrackerContext } from "./TrackerContext";
import { CageOnStats, CageOffStats } from "../stats";

export const TrackerStats: React.FC = () => {
  const {
    isActive,
    isPaused,
    session,
    totalChastityTime,
    totalCageOffTime,
    personalGoal,
  } = useTrackerContext();

  return (
    <div className="space-y-4">
      {/* Cage On Stats */}
      <CageOnStats
        currentSession={session}
        personalGoal={personalGoal || undefined}
        isActive={isActive}
        isPaused={isPaused}
        totalChastityTime={totalChastityTime}
      />

      {/* Cage Off Stats */}
      <CageOffStats isActive={isActive} totalCageOffTime={totalCageOffTime} />
    </div>
  );
};
