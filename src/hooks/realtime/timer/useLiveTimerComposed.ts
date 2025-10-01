/**
 * useLiveTimer - Live Timer Synchronization Hook (Composed)
 *
 * Synchronized timer updates across all devices and users with real-time progress
 * sharing and keyholder monitoring.
 */
import { useState, useRef, useMemo } from "react";
import { LiveTimerState, TimerSubscription } from "../../../types/realtime";
import { calculateComputedValues } from "../timer-operations";
import { useTimerControl } from "./useTimerControl";
import { useTimerQueries } from "./useTimerQueries";
import { useTimerSync } from "./useTimerSync";
import { useTimerSubscriptions } from "./useTimerSubscriptions";

interface UseLiveTimerOptions {
  userId: string;
  relationshipId?: string;
  syncInterval?: number;
  accuracyThreshold?: number;
}

export const useLiveTimer = (options: UseLiveTimerOptions) => {
  const {
    userId,
    relationshipId,
    syncInterval = 1000,
    accuracyThreshold = 500,
  } = options;

  // Timer state
  const [timerState, setTimerState] = useState<LiveTimerState>({
    activeTimers: [],
    timerSyncs: [],
    subscriptions: [],
    events: [],
  });

  // Refs for intervals and subscriptions
  const updateIntervalRef = useRef<number | null>(null);
  const syncIntervalRef = useRef<number | null>(null);
  const subscriptionsRef = useRef<Map<string, TimerSubscription>>(new Map());

  // Subscriptions hook
  const { subscribeToTimer, notifySubscribers } = useTimerSubscriptions({
    setTimerState,
    subscriptionsRef,
  });

  // Sync hook
  const { syncTimer } = useTimerSync({
    userId,
    timerState,
    setTimerState,
    syncInterval,
    accuracyThreshold,
    notifySubscribers,
    updateIntervalRef,
    syncIntervalRef,
  });

  // Control hook
  const {
    createTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    extendTimer,
  } = useTimerControl({
    userId,
    relationshipId,
    timerState,
    setTimerState,
    syncTimer,
    notifySubscribers,
  });

  // Query hook
  const { getTimer, getTimersByType, getRunningTimers } = useTimerQueries({
    timerState,
  });

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
