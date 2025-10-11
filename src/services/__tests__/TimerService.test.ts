/**
 * Tests for TimerService timer sync validation
 */
import { describe, it, expect, vi } from "vitest";
import { TimerService } from "../TimerService";
import type { DBSession } from "../../types/database";

describe("TimerService - Sync Validation", () => {
  it("should detect missing start time", () => {
    const session = {
      id: "session1",
      userId: "user1",
      startTime: undefined as unknown as Date,
      isPaused: false,
      accumulatedPauseTime: 0,
      isHardcoreMode: false,
      keyholderApprovalRequired: false,
      syncStatus: "synced" as const,
      lastModified: new Date(),
    };

    const issue = TimerService.validateTimerData(session, new Date());

    expect(issue).not.toBeNull();
    expect(issue?.type).toBe("missing_data");
    expect(issue?.severity).toBe("error");
  });

  it("should detect future timestamp", () => {
    const now = new Date("2024-01-01T12:00:00Z");
    const futureTime = new Date("2024-01-01T12:10:00Z"); // 10 minutes in future

    const session: DBSession = {
      id: "session1",
      userId: "user1",
      startTime: futureTime,
      isPaused: false,
      accumulatedPauseTime: 0,
      isHardcoreMode: false,
      keyholderApprovalRequired: false,
      syncStatus: "synced",
      lastModified: new Date(),
    };

    const issue = TimerService.validateTimerData(session, now);

    expect(issue).not.toBeNull();
    expect(issue?.type).toBe("future_timestamp");
    expect(issue?.severity).toBe("error"); // More than 5 minutes
  });

  it("should detect minor clock skew as warning", () => {
    const now = new Date("2024-01-01T12:00:00Z");
    const slightlyFuture = new Date("2024-01-01T12:02:00Z"); // 2 minutes in future

    const session: DBSession = {
      id: "session1",
      userId: "user1",
      startTime: slightlyFuture,
      isPaused: false,
      accumulatedPauseTime: 0,
      isHardcoreMode: false,
      keyholderApprovalRequired: false,
      syncStatus: "synced",
      lastModified: new Date(),
    };

    const issue = TimerService.validateTimerData(session, now);

    expect(issue).not.toBeNull();
    expect(issue?.type).toBe("future_timestamp");
    expect(issue?.severity).toBe("warning"); // Less than 5 minutes
  });

  it("should detect clock skew in pause timestamp", () => {
    const now = new Date("2024-01-01T12:00:00Z");
    const futureTime = new Date("2024-01-01T12:10:00Z");

    const session: DBSession = {
      id: "session1",
      userId: "user1",
      startTime: new Date("2024-01-01T10:00:00Z"),
      isPaused: true,
      pauseStartTime: futureTime,
      accumulatedPauseTime: 0,
      isHardcoreMode: false,
      keyholderApprovalRequired: false,
      syncStatus: "synced",
      lastModified: new Date(),
    };

    const issue = TimerService.validateTimerData(session, now);

    expect(issue).not.toBeNull();
    expect(issue?.type).toBe("clock_skew");
  });

  it("should return null for valid timer data", () => {
    const now = new Date("2024-01-01T12:00:00Z");
    const pastTime = new Date("2024-01-01T10:00:00Z");

    const session: DBSession = {
      id: "session1",
      userId: "user1",
      startTime: pastTime,
      isPaused: false,
      accumulatedPauseTime: 0,
      isHardcoreMode: false,
      keyholderApprovalRequired: false,
      syncStatus: "synced",
      lastModified: new Date(),
    };

    const issue = TimerService.validateTimerData(session, now);

    expect(issue).toBeNull();
  });

  it("should handle effective time calculation with sync errors", () => {
    const now = new Date("2024-01-01T12:00:00Z");
    const futureTime = new Date("2024-01-01T13:00:00Z");

    const session: DBSession = {
      id: "session1",
      userId: "user1",
      startTime: futureTime, // Invalid: in the future
      isPaused: false,
      accumulatedPauseTime: 0,
      isHardcoreMode: false,
      keyholderApprovalRequired: false,
      syncStatus: "synced",
      lastModified: new Date(),
    };

    const effectiveTime = TimerService.calculateEffectiveTime(session, now);

    // Should return 0 for error cases
    expect(effectiveTime).toBe(0);
  });

  it("should calculate effective time correctly for valid session", () => {
    const now = new Date("2024-01-01T12:00:00Z");
    const startTime = new Date("2024-01-01T10:00:00Z");

    const session: DBSession = {
      id: "session1",
      userId: "user1",
      startTime,
      isPaused: false,
      accumulatedPauseTime: 600, // 10 minutes
      isHardcoreMode: false,
      keyholderApprovalRequired: false,
      syncStatus: "synced",
      lastModified: new Date(),
    };

    const effectiveTime = TimerService.calculateEffectiveTime(session, now);

    // 2 hours (7200s) - 10 minutes (600s) = 6600s
    expect(effectiveTime).toBe(6600);
  });

  it("should handle negative pause duration gracefully", () => {
    const now = new Date("2024-01-01T12:00:00Z");
    const startTime = new Date("2024-01-01T10:00:00Z");
    const futurePauseTime = new Date("2024-01-01T13:00:00Z"); // In future

    const session: DBSession = {
      id: "session1",
      userId: "user1",
      startTime,
      isPaused: true,
      pauseStartTime: futurePauseTime,
      accumulatedPauseTime: 0,
      isHardcoreMode: false,
      keyholderApprovalRequired: false,
      syncStatus: "synced",
      lastModified: new Date(),
    };

    const effectiveTime = TimerService.calculateEffectiveTime(session, now);

    // Should not go negative
    expect(effectiveTime).toBeGreaterThanOrEqual(0);
  });
});
