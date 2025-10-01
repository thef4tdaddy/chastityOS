import React from "react";
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
import { useTrackerHandlers } from "../hooks/useTrackerHandlers";
import { logger } from "../utils/logging";
import type { DBSession } from "../types/database";
import type { SessionRestorationResult } from "../services/SessionPersistenceService";

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
    logger.info("Session recovery initiated", { sessionId: session.id });
    try {
      await backupSession(session);
      setCurrentSession(session);
      startHeartbeat(session.id);
      setShowSessionRecovery(false);
      setCorruptedSession(null);
      logger.info("Session recovery completed", { sessionId: session.id });
    } catch (error) {
      logger.error("Session recovery failed", { error: error as Error });
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

// Session Persistence Error Component
const SessionPersistenceError: React.FC<{ error: string }> = ({ error }) => (
  <div className="mx-4 mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg">
    <p className="text-sm text-red-200">
      <strong>Session Error:</strong> {error}
    </p>
  </div>
);

// Cooldown Display Component
const CooldownDisplay: React.FC<{
  pauseState: { cooldownRemaining?: number } | null;
}> = ({ pauseState }) => {
  if (!pauseState?.cooldownRemaining) return null;

  return (
    <div className="mx-4 text-center">
      <div className="text-yellow-600">
        Cooldown: {pauseState.cooldownRemaining}s remaining
      </div>
    </div>
  );
};

// Debug Panel Component
interface PauseState {
  canPause: boolean;
  cooldownRemaining?: number;
  lastPauseTime?: Date;
  nextPauseAvailable?: Date;
}

const DebugPanel: React.FC<{
  pauseState: PauseState | null;
  pauseStateLoading: boolean;
  pauseStateError: string | null;
}> = ({ pauseState, pauseStateLoading, pauseStateError }) => {
  if (process.env.NODE_ENV !== "development") return null;

  return (
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
  );
};

// Custom hook for session state management
const useSessionState = () => {
  const [currentSession, setCurrentSession] = useState<DBSession | null>(null);
  const [showSessionRecovery, setShowSessionRecovery] = useState(false);
  const [isSessionInitialized, setIsSessionInitialized] = useState(false);
  const [corruptedSession, setCorruptedSession] = useState<DBSession | null>(
    null,
  );

  return {
    currentSession,
    setCurrentSession,
    showSessionRecovery,
    setShowSessionRecovery,
    isSessionInitialized,
    setIsSessionInitialized,
    corruptedSession,
    setCorruptedSession,
  };
};

// Custom hook for mock data (temporary until real implementation)
const useMockData = (user: User | null) => {
  // Mock pause state data for now
  const pauseState: PauseState = {
    canPause: true,
    cooldownRemaining: undefined,
    lastPauseTime: undefined,
    nextPauseAvailable: undefined,
  };
  const pauseStateLoading = false;
  const pauseStateError = null;
  const refreshPauseState = () => {};

  // Mock session data - replace with real session management
  const mockSessionData = {
    isCageOn: true,
    isPaused: false,
    remainingGoalTime: 3600,
    keyholderName: "Keyholder",
    savedSubmissivesName: "Submissive",
    requiredKeyholderDurationSeconds: 7200,
    mainChastityDisplayTime: 3600,
    topBoxLabel: "Total Locked Time",
    topBoxTime: "1d 2h 3m",
    livePauseDuration: 0,
    accumulatedPauseTimeThisSession: 0,
    timeCageOff: 0,
    totalChastityTime: 86400,
    totalTimeCageOff: 0,
    showRestoreSessionPrompt: false,
    pauseCooldownMessage: null,
    denialCooldownActive: false,
    hasPendingReleaseRequest: false,
    isGoalActive: true,
    isHardcoreGoal: false,
    showReasonModal: false,
    showPauseReasonModal: false,
    useRealTimeTimer: false, // Feature flag for real-time timer
    sessionId: "mock-session-123",
    userId: user?.uid || "mock-user-123",
  };

  // Override pause state for demo - show that pause is available
  const mockPauseState = {
    canPause: true,
    lastPauseTime: undefined,
    nextPauseAvailable: undefined,
    cooldownRemaining: undefined,
  };

  return {
    pauseState,
    pauseStateLoading,
    pauseStateError,
    refreshPauseState,
    ...mockSessionData,
    mockPauseState,
  };
};

const TrackerPage: React.FC = () => {
  // Authentication state
  const { data: user, isLoading: authLoading } = useAuth();

  // Session persistence state
  const {
    isInitializing,
    error: persistenceError,
    backupSession,
    startHeartbeat,
    stopHeartbeat,
  } = useSessionPersistence({
    userId: user?.uid,
    autoInitialize: true,
  });

  // Session state management
  const {
    currentSession,
    setCurrentSession,
    showSessionRecovery,
    setShowSessionRecovery,
    isSessionInitialized,
    setIsSessionInitialized,
    corruptedSession,
    setCorruptedSession,
  } = useSessionState();

  // Mock data (replace with real hooks)
  const mockData = useMockData(user);

  // Use tracker handlers hook for event handlers and effects
  const {
    handleSessionInitialized,
    handleEmergencyUnlock,
    handlePause,
    handleResume,
  } = useTrackerHandlers({
    setCurrentSession,
    setIsSessionInitialized,
    startHeartbeat,
    stopHeartbeat,
    backupSession,
    mockData: {
      sessionId: mockData.sessionId,
      userId: mockData.userId,
      refreshPauseState: mockData.refreshPauseState,
    },
    currentSession,
    isSessionInitialized,
  });

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

  // Helper to compute TrackerStats props based on timer mode
  const getTrackerStatsProps = () => {
    const baseProps = {
      topBoxLabel: mockData.topBoxLabel,
      timeCageOff: mockData.timeCageOff,
      isCageOn: mockData.isCageOn,
      totalChastityTime: mockData.totalChastityTime,
      totalTimeCageOff: mockData.totalTimeCageOff,
      isPaused: mockData.isPaused,
    };

    if (mockData.useRealTimeTimer) {
      return {
        ...baseProps,
        currentSession,
        mainChastityDisplayTime: undefined,
        topBoxTime: undefined,
        livePauseDuration: undefined,
        accumulatedPauseTimeThisSession: undefined,
      };
    }

    return {
      ...baseProps,
      currentSession: undefined,
      mainChastityDisplayTime: mockData.mainChastityDisplayTime,
      topBoxTime: mockData.topBoxTime,
      livePauseDuration: mockData.livePauseDuration,
      accumulatedPauseTimeThisSession: mockData.accumulatedPauseTimeThisSession,
    };
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
      {persistenceError && <SessionPersistenceError error={persistenceError} />}

      {mockData.showRestoreSessionPrompt && (
        <RestoreSessionPrompt onConfirm={() => {}} onDiscard={() => {}} />
      )}

      <TrackerHeader
        remainingGoalTime={mockData.remainingGoalTime}
        keyholderName={mockData.keyholderName}
        savedSubmissivesName={mockData.savedSubmissivesName}
        requiredKeyholderDurationSeconds={
          mockData.requiredKeyholderDurationSeconds
        }
        isCageOn={mockData.isCageOn}
        denialCooldownActive={mockData.denialCooldownActive}
        pauseCooldownMessage={mockData.pauseCooldownMessage}
      />

      <TrackerStats {...getTrackerStatsProps()} />

      {/* Enhanced Pause Controls with 4-hour cooldown */}
      {mockData.isCageOn && currentSession && (
        <>
          <CooldownDisplay pauseState={mockData.pauseState} />
          <PauseResumeButtons
            sessionId={currentSession.id}
            userId={user?.uid || ""}
            isPaused={mockData.isPaused}
            pauseState={mockData.mockPauseState} // Use mock state to show functionality
            onPause={handlePause}
            onResume={handleResume}
          />
        </>
      )}

      <ActionButtons
        isCageOn={mockData.isCageOn}
        isGoalActive={mockData.isGoalActive}
        isHardcoreGoal={mockData.isHardcoreGoal}
        requiredKeyholderDurationSeconds={
          mockData.requiredKeyholderDurationSeconds
        }
        hasPendingReleaseRequest={mockData.hasPendingReleaseRequest}
        sessionId={mockData.sessionId}
        userId={mockData.userId}
        onEmergencyUnlock={handleEmergencyUnlock}
      />

      <ReasonModals
        showReasonModal={mockData.showReasonModal}
        showPauseReasonModal={mockData.showPauseReasonModal}
      />

      <DebugPanel
        pauseState={mockData.pauseState}
        pauseStateLoading={mockData.pauseStateLoading}
        pauseStateError={mockData.pauseStateError}
      />
    </div>
  );
};

export default TrackerPage;
