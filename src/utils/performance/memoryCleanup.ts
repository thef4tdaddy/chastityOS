/**
 * Memory Cleanup Utilities
 * Hooks for preventing memory leaks and managing cleanup
 */
import { useEffect, useRef, useCallback, type MutableRefObject } from "react";

/**
 * Hook to run cleanup function on component unmount
 * @param cleanupFn - Function to run on unmount
 */
export function useCleanupOnUnmount(cleanupFn: () => void): void {
  const cleanupRef = useRef(cleanupFn);

  useEffect(() => {
    cleanupRef.current = cleanupFn;
  }, [cleanupFn]);

  useEffect(() => {
    return () => {
      cleanupRef.current();
    };
  }, []);
}

/**
 * Hook to manage abortable requests
 * Returns an AbortController that's automatically aborted on unmount
 */
export function useAbortableRequest(): {
  abortController: AbortController;
  reset: () => void;
} {
  const abortControllerRef = useRef<AbortController>(new AbortController());

  const reset = useCallback(() => {
    abortControllerRef.current = new AbortController();
  }, []);

  useEffect(() => {
    return () => {
      abortControllerRef.current.abort();
    };
  }, []);

  return {
    abortController: abortControllerRef.current,
    reset,
  };
}

/**
 * Hook to create a memoized ref that persists across renders
 * Useful for storing large data structures without causing re-renders
 */
export function useMemoizedRef<T>(
  initialValue: T | (() => T),
): MutableRefObject<T> {
  const ref = useRef<T>();

  if (ref.current === undefined) {
    ref.current =
      typeof initialValue === "function"
        ? (initialValue as () => T)()
        : initialValue;
  }

  return ref as MutableRefObject<T>;
}

/**
 * Hook to cleanup timers on unmount
 * Returns functions to set and clear timers that auto-cleanup
 */
export function useTimerCleanup() {
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const setTimer = useCallback(
    (
      callback: () => void,
      delay: number,
      type: "timeout" | "interval" = "timeout",
    ): ReturnType<typeof setTimeout> => {
      const timer =
        type === "timeout"
          ? setTimeout(callback, delay)
          : setInterval(callback, delay);
      timersRef.current.add(timer);
      return timer;
    },
    [],
  );

  const clearTimer = useCallback((timer: ReturnType<typeof setTimeout>) => {
    clearTimeout(timer);
    clearInterval(timer);
    timersRef.current.delete(timer);
  }, []);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((timer) => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    timersRef.current.clear();
  }, []);

  useEffect(() => {
    // Capture the ref value in the effect
    const timers = timersRef.current;
    return () => {
      // Use the captured value in cleanup
      timers.forEach((timer) => {
        clearTimeout(timer);
        clearInterval(timer);
      });
      timers.clear();
    };
  }, []);

  return { setTimer, clearTimer, clearAllTimers };
}
