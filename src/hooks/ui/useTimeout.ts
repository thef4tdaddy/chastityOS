/**
 * useTimeout Hook
 * Safe timeout management with automatic cleanup
 */
import { useEffect, useRef } from "react";

/**
 * Custom hook for managing timeouts with automatic cleanup
 * @param callback - Function to call after timeout
 * @param delay - Delay in milliseconds, or null to cancel
 */
export function useTimeout(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the timeout
  useEffect(() => {
    if (delay === null) {
      return;
    }

    const id = setTimeout(() => savedCallback.current(), delay);
    return () => clearTimeout(id);
  }, [delay]);
}
