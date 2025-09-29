/**
 * usePerformance Hook - Performance Monitoring
 *
 * Monitor application performance metrics, identify bottlenecks, and provide
 * optimization recommendations.
 */

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { logger } from "../../utils/logging";

// Performance metric types
export interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift

  // Loading performance
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;

  // Memory usage
  memoryUsed: number;
  memoryTotal: number;
  memoryUsagePercent: number;

  // Network
  networkType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;

  // Custom metrics
  componentRenderTime: number;
  apiResponseTime: number;

  timestamp: Date;
}

// Performance alert
export interface PerformanceAlert {
  id: string;
  type: "warning" | "critical";
  metric: keyof PerformanceMetrics;
  value: number;
  threshold: number;
  message: string;
  timestamp: Date;
}

// Performance recommendation
export interface PerformanceRecommendation {
  id: string;
  category: "loading" | "runtime" | "memory" | "network";
  priority: "low" | "medium" | "high";
  title: string;
  description: string;
  impact: string;
  effort: string;
}

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  memoryUsagePercent: { good: 70, poor: 90 },
  loadComplete: { good: 3000, poor: 6000 },
  apiResponseTime: { good: 500, poor: 2000 },
};

/**
 * Performance Monitoring Hook
 */
export const usePerformance = () => {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);

  // Get current performance metrics
  const { data: metrics, isLoading } = useQuery<PerformanceMetrics>({
    queryKey: ["performance", "metrics"],
    queryFn: async () => {
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
        const memory = (performance as any).memory;
        perfMetrics.memoryUsed = memory.usedJSHeapSize;
        perfMetrics.memoryTotal = memory.totalJSHeapSize;
        perfMetrics.memoryUsagePercent =
          (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;
      }

      // Get network information
      const nav = navigator as any;
      const connection =
        nav.connection || nav.mozConnection || nav.webkitConnection;
      if (connection) {
        perfMetrics.networkType = connection.type || "unknown";
        perfMetrics.effectiveType = connection.effectiveType || "unknown";
        perfMetrics.downlink = connection.downlink || 0;
        perfMetrics.rtt = connection.rtt || 0;
      }

      return perfMetrics;
    },
    refetchInterval: isMonitoring ? 10000 : false, // Every 10 seconds
    staleTime: 5000,
  });

  // Generate performance recommendations
  const { data: recommendations = [] } = useQuery<PerformanceRecommendation[]>({
    queryKey: ["performance", "recommendations", metrics],
    queryFn: () => {
      if (!metrics) return [];

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
        metrics.memoryUsagePercent >
        PERFORMANCE_THRESHOLDS.memoryUsagePercent.poor
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
    },
    enabled: Boolean(metrics),
    staleTime: 60000, // 1 minute
  });

  // Check for performance issues and generate alerts
  const checkPerformanceAlerts = useCallback(
    (currentMetrics: PerformanceMetrics) => {
      const newAlerts: PerformanceAlert[] = [];

      // Check each threshold
      Object.entries(PERFORMANCE_THRESHOLDS).forEach(([key, thresholds]) => {
        const value = currentMetrics[key as keyof PerformanceMetrics] as number;

        if (value > thresholds.poor) {
          newAlerts.push({
            id: `${key}-critical-${Date.now()}`,
            type: "critical",
            metric: key as keyof PerformanceMetrics,
            value,
            threshold: thresholds.poor,
            message: `${key.toUpperCase()} is critically high: ${value.toFixed(2)}ms`,
            timestamp: new Date(),
          });
        } else if (value > thresholds.good) {
          newAlerts.push({
            id: `${key}-warning-${Date.now()}`,
            type: "warning",
            metric: key as keyof PerformanceMetrics,
            value,
            threshold: thresholds.good,
            message: `${key.toUpperCase()} exceeds good threshold: ${value.toFixed(2)}ms`,
            timestamp: new Date(),
          });
        }
      });

      if (newAlerts.length > 0) {
        setAlerts((prev) => [...prev.slice(-19), ...newAlerts]); // Keep last 20 alerts
      }
    },
    [],
  );

  // Monitor performance changes
  useEffect(() => {
    if (metrics && isMonitoring) {
      checkPerformanceAlerts(metrics);
    }
  }, [metrics, isMonitoring, checkPerformanceAlerts]);

  // Measure component render time
  const measureRenderTime = useCallback(
    (componentName: string, renderFn: () => void) => {
      const startTime = performance.now();
      renderFn();
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      logger.debug(
        `Component ${componentName} render time: ${renderTime.toFixed(2)}ms`,
      );
      return renderTime;
    },
    [],
  );

  // Measure API response time
  const measureApiTime = useCallback(async <T>(apiCall: () => Promise<T>): Promise<T> => {
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
  }, []);

  // Clear old alerts
  const clearOldAlerts = useCallback(() => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    setAlerts((prev) => prev.filter((alert) => alert.timestamp > oneHourAgo));
  }, []);

  // Performance score calculation
  const performanceScore = useCallback(
    (currentMetrics: PerformanceMetrics): number => {
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
    },
    [],
  );

  return {
    // Current metrics
    metrics,
    isLoading,

    // Performance insights
    performanceScore: metrics ? performanceScore(metrics) : 0,
    recommendations,
    alerts,

    // Controls
    isMonitoring,
    setIsMonitoring,
    clearOldAlerts,

    // Measurement tools
    measureRenderTime,
    measureApiTime,

    // Computed properties
    isPerformant: metrics ? performanceScore(metrics) > 80 : false,
    hasIssues: alerts.length > 0,
    criticalIssues: alerts.filter((a) => a.type === "critical").length,
    warningIssues: alerts.filter((a) => a.type === "warning").length,

    // Quick checks
    isSlowLoading: metrics?.loadComplete
      ? metrics.loadComplete > PERFORMANCE_THRESHOLDS.loadComplete.good
      : false,
    isHighMemory: metrics?.memoryUsagePercent
      ? metrics.memoryUsagePercent >
        PERFORMANCE_THRESHOLDS.memoryUsagePercent.good
      : false,
    isSlowNetwork: metrics?.rtt ? metrics.rtt > 500 : false,
  };
};
