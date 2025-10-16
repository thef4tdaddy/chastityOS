/**
 * Statistics Helper Functions Tests
 *  for session and goal statistics calculations
 */

import { describe, it, expect } from "vitest";
import {
  calculateImprovementScore,
  calculateConsistencyRating,
  calculateOverallProgress,
  calculateKeyholderSatisfaction,
} from "../statistics";
import type {
  SessionStatistics,
  GoalStatistics,
  SharedStatistics,
  TrendData,
} from "../../../hooks/data/types/statistics";

describe("Statistics Helper Functions", () => {
  describe("calculateImprovementScore", () => {
    it("should return 0 for empty trends array", () => {
      const trends: TrendData[] = [];
      expect(calculateImprovementScore(trends)).toBe(0);
    });

    it("should calculate 100% for all improving trends", () => {
      const trends: TrendData[] = [
        {
          metric: "duration",
          direction: "improving",
          changePercentage: 10,
          timeframe: "week",
          dataPoints: [],
        },
        {
          metric: "completion",
          direction: "improving",
          changePercentage: 15,
          timeframe: "week",
          dataPoints: [],
        },
        {
          metric: "frequency",
          direction: "improving",
          changePercentage: 5,
          timeframe: "week",
          dataPoints: [],
        },
      ];
      expect(calculateImprovementScore(trends)).toBe(100);
    });

    it("should calculate 50% for half improving trends", () => {
      const trends: TrendData[] = [
        {
          metric: "duration",
          direction: "improving",
          changePercentage: 10,
          timeframe: "week",
          dataPoints: [],
        },
        {
          metric: "completion",
          direction: "declining",
          changePercentage: -5,
          timeframe: "week",
          dataPoints: [],
        },
      ];
      expect(calculateImprovementScore(trends)).toBe(50);
    });

    it("should calculate 0% for no improving trends", () => {
      const trends: TrendData[] = [
        {
          metric: "duration",
          direction: "declining",
          changePercentage: -10,
          timeframe: "week",
          dataPoints: [],
        },
        {
          metric: "completion",
          direction: "stable",
          changePercentage: 0,
          timeframe: "week",
          dataPoints: [],
        },
      ];
      expect(calculateImprovementScore(trends)).toBe(0);
    });
  });

  describe("calculateConsistencyRating", () => {
    it("should calculate consistency based on frequency and completion", () => {
      const sessionStats: SessionStatistics = {
        totalSessionTime: 36000,
        averageSessionLength: 3600,
        longestSession: 7200,
        shortestSession: 1800,
        sessionsThisWeek: 5,
        sessionsThisMonth: 20,
        completionRate: 80,
        goalAchievementRate: 75,
        satisfactionRating: 4.5,
        sessionFrequency: {
          daily: 1,
          weekly: 5,
          monthly: 20,
          trend: "stable",
        },
        trends: [],
        streaks: { current: 3, longest: 10, type: "session_consistency" },
      };

      const rating = calculateConsistencyRating(sessionStats);
      expect(rating).toBeGreaterThan(0);
      expect(rating).toBeLessThanOrEqual(100);
    });

    it("should return 50 for moderate consistency", () => {
      const sessionStats: SessionStatistics = {
        totalSessionTime: 18000,
        averageSessionLength: 3600,
        longestSession: 7200,
        shortestSession: 1800,
        sessionsThisWeek: 2,
        sessionsThisMonth: 10,
        completionRate: 50,
        goalAchievementRate: 50,
        satisfactionRating: 3,
        sessionFrequency: {
          daily: 0.5,
          weekly: 2.5,
          monthly: 10,
          trend: "stable",
        },
        trends: [],
        streaks: { current: 1, longest: 5, type: "session_consistency" },
      };

      const rating = calculateConsistencyRating(sessionStats);
      expect(rating).toBe(50);
    });
  });

  describe("calculateOverallProgress", () => {
    it("should return 0 for no goals", () => {
      const goalStats: GoalStatistics = {
        totalGoals: 0,
        completedGoals: 0,
        activeGoals: 0,
        completionRate: 0,
        averageCompletionTime: 0,
        mostCommonGoalTypes: [],
        hardestGoalTypes: [],
        goalStreaks: { current: 0, longest: 0, type: "goal_completion" },
      };

      expect(calculateOverallProgress(goalStats)).toBe(0);
    });

    it("should calculate 100% for all completed goals", () => {
      const goalStats: GoalStatistics = {
        totalGoals: 10,
        completedGoals: 10,
        activeGoals: 0,
        completionRate: 100,
        averageCompletionTime: 3600,
        mostCommonGoalTypes: [
          {
            type: "duration",
            count: 5,
            completionRate: 100,
            averageDuration: 3600,
          },
        ],
        hardestGoalTypes: [],
        goalStreaks: { current: 10, longest: 10, type: "goal_completion" },
      };

      expect(calculateOverallProgress(goalStats)).toBe(100);
    });
  });

  describe("calculateKeyholderSatisfaction", () => {
    it("should return a valid satisfaction score", () => {
      const sharedStats: SharedStatistics = {
        allowedMetrics: ["session_duration", "goal_completion"],
        keyholderView: {
          sessionOverview: {
            totalSessions: 5,
            averageDuration: 3600,
            lastSessionDate: new Date(),
          },
          goalProgress: { activeGoals: 2, completionRate: 80 },
          behaviorPatterns: {
            consistency: 90,
            pauseFrequency: 0.1,
            improvementTrend: "improving",
          },
          allowedInsights: [],
        },
        lastSharedAt: new Date(),
        sharingLevel: "detailed",
      };

      const satisfaction = calculateKeyholderSatisfaction(sharedStats);
      expect(satisfaction).toBeGreaterThan(0);
      expect(satisfaction).toBeLessThanOrEqual(100);
    });
  });
});
