/**
 * useSessionActions Hook Tests
 * Tests for session control operations (start, end, pause, resume)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSessionActions } from "../useSessionActions";

// Mock dependencies
vi.mock("../useSession", () => ({
  useSession: vi.fn(() => ({
    session: null,
    isActive: false,
    startSession: vi.fn().mockResolvedValue({
      id: "test-session",
      userId: "test-user",
      startTime: new Date(),
    }),
    stopSession: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock("../usePauseResume", () => ({
  usePauseResume: vi.fn(() => ({
    isPaused: false,
    pauseSession: vi.fn().mockResolvedValue(undefined),
    resumeSession: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock("../../../utils/logging", () => ({
  serviceLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

vi.mock("../../../services/SessionConflictDetectionService", () => ({
  sessionConflictDetection: {
    isOperationInProgress: vi.fn(() => false),
    startOperation: vi.fn(),
    completeOperation: vi.fn(),
  },
}));

describe("useSessionActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() =>
      useSessionActions({
        userId: "test-user",
        isActive: false,
        onSessionStarted: vi.fn(),
        onSessionEnded: vi.fn(),
      }),
    );

    expect(result.current.isStarting).toBe(false);
    expect(result.current.isEnding).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should expose start session function", () => {
    const { result } = renderHook(() =>
      useSessionActions({
        userId: "test-user",
        isActive: false,
      }),
    );

    expect(result.current.startSession).toBeDefined();
    expect(typeof result.current.startSession).toBe("function");
  });

  it("should expose end session function", () => {
    const { result } = renderHook(() =>
      useSessionActions({
        userId: "test-user",
        isActive: true,
      }),
    );

    expect(result.current.endSession).toBeDefined();
    expect(typeof result.current.endSession).toBe("function");
  });

  it("should expose pause and resume functions", () => {
    const { result } = renderHook(() =>
      useSessionActions({
        userId: "test-user",
        isActive: true,
      }),
    );

    expect(result.current.pauseSession).toBeDefined();
    expect(result.current.resumeSession).toBeDefined();
  });

  it("should determine if session can be started", () => {
    const { result: inactiveResult } = renderHook(() =>
      useSessionActions({
        userId: "test-user",
        isActive: false,
      }),
    );

    const { result: activeResult } = renderHook(() =>
      useSessionActions({
        userId: "test-user",
        isActive: true,
      }),
    );

    expect(inactiveResult.current.canStart).toBeDefined();
    expect(activeResult.current.canEnd).toBeDefined();
  });

  it("should call callbacks when provided", async () => {
    const onSessionStarted = vi.fn();
    const { result } = renderHook(() =>
      useSessionActions({
        userId: "test-user",
        isActive: false,
        onSessionStarted,
      }),
    );

    await act(async () => {
      await result.current.startSession({
        goalDuration: 3600,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
      });
    });

    await waitFor(() => {
      expect(onSessionStarted).toHaveBeenCalled();
    });
  });
});
