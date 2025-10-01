/**
 * useStatisticsState - Statistics State Management
 * Central state management for all statistics data
 */

import { useState } from "react";
import type {
  SessionStatistics,
  GoalStatistics,
  AchievementStatistics,
  ComparativeStatistics,
  SharedStatistics,
  PredictiveAnalytics,
  RecommendationEngine,
} from "../types/statistics";

export const useStatisticsState = () => {
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

  return {
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
    predictiveAnalytics,
    setPredictiveAnalytics,
    recommendations,
    setRecommendations,
    isLoading,
    setIsLoading,
    error,
    setError,
  };
};
