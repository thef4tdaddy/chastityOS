import React from "react";
import { useTrackerData } from "@/hooks/tracker/useTrackerData";
import { useTrackerSession } from "@/hooks/tracker/useTrackerSession";
import { useTimerSyncMonitor } from "@/hooks/tracker/useTimerSyncMonitor";
import {
  buildAllTrackerProps,
  buildRealTrackerDataParams,
  getActionButtonCallbacks,
  shouldShowPauseButtons,
} from "./chastity-tracking/helpers";
import { useMockData } from "./chastity-tracking/useMockData";
import { TrackerView } from "./chastity-tracking/TrackerView";

const TrackerPage: React.FC = () => {
  const USE_REAL_SESSIONS = true; // TODO: Move to env var or settings for #308

  const {
    user,
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
    sessionError,
    clearSessionError,
  } = useTrackerData(USE_REAL_SESSIONS);

  const mockData = useMockData(user);

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

  const { syncIssue, hasSyncIssue, isCriticalSyncIssue } = useTimerSyncMonitor(
    USE_REAL_SESSIONS ? realSession : null,
  );

  const realTrackerData = buildRealTrackerDataParams({
    isActive,
    isPaused,
    sessionId,
    userId: user?.uid,
    goals,
    keyholderGoal: keyholderGoal ?? null,
    personalGoal: personalGoal ?? null,
    isHardcoreMode,
    duration,
  });

  realTrackerData.statsParams.realSession = realSession;
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

  const actionButtonCallbacks = getActionButtonCallbacks(
    USE_REAL_SESSIONS,
    startSession,
    endSession,
    handleEmergencyUnlock,
  );

  const debugPanelProps = {
    pauseState: mockData.pauseState,
    pauseStateLoading: mockData.pauseStateLoading,
    pauseStateError: mockData.pauseStateError,
  };

  return (
    <TrackerView
      isInitializing={isInitializing}
      userId={user?.uid}
      showSessionRecovery={showSessionRecovery}
      corruptedSession={corruptedSession}
      persistenceError={persistenceError}
      hasSyncIssue={hasSyncIssue}
      isCriticalSyncIssue={isCriticalSyncIssue}
      syncIssue={syncIssue}
      sessionError={sessionError}
      showRestoreSessionPrompt={mockData.showRestoreSessionPrompt}
      trackerHeaderProps={trackerHeaderProps}
      trackerStatsProps={trackerStatsProps}
      showPauseButtons={shouldShowPauseButtons(USE_REAL_SESSIONS, isActive)}
      sessionId={sessionId}
      isPaused={isPaused}
      canPause={canPause}
      cooldownRemaining={cooldownRemaining}
      trackerData={trackerData}
      actionButtonCallbacks={actionButtonCallbacks}
      isStarting={isStarting}
      isEnding={isEnding}
      showReasonModal={mockData.showReasonModal}
      showPauseReasonModal={mockData.showPauseReasonModal}
      debugPanelProps={debugPanelProps}
      handleSessionRestored={handleSessionRestored}
      handleSessionInitialized={handleSessionInitialized}
      handleRecoverSession={handleRecoverSession}
      handleDiscardSession={handleDiscardSession}
      clearSessionError={clearSessionError}
      pauseSession={pauseSession}
      resumeSession={resumeSession}
    />
  );
};

export default TrackerPage;
