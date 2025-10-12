/**
 * Tests for SessionConflictDetectionService
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { sessionConflictDetection } from "../SessionConflictDetectionService";
import type { DBSession } from "../../types/database";

describe("SessionConflictDetectionService", () => {
  beforeEach(() => {
    sessionConflictDetection.clearAllOperations();
  });

  it("should mark operation as in progress", () => {
    expect(sessionConflictDetection.isOperationInProgress("user1")).toBe(false);

    sessionConflictDetection.startOperation("user1", "start");

    expect(sessionConflictDetection.isOperationInProgress("user1")).toBe(true);
  });

  it("should complete operation", () => {
    sessionConflictDetection.startOperation("user1", "start");
    expect(sessionConflictDetection.isOperationInProgress("user1")).toBe(true);

    sessionConflictDetection.completeOperation("user1", "start");
    expect(sessionConflictDetection.isOperationInProgress("user1")).toBe(false);
  });

  it("should detect stale data conflict", () => {
    const oldTime = new Date("2024-01-01T10:00:00Z");
    const newTime = new Date("2024-01-01T11:00:00Z");

    const currentSession: DBSession = {
      id: "session1",
      userId: "user1",
      startTime: new Date(),
      isPaused: false,
      accumulatedPauseTime: 0,
      isHardcoreMode: false,
      keyholderApprovalRequired: false,
      syncStatus: "synced",
      lastModified: newTime,
    };

    const expectedState = {
      lastModified: oldTime,
    };

    const result = sessionConflictDetection.detectSessionConflict(
      currentSession,
      expectedState,
    );

    expect(result.hasConflict).toBe(true);
    expect(result.conflictType).toBe("stale_data");
  });

  it("should detect session ended conflict", () => {
    const currentSession: DBSession = {
      id: "session1",
      userId: "user1",
      startTime: new Date("2024-01-01T10:00:00Z"),
      endTime: new Date("2024-01-01T11:00:00Z"),
      isPaused: false,
      accumulatedPauseTime: 0,
      isHardcoreMode: false,
      keyholderApprovalRequired: false,
      syncStatus: "synced",
      lastModified: new Date(),
    };

    const expectedState = {
      endTime: undefined, // Expecting session to be active
    };

    const result = sessionConflictDetection.detectSessionConflict(
      currentSession,
      expectedState,
    );

    expect(result.hasConflict).toBe(true);
    expect(result.conflictType).toBe("session_ended");
  });

  it("should detect pause state mismatch", () => {
    const currentSession: DBSession = {
      id: "session1",
      userId: "user1",
      startTime: new Date(),
      isPaused: true,
      accumulatedPauseTime: 0,
      isHardcoreMode: false,
      keyholderApprovalRequired: false,
      syncStatus: "synced",
      lastModified: new Date(),
    };

    const expectedState = {
      isPaused: false,
    };

    const result = sessionConflictDetection.detectSessionConflict(
      currentSession,
      expectedState,
    );

    expect(result.hasConflict).toBe(true);
    expect(result.conflictType).toBe("pause_state_mismatch");
  });

  it("should not detect conflict when states match", () => {
    const currentSession: DBSession = {
      id: "session1",
      userId: "user1",
      startTime: new Date(),
      isPaused: false,
      accumulatedPauseTime: 0,
      isHardcoreMode: false,
      keyholderApprovalRequired: false,
      syncStatus: "synced",
      lastModified: new Date(),
    };

    const expectedState = {
      isPaused: false,
    };

    const result = sessionConflictDetection.detectSessionConflict(
      currentSession,
      expectedState,
    );

    expect(result.hasConflict).toBe(false);
  });

  it("should clear timed out operations", () => {
    vi.useFakeTimers();

    sessionConflictDetection.startOperation("user1", "start");
    expect(sessionConflictDetection.isOperationInProgress("user1")).toBe(true);

    // Fast forward past timeout (30 seconds)
    vi.advanceTimersByTime(31000);

    expect(sessionConflictDetection.isOperationInProgress("user1")).toBe(false);

    vi.useRealTimers();
  });

  it("should handle concurrent operations from different users", () => {
    sessionConflictDetection.startOperation("user1", "start");
    sessionConflictDetection.startOperation("user2", "pause");

    expect(sessionConflictDetection.isOperationInProgress("user1")).toBe(true);
    expect(sessionConflictDetection.isOperationInProgress("user2")).toBe(true);

    sessionConflictDetection.completeOperation("user1", "start");

    expect(sessionConflictDetection.isOperationInProgress("user1")).toBe(false);
    expect(sessionConflictDetection.isOperationInProgress("user2")).toBe(true);
  });
});
