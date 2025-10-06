/**
 * useSessionHistoryRetrieval Hook
 * Handles session history data retrieval operations
 */
import { useCallback, useMemo } from "react";
import {
  getSessionsByDateRange as getSessionsByDateRangeUtil,
  getSessionsByGoal as getSessionsByGoalUtil,
  searchSessions as searchSessionsUtil,
  getKeyholderView as getKeyholderViewUtil,
  getPerformanceTrends as getPerformanceTrendsUtil,
  getGoalProgressHistory as getGoalProgressHistoryUtil,
  getComparisonMetrics as getComparisonMetricsUtil,
} from "../../utils/session-history-helpers";
import type {
  HistoricalSession,
  HistoryPrivacySettings,
  KeyholderHistoryAccess,
  HistorySearchQuery,
  KeyholderHistoryView,
  PerformanceTrends,
  GoalProgressHistory,
  ComparisonMetrics,
  HistoryTrends,
  HistoryInsights,
} from "./types/sessionHistory";

export function useSessionHistoryRetrieval(
  sessions: HistoricalSession[],
  keyholderAccess: KeyholderHistoryAccess,
  privacySettings: HistoryPrivacySettings,
  averageSessionLength: number,
  goalCompletionRate: number,
  trends: HistoryTrends,
  insights: HistoryInsights,
  longestStreak: number,
) {
  // Data retrieval callbacks
  const getSessionsByDateRange = useCallback(
    (start: Date, end: Date): HistoricalSession[] =>
      getSessionsByDateRangeUtil(sessions, start, end),
    [sessions],
  );

  const getSessionsByGoal = useCallback(
    (goalId: string): HistoricalSession[] =>
      getSessionsByGoalUtil(sessions, goalId),
    [sessions],
  );

  const searchSessions = useCallback(
    (query: HistorySearchQuery): HistoricalSession[] =>
      searchSessionsUtil(sessions, query),
    [sessions],
  );

  const getKeyholderView = useMemo(
    (): KeyholderHistoryView =>
      getKeyholderViewUtil(
        sessions,
        keyholderAccess,
        privacySettings,
        averageSessionLength,
        goalCompletionRate,
      ),
    [
      keyholderAccess,
      sessions,
      privacySettings,
      averageSessionLength,
      goalCompletionRate,
    ],
  );

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
    (goalId: string): GoalProgressHistory =>
      getGoalProgressHistoryUtil(sessions, goalId),
    [sessions],
  );

  const getComparisonMetrics = useCallback(
    (period1: { start: Date; end: Date }, period2: { start: Date; end: Date }): ComparisonMetrics =>
      getComparisonMetricsUtil(sessions, period1, period2),
    [sessions],
  );

  return {
    getSessionsByDateRange,
    getSessionsByGoal,
    searchSessions,
    getKeyholderView,
    getPerformanceTrends,
    getGoalProgressHistory,
    getComparisonMetrics,
  };
}
