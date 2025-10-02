/**
 * Keyholder Actions for Pause/Resume System
 *
 * Provides keyholder-specific control actions for pause/resume functionality
 * including force pause, force resume, and cooldown overrides.
 */
import { useCallback } from "react";
import { serviceLogger } from "../../utils/logging";
import type { KeyholderOverrideCapabilities } from "../../types/pauseResume";

const logger = serviceLogger("usePauseKeyholderActions");

interface UsePauseKeyholderActionsProps {
  sessionId: string;
  keyholderOverrides: KeyholderOverrideCapabilities;
  startPause: (reason: string, initiator?: string) => void;
  resumeSession: () => Promise<void>;
  clearCooldown: () => void;
}

export const usePauseKeyholderActions = ({
  sessionId,
  keyholderOverrides,
  startPause,
  resumeSession,
  clearCooldown,
}: UsePauseKeyholderActionsProps) => {
  // Keyholder force pause
  const keyholderForcePause = useCallback(
    async (reason: string): Promise<void> => {
      if (!keyholderOverrides.canForcePause) {
        throw new Error("Keyholder does not have force pause permissions");
      }

      try {
        logger.debug("Keyholder forcing pause", { sessionId, reason });
        startPause("keyholder_request", "keyholder");
        logger.info("Keyholder force pause successful", { sessionId });
      } catch (err) {
        logger.error("Failed to execute keyholder force pause", { error: err });
        throw err;
      }
    },
    [keyholderOverrides.canForcePause, sessionId, startPause],
  );

  // Keyholder force resume
  const keyholderForceResume = useCallback(
    async (reason: string): Promise<void> => {
      if (!keyholderOverrides.canForceResume) {
        throw new Error("Keyholder does not have force resume permissions");
      }

      try {
        logger.debug("Keyholder forcing resume", { sessionId, reason });
        await resumeSession();
        logger.info("Keyholder force resume successful", { sessionId });
      } catch (err) {
        logger.error("Failed to execute keyholder force resume", {
          error: err,
        });
        throw err;
      }
    },
    [keyholderOverrides.canForceResume, sessionId, resumeSession],
  );

  // Keyholder override cooldown
  const keyholderOverrideCooldown = useCallback(
    async (reason: string): Promise<void> => {
      if (!keyholderOverrides.canOverrideCooldown) {
        throw new Error(
          "Keyholder does not have cooldown override permissions",
        );
      }

      try {
        logger.debug("Keyholder overriding cooldown", { sessionId, reason });
        clearCooldown();
        logger.info("Keyholder cooldown override successful", { sessionId });
      } catch (err) {
        logger.error("Failed to execute keyholder cooldown override", {
          error: err,
        });
        throw err;
      }
    },
    [keyholderOverrides.canOverrideCooldown, sessionId, clearCooldown],
  );

  return {
    keyholderForcePause,
    keyholderForceResume,
    keyholderOverrideCooldown,
  };
};
