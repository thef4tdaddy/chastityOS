/**
 * Timer Sync Hook - Handle timer synchronization and progress updates
 */
import { useCallback, useEffect } from "react";
import type { Dispatch, SetStateAction, MutableRefObject } from "react";
import {
  LiveTimer,
  LiveTimerState,
  TimerStatus,
} from "../../../types/realtime";
import {
  calculateTimerProgress,
  getServerTime,
  logTimerEvent,
} from "../timer-operations";

interface UseTimerSyncParams {
  userId: string;
  timerState: LiveTimerState;
  setTimerState: Dispatch<SetStateAction<LiveTimerState>>;
  syncInterval: number;
  accuracyThreshold: number;
  notifySubscribers: (timer: LiveTimer) => void;
  updateIntervalRef: MutableRefObject<number | null>;
  syncIntervalRef: MutableRefObject<number | null>;
}

export const useTimerSync = ({
  userId,
  timerState,
  setTimerState,
  syncInterval,
  accuracyThreshold,
  notifySubscribers,
  updateIntervalRef,
  syncIntervalRef,
}: UseTimerSyncParams) => {
  // Update timer progress
  const updateTimerProgress = useCallback(() => {
    const now = new Date();

    setTimerState((prev) => ({
      ...prev,
      activeTimers: prev.activeTimers.map((timer) => {
        const progress = calculateTimerProgress(timer, now);
        const updatedTimer = { ...timer, ...progress };

        // Check if timer completed
        if (progress.remaining === 0 && timer.status === TimerStatus.RUNNING) {
          logTimerEvent(timer.id, "complete", userId, { completedAt: now });
          notifySubscribers(updatedTimer);
        }

        return updatedTimer;
      }),
    }));
  }, [userId, notifySubscribers, setTimerState]);

  // Sync timer with server
  const syncTimer = useCallback(
    async (timerId: string): Promise<void> => {
      try {
        const serverTime = await getServerTime();
        const now = new Date();
        const clientOffset = now.getTime() - serverTime.getTime();

        setTimerState((prev) => ({
          ...prev,
          timerSyncs: prev.timerSyncs.map((sync) =>
            sync.timerId === timerId
              ? {
                  ...sync,
                  lastSync: now,
                  serverTime,
                  clientOffset,
                  syncAccuracy:
                    Math.abs(clientOffset) < accuracyThreshold ? 1.0 : 0.5,
                }
              : sync,
          ),
        }));
      } catch {
        // Failed to sync timer
      }
    },
    [accuracyThreshold, setTimerState],
  );

  // Helper function to sync active timers with server
  const syncActiveTimers = useCallback(async () => {
    const runningTimers = timerState.activeTimers.filter(
      (t) => t.status === TimerStatus.RUNNING,
    );

    for (const timer of runningTimers) {
      try {
        const serverTime = await getServerTime();
        const now = new Date();
        const clientOffset = now.getTime() - serverTime.getTime();

        setTimerState((prev) => ({
          ...prev,
          timerSyncs: prev.timerSyncs.map((sync) =>
            sync.timerId === timer.id
              ? {
                  ...sync,
                  lastSync: now,
                  serverTime,
                  clientOffset,
                  syncAccuracy:
                    Math.abs(clientOffset) < accuracyThreshold ? 1.0 : 0.5,
                }
              : sync,
          ),
        }));
      } catch {
        // Failed to sync timer
      }
    }
  }, [timerState.activeTimers, accuracyThreshold, setTimerState]);

  // Start update interval
  useEffect(() => {
    updateIntervalRef.current = setInterval(updateTimerProgress, syncInterval);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
    // updateTimerProgress is stable (no deps change it)
    // syncInterval triggers re-setup of interval when changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncInterval]);

  // Start sync interval
  useEffect(() => {
    syncIntervalRef.current = setInterval(syncActiveTimers, syncInterval * 30);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
    // syncActiveTimers is stable (no deps change it)
    // syncInterval triggers re-setup of interval when changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncInterval]);

  return {
    syncTimer,
    updateTimerProgress,
    syncActiveTimers,
  };
};
