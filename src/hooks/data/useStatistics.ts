/**
 * Comprehensive Statistics Hook
 * Provides analytics and insights for both users and keyholders
 * with appropriate privacy controls
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { serviceLogger } from "../../utils/logging";
import {
  calculateImprovementScore,
  calculateConsistencyRating,
  calculateOverallProgress,
  calculateKeyholderSatisfaction,
} from "../../utils/statisticsHelpers";
import {
  getStatsForPeriod as calculateStatsForPeriod,
  getMonthlyTrends as calculateMonthlyTrends,
  getWeeklyBreakdown as calculateWeeklyBreakdown,
  compareWithPrevious as compareMetricsWithPrevious,
  getBenchmarkComparisons as calculateBenchmarkComparisons,
} from "../../utils/statistics/calculations";
import {
  generateKeyholderDashboard,
  generateRelationshipComparison,
} from "../../utils/statistics/keyholder";
import {
  generatePredictiveInsights,
  generateRecommendations,
} from "../../utils/statistics/predictions";

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
  TimePeriod,
  PeriodStatistics as _PeriodStatistics,
  MonthlyTrends as _MonthlyTrends,
  WeeklyBreakdown as _WeeklyBreakdown,
  ComparisonResult as _ComparisonResult,
  BenchmarkData as _BenchmarkData,
  KeyholderDashboardStats as _KeyholderDashboardStats,
  KeyholderStatisticsView,
  RelationshipComparisonStats as _RelationshipComparisonStats,
  PredictiveInsights as _PredictiveInsights,
  Recommendation as _Recommendation,
  StatisticsExport,
  StatisticType,
  ExportFormat,
} from "./types/statistics";

// ==================== HOOK IMPLEMENTATION ====================

// Complex statistics aggregation hook requires many statements for comprehensive metrics
// eslint-disable-next-line max-statements
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

  // ==================== DATA LOADING FUNCTIONS ====================

  const loadSessionStatistics = useCallback(async () => {
    try {
      // This would integrate with your session database service
      // Calculate session statistics from historical data
      const mockStats: SessionStatistics = {
        totalSessionTime: 7200, // 2 hours
        averageSessionLength: 3600, // 1 hour
        longestSession: 7200,
        shortestSession: 1800,
        sessionsThisWeek: 3,
        sessionsThisMonth: 12,
        sessionFrequency: {
          daily: 0.4,
          weekly: 3,
          monthly: 12,
          trend: "stable",
        },
        completionRate: 85,
        goalAchievementRate: 75,
        satisfactionRating: 4.2,
        trends: [],
        streaks: {
          current: 5,
          longest: 12,
          type: "session_consistency",
        },
      };

      setSessionStats(mockStats);
    } catch (error) {
      logger.error("Failed to load session statistics", { error });
    }
  }, []); // userId not actually used in mock implementation

  const loadGoalStatistics = useCallback(async () => {
    try {
      // Calculate goal statistics from historical goal data
      setGoalStats({
        totalGoals: 25,
        completedGoals: 20,
        activeGoals: 3,
        completionRate: 80,
        averageCompletionTime: 48, // hours
        mostCommonGoalTypes: [],
        hardestGoalTypes: [],
        goalStreaks: {
          current: 3,
          longest: 8,
          type: "goal_completion",
        },
      });
    } catch (error) {
      logger.error("Failed to load goal statistics", { error });
    }
  }, []); // userId not actually used in mock implementation

  const loadAchievementStatistics = useCallback(async () => {
    try {
      // Load achievement data
      setAchievementStats({
        totalAchievements: 15,
        recentAchievements: [],
        achievementsByCategory: [],
        rareAchievements: [],
        achievementPoints: 1500,
        percentileRank: 75,
      });
    } catch (error) {
      logger.error("Failed to load achievement statistics", { error });
    }
  }, []);

  const loadComparativeStatistics = useCallback(async () => {
    try {
      // Load comparative data (anonymized benchmarks)
      setComparativeStats((prev) => ({
        ...prev,
        userPercentile: 72,
      }));
    } catch (error) {
      logger.error("Failed to load comparative statistics", { error });
    }
  }, []); // sessionStats not actually used for computation

  const loadSharedStatistics = useCallback(async () => {
    try {
      if (!relationshipId) return;

      // Load keyholder-specific statistics view
      const keyholderView: KeyholderStatisticsView = {
        sessionOverview: {
          totalSessions: sessionStats.sessionsThisMonth,
          averageDuration: sessionStats.averageSessionLength,
          lastSessionDate: new Date(),
        },
        goalProgress: {
          activeGoals: goalStats.activeGoals,
          completionRate: goalStats.completionRate,
        },
        behaviorPatterns: {
          consistency: consistencyRating,
          pauseFrequency: 0.2,
          improvementTrend: "improving",
        },
        allowedInsights: ["session_duration", "goal_completion"],
      };

      setSharedStats((prev) => ({
        ...prev,
        keyholderView,
      }));
    } catch (error) {
      logger.error("Failed to load shared statistics", { error });
    }
  }, [
    relationshipId,
    consistencyRating,
    sessionStats.sessionsThisMonth,
    sessionStats.averageSessionLength,
    goalStats.activeGoals,
    goalStats.completionRate,
  ]);

  const loadPredictiveAnalytics = useCallback(async () => {
    try {
      // Generate predictive insights based on historical data
      setPredictiveAnalytics({
        nextSessionPrediction: {
          suggestedDuration: sessionStats.averageSessionLength * 1.1,
          successProbability: 85,
          optimalStartTime: new Date(),
          riskFactors: [],
        },
        goalRecommendations: [],
        improvementOpportunities: [],
        trendPredictions: [],
      });
    } catch (error) {
      logger.error("Failed to load predictive analytics", { error });
    }
  }, [sessionStats.averageSessionLength]);

  const loadRecommendations = useCallback(async () => {
    try {
      // Generate personalized recommendations
      setRecommendations({
        sessionRecommendations: [],
        goalRecommendations: [],
        behaviorInsights: [],
        personalizedTips: [],
      });
    } catch (error) {
      logger.error("Failed to load recommendations", { error });
    }
  }, []); // Static data for recommendations

  // ==================== TIME-BASED QUERIES ====================

  const getStatsForPeriod = useCallback(
    (period: TimePeriod) => calculateStatsForPeriod(period),
    [],
  );

  const getMonthlyTrends = useCallback(
    (months: number) => calculateMonthlyTrends(months),
    [],
  );

  const getWeeklyBreakdown = useCallback(() => calculateWeeklyBreakdown(), []);

  // ==================== COMPARATIVE ANALYSIS ====================

  const compareWithPrevious = useCallback(
    (period: TimePeriod) => compareMetricsWithPrevious(period, sessionStats),
    [sessionStats],
  );

  const getBenchmarkComparisons = useCallback(
    () => calculateBenchmarkComparisons(sessionStats),
    [sessionStats],
  );

  // ==================== KEYHOLDER FEATURES ====================

  const getKeyholderDashboard = useCallback(
    () =>
      generateKeyholderDashboard(consistencyRating, sessionStats, goalStats),
    [consistencyRating, sessionStats, goalStats],
  );

  const getRelationshipComparison = useCallback(
    () => generateRelationshipComparison(sessionStats),
    [sessionStats],
  );

  // ==================== PREDICTIVE ANALYTICS ====================

  const getPredictiveInsights = useCallback(
    () => generatePredictiveInsights(),
    [],
  );

  const getRecommendations = useCallback(() => generateRecommendations(), []);

  // ==================== EXPORT AND SHARING ====================

  const exportStatistics = useCallback(
    async (format: ExportFormat): Promise<StatisticsExport> => {
      try {
        logger.debug("Exporting statistics", { format, userId });

        const exportData = {
          sessionStats,
          goalStats,
          achievementStats,
          exportedAt: new Date(),
        };

        return {
          format,
          data: exportData,
          generatedAt: new Date(),
          fileSize: JSON.stringify(exportData).length,
          downloadUrl: "https://example.com/download/stats",
        };
      } catch (error) {
        logger.error("Failed to export statistics", { error });
        throw error;
      }
    },
    [userId, sessionStats, goalStats, achievementStats],
  );

  const shareWithKeyholder = useCallback(
    async (statTypes: StatisticType[]): Promise<void> => {
      try {
        if (!relationshipId) {
          throw new Error("No keyholder relationship found");
        }

        logger.debug("Sharing statistics with keyholder", { statTypes });

        setSharedStats((prev) => ({
          ...prev,
          allowedMetrics: statTypes,
          lastSharedAt: new Date(),
        }));

        logger.info("Statistics shared with keyholder successfully");
      } catch (error) {
        logger.error("Failed to share statistics with keyholder", { error });
        throw error;
      }
    },
    [relationshipId],
  );

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
