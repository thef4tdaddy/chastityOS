/**
 * Timer operation helper functions
 */
import { Dispatch, SetStateAction, MutableRefObject } from "react";
import {
  LiveTimer,
  TimerStatus,
  LiveTimerState,
  TimerSubscription,
} from "../../types/realtime";

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
