import { useState, useEffect, useCallback, useRef } from "react";
import {
  PauseCooldownService,
  PauseState,
} from "../services/PauseCooldownService";
import { PauseService } from "../services/PauseService";
import { serviceLogger } from "../utils/logging";

const logger = serviceLogger("usePauseState");

interface UsePauseStateProps {
  userId: string;
  sessionId?: string;
  refreshInterval?: number; // milliseconds
}

interface UsePauseStateReturn {
  pauseState: PauseState | null;
  isLoading: boolean;
  error: string | null;
  refreshPauseState: () => Promise<void>;
  canPause: boolean;
}

export const usePauseState = ({
  userId,
  sessionId,
  refreshInterval = 30000, // 30 seconds
}: UsePauseStateProps): UsePauseStateReturn => {
  const [pauseState, setPauseState] = useState<PauseState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshPauseStateRef = useRef<() => Promise<void>>();

  const refreshPauseState = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const state = await PauseCooldownService.canUserPause(userId);
      setPauseState(state);
      logger.debug("Pause state refreshed", { userId, state });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to check pause state";
      setError(errorMessage);
      logger.error("Failed to refresh pause state", { error: err, userId });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    refreshPauseState();
  }, []); // refreshPauseState is stable (useCallback), omitted to prevent infinite loops

  // Auto-refresh for cooldown countdown
  useEffect(() => {
    if (!pauseState || pauseState.canPause) return;

    const interval = setInterval(refreshPauseState, refreshInterval);
    return () => clearInterval(interval);
    // eslint-disable-next-line zustand-safe-patterns/zustand-no-store-actions-in-deps
  }, [pauseState, refreshInterval]); // refreshPauseState is stable (useCallback), omitted to prevent infinite loops

  // Real-time cooldown countdown
  useEffect(() => {
    if (!pauseState || pauseState.canPause || !pauseState.cooldownRemaining)
      return;

    const interval = setInterval(() => {
      setPauseState((prev) => {
        if (!prev || prev.canPause || !prev.cooldownRemaining) return prev;

        const newCooldown = Math.max(0, prev.cooldownRemaining - 1);

        if (newCooldown === 0) {
          // Cooldown expired, refresh from server
          refreshPauseState();
          return prev;
        }

        return {
          ...prev,
          cooldownRemaining: newCooldown,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line zustand-safe-patterns/zustand-no-store-actions-in-deps
  }, [pauseState]); // refreshPauseState is stable (useCallback), omitted to prevent infinite loops

  return {
    pauseState,
    isLoading,
    error,
    refreshPauseState,
    canPause: pauseState?.canPause ?? false,
  };
};
