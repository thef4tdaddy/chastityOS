/**
 * Shared Timer Hook
 * Provides a single synchronized currentTime state that updates every second
 * This ensures all timer-dependent hooks tick in perfect sync
 */
import { useState, useEffect } from "react";

let globalCurrentTime = new Date();
let listeners: Set<(time: Date) => void> = new Set();
let intervalId: ReturnType<typeof setInterval> | null = null;

// Start global interval when first listener subscribes
function startGlobalTimer() {
  if (intervalId !== null) return;

  intervalId = setInterval(() => {
    globalCurrentTime = new Date();
    listeners.forEach((listener) => listener(globalCurrentTime));
  }, 1000);
}

// Stop global interval when last listener unsubscribes
function stopGlobalTimer() {
  if (listeners.size > 0) return;
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/**
 * Hook that provides current time updated every second
 * All instances share the same timer to ensure perfect synchronization
 */
export function useSharedTimer(): Date {
  const [currentTime, setCurrentTime] = useState(globalCurrentTime);

  useEffect(() => {
    // Subscribe to global timer
    listeners.add(setCurrentTime);
    startGlobalTimer();

    // Unsubscribe on unmount
    return () => {
      listeners.delete(setCurrentTime);
      stopGlobalTimer();
    };
  }, []);

  return currentTime;
}
