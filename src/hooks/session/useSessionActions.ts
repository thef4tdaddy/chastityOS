/**
 * Session Actions Hook
 * Provides session control operations (start, end, pause, resume, lock, unlock)
 * Extracts session action logic from ActionButtons component
 */
import { useState, useCallback, useMemo } from "react";
import { useSession } from "./useSession";
import { usePauseResume } from "./usePauseResume";
import { serviceLogger } from "../../utils/logging";
import type { DBGoal } from "../../types/database";

const logger = serviceLogger("useSessionActions");

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
  } = useSession(userId);

  const {
    pauseStatus,
    cooldownState,
    pauseSession: pauseSessionCore,
    resumeSession: resumeSessionCore,
  } = usePauseResume(userId, session?.id);

  const isPaused = pauseStatus.isPaused;
  const isPausing = pauseStatus.pauseCount > 0 && pauseStatus.isPaused;
  const isResuming = false; // Track this internally if needed

  // Permissions
  const canStart = useMemo(() => {
    return !isActive && canSelfModify && !isStarting;
  }, [isActive, canSelfModify, isStarting]);

  const canEnd = useMemo(() => {
    return isActive && canSelfModify && !isEnding;
  }, [isActive, canSelfModify, isEnding]);

  const canPause = useMemo(() => {
    return (
      isActive &&
      !isPaused &&
      pauseStatus.canResume &&
      !cooldownState.isInCooldown
    );
  }, [isActive, isPaused, pauseStatus.canResume, cooldownState.isInCooldown]);

  const canResume = useMemo(() => {
    return isActive && isPaused && pauseStatus.canResume;
  }, [isActive, isPaused, pauseStatus.canResume]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Handle errors internally
  const handleError = useCallback(
    (err: unknown, context: string) => {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error(`${context} failed`, { error, userId });
      onError?.(error);
      return error;
    },
    [userId, onError],
  );

  // Start session
  const startSession = useCallback(
    async (config?: SessionConfig): Promise<void> => {
      if (!canStart) {
        const err = new Error("Cannot start session");
        handleError(err, "Start session");
        return;
      }

      setIsStarting(true);
      setError(null);

      try {
        logger.debug("Starting session", { userId, config });

        await startSessionCore({
          goalDuration: config?.goalDuration,
          isHardcoreMode: config?.isHardcoreMode || false,
          keyholderApprovalRequired: config?.keyholderApprovalRequired || false,
          notes: config?.notes,
        });

        logger.info("Session started successfully", { userId });
        onSessionStarted?.();
      } catch (err) {
        handleError(err, "Start session");
        throw err;
      } finally {
        setIsStarting(false);
      }
    },
    [canStart, userId, startSessionCore, handleError, onSessionStarted],
  );

  // End session
  const endSession = useCallback(
    async (reason?: string): Promise<void> => {
      if (!canEnd) {
        const err = new Error("Cannot end session");
        handleError(err, "End session");
        return;
      }

      setIsEnding(true);
      setError(null);

      try {
        logger.debug("Ending session", { userId, reason });

        await stopSessionCore(reason || "User ended session");

        logger.info("Session ended successfully", { userId });
        onSessionEnded?.();
      } catch (err) {
        handleError(err, "End session");
        throw err;
      } finally {
        setIsEnding(false);
      }
    },
    [canEnd, userId, stopSessionCore, handleError, onSessionEnded],
  );

  // Pause session
  const pauseSession = useCallback(
    async (reason?: string): Promise<void> => {
      if (!canPause) {
        const err = new Error("Cannot pause session");
        handleError(err, "Pause session");
        return;
      }

      setError(null);

      try {
        logger.debug("Pausing session", { userId, reason });

        await pauseSessionCore(reason || "bathroom");

        logger.info("Session paused successfully", { userId });
        onSessionPaused?.();
      } catch (err) {
        handleError(err, "Pause session");
        throw err;
      }
    },
    [canPause, userId, pauseSessionCore, handleError, onSessionPaused],
  );

  // Resume session
  const resumeSession = useCallback(async (): Promise<void> => {
    if (!canResume) {
      const err = new Error("Cannot resume session");
      handleError(err, "Resume session");
      return;
    }

    setError(null);

    try {
      logger.debug("Resuming session", { userId });

      await resumeSessionCore();

      logger.info("Session resumed successfully", { userId });
      onSessionResumed?.();
    } catch (err) {
      handleError(err, "Resume session");
      throw err;
    }
  }, [canResume, userId, resumeSessionCore, handleError, onSessionResumed]);

  return {
    // Actions
    startSession,
    endSession,
    pauseSession,
    resumeSession,

    // State
    isStarting,
    isEnding,
    isPausing,
    isResuming,

    // Permissions
    canStart,
    canEnd,
    canPause,
    canResume,

    // Error handling
    error,
    clearError,

    // Current session info
    isActive,
    isPaused,
    sessionId: session?.id || null,
  };
}
