import React from "react";
import { formatElapsedTime } from "../../../utils";
import type { DBSession } from "../../../types/database";
import type { useTrackerStats } from "../../../hooks/tracker/useTrackerStats";
import { Card } from "@/components/ui";

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
  // Check if we have accumulated pause time
  const hasAccumulatedPause = currentSession
    ? currentSession.accumulatedPauseTime > 0
    : (accumulatedPauseTimeThisSession ?? 0) > 0;

  return (
    <Card
      variant="glass"
      padding="sm"
      className={`bg-lavender_web/10 dark:bg-lavender_web/5 backdrop-blur-md transition-all duration-500 h-full flex flex-col ${
        displayData.isPaused || hasAccumulatedPause
          ? "border-2 border-nightly-deep_rose/50 shadow-lg shadow-nightly-deep_rose/20"
          : "border border-rose_quartz/30"
      }`}
    >
      <p className="text-xs sm:text-sm md:text-base lg:text-lg font-medium mb-2 md:mb-3 text-lavender_web leading-tight">
        Pause Status:
      </p>
      {displayData.isPaused ? (
        <>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-nightly-deep_rose bg-nightly-deep_rose/10 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md font-semibold mb-2">
            Currently Paused: {displayData.currentPauseDuration}
          </p>
          {hasAccumulatedPause && (
            <p className="text-xs text-rose_quartz bg-nightly-deep_rose/10 px-2 py-1 rounded-md leading-relaxed">
              Total time paused this session:{" "}
              {currentSession
                ? formatElapsedTime(currentSession.accumulatedPauseTime)
                : displayData.accumulatedPause}
            </p>
          )}
        </>
      ) : hasAccumulatedPause ? (
        <p className="text-xs text-rose_quartz bg-nightly-deep_rose/10 px-2 py-1 rounded-md leading-relaxed">
          Total time paused this session:{" "}
          {currentSession
            ? formatElapsedTime(currentSession.accumulatedPauseTime)
            : displayData.accumulatedPause}
        </p>
      ) : (
        <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-lavender_web/50">
          No Pauses
        </p>
      )}
    </Card>
  );
};
