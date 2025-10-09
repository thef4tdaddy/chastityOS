/**
 * TrackerStatusDisplay - Sub-component for displaying current session status
 */

import React from "react";
import { useTrackerContext } from "./TrackerContext";
import { formatElapsedTime } from "../../../utils/formatting/time";

export const TrackerStatusDisplay: React.FC = () => {
  const { session, isActive, isPaused, duration } = useTrackerContext();

  // Calculate display values
  const currentDuration = duration || 0;
  const formattedTime = formatElapsedTime(currentDuration);

  // Get status color classes
  const getStatusClasses = () => {
    if (!isActive) return "tracker-box";
    if (isPaused) return "bg-yellow-500/20 border-yellow-600";
    return "bg-green-500/20 border-green-600";
  };

  return (
    <div className="space-y-4">
      {/* Main Status Display */}
      <div
        className={`p-4 rounded-lg shadow-sm transition-colors duration-300 border ${getStatusClasses()}`}
      >
        <p className="tracker-label text-sm md:text-lg mb-2">
          Current Session {isPaused ? "(Paused)" : ""}
        </p>
        <p
          className={`tracker-value text-2xl md:text-4xl font-bold ${
            isActive
              ? isPaused
                ? "text-yellow-400"
                : "text-green-400"
              : "text-gray-400"
          }`}
        >
          {isActive ? formattedTime : "Not Active"}
        </p>

        {/* Pause Duration Info */}
        {isPaused && session?.pauseStartTime && (
          <p className="text-xs text-yellow-300 mt-2">Currently paused</p>
        )}
      </div>
    </div>
  );
};
