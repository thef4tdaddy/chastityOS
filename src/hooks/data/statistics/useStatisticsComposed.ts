/**
 * Comprehensive Statistics Hook (Composed)
 * Provides analytics and insights for both users and keyholders
 * with appropriate privacy controls
 */

import { useMemo, useEffect } from "react";
import {
  calculateImprovementScore,
  calculateConsistencyRating,
  calculateOverallProgress,
  calculateKeyholderSatisfaction,
} from "../../../utils/statisticsHelpers";
import { useStatisticsState } from "./useStatisticsState";
import { useStatisticsLoaders } from "./useStatisticsLoaders";
import { useStatisticsQueries } from "./useStatisticsQueries";
import { useStatisticsExport } from "./useStatisticsExport";

export const useStatistics = (userId: string, relationshipId?: string) => {
  // State management
  const {
    sessionStats,
    setSessionStats,
    goalStats,
    setGoalStats,
    achievementStats,
    setAchievementStats,
    comparativeStats,
    setComparativeStats,
    sharedStats,
    setSharedStats,
    setPredictiveAnalytics,
    setRecommendations,
    isLoading,
    setIsLoading,
    error,
    setError,
  } = useStatisticsState();

  // Computed values
  const improvementScore = useMemo(
    () => calculateImprovementScore(sessionStats.trends),
    [sessionStats.trends],
  );

  const consistencyRating = useMemo(
    () => calculateConsistencyRating(sessionStats),
    [sessionStats],
  );

  const overallProgress = useMemo(
    () => calculateOverallProgress(goalStats),
    [goalStats],
  );

  const keyholderSatisfaction = useMemo(
    () => calculateKeyholderSatisfaction(sharedStats),
    [sharedStats],
  );

  // Data loading
  const {
    loadSessionStatistics,
    loadGoalStatistics,
    loadAchievementStatistics,
    loadComparativeStatistics,
    loadSharedStatistics,
    loadPredictiveAnalytics,
    loadRecommendations,
  } = useStatisticsLoaders({
    relationshipId,
    sessionStats,
    goalStats,
    consistencyRating,
    setSessionStats,
    setGoalStats,
    setAchievementStats,
    setComparativeStats,
    setSharedStats,
    setPredictiveAnalytics,
    setRecommendations,
  });

  // Initialize statistics
  useEffect(() => {
    const initializeStatistics = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        setError(null);

        await Promise.all([
          loadSessionStatistics(),
          loadGoalStatistics(),
          loadAchievementStatistics(),
          loadComparativeStatistics(),
          loadSharedStatistics(),
          loadPredictiveAnalytics(),
          loadRecommendations(),
        ]);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize statistics",
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeStatistics();
    /* eslint-disable react-hooks/exhaustive-deps, zustand-safe-patterns/zustand-no-store-actions-in-deps */
  }, [
    userId,
    loadSessionStatistics,
    loadGoalStatistics,
    loadAchievementStatistics,
    loadComparativeStatistics,
    loadSharedStatistics,
    loadPredictiveAnalytics,
    loadRecommendations,
  ]);
  /* eslint-enable react-hooks/exhaustive-deps, zustand-safe-patterns/zustand-no-store-actions-in-deps */

  // Query operations
  const {
    getStatsForPeriod,
    getMonthlyTrends,
    getWeeklyBreakdown,
    compareWithPrevious,
    getBenchmarkComparisons,
    getKeyholderDashboard,
    getRelationshipComparison,
    getPredictiveInsights,
    getRecommendations,
  } = useStatisticsQueries({
    sessionStats,
    goalStats,
    consistencyRating,
  });

  // Export and sharing
  const { exportStatistics, shareWithKeyholder } = useStatisticsExport({
    userId,
    relationshipId,
    sessionStats,
    goalStats,
    achievementStats,
    setSharedStats,
  });

  return {
    // Statistics
    sessionStats,
    goalStats,
    achievementStats,
    comparativeStats,

    // Time-based queries
    getStatsForPeriod,
    getMonthlyTrends,
    getWeeklyBreakdown,

    // Comparative analysis
    compareWithPrevious,
    getBenchmarkComparisons,

    // Keyholder features
    getKeyholderDashboard,
    getRelationshipComparison,

    // Predictive analytics
    getPredictiveInsights,
    getRecommendations,

    // Export and sharing
    exportStatistics,
    shareWithKeyholder,

    // Computed values
    improvementScore,
    consistencyRating,
    overallProgress,
    keyholderSatisfaction,

    // Loading states
    isLoading,
    error,
  };
};
