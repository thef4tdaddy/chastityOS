/**
 * Tests for useSessionLoader hook
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSessionLoader } from "../useSessionLoader";
import type { DBSession } from "../../../types/database";

// Mock the logger
vi.mock("../../../utils/logging", () => ({
  serviceLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock the useSessionPersistence hook
const mockInitializeSession = vi.fn();
const mockGetBackupState = vi.fn();

vi.mock("../../useSessionPersistence", () => ({
  useSessionPersistence: () => ({
    initializeSession: mockInitializeSession,
    isInitializing: false,
    restorationResult: null,
    error: null,
    getBackupState: mockGetBackupState,
  }),
}));

describe("useSessionLoader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useSessionLoader());

    expect(result.current.session).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.hasBackup).toBe(false);
    expect(result.current.isRestoring).toBe(false);
    expect(result.current.canRestore).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  it("should load session successfully", async () => {
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

    mockInitializeSession.mockResolvedValue({
      success: true,
      session: mockSession,
      wasRestored: false,
    });

    const { result } = renderHook(() => useSessionLoader());

    await act(async () => {
      await result.current.loadSession("user-1");
    });

    await waitFor(() => {
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.progress).toBe(100);
    });

    expect(mockInitializeSession).toHaveBeenCalledWith("user-1");
  });

  it("should handle loading errors", async () => {
    const errorMessage = "Failed to load session";
    mockInitializeSession.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useSessionLoader());

    await act(async () => {
      await result.current.loadSession("user-1");
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe(errorMessage);
      expect(result.current.session).toBeNull();
    });
  });

  it("should detect backup availability", () => {
    mockGetBackupState.mockReturnValue({
      activeSessionId: "session-1",
      sessionStartTime: new Date().toISOString(),
      lastHeartbeat: new Date().toISOString(),
    });

    const { result } = renderHook(() => useSessionLoader());

    expect(result.current.hasBackup).toBe(true);
    expect(result.current.canRestore).toBe(true);
  });

  it("should restore from backup", async () => {
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

    mockGetBackupState.mockReturnValue({
      activeSessionId: "session-1",
      sessionStartTime: new Date().toISOString(),
      lastHeartbeat: new Date().toISOString(),
    });

    const { result, rerender } = renderHook(() => useSessionLoader());

    // Simulate restoration result update
    vi.mocked(
      await import("../../useSessionPersistence"),
    ).useSessionPersistence = () => ({
      initializeSession: mockInitializeSession,
      isInitializing: false,
      restorationResult: {
        success: true,
        session: mockSession,
        wasRestored: true,
      },
      error: null,
      getBackupState: mockGetBackupState,
      backupSession: vi.fn(),
      startHeartbeat: vi.fn(),
      stopHeartbeat: vi.fn(),
      detectAndRecover: vi.fn(),
    });

    rerender();

    await act(async () => {
      const restored = await result.current.restoreFromBackup();
      expect(restored).toEqual(mockSession);
    });
  });

  it("should handle restore errors", async () => {
    mockGetBackupState.mockReturnValue(null);

    const { result } = renderHook(() => useSessionLoader());

    await act(async () => {
      try {
        await result.current.restoreFromBackup();
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeTruthy();
        expect((error as Error).message).toContain("No backup available");
      }
    });
  });

  it("should clear backup", async () => {
    localStorage.setItem("chastity_session_backup", JSON.stringify({}));

    const { result } = renderHook(() => useSessionLoader());

    await act(async () => {
      await result.current.clearBackup();
    });

    expect(localStorage.getItem("chastity_session_backup")).toBeNull();
  });

  it("should require user ID for loading", async () => {
    const { result } = renderHook(() => useSessionLoader());

    await act(async () => {
      await result.current.loadSession("");
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toContain("User ID is required");
    });

    expect(mockInitializeSession).not.toHaveBeenCalled();
  });

  it("should track progress during loading", async () => {
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

    mockInitializeSession.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              success: true,
              session: mockSession,
              wasRestored: false,
            });
          }, 100);
        }),
    );

    const { result } = renderHook(() => useSessionLoader());

    act(() => {
      result.current.loadSession("user-1");
    });

    // Progress should update during loading
    await waitFor(() => {
      expect(result.current.progress).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(result.current.progress).toBe(100);
    });
  });
});
