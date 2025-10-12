/**
 * Session Timer Calculations Tests
 * Tests for timer calculations, pause handling, and duration computations
 */

import { describe, it, expect } from "vitest";

// Helper functions for session timer calculations
function calculateEffectiveTime(
  startTime: Date,
  endTime: Date | undefined,
  accumulatedPauseTime: number,
  isPaused: boolean,
  pauseStartTime: Date | undefined,
): number {
  const now = endTime || new Date();
  const totalElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);

  let currentPauseDuration = 0;
  if (isPaused && pauseStartTime) {
    currentPauseDuration = Math.floor(
      (new Date().getTime() - pauseStartTime.getTime()) / 1000,
    );
  }

  const effectiveTime =
    totalElapsed - accumulatedPauseTime - currentPauseDuration;
  return Math.max(0, effectiveTime);
}

function calculateGoalProgress(
  effectiveTime: number,
  goalDuration: number | undefined,
): number {
  if (!goalDuration || goalDuration === 0) return 0;
  return Math.min(100, Math.floor((effectiveTime / goalDuration) * 100));
}

function calculateRemainingTime(
  effectiveTime: number,
  goalDuration: number | undefined,
): number {
  if (!goalDuration) return 0;
  return Math.max(0, goalDuration - effectiveTime);
}

describe("Session Timer Calculations", () => {
  describe("calculateEffectiveTime", () => {
    it("should calculate basic elapsed time", () => {
      const startTime = new Date("2025-01-01T10:00:00Z");
      const endTime = new Date("2025-01-01T11:00:00Z");

      const effectiveTime = calculateEffectiveTime(
        startTime,
        endTime,
        0,
        false,
        undefined,
      );

      expect(effectiveTime).toBe(3600); // 1 hour in seconds
    });

    it("should subtract accumulated pause time", () => {
      const startTime = new Date("2025-01-01T10:00:00Z");
      const endTime = new Date("2025-01-01T11:00:00Z");
      const accumulatedPauseTime = 600; // 10 minutes

      const effectiveTime = calculateEffectiveTime(
        startTime,
        endTime,
        accumulatedPauseTime,
        false,
        undefined,
      );

      expect(effectiveTime).toBe(3000); // 3600 - 600 = 3000 seconds
    });

    it("should handle currently paused session", () => {
      const startTime = new Date(Date.now() - 3600000); // 1 hour ago
      const pauseStartTime = new Date(Date.now() - 300000); // Paused 5 minutes ago

      const effectiveTime = calculateEffectiveTime(
        startTime,
        undefined,
        0,
        true,
        pauseStartTime,
      );

      // Should be ~55 minutes (3600 - ~300 seconds)
      expect(effectiveTime).toBeGreaterThan(3000);
      expect(effectiveTime).toBeLessThan(3600);
    });

    it("should return 0 for negative effective time", () => {
      const startTime = new Date("2025-01-01T10:00:00Z");
      const endTime = new Date("2025-01-01T11:00:00Z");
      const accumulatedPauseTime = 7200; // More pause than elapsed

      const effectiveTime = calculateEffectiveTime(
        startTime,
        endTime,
        accumulatedPauseTime,
        false,
        undefined,
      );

      expect(effectiveTime).toBe(0);
    });

    it("should use current time when no end time provided", () => {
      const startTime = new Date(Date.now() - 1000); // 1 second ago

      const effectiveTime = calculateEffectiveTime(
        startTime,
        undefined,
        0,
        false,
        undefined,
      );

      expect(effectiveTime).toBeGreaterThanOrEqual(0);
      expect(effectiveTime).toBeLessThan(5); // Should be ~1 second
    });
  });

  describe("calculateGoalProgress", () => {
    it("should return 0 when no goal is set", () => {
      const progress = calculateGoalProgress(3600, undefined);
      expect(progress).toBe(0);
    });

    it("should return 0 when goal duration is 0", () => {
      const progress = calculateGoalProgress(3600, 0);
      expect(progress).toBe(0);
    });

    it("should calculate 50% progress", () => {
      const progress = calculateGoalProgress(3600, 7200);
      expect(progress).toBe(50);
    });

    it("should calculate 100% progress", () => {
      const progress = calculateGoalProgress(7200, 7200);
      expect(progress).toBe(100);
    });

    it("should cap at 100% for exceeded goals", () => {
      const progress = calculateGoalProgress(10800, 7200);
      expect(progress).toBe(100);
    });

    it("should round down to nearest integer", () => {
      const progress = calculateGoalProgress(3333, 10000);
      expect(progress).toBe(33); // 33.33% rounded down
    });

    it("should handle very small effective time", () => {
      const progress = calculateGoalProgress(1, 3600);
      expect(progress).toBe(0); // Less than 1%
    });

    it("should handle very large goal durations", () => {
      const progress = calculateGoalProgress(3600, 86400 * 365);
      expect(progress).toBe(0); // Tiny fraction of a year
    });
  });

  describe("calculateRemainingTime", () => {
    it("should return 0 when no goal is set", () => {
      const remaining = calculateRemainingTime(3600, undefined);
      expect(remaining).toBe(0);
    });

    it("should calculate remaining time", () => {
      const remaining = calculateRemainingTime(3600, 7200);
      expect(remaining).toBe(3600); // 1 hour remaining
    });

    it("should return 0 when goal is completed", () => {
      const remaining = calculateRemainingTime(7200, 7200);
      expect(remaining).toBe(0);
    });

    it("should return 0 when goal is exceeded", () => {
      const remaining = calculateRemainingTime(10800, 7200);
      expect(remaining).toBe(0);
    });

    it("should handle small remaining times", () => {
      const remaining = calculateRemainingTime(7199, 7200);
      expect(remaining).toBe(1); // 1 second remaining
    });
  });

  describe("Edge Cases and Timezone Handling", () => {
    it("should handle timezone transitions (DST)", () => {
      // Test with dates around DST transition (March 12, 2025 in US)
      const beforeDST = new Date("2025-03-08T10:00:00-05:00");
      const afterDST = new Date("2025-03-09T10:00:00-04:00");

      const effectiveTime = calculateEffectiveTime(
        beforeDST,
        afterDST,
        0,
        false,
        undefined,
      );

      // Should be ~23 hours due to DST "spring forward"
      expect(effectiveTime).toBeGreaterThan(82000); // ~23 hours
      expect(effectiveTime).toBeLessThan(87000); // Less than 24.2 hours
    });

    it("should handle cross-day calculations", () => {
      const startTime = new Date("2025-01-01T23:00:00Z");
      const endTime = new Date("2025-01-02T01:00:00Z");

      const effectiveTime = calculateEffectiveTime(
        startTime,
        endTime,
        0,
        false,
        undefined,
      );

      expect(effectiveTime).toBe(7200); // 2 hours
    });

    it("should handle leap year calculations", () => {
      const startTime = new Date("2024-02-28T12:00:00Z");
      const endTime = new Date("2024-03-01T12:00:00Z");

      const effectiveTime = calculateEffectiveTime(
        startTime,
        endTime,
        0,
        false,
        undefined,
      );

      expect(effectiveTime).toBe(86400 * 2); // 2 days (including leap day)
    });

    it("should handle sessions spanning months", () => {
      const startTime = new Date("2025-01-30T12:00:00Z");
      const endTime = new Date("2025-02-02T12:00:00Z");

      const effectiveTime = calculateEffectiveTime(
        startTime,
        endTime,
        0,
        false,
        undefined,
      );

      expect(effectiveTime).toBe(86400 * 3); // 3 days
    });

    it("should handle very long sessions (weeks)", () => {
      const startTime = new Date("2025-01-01T00:00:00Z");
      const endTime = new Date("2025-01-31T00:00:00Z");

      const effectiveTime = calculateEffectiveTime(
        startTime,
        endTime,
        0,
        false,
        undefined,
      );

      expect(effectiveTime).toBe(86400 * 30); // 30 days
    });

    it("should handle multiple pause/resume cycles", () => {
      const startTime = new Date("2025-01-01T10:00:00Z");
      const endTime = new Date("2025-01-01T14:00:00Z");
      // Total: 4 hours elapsed
      // Pauses: 30 min + 45 min + 15 min = 90 minutes
      const accumulatedPauseTime = 1800 + 2700 + 900; // 5400 seconds

      const effectiveTime = calculateEffectiveTime(
        startTime,
        endTime,
        accumulatedPauseTime,
        false,
        undefined,
      );

      expect(effectiveTime).toBe(9000); // 14400 - 5400 = 9000 seconds (2.5 hours)
    });

    it("should handle pause exactly at session start", () => {
      const startTime = new Date("2025-01-01T10:00:00Z");

      const effectiveTime = calculateEffectiveTime(
        startTime,
        undefined,
        0,
        true,
        startTime, // Paused immediately
      );

      // Effective time should be ~0 since paused immediately
      expect(effectiveTime).toBeLessThan(5);
    });
  });

  describe("Performance and Precision", () => {
    it("should handle millisecond precision", () => {
      const startTime = new Date("2025-01-01T10:00:00.123Z");
      const endTime = new Date("2025-01-01T10:00:01.123Z");

      const effectiveTime = calculateEffectiveTime(
        startTime,
        endTime,
        0,
        false,
        undefined,
      );

      expect(effectiveTime).toBe(1); // 1 second (rounded down)
    });

    it("should handle rapid calculations", () => {
      const startTime = new Date(Date.now() - 100); // 100ms ago

      const effectiveTime = calculateEffectiveTime(
        startTime,
        undefined,
        0,
        false,
        undefined,
      );

      expect(effectiveTime).toBeGreaterThanOrEqual(0);
      expect(effectiveTime).toBeLessThan(1); // Less than 1 second
    });
  });
});
