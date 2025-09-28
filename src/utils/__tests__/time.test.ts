/**
 * Time Formatting Utilities Tests
 * Tests for time duration formatting functions
 */

import { describe, it, expect } from "vitest";
import {
  formatElapsedTime,
  formatDaysOnly,
  msToSeconds,
  secondsToMs,
} from "../formatting/time";

describe("Time Formatting Utilities", () => {
  describe("formatElapsedTime", () => {
    it("should format seconds only", () => {
      expect(formatElapsedTime(30)).toBe("30s");
      expect(formatElapsedTime(0)).toBe("0s");
      expect(formatElapsedTime(59)).toBe("59s");
    });

    it("should format minutes and seconds", () => {
      expect(formatElapsedTime(60)).toBe("01m 00s");
      expect(formatElapsedTime(90)).toBe("01m 30s");
      expect(formatElapsedTime(3599)).toBe("59m 59s");
    });

    it("should format hours, minutes and seconds", () => {
      expect(formatElapsedTime(3600)).toBe("01h 00m 00s");
      expect(formatElapsedTime(3661)).toBe("01h 01m 01s");
      expect(formatElapsedTime(86399)).toBe("23h 59m 59s");
    });

    it("should format days, hours, minutes and seconds", () => {
      expect(formatElapsedTime(86400)).toBe("1d 00h 00m 00s");
      expect(formatElapsedTime(90061)).toBe("1d 01h 01m 01s");
      expect(formatElapsedTime(172800)).toBe("2d 00h 00m 00s");
    });

    it("should handle invalid input", () => {
      expect(formatElapsedTime(null as any)).toBe("0s");
      expect(formatElapsedTime(undefined as any)).toBe("0s");
      expect(formatElapsedTime(NaN)).toBe("0s");
      expect(formatElapsedTime(-10)).toBe("0s");
    });

    it("should handle fractional seconds", () => {
      expect(formatElapsedTime(0.5)).toBe("0s");
      expect(formatElapsedTime(1.7)).toBe("1s");
      expect(formatElapsedTime(59.9)).toBe("59s");
    });
  });

  describe("formatDaysOnly", () => {
    it("should format zero days", () => {
      expect(formatDaysOnly(0)).toBe("0 days");
      expect(formatDaysOnly(3599)).toBe("0 days"); // Less than 1 day
    });

    it("should format single day", () => {
      expect(formatDaysOnly(86400)).toBe("1 day");
    });

    it("should format multiple days", () => {
      expect(formatDaysOnly(172800)).toBe("2 days");
      expect(formatDaysOnly(259200)).toBe("3 days");
      expect(formatDaysOnly(345600)).toBe("4 days");
    });

    it("should handle invalid input", () => {
      expect(formatDaysOnly(null as any)).toBe("0 days");
      expect(formatDaysOnly(undefined as any)).toBe("0 days");
      expect(formatDaysOnly(NaN)).toBe("0 days");
      expect(formatDaysOnly(-86400)).toBe("0 days");
    });

    it("should handle fractional days", () => {
      expect(formatDaysOnly(86400.5)).toBe("1 day");
      expect(formatDaysOnly(172800.9)).toBe("2 days");
    });
  });

  describe("msToSeconds", () => {
    it("should convert milliseconds to seconds", () => {
      expect(msToSeconds(1000)).toBe(1);
      expect(msToSeconds(5000)).toBe(5);
      expect(msToSeconds(60000)).toBe(60);
    });

    it("should handle fractional milliseconds", () => {
      expect(msToSeconds(1500)).toBe(1); // Floor division
      expect(msToSeconds(1999)).toBe(1);
    });

    it("should handle zero", () => {
      expect(msToSeconds(0)).toBe(0);
    });

    it("should handle negative values", () => {
      expect(msToSeconds(-1000)).toBe(-1);
    });
  });

  describe("secondsToMs", () => {
    it("should convert seconds to milliseconds", () => {
      expect(secondsToMs(1)).toBe(1000);
      expect(secondsToMs(5)).toBe(5000);
      expect(secondsToMs(60)).toBe(60000);
    });

    it("should handle fractional seconds", () => {
      expect(secondsToMs(1.5)).toBe(1500);
      expect(secondsToMs(0.1)).toBe(100);
    });

    it("should handle zero", () => {
      expect(secondsToMs(0)).toBe(0);
    });

    it("should handle negative values", () => {
      expect(secondsToMs(-1)).toBe(-1000);
    });
  });
});
