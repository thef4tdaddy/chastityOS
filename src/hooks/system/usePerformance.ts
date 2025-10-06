/**
 * usePerformance Hook - Performance Monitoring
 *
 * Monitor application performance metrics, identify bottlenecks, and provide
 * optimization recommendations.
 */

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PERFORMANCE_THRESHOLDS,
  collectPerformanceMetrics,
  generatePerformanceRecommendations,
  calculatePerformanceScore,
  measureRenderTime,
  measureApiTime,
} from "./performanceHelpers";

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

/**
 * Performance Monitoring Hook
 */
export const usePerformance = () => {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);

  // Get current performance metrics
  const { data: metrics, isLoading } = useQuery<PerformanceMetrics>({
    queryKey: ["performance", "metrics"],
    queryFn: collectPerformanceMetrics,
    refetchInterval: isMonitoring ? 10000 : false, // Every 10 seconds
    staleTime: 5000,
  });

  // Generate performance recommendations
  const { data: recommendations = [] } = useQuery<PerformanceRecommendation[]>({
    queryKey: ["performance", "recommendations", metrics],
    queryFn: () => {
      if (!metrics) return [];
      return generatePerformanceRecommendations(metrics);
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

  // Clear old alerts
  const clearOldAlerts = useCallback(() => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    setAlerts((prev) => prev.filter((alert) => alert.timestamp > oneHourAgo));
  }, []);

  return {
    // Current metrics
    metrics,
    isLoading,

    // Performance insights
    performanceScore: metrics ? calculatePerformanceScore(metrics) : 0,
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
    isPerformant: metrics ? calculatePerformanceScore(metrics) > 80 : false,
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
