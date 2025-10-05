/**
 * Comprehensive Statistics Hook
 * Provides analytics and insights for both users and keyholders
 * with appropriate privacy controls
 */
import { useState, useEffect, useMemo } from "react";
import { serviceLogger } from "../../utils/logging";
import {
  calculateImprovementScore,
  calculateConsistencyRating,
  calculateOverallProgress,
  calculateKeyholderSatisfaction,
} from "../../utils/statisticsHelpers";
import {
  useSessionStatisticsLoader,
  useGoalStatisticsLoader,
  useAchievementStatisticsLoader,
  useComparativeStatisticsLoader,
  useSharedStatisticsLoader,
  usePredictiveAnalyticsLoader,
  useRecommendationsLoader,
} from "./useStatisticsLoaders";
import {
  useTimeBasedQueries,
  useComparativeAnalysis,
  useKeyholderFeatures,
  usePredictiveAnalytics,
  useStatisticsExport,
} from "./useStatisticsOperations";

const logger = serviceLogger("useStatistics");

// ==================== INTERFACES ====================

// Re-export all types from the types file
export type * from "./types/statistics";

import type {
  SessionStatistics,
  GoalStatistics,
  AchievementStatistics,
  ComparativeStatistics,
  SharedStatistics,
  PredictiveAnalytics,
  RecommendationEngine,
} from "./types/statistics";

// ==================== HOOK IMPLEMENTATION ====================

// Complex statistics aggregation hook requires many statements and lines for comprehensive metrics
// eslint-disable-next-line max-statements, max-lines-per-function
export const useStatistics = (userId: string, relationshipId?: string) => {
  // ==================== STATE ====================

  const [sessionStats, setSessionStats] = useState<SessionStatistics>({
    totalSessionTime: 0,
    averageSessionLength: 0,
    longestSession: 0,
    shortestSession: 0,
    sessionsThisWeek: 0,
    sessionsThisMonth: 0,
    sessionFrequency: {
      daily: 0,
      weekly: 0,
      monthly: 0,
      trend: "stable",
    },
    completionRate: 0,
    goalAchievementRate: 0,
    satisfactionRating: 0,
    trends: [],
    streaks: {
      current: 0,
      longest: 0,
      type: "session_consistency",
    },
  });

  const [goalStats, setGoalStats] = useState<GoalStatistics>({
    totalGoals: 0,
    completedGoals: 0,
    activeGoals: 0,
    completionRate: 0,
    averageCompletionTime: 0,
    mostCommonGoalTypes: [],
    hardestGoalTypes: [],
    goalStreaks: {
      current: 0,
      longest: 0,
      type: "goal_completion",
    },
  });

  const [achievementStats, setAchievementStats] =
    useState<AchievementStatistics>({
      totalAchievements: 0,
      recentAchievements: [],
      achievementsByCategory: [],
      rareAchievements: [],
      achievementPoints: 0,
      percentileRank: 0,
    });

  const [comparativeStats, setComparativeStats] =
    useState<ComparativeStatistics>({
      userPercentile: 50,
      averageUserStats: sessionStats,
      personalBest: {
        longestSession: 0,
        mostGoalsInSession: 0,
        longestStreak: 0,
        highestSatisfactionRating: 0,
        bestMonth: {
          month: "",
          year: 0,
          totalTime: 0,
          sessionCount: 0,
        },
      },
      improvements: {
        sessionLength: { improvement: 0, timeframe: "month" },
        consistency: { improvement: 0, timeframe: "month" },
        goalCompletion: { improvement: 0, timeframe: "month" },
      },
    });

  const [sharedStats, setSharedStats] = useState<SharedStatistics>({
    allowedMetrics: [],
    keyholderView: {
      sessionOverview: {
        totalSessions: 0,
        averageDuration: 0,
        lastSessionDate: new Date(),
      },
      goalProgress: {
        activeGoals: 0,
        completionRate: 0,
      },
      behaviorPatterns: {
        consistency: 0,
        pauseFrequency: 0,
        improvementTrend: "stable",
      },
      allowedInsights: [],
    },
    lastSharedAt: new Date(),
    sharingLevel: "basic",
  });

  const [_predictiveAnalytics, setPredictiveAnalytics] =
    useState<PredictiveAnalytics>({
      nextSessionPrediction: {
        suggestedDuration: 0,
        successProbability: 0,
        optimalStartTime: new Date(),
        riskFactors: [],
      },
      goalRecommendations: [],
      improvementOpportunities: [],
      trendPredictions: [],
    });

  const [_recommendations, setRecommendations] = useState<RecommendationEngine>(
    {
      sessionRecommendations: [],
      goalRecommendations: [],
      behaviorInsights: [],
      personalizedTips: [],
    },
  );

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==================== COMPUTED VALUES ====================

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

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    const initializeStatistics = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Load all statistics data
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
        logger.error("Failed to initialize statistics", { error: err });
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
    // Callback functions are stable and don't need to be in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, relationshipId]);

  // ==================== DATA LOADING HOOKS ====================

  const { loadSessionStatistics } = useSessionStatisticsLoader(setSessionStats);
  const { loadGoalStatistics } = useGoalStatisticsLoader(setGoalStats);
  const { loadAchievementStatistics } =
    useAchievementStatisticsLoader(setAchievementStats);
  const { loadComparativeStatistics } =
    useComparativeStatisticsLoader(setComparativeStats);
  const { loadSharedStatistics } = useSharedStatisticsLoader(
    relationshipId,
    sessionStats,
    goalStats,
    consistencyRating,
    setSharedStats,
  );
  const { loadPredictiveAnalytics } = usePredictiveAnalyticsLoader(
    sessionStats,
    setPredictiveAnalytics,
  );
  const { loadRecommendations } = useRecommendationsLoader(setRecommendations);

  // ==================== OPERATION HOOKS ====================

  const { getStatsForPeriod, getMonthlyTrends, getWeeklyBreakdown } =
    useTimeBasedQueries();

  const { compareWithPrevious, getBenchmarkComparisons } =
    useComparativeAnalysis(sessionStats);

  const { getKeyholderDashboard, getRelationshipComparison } =
    useKeyholderFeatures(consistencyRating, sessionStats, goalStats);

  const { getPredictiveInsights, getRecommendations } =
    usePredictiveAnalytics();

  const { exportStatistics, shareWithKeyholder } = useStatisticsExport({
    userId,
    sessionStats,
    goalStats,
    achievementStats,
    relationshipId,
    setSharedStats,
  });

  // ==================== RETURN HOOK INTERFACE ====================

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
