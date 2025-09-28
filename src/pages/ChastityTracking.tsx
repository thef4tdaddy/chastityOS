import React, { useState, useEffect } from "react";
import { RestoreSessionPrompt } from "../components/tracker/RestoreSessionPrompt";
import { TrackerStats } from "../components/tracker/TrackerStats";
import { ActionButtons } from "../components/tracker/ActionButtons";
import { PauseResumeButtons } from "../components/tracker/PauseResumeButtons";
// TODO: CooldownTimer temporarily disabled due to service import restrictions
// import { CooldownTimer } from "../components/tracker/CooldownTimer";
import { ReasonModals } from "../components/tracker/ReasonModals";
import { TrackerHeader } from "../components/tracker/TrackerHeader";
import { logger } from "../utils/logging";
import type { DBSession } from "../types/database";
// TODO: Replace with proper hook pattern
// import { usePauseState } from "../hooks/usePauseState";
// import { SessionService } from "../services/api/session-service";

const TrackerPage: React.FC = () => {
  // Mock data - in a real app this would come from context/hooks
  const [currentSession, setCurrentSession] = useState<DBSession | null>(null);
  const [userId] = useState("user123"); // This would come from auth context
  const [useRealTimeTimer, setUseRealTimeTimer] = useState(false);

  // TODO: Replace with proper hook pattern
  // const {
  //   pauseState,
  //   isLoading: pauseStateLoading,
  //   error: pauseStateError,
  //   refreshPauseState,
  // } = usePauseState({ userId, sessionId: currentSession?.id });

  // Mock pause state data for now
  const pauseState = {
    canPause: true,
    cooldownRemaining: undefined,
    lastPauseTime: undefined,
    nextPauseAvailable: undefined,
  };
  const pauseStateLoading = false;
  const pauseStateError = null;
  const refreshPauseState = () => {};

  // Mock session data - replace with real session management
  const isCageOn = true;
  const isPaused = false;
  const remainingGoalTime = 3600;
  const keyholderName = "Keyholder";
  const savedSubmissivesName = "Submissive";
  const requiredKeyholderDurationSeconds = 7200;
  const mainChastityDisplayTime = 3600;
  const topBoxLabel = "Total Locked Time";
  const topBoxTime = "1d 2h 3m";
  const livePauseDuration = 0;
  const accumulatedPauseTimeThisSession = 0;
  const timeCageOff = 0;
  const totalChastityTime = 86400;
  const totalTimeCageOff = 0;
  const showRestoreSessionPrompt = false;
  const pauseCooldownMessage = null;
  const denialCooldownActive = false;
  const hasPendingReleaseRequest = false;
  const isGoalActive = true;
  const isHardcoreGoal = false;
  const showReasonModal = false;
  const showPauseReasonModal = false;
  const _showEmergencyUnlockModal = false;

  // Mock session data for emergency unlock
  const sessionId = "mock-session-123";

  const handleEmergencyUnlock = () => {
    // This would typically refresh the session state or redirect
    logger.info("Emergency unlock completed - refreshing session state", {
      sessionId,
      userId,
    });
  };

  // Initialize mock session with real DBSession structure
  useEffect(() => {
    const mockSession: DBSession = {
      id: "session123",
      userId: "user123",
      startTime: new Date(Date.now() - 86400000), // 1 day ago
      endTime: undefined,
      isPaused: false,
      pauseStartTime: undefined,
      accumulatedPauseTime: 3600, // 1 hour of accumulated pause time
      goalDuration: 172800, // 48 hour goal
      isHardcoreMode: false,
      keyholderApprovalRequired: false,
      syncStatus: "synced" as const,
      lastModified: new Date(),
    };
    setCurrentSession(mockSession);
  }, []);

  const handlePause = () => {
    logger.info("Session paused", { sessionId: currentSession?.id, userId });
    refreshPauseState();
  };

  const handleResume = () => {
    logger.info("Session resumed", { sessionId: currentSession?.id, userId });
    refreshPauseState();
  };

  // Override pause state for demo - show that pause is available
  const mockPauseState = {
    canPause: true,
    lastPauseTime: undefined,
    nextPauseAvailable: undefined,
    cooldownRemaining: undefined,
  };

  return (
    <div className="text-nightly-spring-green">
      {/* Real-time Timer Demo Toggle */}
      <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg mb-4 mx-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-300">
              🚀 Real-time Timer Demo
            </h3>
            <p className="text-sm text-gray-300">
              Toggle to see the new real-time timer functionality in action
            </p>
          </div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={useRealTimeTimer}
              onChange={(e) => setUseRealTimeTimer(e.target.checked)}
              className="mr-2"
            />
            <span className="text-blue-300">Use Real-time Timer</span>
          </label>
        </div>
      </div>

      {showRestoreSessionPrompt && (
        <RestoreSessionPrompt onConfirm={() => {}} onDiscard={() => {}} />
      )}

      <TrackerHeader
        remainingGoalTime={remainingGoalTime}
        keyholderName={keyholderName}
        savedSubmissivesName={savedSubmissivesName}
        requiredKeyholderDurationSeconds={requiredKeyholderDurationSeconds}
        isCageOn={isCageOn}
        denialCooldownActive={denialCooldownActive}
        pauseCooldownMessage={pauseCooldownMessage}
      />

      <TrackerStats
        // Pass the real session when using real-time timer
        currentSession={useRealTimeTimer ? currentSession : undefined}
        // Legacy props for backward compatibility
        mainChastityDisplayTime={
          useRealTimeTimer ? undefined : mainChastityDisplayTime
        }
        topBoxLabel={topBoxLabel}
        topBoxTime={useRealTimeTimer ? undefined : topBoxTime}
        livePauseDuration={useRealTimeTimer ? undefined : livePauseDuration}
        accumulatedPauseTimeThisSession={
          useRealTimeTimer ? undefined : accumulatedPauseTimeThisSession
        }
        timeCageOff={timeCageOff}
        isCageOn={isCageOn}
        totalChastityTime={totalChastityTime}
        totalTimeCageOff={totalTimeCageOff}
        isPaused={isPaused}
      />

      {/* Enhanced Pause Controls with 4-hour cooldown */}
      {isCageOn && currentSession && (
        <>
          {pauseState &&
            !pauseState.canPause &&
            pauseState.cooldownRemaining && (
              <div className="mx-4 text-center">
                {/* TODO: Replace with proper CooldownTimer component */}
                <div className="text-yellow-600">
                  Cooldown: {pauseState.cooldownRemaining}s remaining
                </div>
              </div>
            )}

          <PauseResumeButtons
            sessionId={currentSession.id}
            userId={userId}
            isPaused={isPaused}
            pauseState={mockPauseState} // Use mock state to show functionality
            onPause={handlePause}
            onResume={handleResume}
          />
        </>
      )}

      <ActionButtons
        isCageOn={isCageOn}
        isGoalActive={isGoalActive}
        isHardcoreGoal={isHardcoreGoal}
        requiredKeyholderDurationSeconds={requiredKeyholderDurationSeconds}
        hasPendingReleaseRequest={hasPendingReleaseRequest}
        sessionId={sessionId}
        userId={userId}
        onEmergencyUnlock={handleEmergencyUnlock}
      />

      <ReasonModals
        showReasonModal={showReasonModal}
        showPauseReasonModal={showPauseReasonModal}
      />

      {/* Debug info for development */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-8 p-4 bg-gray-800 rounded-lg text-xs">
          <h4 className="text-yellow-400 font-bold mb-2">Debug: Pause State</h4>
          <pre className="text-gray-300">
            {JSON.stringify(
              {
                canPause: pauseState?.canPause,
                cooldownRemaining: pauseState?.cooldownRemaining,
                lastPauseTime: pauseState?.lastPauseTime,
                nextPauseAvailable: pauseState?.nextPauseAvailable,
                isLoading: pauseStateLoading,
                error: pauseStateError,
              },
              null,
              2,
            )}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TrackerPage;
