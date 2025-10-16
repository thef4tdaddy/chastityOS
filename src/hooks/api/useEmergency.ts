import { useMutation, useQueryClient } from "@tanstack/react-query";
import { emergencyService } from "../../services/database/EmergencyService";
import type { EmergencyUnlockReason } from "../../types/events";
import { logger } from "../../utils/logging";

/**
 * Emergency System Hooks - TanStack Query Integration
 *
 * Integrates with:
 * - EmergencyService (emergency unlock operations)
 * - EmergencyUnlockButton.tsx (component integration)
 *
 * Provides safe emergency unlock functionality with proper error handling
 */

interface EmergencyUnlockParams {
  sessionId: string;
  userId: string;
  reason: EmergencyUnlockReason;
  additionalNotes?: string;
}

interface EmergencyUnlockResult {
  success: boolean;
  message: string;
  sessionId?: string;
  timestamp?: Date;
}

/**
 * Perform emergency unlock
 * Fixes: EmergencyUnlockButton.tsx direct service import
 */
export function useEmergencyUnlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params: EmergencyUnlockParams,
    ): Promise<EmergencyUnlockResult> => {
      logger.info("Emergency unlock initiated", {
        sessionId: params.sessionId,
        userId: params.userId,
        reason: params.reason,
      });

      try {
        const result = await emergencyService.performEmergencyUnlock(params);

        if (result.success) {
          logger.info("Emergency unlock successful", {
            sessionId: params.sessionId,
            userId: params.userId,
            reason: params.reason,
          });
        } else {
          logger.error("Emergency unlock failed", {
            error: result.message,
            sessionId: params.sessionId,
            userId: params.userId,
            reason: params.reason,
          });
        }

        return result;
      } catch (error) {
        logger.error("Emergency unlock error", {
          error: error instanceof Error ? error.message : String(error),
          sessionId: params.sessionId,
          userId: params.userId,
          reason: params.reason,
        });

        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred during emergency unlock.",
        };
      }
    },
    onSuccess: (result, params) => {
      if (result.success) {
        // Invalidate session-related queries since session was terminated
        queryClient.invalidateQueries({ queryKey: ["sessions"] });
        queryClient.invalidateQueries({ queryKey: ["session", "current"] });
        queryClient.invalidateQueries({
          queryKey: ["session", "detail", params.sessionId],
        });

        // Invalidate event history to show the emergency unlock event
        queryClient.invalidateQueries({
          queryKey: ["events", "list", params.userId],
        });
        queryClient.invalidateQueries({
          queryKey: ["events", "recent", params.userId],
        });

        // Invalidate user stats that might be affected
        queryClient.invalidateQueries({
          queryKey: ["events", "stats", params.userId],
        });
      }
    },
    onError: (error, params) => {
      logger.error("Emergency unlock mutation failed", {
        error: error instanceof Error ? error.message : String(error),
        sessionId: params.sessionId,
        userId: params.userId,
        reason: params.reason,
      });
    },
  });
}

/**
 * Check if emergency unlock is available
 * Can be used to conditionally show/hide emergency button
 */
export function useEmergencyAvailable(sessionId?: string, userId?: string) {
  return {
    isAvailable: !!(sessionId && userId),
    reason: !sessionId
      ? "No active session"
      : !userId
        ? "User not authenticated"
        : null,
  };
}
