import { useSessionTimer } from "../useSessionTimer";
import type { DBSession } from "../../types/database";

export interface UseTrackerStatsProps {
  currentSession?: DBSession | null;
  // Legacy props for backward compatibility
  topBoxLabel?: string;
  topBoxTime?: string;
  mainChastityDisplayTime?: number;
  isPaused?: boolean;
  livePauseDuration?: number;
  accumulatedPauseTimeThisSession?: number;
  isCageOn?: boolean;
  timeCageOff?: number;
  totalChastityTime?: number;
  totalTimeCageOff?: number;
}

export interface UseTrackerStatsReturn {
  // Display data
  displayData: {
    effectiveTime: string;
    isPaused: boolean;
    currentPauseDuration: string;
    accumulatedPause: string;
    totalElapsed: string;
    isActive: boolean;
    timeCageOff: number;
    totalPauseTime: number;
  };

  // Formatted stats
  stats: {
    topBoxLabel: string;
    totalElapsedFormatted: string;
    currentSessionFormatted: string;
    cageOffTimeFormatted: string;
    totalChastityTimeFormatted: string;
    totalCageOffTimeFormatted: string;
  };

  // State
  isLoading: boolean;
}

// Helper function to format time in seconds to h:m:s
const formatTimeFromSeconds = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours}h ${minutes}m ${remainingSeconds}s`;
};

export const useTrackerStats = ({
  currentSession,
  topBoxLabel = "Total Locked Time",
  topBoxTime,
  mainChastityDisplayTime = 0,
  isPaused = false,
  livePauseDuration = 0,
  accumulatedPauseTimeThisSession = 0,
  isCageOn = false,
  timeCageOff = 0,
  totalChastityTime = 0,
  totalTimeCageOff = 0,
}: UseTrackerStatsProps): UseTrackerStatsReturn => {
  // Use the session timer hook for real-time updates when session is provided
  const timerData = useSessionTimer(currentSession);

  // Use real-time data if session is provided, otherwise fall back to props
  const displayData = currentSession
    ? {
        effectiveTime: timerData.effectiveTimeFormatted,
        isPaused: timerData.isPaused,
        currentPauseDuration: timerData.currentPauseDurationFormatted,
        accumulatedPause: timerData.currentPauseDurationFormatted,
        totalElapsed: timerData.totalElapsedTimeFormatted,
        isActive: timerData.isActive,
        timeCageOff: timerData.currentCageOffTime,
        totalPauseTime: timerData.totalSessionPauseTime,
      }
    : {
        effectiveTime: formatTimeFromSeconds(mainChastityDisplayTime),
        isPaused,
        currentPauseDuration: formatTimeFromSeconds(livePauseDuration),
        accumulatedPause: formatTimeFromSeconds(
          accumulatedPauseTimeThisSession,
        ),
        totalElapsed: topBoxTime || "0s",
        isActive: isCageOn,
        timeCageOff: timeCageOff,
        totalPauseTime: 0,
      };

  // Format all the stats for display
  // Note: totalChastityTime and totalTimeCageOff props should come from useLifetimeStats
  // which already includes all sessions and real-time calculations
  const stats = {
    topBoxLabel,
    totalElapsedFormatted: displayData.totalElapsed,
    currentSessionFormatted: displayData.effectiveTime,
    cageOffTimeFormatted: formatTimeFromSeconds(displayData.timeCageOff),
    totalChastityTimeFormatted: formatTimeFromSeconds(totalChastityTime),
    totalCageOffTimeFormatted: formatTimeFromSeconds(totalTimeCageOff),
  };

  return {
    displayData,
    stats,
    isLoading: false, // Could be connected to actual loading states in the future
  };
};
