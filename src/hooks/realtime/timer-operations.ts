/**
 * Timer operation helper functions
 */
import {
  Dispatch,
  SetStateAction,
  MutableRefObject,
  useEffect,
  useRef,
} from "react";
import {
  LiveTimer,
  TimerType,
  TimerStatus,
  LiveTimerState,
  TimerSubscription,
} from "../../types/realtime";
import {
  getServerTime,
  saveTimer,
  createTimerSync,
  createNewTimer,
} from "./timer-utils";

// Helper function to validate timer permissions
export const validateTimerPermissions = (
  timer: LiveTimer,
  userId: string,
  operation: string,
): void => {
  if (timer.isKeyholderControlled && timer.keyholderUserId !== userId) {
    throw new Error(`Only the keyholder can ${operation} this timer`);
  }
};

// Helper function to update timer in state
export const updateTimerInState = (
  timers: LiveTimer[],
  timerId: string,
  updates: Partial<LiveTimer>,
): LiveTimer[] => {
  return timers.map((t) => (t.id === timerId ? { ...t, ...updates } : t));
};

// Helper function to calculate timer progress
export const calculateTimerProgress = (
  timer: LiveTimer,
  now: Date,
): Partial<LiveTimer> => {
  if (timer.status !== TimerStatus.RUNNING) {
    return {};
  }

  const actualElapsed = Math.floor(
    (now.getTime() - timer.startTime.getTime() - timer.totalPauseTime) / 1000,
  );
  const remaining = Math.max(0, timer.duration - actualElapsed);

  return {
    currentTime: now,
    elapsed: actualElapsed,
    remaining,
    status: remaining <= 0 ? TimerStatus.COMPLETED : timer.status,
  };
};

// Helper function to create timer subscription
export const createTimerSubscription = (
  timerId: string,
  callback: (timer: LiveTimer) => void,
  events: string[] = ["start", "pause", "resume", "stop", "update"],
  setTimerState: Dispatch<SetStateAction<LiveTimerState>>,
  subscriptionsRef: MutableRefObject<Map<string, TimerSubscription>>,
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
        subscriptions: prev.subscriptions.filter((sub) => sub !== subscription),
      }));
    },
  } as TimerSubscription & { unsubscribe: () => void };
};

// ====== Timer Creation Operations ======

// Helper function to create timer creation callback
export const createTimerCreationFunction = (
  userId: string,
  relationshipId: string | undefined,
  setTimerState: Dispatch<SetStateAction<LiveTimerState>>,
) => {
  const createTimer = async (
    type: TimerType,
    duration: number,
    title: string,
    options?: Record<string, unknown>,
  ): Promise<LiveTimer> => {
    const timer = createNewTimer({
      userId,
      relationshipId,
      type,
      duration,
      title,
      ...options,
    } as Parameters<typeof createNewTimer>[0]);

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
  };

  return createTimer;
};

// ====== Timer Control Operations ======

// Helper function to log timer events (to be implemented in backend)
async function logTimerEvent(
  timerId: string,
  type: string,
  data?: Record<string, string | number | boolean | Date>,
): Promise<void> {
  const _event = {
    id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timerId,
    type,
    timestamp: new Date(),
    data,
  };
  // In real implementation, save to backend
}

// Helper function to create timer control operations
export const createTimerControlFunctions = (
  userId: string,
  timerState: LiveTimerState,
  setTimerState: Dispatch<SetStateAction<LiveTimerState>>,
  syncTimer: (timerId: string) => Promise<void>,
  notifySubscribers: (timer: LiveTimer) => void,
) => {
  // Start a timer
  const startTimer = async (timerId: string): Promise<void> => {
    const timer = timerState.activeTimers.find((t) => t.id === timerId);
    if (!timer) throw new Error("Timer not found");

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

    await logTimerEvent(timerId, "start", { startTime: now });
    await syncTimer(timerId);
    notifySubscribers(updatedTimer);
  };

  // Pause a timer
  const pauseTimer = async (timerId: string): Promise<void> => {
    const timer = timerState.activeTimers.find((t) => t.id === timerId);
    if (!timer) throw new Error("Timer not found");
    if (!timer.canPause) throw new Error("Timer cannot be paused");

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

    await logTimerEvent(timerId, "pause", { pausedAt: now });
    await syncTimer(timerId);
    notifySubscribers(updatedTimer);
  };

  // Resume a timer
  const resumeTimer = async (timerId: string): Promise<void> => {
    const timer = timerState.activeTimers.find((t) => t.id === timerId);
    if (!timer) throw new Error("Timer not found");

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

    await logTimerEvent(timerId, "resume", { resumedAt: now, pauseDuration });
    await syncTimer(timerId);
    notifySubscribers(updatedTimer);
  };

  // Stop a timer
  const stopTimer = async (timerId: string): Promise<void> => {
    const timer = timerState.activeTimers.find((t) => t.id === timerId);
    if (!timer) throw new Error("Timer not found");
    if (!timer.canStop) throw new Error("Timer cannot be stopped");

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

    await logTimerEvent(timerId, "stop", { stoppedAt: now });
    await syncTimer(timerId);
    notifySubscribers(updatedTimer);
  };

  // Extend a timer
  const extendTimer = async (
    timerId: string,
    additionalSeconds: number,
  ): Promise<void> => {
    const timer = timerState.activeTimers.find((t) => t.id === timerId);
    if (!timer) throw new Error("Timer not found");
    if (!timer.canExtend) throw new Error("Timer cannot be extended");

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

    await logTimerEvent(timerId, "extend", { additionalSeconds });
    await syncTimer(timerId);
    notifySubscribers(updatedTimer);
  };

  return {
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    extendTimer,
  };
};

// ====== Timer Query Operations ======

// Helper function to create timer query operations
export const createTimerQueryFunctions = (timerState: LiveTimerState) => {
  // Get timer by ID
  const getTimer = (timerId: string): LiveTimer | null => {
    return timerState.activeTimers.find((t) => t.id === timerId) || null;
  };

  // Get timers by type
  const getTimersByType = (type: TimerType): LiveTimer[] => {
    return timerState.activeTimers.filter((t) => t.type === type);
  };

  // Get running timers
  const getRunningTimers = (): LiveTimer[] => {
    return timerState.activeTimers.filter(
      (t) => t.status === TimerStatus.RUNNING,
    );
  };

  return {
    getTimer,
    getTimersByType,
    getRunningTimers,
  };
};

// Helper function to create subscription operations
export const createSubscriptionFunction = (
  setTimerState: Dispatch<SetStateAction<LiveTimerState>>,
  subscriptionsRef: MutableRefObject<Map<string, TimerSubscription>>,
) => {
  const subscribeToTimer = (
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
  };

  return { subscribeToTimer };
};

// Helper function to create timer update progress
export const createUpdateProgressFunction = (
  setTimerState: Dispatch<SetStateAction<LiveTimerState>>,
  calculateProgress: (timer: LiveTimer, now: Date) => Partial<LiveTimer>,
  logEvent: (
    timerId: string,
    type: string,
    data?: Record<string, unknown>,
  ) => void,
  notifySubscribers: (timer: LiveTimer) => void,
) => {
  const updateTimerProgress = () => {
    const now = new Date();

    setTimerState((prev) => ({
      ...prev,
      activeTimers: prev.activeTimers.map((timer) => {
        const progress = calculateProgress(timer, now);
        const updatedTimer = { ...timer, ...progress };

        // Check if timer completed
        if (progress.remaining === 0 && timer.status === TimerStatus.RUNNING) {
          logEvent(timer.id, "complete", { completedAt: now });
          notifySubscribers(updatedTimer);
        }

        return updatedTimer;
      }),
    }));
  };

  return updateTimerProgress;
};

// ====== Timer Sync Operations ======

// Helper function to create sync timer function
export const createSyncTimerFunction = (
  setTimerState: Dispatch<SetStateAction<LiveTimerState>>,
  accuracyThreshold: number,
) => {
  const syncTimer = async (timerId: string): Promise<void> => {
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
  };

  return syncTimer;
};

// Helper function to create sync active timers function
export const createSyncActiveTimersFunction = (
  timerState: LiveTimerState,
  setTimerState: Dispatch<SetStateAction<LiveTimerState>>,
  accuracyThreshold: number,
) => {
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
      } catch {
        // Failed to sync timer
      }
    }
  };

  return syncActiveTimers;
};

// Helper function to notify subscribers
export const createNotifySubscribersFunction = (
  subscriptionsRef: MutableRefObject<Map<string, TimerSubscription>>,
) => {
  const notifySubscribers = (timer: LiveTimer) => {
    subscriptionsRef.current.forEach((subscription) => {
      if (subscription.timerId === timer.id && subscription.isActive) {
        try {
          subscription.callback(timer);
        } catch {
          // Error in subscription callback
        }
      }
    });
  };

  return notifySubscribers;
};

// ====== Timer Hook Helpers ======

// Helper to setup timer intervals
export const useTimerIntervals = (
  updateTimerProgress: () => void,
  syncActiveTimers: () => Promise<void>,
  syncInterval: number,
) => {
  const updateIntervalRef = useRef<number | null>(null);
  const syncIntervalRef = useRef<number | null>(null);

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
};
