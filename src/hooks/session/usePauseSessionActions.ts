/**
 * usePauseSessionActions Hook
 * Handles core pause and resume actions
 */
import { useCallback } from "react";
import { serviceLogger } from "@/utils/logging";
import {
  calculatePauseDuration,
  updatePauseHistoryOnResume,
  updatePauseStatusOnResume,
} from "@/utils/pauseResumeHelpers";
import { calculateCooldownDuration } from "@/utils/pauseAnalytics";
import { NotificationService } from "@/services/notifications";
import type {
  PauseReason,
  PauseStatus,
  PauseHistoryEntry,
  PauseAnalytics,
  KeyholderOverrideCapabilities,
  CooldownState,
} from "@/types/pauseResume";

const logger = serviceLogger("usePauseSessionActions");

export interface UsePauseSessionActionsOptions {
  sessionId: string;
  userId?: string;
  keyholderUserId?: string;
  submissiveName?: string;
  canPause: boolean;
  canResume: boolean;
  pauseStatus: PauseStatus;
  cooldownState: CooldownState;
  pauseAnalytics: PauseAnalytics;
  keyholderOverrides: KeyholderOverrideCapabilities;
  startPause: (
    reason: PauseReason,
    initiatedBy?: "submissive" | "keyholder" | "system",
  ) => void;
  setPauseStatus: (status: PauseStatus) => void;
  setPauseHistory: (
    updater: (prev: PauseHistoryEntry[]) => PauseHistoryEntry[],
  ) => void;
  startCooldown: (duration: number, canOverride: boolean) => void;
}

export function usePauseSessionActions({
  sessionId,
  userId,
  keyholderUserId,
  submissiveName,
  canPause,
  canResume,
  pauseStatus,
  cooldownState,
  pauseAnalytics,
  keyholderOverrides,
  startPause,
  setPauseStatus,
  setPauseHistory,
  startCooldown,
}: UsePauseSessionActionsOptions) {
  // Pause session
  const pauseSession = useCallback(
    async (reason: PauseReason): Promise<void> => {
      if (!sessionId || sessionId.trim() === "") {
        const error = new Error("No active session to pause");
        logger.error("Pause session failed", { error, sessionId });
        throw error;
      }

      if (!canPause) {
        logger.warn("Cannot pause: either already paused or in cooldown", {
          sessionId,
          isPaused: pauseStatus.isPaused,
          isInCooldown: cooldownState.isInCooldown,
        });
        return;
      }

      try {
        logger.debug("Pausing session", { sessionId, reason });

        // Import sessionDBService dynamically to avoid circular dependencies
        const { sessionDBService } = await import("../../services/database");
        await sessionDBService.pauseSession(sessionId, new Date());

        startPause(reason);
        logger.info("Session paused successfully", { sessionId, reason });

        // Notify keyholder if applicable
        if (userId && keyholderUserId) {
          NotificationService.notifySessionPaused({
            sessionId,
            userId,
            keyholderUserId,
            submissiveName,
          }).catch((error) => {
            logger.warn("Failed to send session paused notification", {
              error,
            });
          });
        }
      } catch (err) {
        logger.error("Failed to pause session", { error: err, sessionId });
        throw err;
      }
    },
    [
      canPause,
      sessionId,
      startPause,
      cooldownState.isInCooldown,
      pauseStatus.isPaused,
      userId,
      keyholderUserId,
      submissiveName,
    ],
  );

  // Resume session
  const resumeSession = useCallback(async (): Promise<void> => {
    if (!sessionId || sessionId.trim() === "") {
      const error = new Error("No active session to resume");
      logger.error("Resume session failed", { error, sessionId });
      throw error;
    }

    if (!canResume) {
      const error = new Error("Cannot resume: session is not paused");
      logger.error("Resume session failed", { error, sessionId });
      throw error;
    }

    try {
      logger.debug("Resuming session", { sessionId });

      const resumeTime = new Date();
      const duration = calculatePauseDuration(
        pauseStatus.pauseStartTime,
        resumeTime,
      );

      // Import sessionDBService dynamically to avoid circular dependencies
      const { sessionDBService } = await import("../../services/database");
      await sessionDBService.resumeSession(sessionId, resumeTime);

      setPauseStatus(updatePauseStatusOnResume(pauseStatus));
      setPauseHistory((prev) =>
        updatePauseHistoryOnResume(prev, resumeTime, duration),
      );

      const cooldownDur = calculateCooldownDuration(pauseAnalytics, duration);
      logger.info("Starting cooldown after resume", {
        sessionId,
        cooldownSeconds: cooldownDur,
        pauseDuration: duration,
      });
      startCooldown(cooldownDur, keyholderOverrides.canOverrideCooldown);

      logger.info("Session resumed successfully", {
        sessionId,
        pauseDuration: duration,
      });

      // Notify keyholder if applicable
      if (userId && keyholderUserId) {
        NotificationService.notifySessionResumed({
          sessionId,
          userId,
          keyholderUserId,
          submissiveName,
        }).catch((error) => {
          logger.warn("Failed to send session resumed notification", { error });
        });
      }
    } catch (err) {
      logger.error("Failed to resume session", { error: err, sessionId });
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
    userId,
    keyholderUserId,
    submissiveName,
  ]);

  return {
    pauseSession,
    resumeSession,
  };
}
