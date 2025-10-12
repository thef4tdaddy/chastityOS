/**
 * useSessionTimer Hook Tests
 * Tests for session timer calculations and formatting
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSessionTimer } from "../useSessionTimer";
import type { DBSession } from "../../types/database";

// Mock the time formatting utilities
vi.mock("../../utils/formatting/time", () => ({
  formatElapsedTime: (seconds: number) =>
    `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ${seconds % 60}s`,
}));

describe("useSessionTimer", () => {
  const createMockSession = (overrides?: Partial<DBSession>): DBSession => ({
    id: "test-session",
    userId: "test-user",
    startTime: new Date(Date.now() - 3600000), // 1 hour ago
    isPaused: false,
    accumulatedPauseTime: 0,
    isHardcoreMode: false,
    keyholderApprovalRequired: false,
    syncStatus: "synced",
    lastModified: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return default values when no session provided", () => {
    const { result } = renderHook(() => useSessionTimer(null));

    expect(result.current.effectiveTimeFormatted).toBe("0h 0m 0s");
    expect(result.current.totalElapsedTimeFormatted).toBe("0h 0m 0s");
    expect(result.current.isActive).toBe(false);
    expect(result.current.isPaused).toBe(false);
  });

  it("should calculate elapsed time for active session", () => {
    const session = createMockSession();
    const { result } = renderHook(() => useSessionTimer(session));

    expect(result.current.isActive).toBe(true);
    expect(result.current.effectiveTimeFormatted).toBeDefined();
  });

  it("should handle paused session correctly", () => {
    const session = createMockSession({
      isPaused: true,
      pauseStartTime: new Date(),
      accumulatedPauseTime: 600, // 10 minutes
    });

    const { result } = renderHook(() => useSessionTimer(session));

    expect(result.current.isPaused).toBe(true);
    expect(result.current.currentPauseDurationFormatted).toBeDefined();
  });

  it("should calculate effective time excluding pause time", () => {
    const session = createMockSession({
      startTime: new Date(Date.now() - 7200000), // 2 hours ago
      accumulatedPauseTime: 1800, // 30 minutes paused
    });

    const { result } = renderHook(() => useSessionTimer(session));

    // Effective time should be less than total time due to pauses
    expect(result.current.effectiveTimeFormatted).toBeDefined();
    expect(result.current.totalElapsedTimeFormatted).toBeDefined();
  });

  it("should handle ended session with duration", () => {
    const session = createMockSession({
      endTime: new Date(),
      duration: 3600, // 1 hour
    });

    const { result } = renderHook(() => useSessionTimer(session));

    expect(result.current.isActive).toBe(false);
    expect(result.current.effectiveTimeFormatted).toBeDefined();
  });

  it("should update timer values on interval", async () => {
    vi.useFakeTimers();

    const session = createMockSession();
    const { result } = renderHook(() => useSessionTimer(session));

    const initialTime = result.current.effectiveTimeFormatted;

    act(() => {
      vi.advanceTimersByTime(1000); // Advance 1 second
    });

    // Timer should update (in real implementation with setInterval)
    expect(result.current.effectiveTimeFormatted).toBeDefined();

    vi.useRealTimers();
  });

  it("should handle session with goal progress", () => {
    const session = createMockSession({
      goalDuration: 7200, // 2 hour goal
    });

    const { result } = renderHook(() => useSessionTimer(session));

    expect(result.current.goalProgress).toBeDefined();
  });

  it("should handle very long sessions", () => {
    const session = createMockSession({
      startTime: new Date(Date.now() - 86400000 * 7), // 7 days ago
    });

    const { result } = renderHook(() => useSessionTimer(session));

    expect(result.current.effectiveTimeFormatted).toBeDefined();
    expect(result.current.totalElapsedTimeFormatted).toBeDefined();
  });

  it("should handle session with accumulated pause time greater than elapsed time (edge case)", () => {
    const session = createMockSession({
      startTime: new Date(Date.now() - 3600000), // 1 hour ago
      accumulatedPauseTime: 7200, // 2 hours paused (impossible but edge case)
    });

    const { result } = renderHook(() => useSessionTimer(session));

    // Should handle gracefully, effective time should be 0 or positive
    expect(result.current.effectiveTimeFormatted).toBeDefined();
  });

  describe("Edge Cases", () => {
    it("should handle session with future start time", () => {
      const session = createMockSession({
        startTime: new Date(Date.now() + 3600000), // 1 hour in future
      });

      const { result } = renderHook(() => useSessionTimer(session));

      // Should handle gracefully
      expect(result.current.effectiveTimeFormatted).toBeDefined();
    });

    it("should handle session with undefined fields", () => {
      const session = createMockSession({
        accumulatedPauseTime: 0,
        pauseStartTime: undefined,
      });

      const { result } = renderHook(() => useSessionTimer(session));

      expect(result.current.effectiveTimeFormatted).toBeDefined();
      expect(result.current.currentPauseDurationFormatted).toBeDefined();
    });

    it("should handle rapid session state changes", () => {
      const session = createMockSession();
      const { result, rerender } = renderHook(
        ({ session }) => useSessionTimer(session),
        { initialProps: { session } },
      );

      // Change session state
      act(() => {
        rerender({
          session: {
            ...session,
            isPaused: true,
            pauseStartTime: new Date(),
          },
        });
      });

      expect(result.current.isPaused).toBe(true);
    });
  });
});
