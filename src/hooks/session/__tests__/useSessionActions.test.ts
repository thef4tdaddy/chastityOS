/**
 * Tests for useSessionActions hook
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSessionActions } from "../useSessionActions";
import type { DBSession } from "../../../types/database";

// Mock the logger
vi.mock("../../../utils/logging", () => ({
  serviceLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

// Mock the session hooks
const mockStartSession = vi.fn();
const mockStopSession = vi.fn();
const mockPauseSession = vi.fn();
const mockResumeSession = vi.fn();

vi.mock("../useSession", () => ({
  useSession: () => ({
    session: null,
    isActive: false,
    startSession: mockStartSession,
    stopSession: mockStopSession,
    canSelfModify: true,
  }),
}));

vi.mock("../usePauseResume", () => ({
  usePauseResume: () => ({
    pauseStatus: {
      isPaused: false,
      canResume: true,
      pauseCount: 0,
    },
    cooldownState: {
      isInCooldown: false,
    },
    pauseSession: mockPauseSession,
    resumeSession: mockResumeSession,
  }),
}));

describe("useSessionActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultOptions = {
    userId: "test-user",
  };

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useSessionActions(defaultOptions));

    expect(result.current.isStarting).toBe(false);
    expect(result.current.isEnding).toBe(false);
    expect(result.current.isPausing).toBe(false);
    expect(result.current.isResuming).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isActive).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.sessionId).toBeNull();
  });

  it("should have correct permissions when session is not active", () => {
    const { result } = renderHook(() => useSessionActions(defaultOptions));

    expect(result.current.canStart).toBe(true);
    expect(result.current.canEnd).toBe(false);
    expect(result.current.canPause).toBe(false);
    expect(result.current.canResume).toBe(false);
  });

  it("should start a session successfully", async () => {
    const mockSession: DBSession = {
      id: "session-1",
      userId: "test-user",
      startTime: new Date(),
      isPaused: false,
      accumulatedPauseTime: 0,
      isHardcoreMode: false,
      keyholderApprovalRequired: false,
      syncStatus: "synced",
      lastModified: new Date(),
    };

    mockStartSession.mockResolvedValue(mockSession);

    const onSessionStarted = vi.fn();
    const { result } = renderHook(() =>
      useSessionActions({ ...defaultOptions, onSessionStarted }),
    );

    await act(async () => {
      await result.current.startSession({
        goalDuration: 3600,
        isHardcoreMode: false,
      });
    });

    expect(mockStartSession).toHaveBeenCalledWith({
      goalDuration: 3600,
      isHardcoreMode: false,
      keyholderApprovalRequired: false,
      notes: undefined,
    });
    expect(onSessionStarted).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it("should handle start session errors", async () => {
    const errorMessage = "Failed to start session";
    mockStartSession.mockRejectedValue(new Error(errorMessage));

    const onError = vi.fn();
    const { result } = renderHook(() =>
      useSessionActions({ ...defaultOptions, onError }),
    );

    await act(async () => {
      try {
        await result.current.startSession();
      } catch (error) {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe(errorMessage);
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  it("should end a session successfully", async () => {
    // Mock active session
    vi.mocked(await import("../useSession")).useSession = () => ({
      session: {
        id: "session-1",
        userId: "test-user",
        startTime: new Date(),
        isPaused: false,
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
        syncStatus: "synced",
        lastModified: new Date(),
      },
      isActive: true,
      startSession: mockStartSession,
      stopSession: mockStopSession,
      canSelfModify: true,
      duration: 0,
      goalProgress: 0,
      isUnderKeyholderControl: false,
      getSessionInsights: vi.fn(),
      getPredictiveAnalytics: vi.fn(),
      updateSession: vi.fn(),
      assignGoal: vi.fn(),
      removeGoal: vi.fn(),
    });

    mockStopSession.mockResolvedValue(undefined);

    const onSessionEnded = vi.fn();
    const { result } = renderHook(() =>
      useSessionActions({ ...defaultOptions, onSessionEnded }),
    );

    await act(async () => {
      await result.current.endSession("User requested");
    });

    expect(mockStopSession).toHaveBeenCalledWith("User requested");
    expect(onSessionEnded).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it("should pause a session successfully", async () => {
    // Mock active session
    vi.mocked(await import("../useSession")).useSession = () => ({
      session: {
        id: "session-1",
        userId: "test-user",
        startTime: new Date(),
        isPaused: false,
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
        syncStatus: "synced",
        lastModified: new Date(),
      },
      isActive: true,
      startSession: mockStartSession,
      stopSession: mockStopSession,
      canSelfModify: true,
      duration: 0,
      goalProgress: 0,
      isUnderKeyholderControl: false,
      getSessionInsights: vi.fn(),
      getPredictiveAnalytics: vi.fn(),
      updateSession: vi.fn(),
      assignGoal: vi.fn(),
      removeGoal: vi.fn(),
    });

    mockPauseSession.mockResolvedValue(undefined);

    const onSessionPaused = vi.fn();
    const { result } = renderHook(() =>
      useSessionActions({ ...defaultOptions, onSessionPaused }),
    );

    await act(async () => {
      await result.current.pauseSession("bathroom");
    });

    expect(mockPauseSession).toHaveBeenCalledWith("bathroom");
    expect(onSessionPaused).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it("should resume a session successfully", async () => {
    // Mock paused session
    vi.mocked(await import("../useSession")).useSession = () => ({
      session: {
        id: "session-1",
        userId: "test-user",
        startTime: new Date(),
        isPaused: true,
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
        syncStatus: "synced",
        lastModified: new Date(),
      },
      isActive: true,
      startSession: mockStartSession,
      stopSession: mockStopSession,
      canSelfModify: true,
      duration: 0,
      goalProgress: 0,
      isUnderKeyholderControl: false,
      getSessionInsights: vi.fn(),
      getPredictiveAnalytics: vi.fn(),
      updateSession: vi.fn(),
      assignGoal: vi.fn(),
      removeGoal: vi.fn(),
    });

    vi.mocked(await import("../usePauseResume")).usePauseResume = () => ({
      pauseStatus: {
        isPaused: true,
        canResume: true,
        pauseCount: 1,
        pauseStartTime: new Date(),
        pauseDuration: 60,
      },
      cooldownState: {
        isInCooldown: false,
        cooldownRemaining: 0,
        nextPauseAvailable: null,
        cooldownReason: "frequent_pausing" as const,
        canOverride: false,
        adaptiveDuration: 0,
      },
      pauseSession: mockPauseSession,
      resumeSession: mockResumeSession,
      pauseHistory: [],
      pauseAnalytics: {
        totalPauses: 0,
        averagePauseDuration: 0,
        pauseFrequency: 0,
        emergencyPauseCount: 0,
        keyholderInitiatedCount: 0,
        cooldownViolations: 0,
        patterns: [],
      },
      keyholderOverrides: {
        canOverrideCooldown: false,
        canForcePause: false,
        canForceResume: false,
        canModifyCooldownDuration: false,
        requiresReason: false,
      },
    });

    mockResumeSession.mockResolvedValue(undefined);

    const onSessionResumed = vi.fn();
    const { result } = renderHook(() =>
      useSessionActions({ ...defaultOptions, onSessionResumed }),
    );

    await act(async () => {
      await result.current.resumeSession();
    });

    expect(mockResumeSession).toHaveBeenCalled();
    expect(onSessionResumed).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it("should clear errors", () => {
    const { result } = renderHook(() => useSessionActions(defaultOptions));

    // Manually set an error
    act(() => {
      // Trigger an error by attempting an invalid action
      result.current.startSession();
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it("should prevent actions when permissions are denied", async () => {
    // Mock session where user cannot modify
    vi.mocked(await import("../useSession")).useSession = () => ({
      session: {
        id: "session-1",
        userId: "test-user",
        startTime: new Date(),
        isPaused: false,
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
        syncStatus: "synced",
        lastModified: new Date(),
      },
      isActive: true,
      startSession: mockStartSession,
      stopSession: mockStopSession,
      canSelfModify: false, // No permission to modify
      duration: 0,
      goalProgress: 0,
      isUnderKeyholderControl: true,
      getSessionInsights: vi.fn(),
      getPredictiveAnalytics: vi.fn(),
      updateSession: vi.fn(),
      assignGoal: vi.fn(),
      removeGoal: vi.fn(),
    });

    const { result } = renderHook(() => useSessionActions(defaultOptions));

    expect(result.current.canEnd).toBe(false);

    await act(async () => {
      await result.current.endSession("test");
    });

    expect(mockStopSession).not.toHaveBeenCalled();
    expect(result.current.error).toBeTruthy();
  });
});
