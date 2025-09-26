import React, { useState, useEffect } from "react";
import { EmergencyUnlockModal } from "../components/tracker/EmergencyUnlockModal";
import { RestoreSessionPrompt } from "../components/tracker/RestoreSessionPrompt";
import { TrackerStats } from "../components/tracker/TrackerStats";
import { ActionButtons } from "../components/tracker/ActionButtons";
import { PauseResumeButtons } from "../components/tracker/PauseResumeButtons";
import { CooldownTimer } from "../components/tracker/CooldownTimer";
import { ReasonModals } from "../components/tracker/ReasonModals";
import { TrackerHeader } from "../components/tracker/TrackerHeader";
import { logger } from "../utils/logging";
import { usePauseState } from "../hooks/usePauseState";
import { SessionService } from "../services/api/session-service";

const TrackerPage: React.FC = () => {
  // Mock data - in a real app this would come from context/hooks
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [userId] = useState("user123"); // This would come from auth context

  const {
    pauseState,
    isLoading: pauseStateLoading,
    error: pauseStateError,
    refreshPauseState,
  } = usePauseState({ userId, sessionId: currentSession?.id });

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
  const showEmergencyUnlockModal = false;

  // Mock session data for emergency unlock
  const sessionId = "mock-session-123";

  const handleEmergencyUnlock = () => {
    // This would typically refresh the session state or redirect
    logger.info("Emergency unlock completed - refreshing session state", {
      sessionId,
      userId,
    });
  };

  // Initialize mock session
  useEffect(() => {
    setCurrentSession({
      id: "session123",
      userId: "user123",
      startTime: new Date(Date.now() - 86400000), // 1 day ago
      isPaused: false,
      accumulatedPauseTime: 0,
    });
  }, []);

  const handlePause = () => {
    console.log("Session paused");
    refreshPauseState();
  };

  const handleResume = () => {
    console.log("Session resumed");
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
        mainChastityDisplayTime={mainChastityDisplayTime}
        topBoxLabel={topBoxLabel}
        topBoxTime={topBoxTime}
        livePauseDuration={livePauseDuration}
        accumulatedPauseTimeThisSession={accumulatedPauseTimeThisSession}
        timeCageOff={timeCageOff}
        isCageOn={isCageOn}
        totalChastityTime={totalChastityTime}
        totalTimeCageOff={totalTimeCageOff}
      />

      {/* Enhanced Pause Controls with 4-hour cooldown */}
      {isCageOn && currentSession && (
        <>
          {pauseState &&
            !pauseState.canPause &&
            pauseState.cooldownRemaining && (
              <CooldownTimer
                cooldownSeconds={pauseState.cooldownRemaining}
                className="mx-4"
              />
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
        isPaused={isPaused}
        denialCooldownActive={denialCooldownActive}
        hasPendingReleaseRequest={hasPendingReleaseRequest}
        isGoalActive={isGoalActive}
        isHardcoreGoal={isHardcoreGoal}
        requiredKeyholderDurationSeconds={requiredKeyholderDurationSeconds}
        sessionId={sessionId}
        userId={userId}
        onEmergencyUnlock={handleEmergencyUnlock}
      />

      <ReasonModals
        showReasonModal={showReasonModal}
        showPauseReasonModal={showPauseReasonModal}
        showEmergencyUnlockModal={showEmergencyUnlockModal}
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
