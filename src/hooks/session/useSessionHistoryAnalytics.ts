/**
 * Session History Analytics Hook
 * Handles analytics, performance trends, and comparisons
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
  PerformanceTrends,
  GoalProgressHistory,
  ComparisonMetrics,
} from "./types/sessionHistory";

interface UseSessionHistoryAnalyticsParams {
  sessions: HistoricalSession[];
  trends: HistoryTrends;
  averageSessionLength: number;
  goalCompletionRate: number;
  consistencyScore: number;
  longestStreak: number;
}

export const useSessionHistoryAnalytics = ({
  sessions,
  trends,
  averageSessionLength,
  goalCompletionRate,
  consistencyScore,
  longestStreak,
}: UseSessionHistoryAnalyticsParams) => {
  const getPerformanceTrends = useCallback(
    (): PerformanceTrends =>
      getPerformanceTrendsUtil(
        averageSessionLength,
        trends,
        goalCompletionRate,
        consistencyScore,
        longestStreak,
      ),
    [
      averageSessionLength,
      trends,
      goalCompletionRate,
      consistencyScore,
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
};
