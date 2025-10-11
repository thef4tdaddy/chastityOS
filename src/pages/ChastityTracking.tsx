import React from "react";
import { RestoreSessionPrompt } from "../components/tracker/RestoreSessionPrompt";
import { SessionLoader } from "../components/tracker/SessionLoader";
import { SessionRecoveryModal } from "../components/tracker/SessionRecoveryModal";
import { TrackerStats } from "../components/tracker/TrackerStats";
import { ActionButtons } from "../components/tracker/ActionButtons";
import { PauseResumeButtons } from "../components/tracker/PauseResumeButtons";
import { ReasonModals } from "../components/tracker/ReasonModals";
import { TrackerHeader } from "../components/tracker/TrackerHeader";
import { useTrackerData } from "../hooks/tracker/useTrackerData";
import { useTrackerSession } from "../hooks/tracker/useTrackerSession";
import { logger } from "../utils/logging";
import {
  buildTrackerStatsProps,
  buildTrackerData,
  buildTrackerHeaderProps,
  buildMockTrackerData,
  buildMockTrackerStatsProps,
} from "../utils/tracker/trackerProps";
import type { User } from "../types/core";
import {
  FeatureErrorBoundary,
  TrackerErrorFallback,
} from "../components/errors";

// Session Persistence Error Component
const SessionPersistenceError: React.FC<{ error: string }> = ({ error }) => (
  <div className="mx-4 mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg">
    <p className="text-sm text-red-200">
      <strong>Session Error:</strong> {error}
    </p>
  </div>
);

// Helper to check if session loader should show
const shouldShowSessionLoader = (
  authLoading: boolean,
  isInitializing: boolean,
  userId?: string,
) => (authLoading || isInitializing) && !!userId;

// Helper to check if session recovery should show
const shouldShowSessionRecovery = (showRecovery: boolean, session: unknown) =>
  showRecovery && !!session;

// Helper to check if pause buttons should show
const shouldShowPauseButtons = (useRealSessions: boolean, isActive: boolean) =>
  useRealSessions && isActive;

// Helper to get action button callbacks
const getActionButtonCallbacks = (
  useRealSessions: boolean,
  startSession: () => Promise<void>,
  endSession: (reason?: string) => Promise<void>,
  handleEmergencyUnlock: () => Promise<void>,
) => ({
  onStartSession: useRealSessions ? startSession : undefined,
  onEndSession: useRealSessions
    ? () => endSession("User ended session")
    : undefined,
  onBegForRelease: useRealSessions
    ? () => logger.info("Beg for release - TODO: implement")
    : undefined,
  onEmergencyUnlock: handleEmergencyUnlock,
});

interface RealTrackerData {
  trackerDataParams: {
    isActive: boolean;
    isPaused: boolean;
    sessionId: string | null;
    userId: string | undefined;
    goals: {
      active?: import("@/types/database").DBGoal[];
      keyholderAssigned?: import("@/types/database").DBGoal[];
    };
    keyholderGoal: import("@/types/database").DBGoal | undefined;
    personalGoal: import("@/types/database").DBGoal | undefined;
    isHardcoreMode: boolean;
    duration: number;
  };
  statsParams: {
    isActive: boolean;
    isPaused: boolean;
    realSession: import("@/types/database").DBSession | null;
    totalChastityTime: number;
    totalCageOffTime: number;
    personalGoal: import("@/types/database").DBGoal | undefined;
  };
  goals?: {
    active?: import("@/types/database").DBGoal[];
    keyholderAssigned?: import("@/types/database").DBGoal[];
  };
  isActive: boolean;
}

// Helper to build all component props at once
const buildAllTrackerProps = (
  useRealSessions: boolean,
  realData: RealTrackerData | null,
  mockData: unknown,
  currentSession: unknown,
) => {
  const real = realData;
  const mock = mockData as {
    isCageOn: boolean;
    isPaused: boolean;
    remainingGoalTime?: number;
    keyholderName?: string;
    savedSubmissivesName?: string;
    requiredKeyholderDurationSeconds?: number;
    totalChastityTime: number;
    [key: string]: unknown;
  };
  const trackerData =
    useRealSessions && real
      ? buildTrackerData(real.trackerDataParams)
      : buildMockTrackerData(mock);

  const trackerStatsProps =
    useRealSessions && real
      ? buildTrackerStatsProps(real.statsParams)
      : buildMockTrackerStatsProps(
          mock,
          currentSession as
            | import("@/types/database").DBSession
            | null
            | undefined,
        );

  const trackerHeaderProps =
    useRealSessions && real
      ? buildTrackerHeaderProps(real.goals || {}, real.isActive)
      : {
          remainingGoalTime: mock.remainingGoalTime ?? 0,
          keyholderName: mock.keyholderName ?? "",
          savedSubmissivesName: mock.savedSubmissivesName ?? "",
          requiredKeyholderDurationSeconds:
            mock.requiredKeyholderDurationSeconds ?? 0,
          isCageOn: mock.isCageOn,
        };

  return { trackerData, trackerStatsProps, trackerHeaderProps };
};

// Helper to build real tracker data params
const buildRealTrackerDataParams = (params: {
  isActive: boolean;
  isPaused: boolean;
  sessionId: string | null;
  userId: string | undefined;
  goals: { active: import("@/types/database").DBGoal[] } | null;
  keyholderGoal: import("@/types/database").DBGoal | null;
  personalGoal: import("@/types/database").DBGoal | null;
  isHardcoreMode: boolean;
  duration: number;
}): RealTrackerData => {
  const {
    isActive,
    isPaused,
    sessionId,
    userId,
    goals,
    keyholderGoal,
    personalGoal,
    isHardcoreMode,
    duration,
  } = params;

  const goalsData = goals
    ? { active: goals.active, keyholderAssigned: [] }
    : { active: [], keyholderAssigned: [] };

  return {
    trackerDataParams: {
      isActive,
      isPaused,
      sessionId,
      userId,
      goals: goalsData,
      keyholderGoal: keyholderGoal ?? undefined,
      personalGoal: personalGoal ?? undefined,
      isHardcoreMode,
      duration,
    },
    statsParams: {
      isActive,
      isPaused,
      realSession: null, // Will be set by caller
      totalChastityTime: 0, // Will be set by caller
      totalCageOffTime: 0, // Will be set by caller
      personalGoal: personalGoal ?? undefined,
    },
    goals: goals ? { active: goals.active, keyholderAssigned: [] } : undefined,
    isActive,
  };
};

// Cooldown Display Component (currently unused but kept for future use)
const _CooldownDisplay: React.FC<{
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

// Custom hook for mock data (DEMO VERSION - keep for #308)
// Real version uses useSessionActions + useSession
const useMockData = (user: User | null | undefined) => {
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
  // Feature flag: set to true to use real session hooks, false for demo/mock
  const USE_REAL_SESSIONS = true; // TODO: Move to env var or settings for #308

  // Get tracker data using extracted hook
  const {
    user,
    authLoading,
    isActive,
    isPaused,
    sessionId,
    realSession,
    goals,
    duration,
    canPause,
    cooldownRemaining,
    isStarting,
    isEnding,
    lifetimeStats,
    keyholderGoal,
    personalGoal,
    isHardcoreMode,
    startSession,
    endSession,
    pauseSession,
    resumeSession,
  } = useTrackerData(USE_REAL_SESSIONS);

  // Mock data (for demo version - keep for #308)
  const mockData = useMockData(user);

  // Session management
  const {
    isInitializing,
    persistenceError,
    currentSession,
    showSessionRecovery,
    corruptedSession,
    handleSessionInitialized,
    handleEmergencyUnlock,
    handleSessionRestored,
    handleRecoverSession,
    handleDiscardSession,
  } = useTrackerSession(user?.uid, mockData);

  // Build all component props
  const realTrackerData = buildRealTrackerDataParams({
    isActive,
    isPaused,
    sessionId,
    userId: user?.uid,
    goals,
    keyholderGoal,
    personalGoal,
    isHardcoreMode,
    duration,
  });

  // Add session and stats data
  realTrackerData.statsParams.realSession = realSession as
    | import("@/types/database").DBSession
    | null;
  realTrackerData.statsParams.totalChastityTime =
    lifetimeStats.totalChastityTime;
  realTrackerData.statsParams.totalCageOffTime = lifetimeStats.totalCageOffTime;

  const { trackerData, trackerStatsProps, trackerHeaderProps } =
    buildAllTrackerProps(
      USE_REAL_SESSIONS,
      realTrackerData,
      mockData,
      currentSession,
    );

  return (
    <div className="text-nightly-spring-green max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
      {shouldShowSessionLoader(authLoading, isInitializing, user?.uid) && (
        <SessionLoader
          userId={user!.uid}
          onSessionRestored={handleSessionRestored}
          onInitialized={handleSessionInitialized}
        />
      )}

      {shouldShowSessionRecovery(showSessionRecovery, corruptedSession) && (
        <SessionRecoveryModal
          corruptedSession={corruptedSession!}
          onRecover={handleRecoverSession}
          onDiscard={handleDiscardSession}
        />
      )}

      {persistenceError && <SessionPersistenceError error={persistenceError} />}

      {mockData.showRestoreSessionPrompt && (
        <RestoreSessionPrompt onConfirm={() => {}} onDiscard={() => {}} />
      )}

      <TrackerHeader
        {...trackerHeaderProps}
        denialCooldownActive={mockData.denialCooldownActive}
        pauseCooldownMessage={mockData.pauseCooldownMessage}
      />

      <FeatureErrorBoundary
        feature="chastity-tracker"
        fallback={<TrackerErrorFallback />}
      >
        <TrackerStats {...trackerStatsProps} />

        {shouldShowPauseButtons(USE_REAL_SESSIONS, isActive) && (
          <PauseResumeButtons
            sessionId={sessionId || ""}
            userId={user?.uid || ""}
            isPaused={isPaused}
            pauseState={{
              canPause,
              cooldownRemaining,
              lastPauseTime: undefined,
              nextPauseAvailable: undefined,
            }}
            onPause={() => pauseSession("bathroom")}
            onResume={resumeSession}
          />
        )}

        <ActionButtons
          {...trackerData}
          {...getActionButtonCallbacks(
            USE_REAL_SESSIONS,
            startSession,
            endSession,
            handleEmergencyUnlock,
          )}
          isStarting={USE_REAL_SESSIONS && isStarting}
          isEnding={USE_REAL_SESSIONS && isEnding}
        />
      </FeatureErrorBoundary>

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
