/**
 * Date Formatting Utilities Tests
 * Tests for date and time formatting functions
 */

import { describe, it, expect } from "vitest";
import { formatTime } from "../formatting/date";

describe("Date Formatting Utilities", () => {
  describe("formatTime", () => {
    const testDate = new Date("2024-01-15T14:30:45.000Z");

    it('should return "N/A" for null/undefined input', () => {
      expect(formatTime(null)).toBe("N/A");
      expect(formatTime(undefined)).toBe("N/A");
    });

    it('should return "Invalid Date" for invalid date', () => {
      const invalidDate = new Date("invalid");
      expect(formatTime(invalidDate)).toBe("Invalid Date");
    });

    it("should format time without date by default", () => {
      const result = formatTime(testDate);
      // Should be in format like "2:30:45 PM" or similar based on locale
      expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}/);
      expect(result).toMatch(/(AM|PM)/);
    });

    it("should include date when requested", () => {
      const result = formatTime(testDate, { includeDate: true });
      // Should include date components
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    it("should format for text reports", () => {
      const result = formatTime(testDate, { forTextReport: true });
      expect(result).toBe("2024-01-15 14:30:45");
    });

    it("should handle Firebase Timestamp-like objects", () => {
      const mockTimestamp = {
        toDate: () => testDate,
      };

      const result = formatTime(mockTimestamp as any);
      expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    it("should handle edge cases", () => {
      const midnight = new Date("2024-01-01T00:00:00.000Z");
      const result = formatTime(midnight, { forTextReport: true });
      expect(result).toBe("2024-01-01 00:00:00");
    });
  });
});
