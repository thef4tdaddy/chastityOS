/**
 * Shared Timer Hook
 * Provides a single synchronized currentTime state that updates every second
 * This ensures all timer-dependent hooks tick in perfect sync
 * Optimized to batch updates and reduce re-renders
 */
import { useState, useEffect } from "react";

let globalCurrentTime = new Date();
let listeners: Set<(time: Date) => void> = new Set();
let intervalId: ReturnType<typeof setInterval> | null = null;
let rafId: number | null = null;
let pendingUpdate = false;

// Batch timer updates using requestAnimationFrame for better performance
function batchTimerUpdate() {
  if (pendingUpdate) return;
  pendingUpdate = true;

  rafId = requestAnimationFrame(() => {
    const newTime = new Date();
    // Only update if time has actually changed (avoid sub-second updates)
    if (newTime.getTime() - globalCurrentTime.getTime() >= 1000) {
      globalCurrentTime = newTime;
      // Batch notify all listeners in a single frame
      listeners.forEach((listener) => listener(globalCurrentTime));
    }
    pendingUpdate = false;
  });
}

// Start global interval when first listener subscribes
function startGlobalTimer() {
  if (intervalId !== null) return;

  intervalId = setInterval(() => {
    batchTimerUpdate();
  }, 1000);
}

// Stop global interval when last listener unsubscribes
function stopGlobalTimer() {
  if (listeners.size > 0) return;
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

/**
 * Hook that provides current time updated every second
 * All instances share the same timer to ensure perfect synchronization
 * Updates are batched using requestAnimationFrame for optimal performance
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
