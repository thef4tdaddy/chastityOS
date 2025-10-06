/**
 * Helper functions for usePerformance hook
 * Extracted to reduce function complexity
 */
import { logger } from "../../utils/logging";
import type {
  PerformanceMetrics,
  PerformanceRecommendation,
} from "./usePerformance";

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  memoryUsagePercent: { good: 70, poor: 90 },
  loadComplete: { good: 3000, poor: 6000 },
  apiResponseTime: { good: 500, poor: 2000 },
};

/**
 * Get current performance metrics
 */
export async function collectPerformanceMetrics(): Promise<PerformanceMetrics> {
  const perfMetrics: PerformanceMetrics = {
    lcp: 0,
    fid: 0,
    cls: 0,
    domContentLoaded: 0,
    loadComplete: 0,
    firstPaint: 0,
    firstContentfulPaint: 0,
    memoryUsed: 0,
    memoryTotal: 0,
    memoryUsagePercent: 0,
    networkType: "unknown",
    effectiveType: "unknown",
    downlink: 0,
    rtt: 0,
    componentRenderTime: 0,
    apiResponseTime: 0,
    timestamp: new Date(),
  };

  // Get performance timing
  if (performance.timing) {
    const timing = performance.timing;
    perfMetrics.domContentLoaded =
      timing.domContentLoadedEventEnd - timing.navigationStart;
    perfMetrics.loadComplete = timing.loadEventEnd - timing.navigationStart;
  }

  // Get paint timing
  const paintEntries = performance.getEntriesByType("paint");
  paintEntries.forEach((entry) => {
    if (entry.name === "first-paint") {
      perfMetrics.firstPaint = entry.startTime;
    } else if (entry.name === "first-contentful-paint") {
      perfMetrics.firstContentfulPaint = entry.startTime;
    }
  });

  // Get memory usage
  if ("memory" in performance) {
    const memory = (
      performance as Performance & {
        memory?: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
        };
      }
    ).memory;
    if (memory) {
      perfMetrics.memoryUsed = memory.usedJSHeapSize;
      perfMetrics.memoryTotal = memory.totalJSHeapSize;
      perfMetrics.memoryUsagePercent =
        (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;
    }
  }

  // Get network information
  const nav = navigator as Navigator & {
    connection?: {
      type?: string;
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
    };
    mozConnection?: {
      type?: string;
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
    };
    webkitConnection?: {
      type?: string;
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
    };
  };
  const connection =
    nav.connection || nav.mozConnection || nav.webkitConnection;
  if (connection) {
    perfMetrics.networkType = connection.type || "unknown";
    perfMetrics.effectiveType = connection.effectiveType || "unknown";
    perfMetrics.downlink = connection.downlink || 0;
    perfMetrics.rtt = connection.rtt || 0;
  }

  return perfMetrics;
}

/**
 * Generate performance recommendations
 */
export function generatePerformanceRecommendations(
  metrics: PerformanceMetrics,
): PerformanceRecommendation[] {
  const recs: PerformanceRecommendation[] = [];

  // Loading performance recommendations
  if (metrics.loadComplete > PERFORMANCE_THRESHOLDS.loadComplete.poor) {
    recs.push({
      id: "slow-loading",
      category: "loading",
      priority: "high",
      title: "Slow Page Loading",
      description: "Page load time exceeds recommended thresholds",
      impact: "High - affects user experience and engagement",
      effort: "Medium - requires code splitting and optimization",
    });
  }

  // Memory usage recommendations
  if (
    metrics.memoryUsagePercent > PERFORMANCE_THRESHOLDS.memoryUsagePercent.poor
  ) {
    recs.push({
      id: "high-memory",
      category: "memory",
      priority: "high",
      title: "High Memory Usage",
      description: "Application is using excessive memory",
      impact: "High - can cause crashes and slowdowns",
      effort: "High - requires memory leak investigation",
    });
  }

  // Network recommendations
  if (metrics.rtt > 500) {
    recs.push({
      id: "high-latency",
      category: "network",
      priority: "medium",
      title: "High Network Latency",
      description: "Network requests are slow",
      impact: "Medium - affects data loading",
      effort: "Low - implement caching strategies",
    });
  }

  return recs;
}

/**
 * Calculate performance score
 */
export function calculatePerformanceScore(
  currentMetrics: PerformanceMetrics,
): number {
  if (!currentMetrics) return 0;

  let score = 100;

  // Deduct points for poor metrics
  Object.entries(PERFORMANCE_THRESHOLDS).forEach(([key, thresholds]) => {
    const value = currentMetrics[key as keyof PerformanceMetrics] as number;

    if (value > thresholds.poor) {
      score -= 30;
    } else if (value > thresholds.good) {
      score -= 15;
    }
  });

  return Math.max(0, score);
}

/**
 * Measure component render time
 */
export function measureRenderTime(
  componentName: string,
  renderFn: () => void,
): number {
  const startTime = performance.now();
  renderFn();
  const endTime = performance.now();
  const renderTime = endTime - startTime;

  logger.debug(
    `Component ${componentName} render time: ${renderTime.toFixed(2)}ms`,
  );
  return renderTime;
}

/**
 * Measure API response time
 */
export async function measureApiTime<T>(
  apiCall: () => Promise<T>,
): Promise<{ result: T; responseTime: number }> {
  const startTime = performance.now();
  try {
    const result = await apiCall();
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    logger.debug(`API response time: ${responseTime.toFixed(2)}ms`);
    return { result, responseTime };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    logger.warn(`API error after ${responseTime.toFixed(2)}ms`, error);
    throw error;
  }
}
