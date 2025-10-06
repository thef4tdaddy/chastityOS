/**
 * Custom hook to manage tracker data state
 * Extracted from ChastityTracking to reduce complexity
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

  // Wrap session actions to refresh lifetime stats
  const startSession = useCallback(
    async (config?: import("../session/useSessionActions").SessionConfig) => {
      await startSessionCore(config);
      await refreshLifetimeStats();
    },
    [startSessionCore, refreshLifetimeStats],
  );

  const endSession = useCallback(
    async (reason?: string) => {
      await endSessionCore(reason);
      await refreshLifetimeStats();
    },
    [endSessionCore, refreshLifetimeStats],
  );

  const pauseSession = useCallback(
    async (reason?: string) => {
      await pauseSessionCore(reason);
      await refreshLifetimeStats();
    },
    [pauseSessionCore, refreshLifetimeStats],
  );

  const resumeSession = useCallback(async () => {
    await resumeSessionCore();
    await refreshLifetimeStats();
  }, [resumeSessionCore, refreshLifetimeStats]);

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
  };
};
