/**
 * Session Actions Hook
 * Provides session control operations (start, end, pause, resume, lock, unlock)
 * Extracts session action logic from ActionButtons component
 */
import { useState, useCallback, useMemo } from "react";
import { useSession } from "./useSession";
import { usePauseResume } from "./usePauseResume";
import { serviceLogger } from "../../utils/logging";
import type { DBGoal, DBSession } from "../../types/database";

const logger = serviceLogger("useSessionActions");

/**
 * Helper function to handle session start
 */
async function handleStartSession(
  canStart: boolean,
  userId: string,
  config: SessionConfig | undefined,
  actions: {
    startSessionCore: (config: {
      goalDuration?: number;
      isHardcoreMode: boolean;
      keyholderApprovalRequired: boolean;
      notes?: string;
    }) => Promise<void>;
    handleError: (err: unknown, context: string) => Error;
    setIsStarting: (value: boolean) => void;
    setError: (error: Error | null) => void;
    onSessionStarted?: () => void;
  },
): Promise<void> {
  if (!canStart) {
    const err = new Error("Cannot start session");
    actions.handleError(err, "Start session");
    return;
  }

  actions.setIsStarting(true);
  actions.setError(null);

  try {
    logger.debug("Starting session", { userId });

    await actions.startSessionCore({
      goalDuration: config?.goalDuration,
      isHardcoreMode: config?.isHardcoreMode || false,
      keyholderApprovalRequired: config?.keyholderApprovalRequired || false,
      notes: config?.notes,
    });

    logger.info("Session started successfully", { userId });
    actions.onSessionStarted?.();
  } catch (err) {
    actions.handleError(err, "Start session");
    throw err;
  } finally {
    actions.setIsStarting(false);
  }
}

/**
 * Helper function to handle session end
 */
async function handleEndSession(
  canEnd: boolean,
  userId: string,
  reason: string | undefined,
  actions: {
    stopSessionCore: (reason: string) => Promise<void>;
    handleError: (err: unknown, context: string) => Error;
    setIsEnding: (value: boolean) => void;
    setError: (error: Error | null) => void;
    onSessionEnded?: () => void;
  },
): Promise<void> {
  if (!canEnd) {
    const err = new Error("Cannot end session");
    actions.handleError(err, "End session");
    return;
  }

  actions.setIsEnding(true);
  actions.setError(null);

  try {
    logger.debug("Ending session", { userId, reason });

    await actions.stopSessionCore(reason || "User ended session");

    logger.info("Session ended successfully", { userId });
    actions.onSessionEnded?.();
  } catch (err) {
    actions.handleError(err, "End session");
    throw err;
  } finally {
    actions.setIsEnding(false);
  }
}

/**
 * Helper function to handle session pause
 */
async function handlePauseSession(
  canPause: boolean,
  userId: string,
  reason: string | undefined,
  actions: {
    pauseSessionCore: (reason: string) => Promise<void>;
    handleError: (err: unknown, context: string) => Error;
    setError: (error: Error | null) => void;
    onSessionPaused?: () => void;
  },
): Promise<void> {
  if (!canPause) {
    const err = new Error("Cannot pause session");
    actions.handleError(err, "Pause session");
    return;
  }

  actions.setError(null);

  try {
    logger.debug("Pausing session", { userId, reason });

    await actions.pauseSessionCore(reason || "bathroom");

    logger.info("Session paused successfully", { userId });
    actions.onSessionPaused?.();
  } catch (err) {
    actions.handleError(err, "Pause session");
    throw err;
  }
}

/**
 * Helper function to handle session resume
 */
async function handleResumeSession(
  canResume: boolean,
  userId: string,
  actions: {
    resumeSessionCore: () => Promise<void>;
    handleError: (err: unknown, context: string) => Error;
    setError: (error: Error | null) => void;
    onSessionResumed?: () => void;
  },
): Promise<void> {
  if (!canResume) {
    const err = new Error("Cannot resume session");
    actions.handleError(err, "Resume session");
    return;
  }

  actions.setError(null);

  try {
    logger.debug("Resuming session", { userId });

    await actions.resumeSessionCore();

    logger.info("Session resumed successfully", { userId });
    actions.onSessionResumed?.();
  } catch (err) {
    actions.handleError(err, "Resume session");
    throw err;
  }
}

/**
 * Helper hook to calculate session action permissions
 */
function useSessionPermissions(params: {
  isActive: boolean;
  canSelfModify: boolean;
  isStarting: boolean;
  isEnding: boolean;
  isPaused: boolean;
  pauseStatus: { canResume: boolean };
  cooldownState: { isInCooldown: boolean };
}) {
  const canStart = useMemo(() => {
    return !params.isActive && params.canSelfModify && !params.isStarting;
  }, [params.isActive, params.canSelfModify, params.isStarting]);

  const canEnd = useMemo(() => {
    return params.isActive && params.canSelfModify && !params.isEnding;
  }, [params.isActive, params.canSelfModify, params.isEnding]);

  const canPause = useMemo(() => {
    const result =
      params.isActive && !params.isPaused && !params.cooldownState.isInCooldown;
    logger.debug("Calculating canPause", {
      isActive: params.isActive,
      isPaused: params.isPaused,
      isInCooldown: params.cooldownState.isInCooldown,
      canPause: result,
    });
    return result;
  }, [params.isActive, params.isPaused, params.cooldownState.isInCooldown]);

  const canResume = useMemo(() => {
    return params.isActive && params.isPaused && params.pauseStatus.canResume;
  }, [params.isActive, params.isPaused, params.pauseStatus.canResume]);

  return { canStart, canEnd, canPause, canResume };
}

export interface SessionConfig {
  goalDuration?: number;
  isHardcoreMode?: boolean;
  keyholderApprovalRequired?: boolean;
  goals?: DBGoal[];
  notes?: string;
}

export interface UseSessionActionsReturn {
  // Actions
  startSession: (config?: SessionConfig) => Promise<void>;
  endSession: (reason?: string) => Promise<void>;
  pauseSession: (reason?: string) => Promise<void>;
  resumeSession: () => Promise<void>;

  // State
  isStarting: boolean;
  isEnding: boolean;
  isPausing: boolean;
  isResuming: boolean;

  // Permissions
  canStart: boolean;
  canEnd: boolean;
  canPause: boolean;
  canResume: boolean;

  // Error handling
  error: Error | null;
  clearError: () => void;

  // Current session info
  isActive: boolean;
  isPaused: boolean;
  sessionId: string | null;
  session: DBSession | null;
  goals: { active: DBGoal[]; completed: DBGoal[] } | null;
  duration: number;

  // Pause/cooldown info
  timeUntilNextPause: number;
  cooldownRemaining: number;
}

export interface UseSessionActionsOptions {
  userId: string;
  onSessionStarted?: () => void;
  onSessionEnded?: () => void;
  onSessionPaused?: () => void;
  onSessionResumed?: () => void;
  onError?: (error: Error) => void;
}

export function useSessionActions({
  userId,
  onSessionStarted,
  onSessionEnded,
  onSessionPaused,
  onSessionResumed,
  onError,
}: UseSessionActionsOptions): UseSessionActionsReturn {
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use existing session management hooks
  const {
    session,
    isActive,
    startSession: startSessionCore,
    stopSession: stopSessionCore,
    canSelfModify,
    refreshSession,
    duration: sessionDuration,
  } = useSession(userId);

  const {
    pauseStatus,
    cooldownState,
    pauseSession: pauseSessionCore,
    resumeSession: resumeSessionCore,
    timeUntilNextPause,
  } = usePauseResume(session?.id || "", undefined);
  const isPaused = pauseStatus.isPaused;
  const isPausing = pauseStatus.pauseCount > 0 && pauseStatus.isPaused;
  const isResuming = false;

  logger.debug("Session state for permissions", {
    isActive,
    canSelfModify,
    isPaused,
    sessionId: session?.id,
    cooldownIsInCooldown: cooldownState.isInCooldown,
    pauseStatusIsPaused: pauseStatus.isPaused,
  });

  const { canStart, canEnd, canPause, canResume } = useSessionPermissions({
    isActive,
    canSelfModify,
    isStarting,
    isEnding,
    isPaused,
    pauseStatus,
    cooldownState,
  });

  const clearError = useCallback(() => setError(null), []);

  // Handle errors internally
  const handleError = useCallback(
    (err: unknown, context: string) => {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error(`${context} failed`, {
        error,
        errorMessage: error.message,
        errorStack: error.stack,
        userId,
      });
      onError?.(error);
      return error;
    },
    [userId, onError],
  );

  const startSession = useCallback(
    async (config?: SessionConfig): Promise<void> => {
      await handleStartSession(canStart, userId, config, {
        startSessionCore,
        handleError,
        setIsStarting,
        setError,
        onSessionStarted,
      });
    },
    [canStart, userId, startSessionCore, handleError, onSessionStarted],
  );

  const endSession = useCallback(
    async (reason?: string): Promise<void> => {
      await handleEndSession(canEnd, userId, reason, {
        stopSessionCore,
        handleError,
        setIsEnding,
        setError,
        onSessionEnded,
      });
    },
    [canEnd, userId, stopSessionCore, handleError, onSessionEnded],
  );

  const pauseSession = useCallback(
    async (reason?: string): Promise<void> => {
      await handlePauseSession(canPause, userId, reason, {
        pauseSessionCore,
        handleError,
        setError,
        onSessionPaused,
      });
      // Immediately refresh session to update UI
      await refreshSession();
    },
    [
      canPause,
      userId,
      pauseSessionCore,
      handleError,
      onSessionPaused,
      refreshSession,
    ],
  );

  const resumeSession = useCallback(async (): Promise<void> => {
    await handleResumeSession(canResume, userId, {
      resumeSessionCore,
      handleError,
      setError,
      onSessionResumed,
    });
    // Immediately refresh session to update UI
    await refreshSession();
  }, [
    canResume,
    userId,
    resumeSessionCore,
    handleError,
    onSessionResumed,
    refreshSession,
  ]);

  return {
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    isStarting,
    isEnding,
    isPausing,
    isResuming,
    canStart,
    canEnd,
    canPause,
    canResume,
    error,
    clearError,
    isActive,
    isPaused,
    sessionId: session?.id || null,
    session,
    goals: null, // TODO: Add goals from useSession
    duration: sessionDuration,
    timeUntilNextPause,
    cooldownRemaining: timeUntilNextPause,
  };
}
