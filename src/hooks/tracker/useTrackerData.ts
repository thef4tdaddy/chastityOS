/**
 * Custom hook to manage tracker data state
 * Extracted from ChastityTracking to reduce complexity
 * Enhanced with retry mechanisms for failed operations
 */

import { useCallback } from "react";
import { useAuth } from "../api/useAuth";
import { useSessionActions } from "../session/useSessionActions";
import { useLifetimeStats } from "../stats/useLifetimeStats";
import {
  useKeyholderRequiredDurationQuery,
  usePersonalGoalQuery,
} from "../api/usePersonalGoalQueries";
import { logger } from "@/utils/logging";
import { useRetryableOperation } from "./useRetryableOperation";
import type { PauseReason } from "@/types/pauseResume";

export const useTrackerData = (_USE_REAL_SESSIONS: boolean) => {
  // Authentication state
  const { user, isLoading: authLoading } = useAuth();

  // Real session hooks
  const sessionActions = useSessionActions({
    userId: user?.uid || "",
    onSessionStarted: () => logger.info("Session started"),
    onSessionEnded: () => logger.info("Session ended"),
    onSessionPaused: () => logger.info("Session paused"),
    onSessionResumed: () => logger.info("Session resumed"),
  });

  const {
    startSession: startSessionCore,
    endSession: endSessionCore,
    pauseSession: pauseSessionCore,
    resumeSession: resumeSessionCore,
    isActive,
    isPaused,
    sessionId,
    session: realSession,
    goals,
    duration,
    canPause,
    cooldownRemaining,
    isStarting,
    isEnding,
  } = sessionActions;

  // Lifetime stats
  const lifetimeStats = useLifetimeStats(user?.uid);
  const { refresh: refreshLifetimeStats } = lifetimeStats;

  // Goals
  const { data: keyholderGoal } = useKeyholderRequiredDurationQuery(user?.uid);
  const { data: personalGoal } = usePersonalGoalQuery(user?.uid);

  // Check if current goal is hardcore mode
  const isHardcoreMode = personalGoal?.isHardcoreMode || false;

  // Initialize retry mechanism for session operations
  const { executeWithRetry, isRetrying } = useRetryableOperation({
    maxRetries: 2,
    baseDelay: 1000,
    retryableErrors: ["network", "timeout", "fetch", "ECONNRESET"],
  });

  // Wrap session actions with retry logic and refresh lifetime stats
  const startSession = useCallback(
    async (config?: import("../session/useSessionActions").SessionConfig) => {
      await executeWithRetry(async () => {
        await startSessionCore(config);
        await refreshLifetimeStats();
      }, "startSession");
    },
    [startSessionCore, refreshLifetimeStats, executeWithRetry],
  );

  const endSession = useCallback(
    async (reason?: string) => {
      await executeWithRetry(async () => {
        await endSessionCore(reason);
        await refreshLifetimeStats();
      }, "endSession");
    },
    [endSessionCore, refreshLifetimeStats, executeWithRetry],
  );

  const pauseSession = useCallback(
    async (reason?: PauseReason) => {
      await executeWithRetry(async () => {
        await pauseSessionCore(reason);
        await refreshLifetimeStats();
      }, "pauseSession");
    },
    [pauseSessionCore, refreshLifetimeStats, executeWithRetry],
  );

  const resumeSession = useCallback(async () => {
    await executeWithRetry(async () => {
      await resumeSessionCore();
      await refreshLifetimeStats();
    }, "resumeSession");
  }, [resumeSessionCore, refreshLifetimeStats, executeWithRetry]);

  return {
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
    // Expose session action errors and retry state
    sessionError: sessionActions.error,
    clearSessionError: sessionActions.clearError,
    isRetrying,
  };
};
