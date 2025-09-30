/**
 * Pause State Management Hook
 * Manages pause status and basic pause operations
 */
import { useState, useCallback } from "react";
import type { PauseStatus, PauseReason, PauseHistoryEntry } from "../../types/pauseResume";
import {
  createPauseHistoryEntry,
  updatePauseStatusOnStart,
} from "../../utils/pauseResumeHelpers";
import { serviceLogger } from "../../utils/logging";

const logger = serviceLogger("usePauseState");

const createInitialPauseStatus = (): PauseStatus => ({
  isPaused: false,
  pauseDuration: 0,
  canResume: false,
  pauseCount: 0,
});

export function usePauseState(sessionId: string) {
  const [pauseStatus, setPauseStatus] = useState(createInitialPauseStatus);
  const [pauseHistory, setPauseHistory] = useState<PauseHistoryEntry[]>([]);

  const startPause = useCallback(
    (reason: PauseReason, initiatedBy: "submissive" | "keyholder" | "system" = "submissive") => {
      const pauseTime = new Date();
      
      setPauseStatus((prev) => updatePauseStatusOnStart(pauseTime, reason, prev));
      
      const newHistoryEntry = createPauseHistoryEntry(sessionId, pauseTime, reason, initiatedBy);
      setPauseHistory((prev) => [...prev, newHistoryEntry]);
      
      logger.debug("Pause started", { sessionId, reason, initiatedBy });
    },
    [sessionId]
  );

  const updatePauseDuration = useCallback((duration: number) => {
    setPauseStatus((prev) => ({ ...prev, pauseDuration: duration }));
  }, []);

  const incrementPauseCount = useCallback(() => {
    setPauseStatus((prev) => ({ ...prev, pauseCount: prev.pauseCount + 1 }));
  }, []);

  return {
    pauseStatus,
    pauseHistory,
    setPauseStatus,
    setPauseHistory,
    startPause,
    updatePauseDuration,
    incrementPauseCount,
  };
}
