/**
 * Tests for useTrackerStats hook
 */
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useTrackerStats } from "../useTrackerStats";
import type { DBSession } from "../../../types/database";

// Mock the useSessionTimer hook
vi.mock("../../useSessionTimer", () => ({
  useSessionTimer: () => ({
    effectiveTimeFormatted: "1h 30m 45s",
    isPaused: false,
    currentPauseDurationFormatted: "0h 0m 0s",
    totalElapsedTimeFormatted: "1h 35m 20s",
    isActive: true,
  }),
}));

describe("useTrackerStats", () => {
  it("should initialize with default values when no props provided", () => {
    const { result } = renderHook(() => useTrackerStats({}));

    expect(result.current.stats.topBoxLabel).toBe("Total Locked Time");
    expect(result.current.stats.totalElapsedFormatted).toBe("0s");
    expect(result.current.stats.currentSessionFormatted).toBe("0h 0m 0s");
    expect(result.current.stats.cageOffTimeFormatted).toBe("0h 0m 0s");
    expect(result.current.isLoading).toBe(false);
  });

  it("should use session timer data when currentSession is provided", () => {
    const mockSession: DBSession = {
      id: "session-1",
      userId: "user-1",
      startTime: new Date(),
      isPaused: false,
      accumulatedPauseTime: 0,
      isHardcoreMode: false,
      keyholderApprovalRequired: false,
      syncStatus: "synced",
      lastModified: new Date(),
    };

    const { result } = renderHook(() =>
      useTrackerStats({ currentSession: mockSession }),
    );

    // Should use mocked timer data
    expect(result.current.displayData.effectiveTime).toBe("1h 30m 45s");
    expect(result.current.displayData.totalElapsed).toBe("1h 35m 20s");
    expect(result.current.displayData.isActive).toBe(true);
    expect(result.current.displayData.isPaused).toBe(false);
  });

  it("should use legacy props when currentSession is not provided", () => {
    const { result } = renderHook(() =>
      useTrackerStats({
        topBoxLabel: "Custom Label",
        topBoxTime: "2h 0m 0s",
        mainChastityDisplayTime: 7200, // 2 hours in seconds
        isCageOn: true,
        isPaused: false,
        timeCageOff: 300, // 5 minutes
        totalChastityTime: 10800, // 3 hours
        totalTimeCageOff: 600, // 10 minutes
      }),
    );

    expect(result.current.stats.topBoxLabel).toBe("Custom Label");
    expect(result.current.stats.totalElapsedFormatted).toBe("2h 0m 0s");
    expect(result.current.stats.currentSessionFormatted).toBe("2h 0m 0s");
    expect(result.current.stats.cageOffTimeFormatted).toBe("0h 5m 0s");
    expect(result.current.stats.totalChastityTimeFormatted).toBe("3h 0m 0s");
    expect(result.current.stats.totalCageOffTimeFormatted).toBe("0h 10m 0s");
    expect(result.current.displayData.isActive).toBe(true);
  });

  it("should format pause duration correctly", () => {
    const { result } = renderHook(() =>
      useTrackerStats({
        isPaused: true,
        livePauseDuration: 125, // 2 minutes 5 seconds
        accumulatedPauseTimeThisSession: 500, // 8 minutes 20 seconds
      }),
    );

    expect(result.current.displayData.isPaused).toBe(true);
    expect(result.current.displayData.currentPauseDuration).toBe("0h 2m 5s");
    expect(result.current.displayData.accumulatedPause).toBe("0h 8m 20s");
  });

  it("should handle zero values correctly", () => {
    const { result } = renderHook(() =>
      useTrackerStats({
        mainChastityDisplayTime: 0,
        timeCageOff: 0,
        totalChastityTime: 0,
        totalTimeCageOff: 0,
      }),
    );

    expect(result.current.stats.currentSessionFormatted).toBe("0h 0m 0s");
    expect(result.current.stats.cageOffTimeFormatted).toBe("0h 0m 0s");
    expect(result.current.stats.totalChastityTimeFormatted).toBe("0h 0m 0s");
    expect(result.current.stats.totalCageOffTimeFormatted).toBe("0h 0m 0s");
  });

  it("should handle large time values correctly", () => {
    const { result } = renderHook(() =>
      useTrackerStats({
        mainChastityDisplayTime: 86400, // 24 hours
        totalChastityTime: 604800, // 7 days (168 hours)
      }),
    );

    expect(result.current.stats.currentSessionFormatted).toBe("24h 0m 0s");
    expect(result.current.stats.totalChastityTimeFormatted).toBe("168h 0m 0s");
  });

  it("should format partial hours and minutes correctly", () => {
    const { result } = renderHook(() =>
      useTrackerStats({
        mainChastityDisplayTime: 3665, // 1 hour, 1 minute, 5 seconds
        timeCageOff: 125, // 2 minutes, 5 seconds
      }),
    );

    expect(result.current.stats.currentSessionFormatted).toBe("1h 1m 5s");
    expect(result.current.stats.cageOffTimeFormatted).toBe("0h 2m 5s");
  });

  it("should reflect inactive state when cage is off", () => {
    const { result } = renderHook(() =>
      useTrackerStats({
        isCageOn: false,
        timeCageOff: 600, // 10 minutes
      }),
    );

    expect(result.current.displayData.isActive).toBe(false);
    expect(result.current.stats.cageOffTimeFormatted).toBe("0h 10m 0s");
  });

  it("should handle missing optional props gracefully", () => {
    const { result } = renderHook(() => useTrackerStats({}));

    // Should not throw and should have default values
    expect(result.current.stats.topBoxLabel).toBeDefined();
    expect(result.current.stats.currentSessionFormatted).toBeDefined();
    expect(result.current.displayData.isActive).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("should update when props change", () => {
    const { result, rerender } = renderHook(
      ({ time }) => useTrackerStats({ mainChastityDisplayTime: time }),
      { initialProps: { time: 3600 } },
    );

    expect(result.current.stats.currentSessionFormatted).toBe("1h 0m 0s");

    // Update the time
    rerender({ time: 7200 });

    expect(result.current.stats.currentSessionFormatted).toBe("2h 0m 0s");
  });

  it("should maintain backward compatibility with legacy props", () => {
    const legacyProps = {
      topBoxLabel: "Legacy Total Time",
      topBoxTime: "5h 30m 15s",
      mainChastityDisplayTime: 19815,
      isPaused: true,
      livePauseDuration: 300,
      accumulatedPauseTimeThisSession: 900,
      isCageOn: true,
      timeCageOff: 0,
      totalChastityTime: 50000,
      totalTimeCageOff: 10000,
    };

    const { result } = renderHook(() => useTrackerStats(legacyProps));

    expect(result.current.stats.topBoxLabel).toBe("Legacy Total Time");
    expect(result.current.displayData.isActive).toBe(true);
    expect(result.current.displayData.isPaused).toBe(true);
  });
});
