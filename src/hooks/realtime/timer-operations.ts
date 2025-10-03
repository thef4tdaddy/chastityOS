/**
 * Timer operation helper functions
 */
import { Dispatch, SetStateAction, MutableRefObject } from "react";
import {
  LiveTimer,
  TimerStatus,
  LiveTimerState,
  TimerSubscription,
  TimerSync,
  TimerEvent,
  TimerType,
} from "../../types/realtime";
import { validateTimerPermissions } from "../../utils/validation/timer";

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

// Helper function to calculate computed values
export const calculateComputedValues = (activeTimers: LiveTimer[]) => {
  const runningCount = activeTimers.filter(
    (t) => t.status === TimerStatus.RUNNING,
  ).length;
  const pausedCount = activeTimers.filter(
    (t) => t.status === TimerStatus.PAUSED,
  ).length;
  const completedCount = activeTimers.filter(
    (t) => t.status === TimerStatus.COMPLETED,
  ).length;

  const totalActiveTime = activeTimers
    .filter((t) => t.status === TimerStatus.RUNNING)
    .reduce((total, timer) => total + timer.elapsed, 0);

  const longestRunningTimer =
    activeTimers
      .filter((t) => t.status === TimerStatus.RUNNING)
      .sort((a, b) => b.elapsed - a.elapsed)[0] || null;

  return {
    runningCount,
    pausedCount,
    completedCount,
    totalActiveTime,
    longestRunningTimer,
  };
};

// Server time helper
export async function getServerTime(): Promise<Date> {
  // In real implementation, fetch server time from API
  try {
    // const response = await fetch('/api/time');
    // const { timestamp } = await response.json();
    // return new Date(timestamp);
    return new Date(); // Fallback to client time
  } catch {
    return new Date();
  }
}

// Save timer helper
export async function saveTimer(_timer: LiveTimer): Promise<void> {
  // In real implementation, save to backend
}

// Log timer event helper
export async function logTimerEvent(
  timerId: string,
  type: string,
  userId: string,
  data?: Record<string, string | number | boolean | Date>,
): Promise<void> {
  const _event: TimerEvent = {
    id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timerId,
    type: type as TimerEvent["type"],
    timestamp: new Date(),
    userId,
    data,
  };
  // In real implementation, save to backend
}

// Create timer sync record
export async function createTimerSync(timerId: string): Promise<TimerSync> {
  const now = new Date();
  return {
    timerId,
    lastSync: now,
    serverTime: await getServerTime(),
    clientOffset: 0,
    syncAccuracy: 1.0,
  };
}

// Create new timer helper
export interface CreateTimerParams {
  userId: string;
  relationshipId?: string;
  type: TimerType;
  duration: number;
  title: string;
  description?: string;
  canPause?: boolean;
  canStop?: boolean;
  canExtend?: boolean;
  isKeyholderControlled?: boolean;
  keyholderUserId?: string;
  sessionId?: string;
  taskId?: string;
}

export function createNewTimer({
  userId,
  relationshipId,
  type,
  duration,
  title,
  description,
  canPause = true,
  canStop = true,
  canExtend = false,
  isKeyholderControlled = false,
  keyholderUserId,
  sessionId,
  taskId,
}: CreateTimerParams): LiveTimer {
  const now = new Date();
  return {
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
    description,
    canPause,
    canStop,
    canExtend,
    isKeyholderControlled,
    keyholderUserId,
    sessionId,
    taskId,
  };
}

// Timer control operations
export async function startTimerOperation(
  timer: LiveTimer,
  userId: string,
  syncTimerFn: (timerId: string) => Promise<void>,
  notifySubscribersFn: (timer: LiveTimer) => void,
): Promise<LiveTimer> {
  validateTimerPermissions(timer, userId, "control");

  const now = new Date();
  const updatedTimer: LiveTimer = {
    ...timer,
    status: TimerStatus.RUNNING,
    startTime: now,
    currentTime: now,
    isPaused: false,
  };

  await logTimerEvent(timer.id, "start", userId, { startTime: now });
  await syncTimerFn(timer.id);
  notifySubscribersFn(updatedTimer);

  return updatedTimer;
}

export async function pauseTimerOperation(
  timer: LiveTimer,
  userId: string,
  syncTimerFn: (timerId: string) => Promise<void>,
  notifySubscribersFn: (timer: LiveTimer) => void,
): Promise<LiveTimer> {
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

  await logTimerEvent(timer.id, "pause", userId, { pausedAt: now });
  await syncTimerFn(timer.id);
  notifySubscribersFn(updatedTimer);

  return updatedTimer;
}

export async function resumeTimerOperation(
  timer: LiveTimer,
  userId: string,
  syncTimerFn: (timerId: string) => Promise<void>,
  notifySubscribersFn: (timer: LiveTimer) => void,
): Promise<LiveTimer> {
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

  await logTimerEvent(timer.id, "resume", userId, {
    resumedAt: now,
    pauseDuration,
  });
  await syncTimerFn(timer.id);
  notifySubscribersFn(updatedTimer);

  return updatedTimer;
}

export async function stopTimerOperation(
  timer: LiveTimer,
  userId: string,
  syncTimerFn: (timerId: string) => Promise<void>,
  notifySubscribersFn: (timer: LiveTimer) => void,
): Promise<LiveTimer> {
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

  await logTimerEvent(timer.id, "stop", userId, { stoppedAt: now });
  await syncTimerFn(timer.id);
  notifySubscribersFn(updatedTimer);

  return updatedTimer;
}

export async function extendTimerOperation(
  timer: LiveTimer,
  userId: string,
  additionalSeconds: number,
  syncTimerFn: (timerId: string) => Promise<void>,
  notifySubscribersFn: (timer: LiveTimer) => void,
): Promise<LiveTimer> {
  if (!timer.canExtend) {
    throw new Error("Timer cannot be extended");
  }

  validateTimerPermissions(timer, userId, "extend");

  const updatedTimer: LiveTimer = {
    ...timer,
    duration: timer.duration + additionalSeconds,
    remaining: timer.remaining + additionalSeconds,
  };

  await logTimerEvent(timer.id, "extend", userId, { additionalSeconds });
  await syncTimerFn(timer.id);
  notifySubscribersFn(updatedTimer);

  return updatedTimer;
}
