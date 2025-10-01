/**
 * useLiveTimer - Live Timer Synchronization Hook
 *
 * Synchronized timer updates across all devices and users with real-time progress
 * sharing and keyholder monitoring.
 */
import { useState, useRef, useMemo } from "react";
import { LiveTimerState, TimerSubscription } from "../../types/realtime";
import {
  calculateTimerProgress,
  createTimerControlFunctions,
  createTimerQueryFunctions,
  createSubscriptionFunction,
  createUpdateProgressFunction,
  createSyncTimerFunction,
  createSyncActiveTimersFunction,
  createNotifySubscribersFunction,
  createTimerCreationFunction,
  useTimerIntervals,
} from "./timer-operations";
import { calculateComputedValues } from "./timer-utils";

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

  // Refs for subscriptions
  const subscriptionsRef = useRef<Map<string, TimerSubscription>>(new Map());

  // Create a new timer
  const createTimer = useMemo(
    () => createTimerCreationFunction(userId, relationshipId, setTimerState),
    [userId, relationshipId],
  );

  // Create all timer operation functions
  const notifySubscribers = useMemo(
    () => createNotifySubscribersFunction(subscriptionsRef),
    [],
  );
  const syncTimer = useMemo(
    () => createSyncTimerFunction(setTimerState, accuracyThreshold),
    [accuracyThreshold],
  );

  const { startTimer, pauseTimer, resumeTimer, stopTimer, extendTimer } =
    useMemo(
      () =>
        createTimerControlFunctions(
          userId,
          timerState,
          setTimerState,
          syncTimer,
          notifySubscribers,
        ),
      [userId, timerState, syncTimer, notifySubscribers],
    );

  const { getTimer, getTimersByType, getRunningTimers } = useMemo(
    () => createTimerQueryFunctions(timerState),
    [timerState],
  );

  const { subscribeToTimer } = useMemo(
    () => createSubscriptionFunction(setTimerState, subscriptionsRef),
    [],
  );

  const updateTimerProgress = useMemo(
    () =>
      createUpdateProgressFunction(
        setTimerState,
        calculateTimerProgress,
        () => {},
        notifySubscribers,
      ),
    [notifySubscribers],
  );
  const syncActiveTimers = useMemo(
    () =>
      createSyncActiveTimersFunction(
        timerState,
        setTimerState,
        accuracyThreshold,
      ),
    [timerState, accuracyThreshold],
  );
  useTimerIntervals(updateTimerProgress, syncActiveTimers, syncInterval);

  const computedValues = useMemo(
    () => calculateComputedValues(timerState.activeTimers),
    [timerState.activeTimers],
  );

  return {
    activeTimers: timerState.activeTimers,
    timerSyncs: timerState.timerSyncs,
    events: timerState.events,
    createTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    extendTimer,
    getTimer,
    getTimersByType,
    getRunningTimers,
    subscribeToTimer,
    ...computedValues,
  };
};
