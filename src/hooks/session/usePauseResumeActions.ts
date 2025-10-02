/**
 * Basic Pause/Resume Actions
 *
 * Core pause and resume session actions with validation and state updates.
 */
import { useCallback } from "react";
import { serviceLogger } from "../../utils/logging";
import {
  calculatePauseDuration,
  updatePauseHistoryOnResume,
  updatePauseStatusOnResume,
} from "../../utils/pauseResumeHelpers";
import { calculateCooldownDuration } from "../../utils/pauseAnalytics";
import type {
  PauseReason,
  PauseStatus,
  PauseHistoryEntry,
  PauseAnalytics,
  KeyholderOverrideCapabilities,
} from "../../types/pauseResume";

const logger = serviceLogger("usePauseResumeActions");

interface UsePauseResumeActionsProps {
  sessionId: string;
  canPause: boolean;
  canResume: boolean;
  pauseStatus: PauseStatus;
  pauseAnalytics: PauseAnalytics;
  keyholderOverrides: KeyholderOverrideCapabilities;
  startPause: (reason: PauseReason, initiator?: string) => void;
  setPauseStatus: (status: PauseStatus) => void;
  setPauseHistory: (
    updater: (prev: PauseHistoryEntry[]) => PauseHistoryEntry[],
  ) => void;
  startCooldown: (duration: number, canOverride: boolean) => void;
}

export const usePauseResumeActions = ({
  sessionId,
  canPause,
  canResume,
  pauseStatus,
  pauseAnalytics,
  keyholderOverrides,
  startPause,
  setPauseStatus,
  setPauseHistory,
  startCooldown,
}: UsePauseResumeActionsProps) => {
  // Pause session
  const pauseSession = useCallback(
    async (reason: PauseReason): Promise<void> => {
      if (!canPause) {
        throw new Error("Cannot pause: either already paused or in cooldown");
      }

      try {
        logger.debug("Pausing session", { sessionId, reason });
        startPause(reason);
        logger.info("Session paused successfully", { sessionId, reason });
      } catch (err) {
        logger.error("Failed to pause session", { error: err });
        throw err;
      }
    },
    [canPause, sessionId, startPause],
  );

  // Resume session
  const resumeSession = useCallback(async (): Promise<void> => {
    if (!canResume) {
      throw new Error("Cannot resume: session is not paused");
    }

    try {
      logger.debug("Resuming session", { sessionId });

      const resumeTime = new Date();
      const duration = calculatePauseDuration(
        pauseStatus.pauseStartTime,
        resumeTime,
      );

      setPauseStatus(updatePauseStatusOnResume(pauseStatus));
      setPauseHistory((prev) =>
        updatePauseHistoryOnResume(prev, resumeTime, duration),
      );

      const cooldownDur = calculateCooldownDuration(pauseAnalytics, duration);
      startCooldown(cooldownDur, keyholderOverrides.canOverrideCooldown);

      logger.info("Session resumed successfully", {
        sessionId,
        pauseDuration: duration,
      });
    } catch (err) {
      logger.error("Failed to resume session", { error: err });
      throw err;
    }
  }, [
    canResume,
    sessionId,
    pauseStatus,
    pauseAnalytics,
    keyholderOverrides.canOverrideCooldown,
    setPauseStatus,
    setPauseHistory,
    startCooldown,
  ]);

  return {
    pauseSession,
    resumeSession,
  };
};
