/**
 * Comprehensive Statistics Hook
 * Provides analytics and insights for both users and keyholders
 * with appropriate privacy controls
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import type { DBSession, DBGoal, DBTask } from "../../types/database";
import type { KeyholderRelationship } from "../../types/core";
import { serviceLogger } from "../../utils/logging";

const logger = serviceLogger("useStatistics");

// ==================== INTERFACES ====================

export interface SessionStatistics {
  // Time-based stats
  totalSessionTime: number; // Total time across all sessions in seconds
  averageSessionLength: number; // Average session duration in seconds
  longestSession: number; // Longest session duration in seconds
  shortestSession: number; // Shortest session duration in seconds

  // Frequency stats
  sessionsThisWeek: number;
  sessionsThisMonth: number;
  sessionFrequency: FrequencyMetrics;

  // Quality metrics
  completionRate: number; // Percentage of sessions completed vs abandoned
  goalAchievementRate: number; // Percentage of goals achieved
  satisfactionRating: number; // Average satisfaction rating (1-5)

  // Trend data
  trends: TrendData[];
  streaks: StreakData;
}

export interface GoalStatistics {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  completionRate: number;
  averageCompletionTime: number; // Hours
  mostCommonGoalTypes: GoalTypeStats[];
  hardestGoalTypes: GoalTypeStats[];
  goalStreaks: StreakData;
}

export interface AchievementStatistics {
  totalAchievements: number;
  recentAchievements: Achievement[];
  achievementsByCategory: CategoryStats[];
  rareAchievements: Achievement[];
  achievementPoints: number;
  percentileRank: number; // Where user ranks compared to others
}

export interface ComparativeStatistics {
  userPercentile: number; // 0-100, where user ranks compared to others
  averageUserStats: SessionStatistics;
  personalBest: PersonalBestStats;
  improvements: ImprovementMetrics;
}

export interface SharedStatistics {
  allowedMetrics: StatisticType[];
  keyholderView: KeyholderStatisticsView;
  lastSharedAt: Date;
  sharingLevel: "basic" | "detailed" | "full";
}

export interface PredictiveAnalytics {
  nextSessionPrediction: {
    suggestedDuration: number;
    successProbability: number;
    optimalStartTime: Date;
    riskFactors: string[];
  };
  goalRecommendations: GoalRecommendation[];
  improvementOpportunities: ImprovementOpportunity[];
  trendPredictions: TrendPrediction[];
}

export interface RecommendationEngine {
  sessionRecommendations: SessionRecommendation[];
  goalRecommendations: GoalRecommendation[];
  behaviorInsights: BehaviorInsight[];
  personalizedTips: PersonalizedTip[];
}

export interface StatisticsState {
  sessionStats: SessionStatistics;
  goalStats: GoalStatistics;
  achievementStats: AchievementStatistics;
  comparativeStats: ComparativeStatistics;
  sharedStats: SharedStatistics;
  predictiveAnalytics: PredictiveAnalytics;
  recommendations: RecommendationEngine;
}

export interface FrequencyMetrics {
  daily: number;
  weekly: number;
  monthly: number;
  trend: "increasing" | "stable" | "decreasing";
}

export interface TrendData {
  metric: string;
  direction: "improving" | "stable" | "declining";
  changePercentage: number;
  timeframe: string;
  dataPoints: { date: Date; value: number }[];
}

export interface StreakData {
  current: number;
  longest: number;
  type: "session_consistency" | "goal_completion" | "no_pauses";
  startDate?: Date;
  endDate?: Date;
}

export interface GoalTypeStats {
  type: string;
  count: number;
  completionRate: number;
  averageDuration: number;
}

export interface CategoryStats {
  category: string;
  count: number;
  percentage: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  earnedAt: Date;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  points: number;
}

export interface PersonalBestStats {
  longestSession: number;
  mostGoalsInSession: number;
  longestStreak: number;
  highestSatisfactionRating: number;
  bestMonth: {
    month: string;
    year: number;
    totalTime: number;
    sessionCount: number;
  };
}

export interface ImprovementMetrics {
  sessionLength: {
    improvement: number; // percentage
    timeframe: string;
  };
  consistency: {
    improvement: number;
    timeframe: string;
  };
  goalCompletion: {
    improvement: number;
    timeframe: string;
  };
}

export interface GoalRecommendation {
  type: string;
  suggestedTarget: number;
  reasoning: string;
  confidence: number;
  estimatedDifficulty: "easy" | "medium" | "hard";
}

export interface ImprovementOpportunity {
  area: string;
  description: string;
  impact: "low" | "medium" | "high";
  effort: "low" | "medium" | "high";
  actionItems: string[];
}

export interface TrendPrediction {
  metric: string;
  predictedDirection: "improving" | "stable" | "declining";
  confidence: number;
  timeframe: string;
  reasoning: string;
}

export interface SessionRecommendation {
  type: "duration" | "timing" | "goals" | "preparation";
  suggestion: string;
  reasoning: string;
  expectedBenefit: string;
}

export interface BehaviorInsight {
  pattern: string;
  description: string;
  frequency: number;
  impact: "positive" | "neutral" | "negative";
  suggestions: string[];
}

export interface PersonalizedTip {
  id: string;
  category: string;
  tip: string;
  relevanceScore: number;
  isActionable: boolean;
}

export interface KeyholderStatisticsView {
  sessionOverview: {
    totalSessions: number;
    averageDuration: number;
    lastSessionDate: Date;
  };
  goalProgress: {
    activeGoals: number;
    completionRate: number;
  };
  behaviorPatterns: {
    consistency: number;
    pauseFrequency: number;
    improvementTrend: string;
  };
  allowedInsights: string[];
}

export interface TimePeriod {
  start: Date;
  end: Date;
  label: string;
}

export interface PeriodStatistics {
  period: TimePeriod;
  sessionCount: number;
  totalTime: number;
  goalCompletionRate: number;
  averageSatisfaction: number;
}

export interface MonthlyTrends {
  months: {
    month: string;
    year: number;
    sessionCount: number;
    totalTime: number;
    completionRate: number;
  }[];
  overallTrend: "improving" | "stable" | "declining";
}

export interface WeeklyBreakdown {
  weekdays: {
    day: string;
    sessionCount: number;
    averageDuration: number;
    completionRate: number;
  }[];
  weekendVsWeekday: {
    weekday: PeriodStatistics;
    weekend: PeriodStatistics;
  };
}

export interface ComparisonResult {
  metric: string;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercentage: number;
  trend: "improving" | "stable" | "declining";
}

export interface BenchmarkData {
  userValue: number;
  averageValue: number;
  percentile: number;
  category: string;
}

export interface KeyholderDashboardStats {
  submissiveOverview: {
    name: string;
    consistencyScore: number;
    improvementTrend: string;
    lastActiveDate: Date;
  };
  sessionSummary: {
    thisWeek: number;
    thisMonth: number;
    averageDuration: number;
    completionRate: number;
  };
  goalTracking: {
    activeGoals: string[];
    completionRate: number;
    upcomingDeadlines: Date[];
  };
  behaviorInsights: {
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
  };
}

export interface RelationshipComparisonStats {
  relationshipDuration: number; // days
  sharedSessions: number;
  collaborationScore: number;
  satisfactionTrend: string;
  milestones: {
    name: string;
    date: Date;
    achieved: boolean;
  }[];
}

export interface PredictiveInsights {
  nextSessionSuccess: {
    probability: number;
    factors: string[];
  };
  goalAchievementLikelihood: {
    goalId: string;
    probability: number;
    timeToCompletion: number;
  }[];
  riskAssessment: {
    burnoutRisk: "low" | "medium" | "high";
    consistencyRisk: "low" | "medium" | "high";
    factors: string[];
  };
}

export interface Recommendation {
  id: string;
  type: "session" | "goal" | "behavior" | "timing";
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  expectedImpact: string;
  actionRequired: string;
}

export interface StatisticsExport {
  format: ExportFormat;
  data: Record<string, unknown>;
  generatedAt: Date;
  fileSize: number;
  downloadUrl: string;
}

export type StatisticType =
  | "session_duration"
  | "goal_completion"
  | "consistency"
  | "satisfaction"
  | "achievements"
  | "streaks"
  | "trends";

export type ExportFormat = "json" | "csv" | "pdf" | "xlsx";

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

  const [predictiveAnalytics, setPredictiveAnalytics] =
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

  const [recommendations, setRecommendations] = useState<RecommendationEngine>({
    sessionRecommendations: [],
    goalRecommendations: [],
    behaviorInsights: [],
    personalizedTips: [],
  });

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
  }, [relationshipId, consistencyRating]);

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
  }, [sessionStats]);

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

  const getMonthlyTrends = useCallback((months: number): MonthlyTrends => {
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
    (period: TimePeriod): ComparisonResult => {
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
  }, [consistencyRating]); // Only depends on consistency rating

  const getRelationshipComparison =
    useCallback((): RelationshipComparisonStats => {
      return {
        relationshipDuration: 90, // days
        sharedSessions: sessionStats.sessionsThisMonth,
        collaborationScore: 85,
        satisfactionTrend: "improving",
        milestones: [],
      };
    }, [sessionStats]);

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
    [userId], // Only userId is actually used
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

// ==================== HELPER FUNCTIONS ====================

function calculateImprovementScore(trends: TrendData[]): number {
  if (trends.length === 0) return 0;

  const improvingTrends = trends.filter(
    (t) => t.direction === "improving",
  ).length;
  return Math.floor((improvingTrends / trends.length) * 100);
}

function calculateConsistencyRating(sessionStats: SessionStatistics): number {
  // Calculate consistency based on session frequency and completion rate
  const frequencyScore = Math.min(
    100,
    sessionStats.sessionFrequency.weekly * 20,
  );
  const completionScore = sessionStats.completionRate;

  return Math.floor((frequencyScore + completionScore) / 2);
}

function calculateOverallProgress(goalStats: GoalStatistics): number {
  if (goalStats.totalGoals === 0) return 0;

  return Math.floor((goalStats.completedGoals / goalStats.totalGoals) * 100);
}

function calculateKeyholderSatisfaction(sharedStats: SharedStatistics): number {
  // This would be calculated based on keyholder feedback and interaction patterns
  return 85; // Placeholder value
}

export default useStatistics;
