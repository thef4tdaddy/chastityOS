/**
 * TrackerHeader - Sub-component for displaying goal and keyholder information
 */

import React from "react";
import { useTrackerContext } from "./TrackerContext";
import { PauseCooldownMessage } from "../PauseCooldownMessage";

export const TrackerHeader: React.FC = () => {
  const { isActive, personalGoal, cooldownRemaining } = useTrackerContext();

  // Calculate remaining goal time from personal goal
  const remainingGoalTime = personalGoal
    ? Math.max(
        0,
        (personalGoal.targetValue || 0) - (personalGoal.currentValue || 0),
      )
    : 0;

  return (
    <div className="space-y-4">
      {/* Pause Cooldown Message */}
      {cooldownRemaining !== undefined && cooldownRemaining > 0 && (
        <PauseCooldownMessage
          message={`Pause cooldown: ${Math.ceil(cooldownRemaining)}s remaining`}
        />
      )}

      {/* Personal Goal Display */}
      {isActive && personalGoal && remainingGoalTime > 0 && (
        <div className="mb-4 p-3 rounded-lg shadow-sm text-center border bg-white/10 backdrop-blur-xs border-white/20">
          <p className="text-lg font-semibold text-blue-200">
            Time Remaining on Goal:
          </p>
          <p className="text-3xl font-bold text-blue-100">
            {Math.floor(remainingGoalTime / 3600)}h{" "}
            {Math.floor((remainingGoalTime % 3600) / 60)}m
          </p>
        </div>
      )}
    </div>
  );
};
