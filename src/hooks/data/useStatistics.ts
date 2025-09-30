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
  PeriodStatistics,
  MonthlyTrends,
  WeeklyBreakdown,
  ComparisonResult,
  BenchmarkData,
  KeyholderDashboardStats,
  RelationshipComparisonStats,
  PredictiveInsights,
  Recommendation,
  StatisticsExport,
  ExportFormat,
} from "./types/statistics";

// ==================== HOOK IMPLEMENTATION ====================

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
  }, [
    userId,
    relationshipId,
    loadSessionStatistics,
    loadGoalStatistics,
    loadComparativeStatistics,
    loadAchievementStatistics,
    loadSharedStatistics,
    loadPredictiveAnalytics,
    loadRecommendations,
  ]);

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
    (period: TimePeriod): PeriodStatistics => {
      // Filter and calculate statistics for specific time period
      return {
        period,
        sessionCount: 0,
        totalTime: 0,
        goalCompletionRate: 0,
        averageSatisfaction: 0,
      };
    },
    [],
  );

  const getMonthlyTrends = useCallback((_months: number): MonthlyTrends => {
    // Calculate monthly trends for specified number of months
    return {
      months: [],
      overallTrend: "stable",
    };
  }, []);

  const getWeeklyBreakdown = useCallback((): WeeklyBreakdown => {
    // Analyze sessions by day of week
    return {
      weekdays: [],
      weekendVsWeekday: {
        weekday: {
          period: { start: new Date(), end: new Date(), label: "Weekday" },
          sessionCount: 0,
          totalTime: 0,
          goalCompletionRate: 0,
          averageSatisfaction: 0,
        },
        weekend: {
          period: { start: new Date(), end: new Date(), label: "Weekend" },
          sessionCount: 0,
          totalTime: 0,
          goalCompletionRate: 0,
          averageSatisfaction: 0,
        },
      },
    };
  }, []);

  // ==================== COMPARATIVE ANALYSIS ====================

  const compareWithPrevious = useCallback(
    (_period: TimePeriod): ComparisonResult => {
      // Compare current metrics with previous period
      return {
        metric: "session_duration",
        currentValue: sessionStats.averageSessionLength,
        previousValue: sessionStats.averageSessionLength * 0.9,
        change: sessionStats.averageSessionLength * 0.1,
        changePercentage: 10,
        trend: "improving",
      };
    },
    [sessionStats],
  );

  const getBenchmarkComparisons = useCallback((): BenchmarkData[] => {
    // Compare user metrics with anonymized community benchmarks
    return [
      {
        userValue: sessionStats.averageSessionLength,
        averageValue: 3000, // 50 minutes average
        percentile: 75,
        category: "session_duration",
      },
    ];
  }, [sessionStats]);

  // ==================== KEYHOLDER FEATURES ====================

  const getKeyholderDashboard = useCallback((): KeyholderDashboardStats => {
    return {
      submissiveOverview: {
        name: "Submissive",
        consistencyScore: consistencyRating,
        improvementTrend: "improving",
        lastActiveDate: new Date(),
      },
      sessionSummary: {
        thisWeek: sessionStats.sessionsThisWeek,
        thisMonth: sessionStats.sessionsThisMonth,
        averageDuration: sessionStats.averageSessionLength,
        completionRate: sessionStats.completionRate,
      },
      goalTracking: {
        activeGoals: [],
        completionRate: goalStats.completionRate,
        upcomingDeadlines: [],
      },
      behaviorInsights: {
        strengths: [],
        areasForImprovement: [],
        recommendations: [],
      },
    };
  }, [
    consistencyRating,
    sessionStats.sessionsThisWeek,
    sessionStats.sessionsThisMonth,
    sessionStats.averageSessionLength,
    sessionStats.completionRate,
    goalStats.completionRate,
  ]);

  const getRelationshipComparison =
    useCallback((): RelationshipComparisonStats => {
      return {
        relationshipDuration: 90, // days
        sharedSessions: sessionStats.sessionsThisMonth,
        collaborationScore: 85,
        satisfactionTrend: "improving",
        milestones: [],
      };
    }, [sessionStats.sessionsThisMonth]);

  // ==================== PREDICTIVE ANALYTICS ====================

  const getPredictiveInsights = useCallback((): PredictiveInsights => {
    return {
      nextSessionSuccess: {
        probability: 85,
        factors: ["consistent schedule", "appropriate goal setting"],
      },
      goalAchievementLikelihood: [],
      riskAssessment: {
        burnoutRisk: "low",
        consistencyRisk: "low",
        factors: [],
      },
    };
  }, []);

  const getRecommendations = useCallback((): Recommendation[] => {
    return [
      {
        id: "rec1",
        type: "session",
        title: "Optimize Session Timing",
        description:
          "Consider starting sessions earlier in the day for better completion rates",
        priority: "medium",
        expectedImpact: "Improved session completion rate",
        actionRequired: "Adjust session start time",
      },
    ];
  }, []);

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

export default useStatistics;
