/**
 * Recurring Task Service Tests
 * Tests for recurring task date calculations and instance creation
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { RecurringTaskService } from "../RecurringTaskService";
import type { RecurringConfig } from "@/types/database";

describe("RecurringTaskService", () => {
  describe("calculateNextDueDate", () => {
    beforeEach(() => {
      // Mock current date to 2024-01-15 (Monday) 10:00:00
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-15T10:00:00.000Z"));
    });

    it("should calculate next daily occurrence", () => {
      const config: RecurringConfig = {
        frequency: "daily",
        interval: 1,
      };
      const nextDate = RecurringTaskService.calculateNextDueDate(config);
      const expected = new Date("2024-01-16T10:00:00.000Z");
      expect(nextDate.toISOString()).toBe(expected.toISOString());
    });

    it("should calculate next daily occurrence with custom interval", () => {
      const config: RecurringConfig = {
        frequency: "daily",
        interval: 3,
      };
      const nextDate = RecurringTaskService.calculateNextDueDate(config);
      const expected = new Date("2024-01-18T10:00:00.000Z");
      expect(nextDate.toISOString()).toBe(expected.toISOString());
    });

    it("should calculate next weekly occurrence for single day", () => {
      const config: RecurringConfig = {
        frequency: "weekly",
        daysOfWeek: [3], // Wednesday
      };
      const nextDate = RecurringTaskService.calculateNextDueDate(config);
      const expected = new Date("2024-01-17T10:00:00.000Z"); // Next Wednesday
      expect(nextDate.toISOString()).toBe(expected.toISOString());
    });

    it("should calculate next weekly occurrence for multiple days", () => {
      const config: RecurringConfig = {
        frequency: "weekly",
        daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
      };
      const nextDate = RecurringTaskService.calculateNextDueDate(config);
      // Current date is Monday, so next should be Wednesday
      const expected = new Date("2024-01-17T10:00:00.000Z");
      expect(nextDate.toISOString()).toBe(expected.toISOString());
    });

    it("should calculate next monthly occurrence in current month", () => {
      const config: RecurringConfig = {
        frequency: "monthly",
        dayOfMonth: 20,
      };
      const nextDate = RecurringTaskService.calculateNextDueDate(config);
      const expected = new Date("2024-01-20T10:00:00.000Z");
      expect(nextDate.toISOString()).toBe(expected.toISOString());
    });

    it("should calculate next monthly occurrence in next month", () => {
      const config: RecurringConfig = {
        frequency: "monthly",
        dayOfMonth: 10, // Already passed in current month
      };
      const nextDate = RecurringTaskService.calculateNextDueDate(config);
      const expected = new Date("2024-02-10T10:00:00.000Z");
      expect(nextDate.toISOString()).toBe(expected.toISOString());
    });

    it("should calculate next custom interval occurrence", () => {
      const config: RecurringConfig = {
        frequency: "custom",
        interval: 14,
      };
      const nextDate = RecurringTaskService.calculateNextDueDate(config);
      const expected = new Date("2024-01-29T10:00:00.000Z");
      expect(nextDate.toISOString()).toBe(expected.toISOString());
    });

    it("should throw error for unknown frequency", () => {
      const config = {
        frequency: "unknown" as any,
      };
      expect(() => RecurringTaskService.calculateNextDueDate(config)).toThrow(
        "Unknown frequency: unknown",
      );
    });
  });

  describe("Date Helper Methods", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-15T10:00:00.000Z"));
    });

    it("should handle weekly recurrence wrapping to next week", () => {
      // Current day is Monday (1), ask for Sunday (0)
      const config: RecurringConfig = {
        frequency: "weekly",
        daysOfWeek: [0], // Sunday
      };
      const nextDate = RecurringTaskService.calculateNextDueDate(config);
      const expected = new Date("2024-01-21T10:00:00.000Z"); // Next Sunday
      expect(nextDate.toISOString()).toBe(expected.toISOString());
    });

    it("should handle month boundaries correctly", () => {
      vi.setSystemTime(new Date("2024-01-31T10:00:00.000Z")); // End of Jan
      const config: RecurringConfig = {
        frequency: "daily",
        interval: 1,
      };
      const nextDate = RecurringTaskService.calculateNextDueDate(config);
      const expected = new Date("2024-02-01T10:00:00.000Z"); // Feb 1st
      expect(nextDate.toISOString()).toBe(expected.toISOString());
    });

    it("should use default interval of 1 for daily when not specified", () => {
      const config: RecurringConfig = {
        frequency: "daily",
      };
      const nextDate = RecurringTaskService.calculateNextDueDate(config);
      const expected = new Date("2024-01-16T10:00:00.000Z");
      expect(nextDate.toISOString()).toBe(expected.toISOString());
    });

    it("should use default day (Monday) for weekly when not specified", () => {
      const config: RecurringConfig = {
        frequency: "weekly",
      };
      const nextDate = RecurringTaskService.calculateNextDueDate(config);
      // Should find next Monday
      const expected = new Date("2024-01-22T10:00:00.000Z"); // Next Monday (current is also Monday)
      expect(nextDate.toISOString()).toBe(expected.toISOString());
    });

    it("should use default day (1st) for monthly when not specified", () => {
      const config: RecurringConfig = {
        frequency: "monthly",
      };
      const nextDate = RecurringTaskService.calculateNextDueDate(config);
      const expected = new Date("2024-02-01T10:00:00.000Z"); // Next month since 1st already passed
      expect(nextDate.toISOString()).toBe(expected.toISOString());
    });
  });
});
