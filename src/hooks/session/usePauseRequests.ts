/**
 * usePauseRequests Hook
 * Handles pause requests (emergency and cooldown override)
 */
import { useCallback } from "react";
import { serviceLogger } from "../../utils/logging";
import type {
  PauseReason,
  PauseRequestStatus,
  OverrideRequestStatus,
  CooldownState,
} from "../../types/pauseResume";

const logger = serviceLogger("usePauseRequests");

export function usePauseRequests(
  sessionId: string,
  relationshipId: string | undefined,
  cooldownState: CooldownState,
  pauseSession: (reason: PauseReason) => Promise<void>,
) {
  // Emergency pause
  const requestEmergencyPause = useCallback(
    async (reason: string): Promise<PauseRequestStatus> => {
      try {
        logger.debug("Requesting emergency pause", { sessionId, reason });

        if (cooldownState.isInCooldown) {
          logger.warn("Emergency pause bypassing cooldown", { sessionId });
        }

        await pauseSession("emergency");

        return {
          approved: true,
          reason: "Emergency pause approved automatically",
          requestId: `emergency_${Date.now()}`,
          approvedBy: "emergency_protocol",
          approvedAt: new Date(),
        };
      } catch (err) {
        logger.error("Failed to request emergency pause", { error: err });
        return {
          approved: false,
          reason: err instanceof Error ? err.message : "Unknown error",
          requestId: `emergency_${Date.now()}`,
        };
      }
    },
    [sessionId, cooldownState.isInCooldown, pauseSession],
  );

  // Request cooldown override
  const requestCooldownOverride = useCallback(
    async (justification: string): Promise<OverrideRequestStatus> => {
      if (!relationshipId) {
        return {
          approved: false,
          reason: "Cooldown override requires keyholder relationship",
          requestId: `override_${Date.now()}`,
          overrideType: "cooldown",
        };
      }

      try {
        logger.debug("Requesting cooldown override", {
          sessionId,
          justification,
        });

        return {
          approved: false,
          reason: "Override request sent to keyholder",
          requestId: `override_${Date.now()}`,
          overrideType: "cooldown",
        };
      } catch (err) {
        logger.error("Failed to request cooldown override", { error: err });
        return {
          approved: false,
          reason: err instanceof Error ? err.message : "Unknown error",
          requestId: `override_${Date.now()}`,
          overrideType: "cooldown",
        };
      }
    },
    [sessionId, relationshipId],
  );

  return {
    requestEmergencyPause,
    requestCooldownOverride,
  };
}
