import React, { useState, useEffect } from "react";
import { RestoreSessionPrompt } from "../components/tracker/RestoreSessionPrompt";
import { SessionLoader } from "../components/tracker/SessionLoader";
import { SessionRecoveryModal } from "../components/tracker/SessionRecoveryModal";
import { TrackerStats } from "../components/tracker/TrackerStats";
import { ActionButtons } from "../components/tracker/ActionButtons";
import { PauseResumeButtons } from "../components/tracker/PauseResumeButtons";
// TODO: CooldownTimer temporarily disabled due to service import restrictions
// import { CooldownTimer } from "../components/tracker/CooldownTimer";
import { ReasonModals } from "../components/tracker/ReasonModals";
import { TrackerHeader } from "../components/tracker/TrackerHeader";
import { useSessionPersistence } from "../hooks/useSessionPersistence";
import { useAuth } from "../hooks/api/useAuth";
import { logger } from "../utils/logging";
import type { DBSession } from "../types/database";
import type { SessionRestorationResult } from "../services/SessionPersistenceService";
// TODO: Replace with proper hook pattern
// import { usePauseState } from "../hooks/usePauseState";
// import { SessionService } from "../services/api/session-service";

// Helper function to handle session restoration
const createSessionRestorationHandler =
  (
    setCurrentSession: (session: DBSession | null) => void,
    startHeartbeat: (sessionId: string) => void,
    setCorruptedSession: (session: DBSession | null) => void,
    setShowSessionRecovery: (show: boolean) => void,
  ) =>
  (result: SessionRestorationResult) => {
    logger.info("Session restoration completed", {
      wasRestored: result.wasRestored,
      sessionId: result.session?.id,
    });

    if (result.session) {
      setCurrentSession(result.session);
      startHeartbeat(result.session.id);

      // If session had validation issues but was recovered, show recovery modal
      if (result.error && result.session) {
        setCorruptedSession(result.session);
        setShowSessionRecovery(true);
      }
    }
  };

// Helper function to handle session recovery
const createSessionRecoveryHandler =
  (
    setCurrentSession: (session: DBSession | null) => void,
    backupSession: (session: DBSession) => Promise<void>,
    startHeartbeat: (sessionId: string) => void,
    setShowSessionRecovery: (show: boolean) => void,
    setCorruptedSession: (session: DBSession | null) => void,
  ) =>
  async (session: DBSession) => {
    try {
      setCurrentSession(session);
      await backupSession(session);
      startHeartbeat(session.id);
      setShowSessionRecovery(false);
      setCorruptedSession(null);
      logger.info("Session recovered successfully", { sessionId: session.id });
    } catch (error) {
      logger.error("Failed to recover session", { error: error as Error });
    }
  };

// Helper function to handle session discard
const createSessionDiscardHandler =
  (
    setCurrentSession: (session: DBSession | null) => void,
    setShowSessionRecovery: (show: boolean) => void,
    setCorruptedSession: (session: DBSession | null) => void,
    stopHeartbeat: () => void,
  ) =>
  () => {
    setCurrentSession(null);
    setShowSessionRecovery(false);
    setCorruptedSession(null);
    stopHeartbeat();
    logger.info("Corrupted session discarded");
  };

const TrackerPage: React.FC = () => {
  // Authentication state
  const { data: user, isLoading: authLoading } = useAuth();

  // Session persistence state
  const {
    isInitializing,
    restorationResult,
    error: persistenceError,
    isSessionRestored,
    backupSession,
    startHeartbeat,
    stopHeartbeat,
  } = useSessionPersistence({
    userId: user?.uid,
    autoInitialize: true,
  });

  // Session state
  const [currentSession, setCurrentSession] = useState<DBSession | null>(null);
  const [showSessionRecovery, setShowSessionRecovery] = useState(false);
  const [isSessionInitialized, setIsSessionInitialized] = useState(false);
  const [corruptedSession, setCorruptedSession] = useState<DBSession | null>(
    null,
  );

  // Create handlers using helper functions
  const handleSessionRestored = createSessionRestorationHandler(
    setCurrentSession,
    startHeartbeat,
    setCorruptedSession,
    setShowSessionRecovery,
  );

  const handleRecoverSession = createSessionRecoveryHandler(
    setCurrentSession,
    backupSession,
    startHeartbeat,
    setShowSessionRecovery,
    setCorruptedSession,
  );

  const handleDiscardSession = createSessionDiscardHandler(
    setCurrentSession,
    setShowSessionRecovery,
    setCorruptedSession,
    stopHeartbeat,
  );

  // Handle session persistence initialization
  const handleSessionInitialized = () => {
    setIsSessionInitialized(true);
    logger.debug("Session persistence initialized");
  };

  // Backup session state when it changes
  useEffect(() => {
    if (currentSession && isSessionInitialized) {
      backupSession(currentSession).catch((error) => {
        logger.error("Failed to backup session", { error: error as Error });
      });
    }
  }, [currentSession, isSessionInitialized, backupSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopHeartbeat();
    };
  }, [stopHeartbeat]);

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
  const useRealTimeTimer = false; // Feature flag for real-time timer

  // Mock session data for emergency unlock
  const sessionId = "mock-session-123";
  const userId = user?.uid || "mock-user-123";

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
      {/* Session Persistence Loading */}
      {(authLoading || isInitializing) && user?.uid && (
        <SessionLoader
          userId={user.uid}
          onSessionRestored={handleSessionRestored}
          onInitialized={handleSessionInitialized}
        />
      )}

      {/* Session Recovery Modal */}
      {showSessionRecovery && corruptedSession && (
        <SessionRecoveryModal
          corruptedSession={corruptedSession}
          onRecover={handleRecoverSession}
          onDiscard={handleDiscardSession}
        />
      )}

      {/* Session Persistence Error */}
      {persistenceError && (
        <div className="mx-4 mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg">
          <p className="text-sm text-red-200">
            <strong>Session Error:</strong> {persistenceError}
          </p>
        </div>
      )}

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
            userId={user?.uid || ""}
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
