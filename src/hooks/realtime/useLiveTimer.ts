/**
 * useLiveTimer - Live Timer Synchronization Hook
 *
 * Synchronized timer updates across all devices and users with real-time progress
 * sharing and keyholder monitoring.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  LiveTimerState,
  LiveTimer,
  TimerType,
  TimerStatus,
  TimerSubscription,
} from "../../types/realtime";
import {
  validateTimerPermissions,
  updateTimerInState,
  calculateTimerProgress,
  createTimerSubscription,
  calculateComputedValues,
  getServerTime,
  saveTimer,
  logTimerEvent,
  createTimerSync,
  createNewTimer,
} from "./timer-operations";

interface UseLiveTimerOptions {
  userId: string;
  relationshipId?: string;
  syncInterval?: number; // milliseconds
  accuracyThreshold?: number; // milliseconds
}

export const useLiveTimer = (options: UseLiveTimerOptions) => {
  const {
    userId,
    relationshipId,
    syncInterval = 1000, // 1 second
    accuracyThreshold = 500, // 500ms
  } = options;

  // Timer state
  const [timerState, setTimerState] = useState<LiveTimerState>({
    activeTimers: [],
    timerSyncs: [],
    subscriptions: [],
    events: [],
  });

  // Refs for intervals and sync
  const updateIntervalRef = useRef<number | null>(null);
  const syncIntervalRef = useRef<number | null>(null);
  const subscriptionsRef = useRef<Map<string, TimerSubscription>>(new Map());

  // Create a new timer
  const createTimer = useCallback(
    async (
      type: TimerType,
      duration: number, // seconds
      title: string,
      options?: {
        description?: string;
        canPause?: boolean;
        canStop?: boolean;
        canExtend?: boolean;
        isKeyholderControlled?: boolean;
        keyholderUserId?: string;
        sessionId?: string;
        taskId?: string;
      },
    ): Promise<LiveTimer> => {
      const timer = createNewTimer({
        userId,
        relationshipId,
        type,
        duration,
        title,
        ...options,
      });

      setTimerState((prev) => ({
        ...prev,
        activeTimers: [...prev.activeTimers, timer],
      }));

      // Create sync record
      const sync = await createTimerSync(timer.id);
      setTimerState((prev) => ({
        ...prev,
        timerSyncs: [...prev.timerSyncs, sync],
      }));

      // Save to backend
      await saveTimer(timer);

      return timer;
    },
    [userId, relationshipId],
  );

  // Start a timer
  const startTimer = useCallback(
    async (timerId: string): Promise<void> => {
      const timer = timerState.activeTimers.find((t) => t.id === timerId);
      if (!timer) {
        throw new Error("Timer not found");
      }

      validateTimerPermissions(timer, userId, "control");

      const now = new Date();
      const updatedTimer: LiveTimer = {
        ...timer,
        status: TimerStatus.RUNNING,
        startTime: now,
        currentTime: now,
        isPaused: false,
      };

      setTimerState((prev) => ({
        ...prev,
        activeTimers: updateTimerInState(
          prev.activeTimers,
          timerId,
          updatedTimer,
        ),
      }));

      // Log event and sync
      await logTimerEvent(timerId, "start", userId, { startTime: now });
      await syncTimer(timerId);
      notifySubscribers(updatedTimer);
    },
    [timerState.activeTimers, userId, notifySubscribers, syncTimer],
  );

  // Pause a timer
  const pauseTimer = useCallback(
    async (timerId: string): Promise<void> => {
      const timer = timerState.activeTimers.find((t) => t.id === timerId);
      if (!timer) {
        throw new Error("Timer not found");
      }

      if (!timer.canPause) {
        throw new Error("Timer cannot be paused");
      }

      validateTimerPermissions(timer, userId, "pause");

      const now = new Date();
      const updatedTimer: LiveTimer = {
        ...timer,
        status: TimerStatus.PAUSED,
        isPaused: true,
        pausedAt: now,
        currentTime: now,
      };

      setTimerState((prev) => ({
        ...prev,
        activeTimers: updateTimerInState(
          prev.activeTimers,
          timerId,
          updatedTimer,
        ),
      }));

      await logTimerEvent(timerId, "pause", userId, { pausedAt: now });
      await syncTimer(timerId);
      notifySubscribers(updatedTimer);
    },
    [timerState.activeTimers, userId, notifySubscribers, syncTimer],
  );

  // Resume a timer
  const resumeTimer = useCallback(
    async (timerId: string): Promise<void> => {
      const timer = timerState.activeTimers.find((t) => t.id === timerId);
      if (!timer) {
        throw new Error("Timer not found");
      }

      validateTimerPermissions(timer, userId, "resume");

      const now = new Date();
      const pauseDuration = timer.pausedAt
        ? now.getTime() - timer.pausedAt.getTime()
        : 0;

      const updatedTimer: LiveTimer = {
        ...timer,
        status: TimerStatus.RUNNING,
        isPaused: false,
        pausedAt: undefined,
        totalPauseTime: timer.totalPauseTime + pauseDuration,
        currentTime: now,
      };

      setTimerState((prev) => ({
        ...prev,
        activeTimers: updateTimerInState(
          prev.activeTimers,
          timerId,
          updatedTimer,
        ),
      }));

      await logTimerEvent(timerId, "resume", userId, {
        resumedAt: now,
        pauseDuration,
      });
      await syncTimer(timerId);
      notifySubscribers(updatedTimer);
    },
    [timerState.activeTimers, userId, notifySubscribers, syncTimer],
  );

  // Stop a timer
  const stopTimer = useCallback(
    async (timerId: string): Promise<void> => {
      const timer = timerState.activeTimers.find((t) => t.id === timerId);
      if (!timer) {
        throw new Error("Timer not found");
      }

      if (!timer.canStop) {
        throw new Error("Timer cannot be stopped");
      }

      validateTimerPermissions(timer, userId, "stop");

      const now = new Date();
      const updatedTimer: LiveTimer = {
        ...timer,
        status: TimerStatus.STOPPED,
        endTime: now,
        currentTime: now,
        isPaused: false,
      };

      setTimerState((prev) => ({
        ...prev,
        activeTimers: updateTimerInState(
          prev.activeTimers,
          timerId,
          updatedTimer,
        ),
      }));

      await logTimerEvent(timerId, "stop", userId, { stoppedAt: now });
      await syncTimer(timerId);
      notifySubscribers(updatedTimer);
    },
    [timerState.activeTimers, userId, notifySubscribers, syncTimer],
  );

  // Extend a timer
  const extendTimer = useCallback(
    async (timerId: string, additionalSeconds: number): Promise<void> => {
      const timer = timerState.activeTimers.find((t) => t.id === timerId);
      if (!timer) {
        throw new Error("Timer not found");
      }

      if (!timer.canExtend) {
        throw new Error("Timer cannot be extended");
      }

      validateTimerPermissions(timer, userId, "extend");

      const updatedTimer: LiveTimer = {
        ...timer,
        duration: timer.duration + additionalSeconds,
        remaining: timer.remaining + additionalSeconds,
      };

      setTimerState((prev) => ({
        ...prev,
        activeTimers: updateTimerInState(
          prev.activeTimers,
          timerId,
          updatedTimer,
        ),
      }));

      await logTimerEvent(timerId, "extend", userId, { additionalSeconds });
      await syncTimer(timerId);
      notifySubscribers(updatedTimer);
    },
    [timerState.activeTimers, userId, notifySubscribers, syncTimer],
  );

  // Subscribe to timer updates
  const subscribeToTimer = useCallback(
    (
      timerId: string,
      callback: (timer: LiveTimer) => void,
      events: string[] = ["start", "pause", "resume", "stop", "update"],
    ): TimerSubscription => {
      return createTimerSubscription(
        timerId,
        callback,
        events,
        setTimerState,
        subscriptionsRef,
      );
    },
    [],
  );

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
  }, [notifySubscribers]);

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
    [accuracyThreshold],
  );

  // Notify subscribers
  const notifySubscribers = useCallback((timer: LiveTimer) => {
    subscriptionsRef.current.forEach((subscription) => {
      if (subscription.timerId === timer.id && subscription.isActive) {
        try {
          subscription.callback(timer);
        } catch {
          // Error in subscription callback
        }
      }
    });
  }, []);

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
  }, [timerState.activeTimers, accuracyThreshold]);

  // Start update interval
  useEffect(() => {
    updateIntervalRef.current = setInterval(updateTimerProgress, syncInterval);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
    // updateTimerProgress is stable (no deps)
    // syncInterval triggers re-setup of interval when changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncInterval]);

  // Start sync interval
  useEffect(() => {
    syncIntervalRef.current = setInterval(syncActiveTimers, syncInterval * 30); // Sync every 30 seconds

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
    // syncActiveTimers is stable (no deps)
    // syncInterval triggers re-setup of interval when changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncInterval]);

  // Computed values
  const computedValues = useMemo(() => {
    return calculateComputedValues(timerState.activeTimers);
  }, [timerState.activeTimers]);

  return {
    // Timer state
    activeTimers: timerState.activeTimers,
    timerSyncs: timerState.timerSyncs,
    events: timerState.events,

    // Timer management
    createTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    extendTimer,

    // Timer queries
    getTimer,
    getTimersByType,
    getRunningTimers,

    // Subscription management
    subscribeToTimer,

    // Computed values
    ...computedValues,
  };
};
