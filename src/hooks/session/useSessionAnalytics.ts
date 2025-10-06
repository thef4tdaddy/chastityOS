/**
 * Session Analytics Hook
 * Handles analytics, trends, and comparison metrics
 */
import { useCallback } from "react";
import {
  getPerformanceTrends as getPerformanceTrendsUtil,
  getGoalProgressHistory as getGoalProgressHistoryUtil,
  getComparisonMetrics as getComparisonMetricsUtil,
} from "../../utils/session-history-helpers";
import type {
  HistoricalSession,
  HistoryTrends,
  HistoryInsights,
  PerformanceTrends,
  GoalProgressHistory,
  ComparisonMetrics,
} from "./types/sessionHistory";

export interface UseSessionAnalyticsOptions {
  sessions: HistoricalSession[];
  trends: HistoryTrends;
  insights: HistoryInsights;
  averageSessionLength: number;
  goalCompletionRate: number;
  longestStreak: number;
}

export function useSessionAnalytics({
  sessions,
  trends,
  insights,
  averageSessionLength,
  goalCompletionRate,
  longestStreak,
}: UseSessionAnalyticsOptions) {
  const getPerformanceTrends = useCallback(
    (): PerformanceTrends =>
      getPerformanceTrendsUtil(
        averageSessionLength,
        trends,
        goalCompletionRate,
        insights.consistencyScore,
        longestStreak,
      ),
    [
      averageSessionLength,
      trends,
      goalCompletionRate,
      insights.consistencyScore,
      longestStreak,
    ],
  );

  const getGoalProgressHistory = useCallback(
    (): GoalProgressHistory[] => getGoalProgressHistoryUtil(sessions),
    [sessions],
  );

  const getComparisonMetrics = useCallback(
    (): ComparisonMetrics => getComparisonMetricsUtil(sessions),
    [sessions],
  );

  return {
    getPerformanceTrends,
    getGoalProgressHistory,
    getComparisonMetrics,
  };
}
