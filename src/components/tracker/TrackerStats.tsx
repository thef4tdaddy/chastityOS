import React from "react";
import { useSessionTimer } from "../../hooks/useSessionTimer";
import { formatElapsedTime } from "../../utils";
import type { DBSession } from "../../types/database";

interface TrackerStatsProps {
  // New props for real-time timer
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

export const TrackerStats: React.FC<TrackerStatsProps> = ({
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
}) => {
  // Use the new timer hook for real-time updates when session is provided
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
      }
    : {
        effectiveTime: `${Math.floor(mainChastityDisplayTime / 3600)}h ${Math.floor((mainChastityDisplayTime % 3600) / 60)}m ${mainChastityDisplayTime % 60}s`,
        isPaused,
        currentPauseDuration: `${Math.floor(livePauseDuration / 3600)}h ${Math.floor((livePauseDuration % 3600) / 60)}m ${livePauseDuration % 60}s`,
        accumulatedPause: `${Math.floor(accumulatedPauseTimeThisSession / 3600)}h ${Math.floor((accumulatedPauseTimeThisSession % 3600) / 60)}m ${accumulatedPauseTimeThisSession % 60}s`,
        totalElapsed: topBoxTime || "0s",
        isActive: isCageOn,
      };

  return (
    <div className="space-y-6 mb-8">
      {/* Top stat card with enhanced glass effect */}
      <div className="glass-card-primary text-center glass-float">
        <p className="text-blue-200 text-sm md:text-lg font-medium mb-2">
          {topBoxLabel}
        </p>
        <p className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">
          {displayData.totalElapsed}
        </p>
      </div>

      {/* Stats grid with enhanced glass cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
            Current Session In Chastity {displayData.isPaused ? "(Paused)" : ""}
            :
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
            {displayData.effectiveTime}
          </p>
          {displayData.isPaused && (
            <p className="text-xs text-yellow-200 bg-yellow-400/10 px-2 py-1 rounded-md">
              Currently paused for: {displayData.currentPauseDuration}
            </p>
          )}
          {displayData.isActive &&
            (currentSession
              ? currentSession.accumulatedPauseTime > 0
              : accumulatedPauseTimeThisSession > 0) && (
              <p className="text-xs text-yellow-200 bg-yellow-400/10 px-2 py-1 rounded-md mt-2">
                Total time paused this session:{" "}
                {currentSession
                  ? formatElapsedTime(currentSession.accumulatedPauseTime)
                  : displayData.accumulatedPause}
              </p>
            )}
        </div>

        <div
          className={`glass-card transition-all duration-500 ${
            !displayData.isActive && timeCageOff > 0
              ? "border-red-400/30 shadow-red-400/20"
              : "glass-card-primary"
          }`}
        >
          <p className="text-sm md:text-lg font-medium mb-3 text-gray-200">
            Current Session Cage Off:
          </p>
          <p
            className={`text-2xl md:text-4xl font-bold ${
              !displayData.isActive && timeCageOff > 0
                ? "text-red-300"
                : "text-white"
            }`}
          >
            {`${Math.floor(timeCageOff / 3600)}h ${Math.floor((timeCageOff % 3600) / 60)}m ${timeCageOff % 60}s`}
          </p>
        </div>
      </div>

      {/* Total stats with subtle glass cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="glass-card glass-hover">
          <p className="text-sm md:text-lg font-medium mb-3 text-gray-200">
            Total Time In Chastity:
          </p>
          <p className="text-2xl md:text-4xl font-bold text-white">
            {`${Math.floor(totalChastityTime / 3600)}h ${Math.floor((totalChastityTime % 3600) / 60)}m ${totalChastityTime % 60}s`}
          </p>
        </div>
        <div className="glass-card glass-hover">
          <p className="text-sm md:text-lg font-medium mb-3 text-gray-200">
            Total Time Cage Off:
          </p>
          <p className="text-2xl md:text-4xl font-bold text-white">
            {`${Math.floor(totalTimeCageOff / 3600)}h ${Math.floor((totalTimeCageOff % 3600) / 60)}m ${totalTimeCageOff % 60}s`}
          </p>
        </div>
      </div>
    </div>
  );
};
