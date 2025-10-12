import React from "react";
import { useSessionTimer } from "../../hooks/useSessionTimer";
import type { DBSession } from "../../types/database";
import {
  FaClock,
  FaPlay,
  FaPause,
  FaStop,
  FaTrophy,
} from "../../utils/iconImport";
import { Card } from "@/components/ui";

// Session Status Helper Component
const SessionStatusDisplay: React.FC<{
  currentSession: DBSession | null;
  timerData: ReturnType<typeof useSessionTimer>;
}> = ({ currentSession, timerData }) => {
  const getSessionStatus = () => {
    if (!currentSession)
      return {
        status: "No Active Session",
        icon: FaStop,
        color: "text-gray-400",
      };
    if (currentSession.isPaused)
      return { status: "Paused", icon: FaPause, color: "text-yellow-400" };
    return { status: "Active", icon: FaPlay, color: "text-green-400" };
  };

  const sessionStatus = getSessionStatus();
  const StatusIcon = sessionStatus.icon;

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <StatusIcon className={`${sessionStatus.color} text-base sm:text-lg`} />
        <span className={`text-base sm:text-lg font-medium ${sessionStatus.color}`}>
          {sessionStatus.status}
        </span>
      </div>
      {currentSession && (
        <>
          <div className="text-2xl sm:text-3xl font-mono text-nightly-honeydew mb-2">
            {timerData.effectiveTimeFormatted}
          </div>
          <div className="text-xs sm:text-sm text-nightly-celadon break-words px-2">
            Started: {currentSession.startTime.toLocaleDateString()}{" "}
            {currentSession.startTime.toLocaleTimeString()}
          </div>
          {currentSession.goalDuration && (
            <div className="text-xs sm:text-sm text-nightly-celadon">
              Goal: {timerData.remainingGoalTimeFormatted} remaining
            </div>
          )}
          {timerData.isPaused && timerData.currentPauseDuration > 0 && (
            <div className="text-xs sm:text-sm text-yellow-400 mt-2">
              Current pause: {timerData.currentPauseDurationFormatted}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Session Details Helper Component
const SessionDetailsDisplay: React.FC<{
  currentSession: DBSession | null;
  timerData: ReturnType<typeof useSessionTimer>;
}> = ({ currentSession, timerData }) => {
  if (!currentSession) return null;

  return (
    <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
      <div className="flex justify-between gap-2">
        <span className="text-nightly-celadon">Mode:</span>
        <span className="text-nightly-honeydew text-right">
          {currentSession.isHardcoreMode ? "Hardcore" : "Normal"}
        </span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="text-nightly-celadon">Total Time:</span>
        <span className="text-nightly-honeydew text-right">
          {timerData.totalElapsedTimeFormatted}
        </span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="text-nightly-celadon">Accumulated Pause:</span>
        <span className="text-nightly-honeydew text-right">
          {currentSession.accumulatedPauseTime > 0
            ? `${Math.floor(currentSession.accumulatedPauseTime / 60)}m ${currentSession.accumulatedPauseTime % 60}s`
            : "0s"}
        </span>
      </div>
      {currentSession.goalDuration && (
        <>
          <div className="flex justify-between gap-2">
            <span className="text-nightly-celadon">Goal Progress:</span>
            <span className="text-nightly-honeydew text-right">
              {timerData.goalProgress.toFixed(1)}%
            </span>
          </div>
          {timerData.isGoalCompleted && (
            <div className="text-center mt-2 animate-bounce-celebration">
              <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm animate-pulse-glow">
                <FaTrophy className="text-yellow-400" />
                Goal Completed!
              </span>
            </div>
          )}
        </>
      )}
      <div className="flex justify-between gap-2">
        <span className="text-nightly-celadon">Keyholder Approval:</span>
        <span className="text-nightly-honeydew text-right break-words">
          {currentSession.keyholderApprovalRequired
            ? "Required"
            : "Not Required"}
        </span>
      </div>
    </div>
  );
};

// Main Current Status Section Component
export const CurrentStatusSection: React.FC<{
  currentSession: DBSession | null;
}> = ({ currentSession }) => {
  const timerData = useSessionTimer(currentSession);

  return (
    <Card variant="glass" className="mb-4 sm:mb-6 animate-fade-in-up">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <FaClock className="text-nightly-aquamarine text-lg sm:text-xl" />
        <h2 className="text-lg sm:text-xl font-semibold text-nightly-honeydew">
          Current Status
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="animate-slide-in-right">
          <SessionStatusDisplay
            currentSession={currentSession}
            timerData={timerData}
          />
        </div>
        <div className="animate-slide-in-right stagger-2">
          <SessionDetailsDisplay
            currentSession={currentSession}
            timerData={timerData}
          />
        </div>
      </div>
    </Card>
  );
};

export default CurrentStatusSection;
