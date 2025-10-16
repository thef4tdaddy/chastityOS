/**
 * Performance Monitoring Hook
 * Simple hook to monitor component render performance
 */

import { useEffect, useRef } from "react";
import { logger } from "../utils/logging";

interface PerformanceMonitorOptions {
  componentName: string;
  enabled?: boolean;
  logThreshold?: number; // Only log if render time exceeds this (ms)
}

export function usePerformanceMonitor(
  options: PerformanceMonitorOptions,
): void {
  const { componentName, enabled = false, logThreshold = 16 } = options; // 16ms = 60fps
  const renderCount = useRef(0);
  const renderStartTime = useRef(0);

  // Track render count
  renderCount.current++;

  // Measure render time
  useEffect(() => {
    if (!enabled) return;

    const renderEndTime = performance.now();
    const renderDuration = renderEndTime - renderStartTime.current;

    if (renderDuration > logThreshold) {
      logger.debug(
        `[Performance] ${componentName} render #${renderCount.current} took ${renderDuration.toFixed(2)}ms`,
        "PerformanceMonitor",
      );
    }
  });

  // Capture start time before render
  renderStartTime.current = performance.now();
}

/**
 * Hook to measure async operation performance
 */
export function useAsyncPerformanceTracker() {
  const measureAsync = async <T>(
    operationName: string,
    operation: () => Promise<T>,
    logThreshold = 100, // 100ms
  ): Promise<T> => {
    const startTime = performance.now();
    const result = await operation();
    const duration = performance.now() - startTime;

    if (duration > logThreshold) {
      logger.debug(
        `[Performance] ${operationName} took ${duration.toFixed(2)}ms`,
        "AsyncPerformanceTracker",
      );
    }

    return result;
  };

  return { measureAsync };
}
