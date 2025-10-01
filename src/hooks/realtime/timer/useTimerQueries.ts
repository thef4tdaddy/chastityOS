/**
 * Timer Query Hook - Query and filter timers
 */
import { useCallback } from "react";
import {
  LiveTimer,
  LiveTimerState,
  TimerStatus,
  TimerType,
} from "../../../types/realtime";

interface UseTimerQueriesParams {
  timerState: LiveTimerState;
}

export const useTimerQueries = ({ timerState }: UseTimerQueriesParams) => {
  // Get timer by ID
  const getTimer = useCallback(
    (timerId: string): LiveTimer | null => {
      return timerState.activeTimers.find((t) => t.id === timerId) || null;
    },
    [timerState.activeTimers],
  );

  // Get timers by type
  const getTimersByType = useCallback(
    (type: TimerType): LiveTimer[] => {
      return timerState.activeTimers.filter((t) => t.type === type);
    },
    [timerState.activeTimers],
  );

  // Get running timers
  const getRunningTimers = useCallback((): LiveTimer[] => {
    return timerState.activeTimers.filter(
      (t) => t.status === TimerStatus.RUNNING,
    );
  }, [timerState.activeTimers]);

  return {
    getTimer,
    getTimersByType,
    getRunningTimers,
  };
};
