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
  TimerSync,
  TimerEvent,
  TimerSubscription,
} from "../../types/realtime";

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
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
      const now = new Date();
      const timer: LiveTimer = {
        id: `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        status: TimerStatus.STOPPED,
        startTime: now,
        currentTime: now,
        duration,
        elapsed: 0,
        remaining: duration,
        isPaused: false,
        totalPauseTime: 0,
        userId,
        relationshipId,
        title,
        description: options?.description,
        canPause: options?.canPause ?? true,
        canStop: options?.canStop ?? true,
        canExtend: options?.canExtend ?? false,
        isKeyholderControlled: options?.isKeyholderControlled ?? false,
        keyholderUserId: options?.keyholderUserId,
        sessionId: options?.sessionId,
        taskId: options?.taskId,
      };

      setTimerState((prev) => ({
        ...prev,
        activeTimers: [...prev.activeTimers, timer],
      }));

      // Create sync record
      const sync: TimerSync = {
        timerId: timer.id,
        lastSync: now,
        serverTime: await getServerTime(),
        clientOffset: 0,
        syncAccuracy: 1.0,
      };

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

      if (timer.isKeyholderControlled && timer.keyholderUserId !== userId) {
        throw new Error("Only the keyholder can control this timer");
      }

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
        activeTimers: prev.activeTimers.map((t) =>
          t.id === timerId ? updatedTimer : t,
        ),
      }));

      // Log event
      await logTimerEvent(timerId, "start", { startTime: now });

      // Sync with server
      await syncTimer(timerId);

      // Notify subscribers
      notifySubscribers(updatedTimer);
    },
    [timerState.activeTimers, userId],
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

      if (timer.isKeyholderControlled && timer.keyholderUserId !== userId) {
        throw new Error("Only the keyholder can pause this timer");
      }

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
        activeTimers: prev.activeTimers.map((t) =>
          t.id === timerId ? updatedTimer : t,
        ),
      }));

      await logTimerEvent(timerId, "pause", { pausedAt: now });
      await syncTimer(timerId);
      notifySubscribers(updatedTimer);
    },
    [timerState.activeTimers, userId],
  );

  // Resume a timer
  const resumeTimer = useCallback(
    async (timerId: string): Promise<void> => {
      const timer = timerState.activeTimers.find((t) => t.id === timerId);
      if (!timer) {
        throw new Error("Timer not found");
      }

      if (timer.isKeyholderControlled && timer.keyholderUserId !== userId) {
        throw new Error("Only the keyholder can resume this timer");
      }

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
        activeTimers: prev.activeTimers.map((t) =>
          t.id === timerId ? updatedTimer : t,
        ),
      }));

      await logTimerEvent(timerId, "resume", { resumedAt: now, pauseDuration });
      await syncTimer(timerId);
      notifySubscribers(updatedTimer);
    },
    [timerState.activeTimers, userId],
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

      if (timer.isKeyholderControlled && timer.keyholderUserId !== userId) {
        throw new Error("Only the keyholder can stop this timer");
      }

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
        activeTimers: prev.activeTimers.map((t) =>
          t.id === timerId ? updatedTimer : t,
        ),
      }));

      await logTimerEvent(timerId, "stop", { stoppedAt: now });
      await syncTimer(timerId);
      notifySubscribers(updatedTimer);
    },
    [timerState.activeTimers, userId],
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

      if (timer.isKeyholderControlled && timer.keyholderUserId !== userId) {
        throw new Error("Only the keyholder can extend this timer");
      }

      const updatedTimer: LiveTimer = {
        ...timer,
        duration: timer.duration + additionalSeconds,
        remaining: timer.remaining + additionalSeconds,
      };

      setTimerState((prev) => ({
        ...prev,
        activeTimers: prev.activeTimers.map((t) =>
          t.id === timerId ? updatedTimer : t,
        ),
      }));

      await logTimerEvent(timerId, "extend", { additionalSeconds });
      await syncTimer(timerId);
      notifySubscribers(updatedTimer);
    },
    [timerState.activeTimers, userId],
  );

  // Subscribe to timer updates
  const subscribeToTimer = useCallback(
    (
      timerId: string,
      callback: (timer: LiveTimer) => void,
      events: string[] = ["start", "pause", "resume", "stop", "update"],
    ): TimerSubscription => {
      const subscription: TimerSubscription = {
        timerId,
        callback,
        events,
        isActive: true,
      };

      const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      subscriptionsRef.current.set(subscriptionId, subscription);

      setTimerState((prev) => ({
        ...prev,
        subscriptions: [...prev.subscriptions, subscription],
      }));

      return {
        ...subscription,
        unsubscribe: () => {
          subscriptionsRef.current.delete(subscriptionId);
          setTimerState((prev) => ({
            ...prev,
            subscriptions: prev.subscriptions.filter(
              (sub) => sub !== subscription,
            ),
          }));
        },
      } as TimerSubscription & { unsubscribe: () => void };
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
        if (timer.status !== TimerStatus.RUNNING) {
          return timer;
        }

        const actualElapsed = Math.floor(
          (now.getTime() - timer.startTime.getTime() - timer.totalPauseTime) /
            1000,
        );

        const remaining = Math.max(0, timer.duration - actualElapsed);

        const updatedTimer: LiveTimer = {
          ...timer,
          currentTime: now,
          elapsed: actualElapsed,
          remaining,
          status: remaining <= 0 ? TimerStatus.COMPLETED : timer.status,
        };

        // Check if timer completed
        if (remaining <= 0 && timer.status === TimerStatus.RUNNING) {
          logTimerEvent(timer.id, "complete", { completedAt: now });
          notifySubscribers(updatedTimer);
        }

        return updatedTimer;
      }),
    }));
  }, []);

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
      } catch (error) {
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
        } catch (error) {
          // Error in subscription callback
        }
      }
    });
  }, []);

  // Start update interval
  useEffect(() => {
    updateIntervalRef.current = setInterval(updateTimerProgress, syncInterval);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [syncInterval]);

  // Start sync interval
  useEffect(() => {
    const syncActiveTimers = async () => {
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
        } catch (error) {
          // Failed to sync timer
        }
      }
    };

    syncIntervalRef.current = setInterval(syncActiveTimers, syncInterval * 30); // Sync every 30 seconds

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [timerState.activeTimers, syncInterval, accuracyThreshold]);

  // Computed values
  const computedValues = useMemo(() => {
    const runningCount = timerState.activeTimers.filter(
      (t) => t.status === TimerStatus.RUNNING,
    ).length;
    const pausedCount = timerState.activeTimers.filter(
      (t) => t.status === TimerStatus.PAUSED,
    ).length;
    const completedCount = timerState.activeTimers.filter(
      (t) => t.status === TimerStatus.COMPLETED,
    ).length;

    const totalActiveTime = timerState.activeTimers
      .filter((t) => t.status === TimerStatus.RUNNING)
      .reduce((total, timer) => total + timer.elapsed, 0);

    const longestRunningTimer =
      timerState.activeTimers
        .filter((t) => t.status === TimerStatus.RUNNING)
        .sort((a, b) => b.elapsed - a.elapsed)[0] || null;

    return {
      runningCount,
      pausedCount,
      completedCount,
      totalActiveTime,
      longestRunningTimer,
    };
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

// Helper functions
async function getServerTime(): Promise<Date> {
  // In real implementation, fetch server time from API
  try {
    // const response = await fetch('/api/time');
    // const { timestamp } = await response.json();
    // return new Date(timestamp);
    return new Date(); // Fallback to client time
  } catch (error) {
    // Fallback to client time
    return new Date();
  }
}

async function saveTimer(timer: LiveTimer): Promise<void> {
  // In real implementation, save to backend
  // In real implementation, save to backend
}

async function logTimerEvent(
  timerId: string,
  type: string,
  data?: any,
): Promise<void> {
  const event: TimerEvent = {
    id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timerId,
    type: type as any,
    timestamp: new Date(),
    userId: "", // Would be filled from context
    data,
  };

  // In real implementation, save to backend
  // In real implementation, save to backend
}
