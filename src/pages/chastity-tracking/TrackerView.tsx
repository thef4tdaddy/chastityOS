import React from "react";
import { SessionLoader } from "@/components/tracker/SessionLoader";
import { SessionRecoveryModal } from "@/components/tracker/SessionRecoveryModal";
import { RestoreSessionPrompt } from "@/components/tracker/RestoreSessionPrompt";
import {
  TrackerHeader,
  type TrackerHeaderProps,
} from "@/components/tracker/TrackerHeader";
import {
  TrackerStats,
  type TrackerStatsProps,
} from "@/components/tracker/TrackerStats";
import { PauseResumeButtons } from "@/components/tracker/PauseResumeButtons";
import {
  ActionButtons,
  type ActionButtonsProps,
} from "@/components/tracker/ActionButtons";
import { ReasonModals } from "@/components/tracker/ReasonModals";
import { ErrorDisplay } from "@/components/tracker/ErrorDisplay";
import {
  FeatureErrorBoundary,
  TrackerErrorFallback,
} from "@/components/errors";
import { SessionPersistenceError } from "./SessionPersistenceError";
import { SyncIssueWarning } from "./SyncIssueWarning";
import { DebugPanel, type DebugPanelProps } from "./DebugPanel";
import type { DBSession } from "@/types/database";
import type { SessionRestorationResult } from "@/services/SessionPersistenceService";

// Props for the callbacks passed to ActionButtons
interface ActionButtonCallbacks {
  onStartSession?: () => void;
  onEndSession?: () => void;
  onBegForRelease?: () => void;
  onEmergencyUnlock?: () => void;
}

interface TrackerViewProps {
  isInitializing: boolean;
  userId?: string;
  showSessionRecovery: boolean;
  corruptedSession: DBSession | null;
  persistenceError: string | null;
  hasSyncIssue: boolean;
  isCriticalSyncIssue: boolean;
  syncIssue: { severity: "warning" | "error"; message: string } | null;
  sessionError: Error | null;
  showRestoreSessionPrompt: boolean;
  trackerHeaderProps: TrackerHeaderProps;
  trackerStatsProps: TrackerStatsProps;
  showPauseButtons: boolean;
  sessionId: string | null;
  isPaused: boolean;
  canPause: boolean;
  cooldownRemaining: number | undefined;
  trackerData: Omit<ActionButtonsProps, keyof ActionButtonCallbacks>;
  actionButtonCallbacks: ActionButtonCallbacks;
  isStarting: boolean;
  isEnding: boolean;
  showReasonModal: boolean;
  showPauseReasonModal: boolean;
  debugPanelProps: DebugPanelProps;
  handleSessionRestored: (result: SessionRestorationResult) => void;
  handleSessionInitialized: () => void;
  handleRecoverSession: (session: DBSession) => Promise<void>;
  handleDiscardSession: () => void;
  clearSessionError: () => void;
  pauseSession: (reason: string) => Promise<void>;
  resumeSession: () => Promise<void>;
}

export const TrackerView: React.FC<TrackerViewProps> = (props) => {
  const {
    isInitializing,
    userId,
    showSessionRecovery,
    corruptedSession,
    persistenceError,
    hasSyncIssue,
    isCriticalSyncIssue,
    syncIssue,
    sessionError,
    showRestoreSessionPrompt,
    trackerHeaderProps,
    trackerStatsProps,
    showPauseButtons,
    sessionId,
    isPaused,
    canPause,
    cooldownRemaining,
    trackerData,
    actionButtonCallbacks,
    isStarting,
    isEnding,
    showReasonModal,
    showPauseReasonModal,
    debugPanelProps,
    handleSessionRestored,
    handleSessionInitialized,
    handleRecoverSession,
    handleDiscardSession,
    clearSessionError,
    pauseSession,
    resumeSession,
  } = props;

  return (
    <div className="text-nightly-spring-green max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
      {isInitializing && userId && (
        <SessionLoader
          userId={userId}
          onSessionRestored={handleSessionRestored}
          onInitialized={handleSessionInitialized}
        />
      )}

      {showSessionRecovery && corruptedSession && (
        <SessionRecoveryModal
          corruptedSession={corruptedSession}
          onRecover={() => handleRecoverSession(corruptedSession)}
          onDiscard={handleDiscardSession}
        />
      )}

      {persistenceError && <SessionPersistenceError error={persistenceError} />}

      <SyncIssueWarning
        hasSyncIssue={hasSyncIssue}
        isCriticalSyncIssue={isCriticalSyncIssue}
        syncIssue={syncIssue}
      />

      {sessionError && (
        <ErrorDisplay
          error={sessionError.message}
          onDismiss={clearSessionError}
          className="mx-4"
        />
      )}

      {showRestoreSessionPrompt && (
        <RestoreSessionPrompt onConfirm={() => {}} onDiscard={() => {}} />
      )}

      <TrackerHeader {...trackerHeaderProps} />

      <FeatureErrorBoundary
        feature="chastity-tracker"
        fallback={<TrackerErrorFallback />}
      >
        <FeatureErrorBoundary
          feature="tracker-stats"
          fallback={
            <div className="p-4 text-center text-yellow-600">
              Unable to load session statistics
            </div>
          }
        >
          <TrackerStats {...trackerStatsProps} />
        </FeatureErrorBoundary>

        {showPauseButtons && (
          <FeatureErrorBoundary
            feature="pause-resume-controls"
            fallback={
              <div className="p-4 text-center text-yellow-600">
                Pause controls temporarily unavailable
              </div>
            }
          >
            <PauseResumeButtons
              sessionId={sessionId || ""}
              userId={userId || ""}
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
          </FeatureErrorBoundary>
        )}

        <FeatureErrorBoundary
          feature="action-buttons"
          fallback={
            <div className="p-4 text-center text-yellow-600">
              Session controls temporarily unavailable
            </div>
          }
        >
          <ActionButtons
            {...trackerData}
            {...actionButtonCallbacks}
            isStarting={isStarting}
            isEnding={isEnding}
          />
        </FeatureErrorBoundary>
      </FeatureErrorBoundary>

      <ReasonModals
        showReasonModal={showReasonModal}
        showPauseReasonModal={showPauseReasonModal}
      />

      <DebugPanel {...debugPanelProps} />
    </div>
  );
};
