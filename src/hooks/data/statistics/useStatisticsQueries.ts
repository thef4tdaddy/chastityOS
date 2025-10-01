/**
 * useStatisticsQueries - Query Operations
 * Time-based queries and comparative analysis functions
 */

import { useCallback } from "react";
import {
  getStatsForPeriod as calculateStatsForPeriod,
  getMonthlyTrends as calculateMonthlyTrends,
  getWeeklyBreakdown as calculateWeeklyBreakdown,
  compareWithPrevious as compareMetricsWithPrevious,
  getBenchmarkComparisons as calculateBenchmarkComparisons,
} from "../../../utils/statistics/calculations";
import {
  generateKeyholderDashboard,
  generateRelationshipComparison,
} from "../../../utils/statistics/keyholder";
import {
  generatePredictiveInsights,
  generateRecommendations,
} from "../../../utils/statistics/predictions";
import type {
  SessionStatistics,
  GoalStatistics,
  TimePeriod,
} from "../types/statistics";

interface UseStatisticsQueriesOptions {
  sessionStats: SessionStatistics;
  goalStats: GoalStatistics;
  consistencyRating: number;
}

export const useStatisticsQueries = (options: UseStatisticsQueriesOptions) => {
  const { sessionStats, goalStats, consistencyRating } = options;

  const getStatsForPeriod = useCallback(
    (period: TimePeriod) => calculateStatsForPeriod(period),
    [],
  );

  const getMonthlyTrends = useCallback(
    (months: number) => calculateMonthlyTrends(months),
    [],
  );

  const getWeeklyBreakdown = useCallback(() => calculateWeeklyBreakdown(), []);

  const compareWithPrevious = useCallback(
    (period: TimePeriod) => compareMetricsWithPrevious(period, sessionStats),
    [sessionStats],
  );

  const getBenchmarkComparisons = useCallback(
    () => calculateBenchmarkComparisons(sessionStats),
    [sessionStats],
  );

  const getKeyholderDashboard = useCallback(
    () =>
      generateKeyholderDashboard(consistencyRating, sessionStats, goalStats),
    [consistencyRating, sessionStats, goalStats],
  );

  const getRelationshipComparison = useCallback(
    () => generateRelationshipComparison(sessionStats),
    [sessionStats],
  );

  const getPredictiveInsights = useCallback(
    () => generatePredictiveInsights(),
    [],
  );

  const getRecommendations = useCallback(() => generateRecommendations(), []);

  return {
    getStatsForPeriod,
    getMonthlyTrends,
    getWeeklyBreakdown,
    compareWithPrevious,
    getBenchmarkComparisons,
    getKeyholderDashboard,
    getRelationshipComparison,
    getPredictiveInsights,
    getRecommendations,
  };
};
