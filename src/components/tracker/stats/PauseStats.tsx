import React from "react";
import { formatElapsedTime } from "../../../utils";
import type { DBSession } from "../../../types/database";
import type { useTrackerStats } from "../../../hooks/tracker/useTrackerStats";

interface PauseStatsProps {
  displayData: ReturnType<typeof useTrackerStats>["displayData"];
  currentSession?: DBSession | null;
  accumulatedPauseTimeThisSession?: number;
}

export const PauseStats: React.FC<PauseStatsProps> = ({
  displayData,
  currentSession,
  accumulatedPauseTimeThisSession,
}) => {
  // Don't show pause stats if not paused and no accumulated pause time
  const hasAccumulatedPause = currentSession
    ? currentSession.accumulatedPauseTime > 0
    : (accumulatedPauseTimeThisSession ?? 0) > 0;

  if (!displayData.isPaused && !hasAccumulatedPause) {
    return null;
  }

  return (
    <div className="bg-lavender_web dark:bg-dark_purple rounded-lg p-4 border-2 border-nightly-deep_rose/50 shadow-lg shadow-nightly-deep_rose/20 transition-all duration-500">
      <p className="text-sm md:text-lg font-medium mb-3 text-dark_purple dark:text-lavender_web">
        Pause Status:
      </p>
      {displayData.isPaused && (
        <p className="text-sm md:text-lg text-nightly-deep_rose bg-nightly-deep_rose/10 px-3 py-2 rounded-md font-semibold mb-2">
          Currently Paused: {displayData.currentPauseDuration}
        </p>
      )}
      {displayData.isActive && hasAccumulatedPause && (
        <p className="text-xs text-dark_purple dark:text-rose_quartz bg-nightly-deep_rose/10 px-2 py-1 rounded-md">
          Total time paused this session:{" "}
          {currentSession
            ? formatElapsedTime(currentSession.accumulatedPauseTime)
            : displayData.accumulatedPause}
        </p>
      )}
    </div>
  );
};
