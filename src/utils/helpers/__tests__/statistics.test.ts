/**
 * Statistics Helper Functions Tests
 * Tests for session and goal statistics calculations
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
        { metric: "duration", direction: "improving", changePercent: 10 },
        { metric: "completion", direction: "improving", changePercent: 15 },
        { metric: "frequency", direction: "improving", changePercent: 5 },
      ];
      expect(calculateImprovementScore(trends)).toBe(100);
    });

    it("should calculate 50% for half improving trends", () => {
      const trends: TrendData[] = [
        { metric: "duration", direction: "improving", changePercent: 10 },
        { metric: "completion", direction: "declining", changePercent: -5 },
      ];
      expect(calculateImprovementScore(trends)).toBe(50);
    });

    it("should calculate 0% for no improving trends", () => {
      const trends: TrendData[] = [
        { metric: "duration", direction: "declining", changePercent: -10 },
        { metric: "completion", direction: "stable", changePercent: 0 },
      ];
      expect(calculateImprovementScore(trends)).toBe(0);
    });
  });

  describe("calculateConsistencyRating", () => {
    it("should calculate consistency based on frequency and completion", () => {
      const sessionStats: SessionStatistics = {
        totalSessions: 10,
        averageSessionLength: 3600,
        longestSession: 7200,
        shortestSession: 1800,
        completionRate: 80,
        sessionFrequency: {
          daily: 1,
          weekly: 5,
          monthly: 20,
        },
        lastSessionDate: new Date(),
      };

      const rating = calculateConsistencyRating(sessionStats);
      expect(rating).toBeGreaterThan(0);
      expect(rating).toBeLessThanOrEqual(100);
    });

    it("should return 50 for moderate consistency", () => {
      const sessionStats: SessionStatistics = {
        totalSessions: 5,
        averageSessionLength: 3600,
        longestSession: 7200,
        shortestSession: 1800,
        completionRate: 50,
        sessionFrequency: {
          daily: 0.5,
          weekly: 2.5,
          monthly: 10,
        },
        lastSessionDate: new Date(),
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
        averageCompletionTime: 0,
        goalsByType: {},
        successRate: 0,
      };

      expect(calculateOverallProgress(goalStats)).toBe(0);
    });

    it("should calculate 100% for all completed goals", () => {
      const goalStats: GoalStatistics = {
        totalGoals: 10,
        completedGoals: 10,
        activeGoals: 0,
        averageCompletionTime: 3600,
        goalsByType: {
          duration: 5,
          achievement: 5,
        },
        successRate: 100,
      };

      expect(calculateOverallProgress(goalStats)).toBe(100);
    });
  });

  describe("calculateKeyholderSatisfaction", () => {
    it("should return a valid satisfaction score", () => {
      const sharedStats: SharedStatistics = {
        sharedSessions: 5,
        averageSharedDuration: 3600,
        communicationFrequency: 10,
        lastInteraction: new Date(),
      };

      const satisfaction = calculateKeyholderSatisfaction(sharedStats);
      expect(satisfaction).toBeGreaterThan(0);
      expect(satisfaction).toBeLessThanOrEqual(100);
    });
  });
});
