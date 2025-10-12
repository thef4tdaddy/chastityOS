/**
 * Session History Helpers Tests
 * Tests for session history utility functions
 */

import { describe, it, expect } from "vitest";
import {
  createEmptyTrendData,
  calculateOverallCompletionRate,
  calculateLongestStreak,
  calculatePauseFrequency,
  calculateImprovementTrend,
  calculateConsistencyScore,
} from "../sessionHistory";
import type { HistoricalSession } from "../../../hooks/session/types/sessionHistory";

describe("Session History Helpers", () => {
  const createMockSession = (
    overrides?: Partial<HistoricalSession>,
  ): HistoricalSession => ({
    id: "session-1",
    startTime: new Date("2025-01-01T10:00:00Z"),
    endTime: new Date("2025-01-01T14:00:00Z"),
    duration: 14400,
    effectiveDuration: 14400,
    goals: [],
    pauseEvents: [],
    notes: "",
    rating: 5,
    ...overrides,
  });

  describe("createEmptyTrendData", () => {
    it("should create empty trend data with default values", () => {
      const trendData = createEmptyTrendData();

      expect(trendData.direction).toBe("stable");
      expect(trendData.changePercentage).toBe(0);
      expect(trendData.confidence).toBe(0);
      expect(trendData.timeframe).toBe("week");
      expect(trendData.dataPoints).toEqual([]);
    });
  });

  describe("calculateOverallCompletionRate", () => {
    it("should return 0 for empty sessions", () => {
      expect(calculateOverallCompletionRate([])).toBe(0);
    });

    it("should return 0 for sessions with no goals", () => {
      const sessions = [createMockSession(), createMockSession()];
      expect(calculateOverallCompletionRate(sessions)).toBe(0);
    });

    it("should calculate 100% for all completed goals", () => {
      const sessions = [
        createMockSession({
          goals: [
            { id: "g1", completed: true, type: "duration", target: 3600 },
            { id: "g2", completed: true, type: "duration", target: 7200 },
          ],
        }),
      ];

      expect(calculateOverallCompletionRate(sessions)).toBe(100);
    });

    it("should calculate 50% for half completed goals", () => {
      const sessions = [
        createMockSession({
          goals: [
            { id: "g1", completed: true, type: "duration", target: 3600 },
            { id: "g2", completed: false, type: "duration", target: 7200 },
          ],
        }),
      ];

      expect(calculateOverallCompletionRate(sessions)).toBe(50);
    });

    it("should aggregate across multiple sessions", () => {
      const sessions = [
        createMockSession({
          goals: [
            { id: "g1", completed: true, type: "duration", target: 3600 },
            { id: "g2", completed: true, type: "duration", target: 7200 },
          ],
        }),
        createMockSession({
          goals: [
            { id: "g3", completed: false, type: "duration", target: 3600 },
            { id: "g4", completed: false, type: "duration", target: 7200 },
          ],
        }),
      ];

      expect(calculateOverallCompletionRate(sessions)).toBe(50);
    });
  });

  describe("calculateLongestStreak", () => {
    it("should return 0 for empty sessions", () => {
      expect(calculateLongestStreak([])).toBe(0);
    });

    it("should return 1 for single session", () => {
      const sessions = [createMockSession()];
      expect(calculateLongestStreak(sessions)).toBe(1);
    });

    it("should calculate streak for consecutive days", () => {
      const sessions = [
        createMockSession({ startTime: new Date("2025-01-01") }),
        createMockSession({ startTime: new Date("2025-01-02") }),
        createMockSession({ startTime: new Date("2025-01-03") }),
      ];

      expect(calculateLongestStreak(sessions)).toBe(3);
    });

    it("should handle gaps in sessions", () => {
      const sessions = [
        createMockSession({ startTime: new Date("2025-01-01") }),
        createMockSession({ startTime: new Date("2025-01-02") }),
        createMockSession({ startTime: new Date("2025-01-05") }), // 3-day gap
        createMockSession({ startTime: new Date("2025-01-06") }),
      ];

      expect(calculateLongestStreak(sessions)).toBe(2); // Longest continuous streak
    });

    it("should handle unsorted sessions", () => {
      const sessions = [
        createMockSession({ startTime: new Date("2025-01-03") }),
        createMockSession({ startTime: new Date("2025-01-01") }),
        createMockSession({ startTime: new Date("2025-01-02") }),
      ];

      expect(calculateLongestStreak(sessions)).toBe(3);
    });
  });

  describe("calculatePauseFrequency", () => {
    it("should return 0 for empty sessions", () => {
      expect(calculatePauseFrequency([])).toBe(0);
    });

    it("should return 0 for sessions with no pauses", () => {
      const sessions = [createMockSession(), createMockSession()];
      expect(calculatePauseFrequency(sessions)).toBe(0);
    });

    it("should calculate average pause frequency", () => {
      const sessions = [
        createMockSession({
          pauseEvents: [
            {
              startTime: new Date(),
              endTime: new Date(),
              duration: 1800,
              reason: "",
            },
            {
              startTime: new Date(),
              endTime: new Date(),
              duration: 1800,
              reason: "",
            },
          ],
        }),
        createMockSession({
          pauseEvents: [
            {
              startTime: new Date(),
              endTime: new Date(),
              duration: 1800,
              reason: "",
            },
          ],
        }),
      ];

      expect(calculatePauseFrequency(sessions)).toBe(1.5); // (2 + 1) / 2
    });

    it("should handle mixed pause counts", () => {
      const sessions = [
        createMockSession({ pauseEvents: [] }),
        createMockSession({
          pauseEvents: [
            {
              startTime: new Date(),
              endTime: new Date(),
              duration: 1800,
              reason: "",
            },
          ],
        }),
        createMockSession({
          pauseEvents: [
            {
              startTime: new Date(),
              endTime: new Date(),
              duration: 1800,
              reason: "",
            },
            {
              startTime: new Date(),
              endTime: new Date(),
              duration: 1800,
              reason: "",
            },
          ],
        }),
      ];

      expect(calculatePauseFrequency(sessions)).toBe(1); // (0 + 1 + 2) / 3
    });
  });

  describe("calculateImprovementTrend", () => {
    it("should return stable for empty sessions", () => {
      expect(calculateImprovementTrend([])).toBe("stable");
    });

    it("should return stable for single session", () => {
      const sessions = [createMockSession()];
      expect(calculateImprovementTrend(sessions)).toBe("stable");
    });

    it("should return improving for increasing durations", () => {
      const sessions = [
        createMockSession({ effectiveDuration: 10800 }), // Recent: 3 hours
        createMockSession({ effectiveDuration: 10800 }),
        createMockSession({ effectiveDuration: 3600 }), // Older: 1 hour
        createMockSession({ effectiveDuration: 3600 }),
      ];

      expect(calculateImprovementTrend(sessions)).toBe("improving");
    });

    it("should return declining for decreasing durations", () => {
      const sessions = [
        createMockSession({ effectiveDuration: 3600 }), // Recent: 1 hour
        createMockSession({ effectiveDuration: 3600 }),
        createMockSession({ effectiveDuration: 10800 }), // Older: 3 hours
        createMockSession({ effectiveDuration: 10800 }),
      ];

      expect(calculateImprovementTrend(sessions)).toBe("declining");
    });

    it("should return stable for minor changes", () => {
      const sessions = [
        createMockSession({ effectiveDuration: 3700 }),
        createMockSession({ effectiveDuration: 3600 }),
      ];

      expect(calculateImprovementTrend(sessions)).toBe("stable");
    });
  });

  describe("calculateConsistencyScore", () => {
    it("should return 0 for empty sessions", () => {
      expect(calculateConsistencyScore([])).toBe(0);
    });

    it("should calculate score based on completion rate and streak", () => {
      const sessions = [
        createMockSession({
          startTime: new Date("2025-01-01"),
          goals: [
            { id: "g1", completed: true, type: "duration", target: 3600 },
          ],
        }),
        createMockSession({
          startTime: new Date("2025-01-02"),
          goals: [
            { id: "g2", completed: true, type: "duration", target: 3600 },
          ],
        }),
      ];

      const score = calculateConsistencyScore(sessions);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should give higher score for better consistency", () => {
      const goodSessions = [
        createMockSession({
          startTime: new Date("2025-01-01"),
          goals: [
            { id: "g1", completed: true, type: "duration", target: 3600 },
          ],
        }),
        createMockSession({
          startTime: new Date("2025-01-02"),
          goals: [
            { id: "g2", completed: true, type: "duration", target: 3600 },
          ],
        }),
        createMockSession({
          startTime: new Date("2025-01-03"),
          goals: [
            { id: "g3", completed: true, type: "duration", target: 3600 },
          ],
        }),
      ];

      const poorSessions = [
        createMockSession({
          goals: [
            { id: "g1", completed: false, type: "duration", target: 3600 },
          ],
        }),
      ];

      const goodScore = calculateConsistencyScore(goodSessions);
      const poorScore = calculateConsistencyScore(poorSessions);

      expect(goodScore).toBeGreaterThan(poorScore);
    });
  });

  describe("Edge Cases", () => {
    it("should handle sessions on same day", () => {
      const sessions = [
        createMockSession({ startTime: new Date("2025-01-01T08:00:00Z") }),
        createMockSession({ startTime: new Date("2025-01-01T20:00:00Z") }),
      ];

      const streak = calculateLongestStreak(sessions);
      expect(streak).toBeGreaterThanOrEqual(1);
    });

    it("should handle sessions across timezone boundaries", () => {
      const sessions = [
        createMockSession({ startTime: new Date("2025-01-01T23:00:00Z") }),
        createMockSession({ startTime: new Date("2025-01-02T01:00:00Z") }),
      ];

      const streak = calculateLongestStreak(sessions);
      expect(streak).toBeGreaterThanOrEqual(1);
    });

    it("should handle very long streaks", () => {
      const sessions = Array.from({ length: 100 }, (_, i) =>
        createMockSession({
          startTime: new Date(2025, 0, i + 1), // 100 consecutive days
        }),
      );

      expect(calculateLongestStreak(sessions)).toBe(100);
    });

    it("should handle sessions with many pause events", () => {
      const manyPauses = Array.from({ length: 50 }, () => ({
        startTime: new Date(),
        endTime: new Date(),
        duration: 1800,
        reason: "",
      }));

      const sessions = [createMockSession({ pauseEvents: manyPauses })];

      expect(calculatePauseFrequency(sessions)).toBe(50);
    });
  });
});
