/**
 * useSessionActions Hook Tests
 *  for session control operations (start, end, pause, resume)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSessionActions } from "@/hooks/session/useSessionActions";
import { useSession } from "@/hooks/session/useSession";

// Mock dependencies
vi.mock("@/hooks/session/useSession");

vi.mock("@/hooks/session/usePauseResume", () => ({
  usePauseResume: vi.fn(() => ({
    isPaused: false,
    pauseSession: vi.fn().mockResolvedValue(undefined),
    resumeSession: vi.fn().mockResolvedValue(undefined),
    pauseStatus: { isPaused: false, pauseCount: 0, canResume: false },
    cooldownState: { isInCooldown: false },
    timeUntilNextPause: 0,
  })),
}));

vi.mock("@/utils/logging", () => ({
  serviceLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

vi.mock("@/services/SessionConflictDetectionService", () => ({
  sessionConflictDetection: {
    isOperationInProgress: vi.fn(() => false),
    startOperation: vi.fn(),
    completeOperation: vi.fn(),
  },
}));

describe("useSessionActions", () => {
  const mockUserId = "test-user";

  const mockUseSession = (isActive: boolean) => {
    const mockSessionData: Partial<ReturnType<typeof useSession>> = {
      session: isActive
        ? {
            id: "test-session",
            userId: mockUserId,
            startTime: new Date(),
            isPaused: false,
            accumulatedPauseTime: 0,
            isHardcoreMode: false,
            keyholderApprovalRequired: false,
            syncStatus: "synced",
            lastModified: new Date(),
          }
        : null,
      isActive,
      startSession: vi.fn().mockResolvedValue({
        id: "test-session",
        userId: mockUserId,
        startTime: new Date(),
      }),
      stopSession: vi.fn().mockResolvedValue(undefined),
      pauseSession: vi.fn().mockResolvedValue(undefined),
      resumeSession: vi.fn().mockResolvedValue(undefined),
      modifySession: vi.fn().mockResolvedValue(undefined),
      setGoals: vi.fn().mockResolvedValue(undefined),
      requestModification: vi.fn().mockResolvedValue(undefined),
      requestKeyholderApproval: vi.fn().mockResolvedValue({ approved: true }),
      canSelfModify: true,
      refreshSession: vi.fn(),
      duration: 0,
      analytics: {
        averageSessionLength: 0,
        completionRate: 0,
        goalAchievementRate: 0,
        totalSessions: 0,
        consistencyScore: 0,
      },
      context: {
        userId: mockUserId,
        sessionType: "self_managed",
        permissions: [],
      },
      goals: { personal: [], keyholderAssigned: [], active: [] },
      getPredictiveAnalytics: vi.fn(),
      getSessionInsights: vi.fn(),
      isUnderKeyholderControl: false,
      keyholderControls: null,
      goalProgress: 0,
      isLoading: false,
      error: null,
    };
    vi.mocked(useSession).mockReturnValue(
      mockSessionData as ReturnType<typeof useSession>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    mockUseSession(false);
    const { result } = renderHook(() =>
      useSessionActions({ userId: mockUserId }),
    );

    expect(result.current.isStarting).toBe(false);
    expect(result.current.isEnding).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should expose start session function", () => {
    mockUseSession(false);
    const { result } = renderHook(() =>
      useSessionActions({ userId: mockUserId }),
    );

    expect(result.current.startSession).toBeDefined();
    expect(typeof result.current.startSession).toBe("function");
  });

  it("should expose end session function", () => {
    mockUseSession(true);
    const { result } = renderHook(() =>
      useSessionActions({ userId: mockUserId }),
    );

    expect(result.current.endSession).toBeDefined();
    expect(typeof result.current.endSession).toBe("function");
  });

  it("should expose pause and resume functions", () => {
    mockUseSession(true);
    const { result } = renderHook(() =>
      useSessionActions({ userId: mockUserId }),
    );

    expect(result.current.pauseSession).toBeDefined();
    expect(result.current.resumeSession).toBeDefined();
  });

  it("should determine if session can be started", () => {
    mockUseSession(false);
    const { result: inactiveResult } = renderHook(() =>
      useSessionActions({ userId: mockUserId }),
    );
    expect(inactiveResult.current.canStart).toBe(true);

    mockUseSession(true);
    const { result: activeResult } = renderHook(() =>
      useSessionActions({ userId: mockUserId }),
    );
    expect(activeResult.current.canStart).toBe(false);
  });

  it("should call callbacks when provided", async () => {
    mockUseSession(false);
    const onSessionStarted = vi.fn();
    const { result } = renderHook(() =>
      useSessionActions({ userId: mockUserId, onSessionStarted }),
    );

    await act(async () => {
      await result.current.startSession({
        goalDuration: 3600,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
      });
    });

    expect(onSessionStarted).toHaveBeenCalled();
  });
});
