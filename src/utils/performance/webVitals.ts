/**
 * Web Vitals Performance Monitoring
 *
 * Tracks Core Web Vitals metrics and sends them to analytics.
 *
 * Target thresholds:
 * - FCP (First Contentful Paint): < 1.5s
 * - LCP (Largest Contentful Paint): < 2.5s
 * - INP (Interaction to Next Paint): < 200ms (replaces FID)
 * - CLS (Cumulative Layout Shift): < 0.1
 * - TTFB (Time to First Byte): < 600ms
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";

interface PerformanceMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  id: string;
  navigationType?: string;
}

/**
 * Sends performance metric to analytics
 */
const sendToAnalytics = (metric: PerformanceMetric): void => {
  // Send to Google Analytics if available
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", metric.name, {
      event_category: "Web Vitals",
      event_label: metric.id,
      value: Math.round(
        metric.name === "CLS" ? metric.value * 1000 : metric.value,
      ),
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: metric.rating,
      non_interaction: true,
    });
  }

  // Log to console in development
  if (import.meta.env.DEV) {
    console.log("[Web Vitals]", {
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
      navigationType: metric.navigationType,
    });
  }
};

/**
 * Determines the rating for a metric based on thresholds
 */
const getMetricRating = (
  name: string,
  value: number,
): "good" | "needs-improvement" | "poor" => {
  const thresholds: Record<string, [number, number]> = {
    FCP: [1500, 2500],
    LCP: [2500, 4000],
    INP: [200, 500], // Interaction to Next Paint (replaces FID)
    CLS: [0.1, 0.25],
    TTFB: [600, 1500],
  };

  const [good, poor] = thresholds[name] || [0, 0];

  if (value <= good) return "good";
  if (value <= poor) return "needs-improvement";
  return "poor";
};

/**
 * Handler for web vitals metrics
 */
const handleMetric = (metric: Metric): void => {
  const performanceMetric: PerformanceMetric = {
    name: metric.name,
    value: metric.value,
    rating: getMetricRating(metric.name, metric.value),
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  };

  sendToAnalytics(performanceMetric);
};

/**
 * Initialize Web Vitals tracking
 * Call this function once when the app loads
 */
export const initWebVitals = (): void => {
  try {
    // Track all Core Web Vitals
    onCLS(handleMetric);
    onFCP(handleMetric);
    onINP(handleMetric); // Interaction to Next Paint (replaces FID)
    onLCP(handleMetric);
    onTTFB(handleMetric);

    if (import.meta.env.DEV) {
      console.log("[Web Vitals] Performance monitoring initialized");
    }
  } catch (error) {
    console.error(
      "[Web Vitals] Failed to initialize performance monitoring:",
      error,
    );
  }
};

/**
 * Get current performance metrics (for manual reporting)
 */
export const getCurrentMetrics = async (): Promise<Record<string, number>> => {
  const metrics: Record<string, number> = {};

  try {
    if (typeof window !== "undefined" && window.performance) {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;

      if (navigation) {
        // Calculate key metrics
        metrics.ttfb = navigation.responseStart - navigation.requestStart;
        metrics.domContentLoaded =
          navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart;
        metrics.loadComplete =
          navigation.loadEventEnd - navigation.loadEventStart;
        metrics.domInteractive =
          navigation.domInteractive - navigation.fetchStart;
      }

      // Get paint metrics
      const paintEntries = performance.getEntriesByType("paint");
      paintEntries.forEach((entry) => {
        if (entry.name === "first-contentful-paint") {
          metrics.fcp = entry.startTime;
        }
      });
    }
  } catch (error) {
    console.error("[Web Vitals] Failed to get current metrics:", error);
  }

  return metrics;
};

/**
 * Report custom performance mark
 */
export const reportPerformanceMark = (
  markName: string,
  measureFrom: string = "navigationStart",
): void => {
  try {
    if (typeof window !== "undefined" && window.performance) {
      performance.mark(markName);

      const measure = performance.measure(
        `${markName}-duration`,
        measureFrom,
        markName,
      );

      if (import.meta.env.DEV) {
        console.log(
          `[Performance] ${markName}: ${measure.duration.toFixed(2)}ms`,
        );
      }

      // Send to analytics
      if (window.gtag) {
        window.gtag("event", "performance_mark", {
          event_category: "Performance",
          event_label: markName,
          value: Math.round(measure.duration),
          non_interaction: true,
        });
      }
    }
  } catch (error) {
    console.error("[Performance] Failed to report performance mark:", error);
  }
};

// TypeScript declaration for gtag
declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
  }
}

export default initWebVitals;
