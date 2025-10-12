/**
 * SessionDBService Tests
 * Comprehensive tests for session CRUD operations and state management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { sessionDBService } from "../SessionDBService";
import { db } from "../../storage/ChastityDB";
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

// Mock the event logging service
vi.mock("../EventDBService", () => ({
  eventDBService: {
    logEvent: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock the goal tracker service
vi.mock("../../GoalTrackerService", () => ({
  GoalTrackerService: {
    startGoal: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock UUID generation for predictable IDs
vi.mock("../../../utils", () => ({
  generateUUID: vi.fn(() => "test-session-id"),
}));

describe("SessionDBService", () => {
  const testUserId = "test-user-123";
  const mockSession: Omit<DBSession, "lastModified" | "syncStatus"> = {
    id: "test-session-id",
    userId: testUserId,
    startTime: new Date("2025-01-01T10:00:00Z"),
    isPaused: false,
    accumulatedPauseTime: 0,
    isHardcoreMode: false,
    keyholderApprovalRequired: false,
  };

  beforeEach(async () => {
    // Clear the database before each test
    await db.sessions.clear();
  });

  afterEach(async () => {
    // Clean up after each test
    await db.sessions.clear();
  });

  describe("startSession", () => {
    it("should create a new session", async () => {
      const sessionId = await sessionDBService.startSession(testUserId, {
        goalDuration: 3600,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
      });

      expect(sessionId).toBe("test-session-id");

      const session = await db.sessions.get(sessionId);
      expect(session).toBeDefined();
      expect(session?.userId).toBe(testUserId);
      expect(session?.goalDuration).toBe(3600);
      expect(session?.isHardcoreMode).toBe(false);
    });

    it("should create a hardcore session", async () => {
      const sessionId = await sessionDBService.startSession(testUserId, {
        isHardcoreMode: true,
      });

      const session = await db.sessions.get(sessionId);
      expect(session?.isHardcoreMode).toBe(true);
    });

    it("should throw error if user already has active session", async () => {
      // Create first session
      await sessionDBService.startSession(testUserId);

      // Try to create second session
      await expect(sessionDBService.startSession(testUserId)).rejects.toThrow(
        "User already has an active session",
      );
    });

    it("should set default values for optional parameters", async () => {
      const sessionId = await sessionDBService.startSession(testUserId, {});

      const session = await db.sessions.get(sessionId);
      expect(session?.isHardcoreMode).toBe(false);
      expect(session?.keyholderApprovalRequired).toBe(false);
      expect(session?.isPaused).toBe(false);
      expect(session?.accumulatedPauseTime).toBe(0);
    });

    it("should create session with notes", async () => {
      const sessionId = await sessionDBService.startSession(testUserId, {
        notes: "Test session notes",
      });

      const session = await db.sessions.get(sessionId);
      expect(session?.notes).toBe("Test session notes");
    });
  });

  describe("getCurrentSession", () => {
    it("should return active session for user", async () => {
      const sessionId = await sessionDBService.startSession(testUserId);

      const currentSession =
        await sessionDBService.getCurrentSession(testUserId);
      expect(currentSession).toBeDefined();
      expect(currentSession?.id).toBe(sessionId);
      expect(currentSession?.userId).toBe(testUserId);
    });

    it("should return undefined if no active session", async () => {
      const currentSession =
        await sessionDBService.getCurrentSession(testUserId);
      expect(currentSession).toBeUndefined();
    });

    it("should return undefined for empty userId", async () => {
      const currentSession = await sessionDBService.getCurrentSession("");
      expect(currentSession).toBeUndefined();
    });

    it("should not return ended sessions", async () => {
      const sessionId = await sessionDBService.startSession(testUserId);
      await sessionDBService.endSession(sessionId, "Test end");

      const currentSession =
        await sessionDBService.getCurrentSession(testUserId);
      expect(currentSession).toBeUndefined();
    });
  });

  describe("endSession", () => {
    it("should end an active session", async () => {
      const sessionId = await sessionDBService.startSession(testUserId);

      await sessionDBService.endSession(sessionId, "User requested");

      const session = await db.sessions.get(sessionId);
      expect(session?.endTime).toBeDefined();
      expect(session?.endReason).toBe("User requested");
    });

    it("should calculate duration when ending session", async () => {
      const sessionId = await sessionDBService.startSession(testUserId);

      // Wait a bit before ending
      await new Promise((resolve) => setTimeout(resolve, 100));

      await sessionDBService.endSession(sessionId);

      const session = await db.sessions.get(sessionId);
      expect(session?.duration).toBeDefined();
      expect(session?.duration).toBeGreaterThan(0);
    });

    it("should throw error for non-existent session", async () => {
      await expect(
        sessionDBService.endSession("non-existent-id"),
      ).rejects.toThrow();
    });
  });

  describe("pauseSession", () => {
    it("should pause an active session", async () => {
      const sessionId = await sessionDBService.startSession(testUserId);

      await sessionDBService.pauseSession(sessionId, "Taking a break");

      const session = await db.sessions.get(sessionId);
      expect(session?.isPaused).toBe(true);
      expect(session?.pauseStartTime).toBeDefined();
      expect(session?.pauseReason).toBe("Taking a break");
    });

    it("should throw error when pausing already paused session", async () => {
      const sessionId = await sessionDBService.startSession(testUserId);
      await sessionDBService.pauseSession(sessionId);

      await expect(sessionDBService.pauseSession(sessionId)).rejects.toThrow(
        "Session is already paused",
      );
    });

    it("should throw error when pausing ended session", async () => {
      const sessionId = await sessionDBService.startSession(testUserId);
      await sessionDBService.endSession(sessionId);

      await expect(sessionDBService.pauseSession(sessionId)).rejects.toThrow(
        "Cannot pause ended session",
      );
    });
  });

  describe("resumeSession", () => {
    it("should resume a paused session", async () => {
      const sessionId = await sessionDBService.startSession(testUserId);
      await sessionDBService.pauseSession(sessionId);

      // Wait a bit before resuming
      await new Promise((resolve) => setTimeout(resolve, 100));

      await sessionDBService.resumeSession(sessionId);

      const session = await db.sessions.get(sessionId);
      expect(session?.isPaused).toBe(false);
      expect(session?.pauseStartTime).toBeUndefined();
      expect(session?.accumulatedPauseTime).toBeGreaterThan(0);
    });

    it("should throw error when resuming non-paused session", async () => {
      const sessionId = await sessionDBService.startSession(testUserId);

      await expect(sessionDBService.resumeSession(sessionId)).rejects.toThrow(
        "Session is not paused",
      );
    });

    it("should accumulate multiple pause durations", async () => {
      const sessionId = await sessionDBService.startSession(testUserId);

      // First pause
      await sessionDBService.pauseSession(sessionId);
      await new Promise((resolve) => setTimeout(resolve, 50));
      await sessionDBService.resumeSession(sessionId);

      const firstPause =
        (await db.sessions.get(sessionId))?.accumulatedPauseTime || 0;

      // Second pause
      await sessionDBService.pauseSession(sessionId);
      await new Promise((resolve) => setTimeout(resolve, 50));
      await sessionDBService.resumeSession(sessionId);

      const session = await db.sessions.get(sessionId);
      expect(session?.accumulatedPauseTime).toBeGreaterThan(firstPause);
    });
  });

  describe("getSessionHistory", () => {
    it("should return sessions sorted by most recent", async () => {
      // Create multiple sessions
      const session1Id = await sessionDBService.startSession(testUserId);
      await sessionDBService.endSession(session1Id);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const session2Id = await sessionDBService.startSession(testUserId);
      await sessionDBService.endSession(session2Id);

      const history = await sessionDBService.getSessionHistory(testUserId);
      expect(history).toHaveLength(2);
      expect(history[0].id).toBe(session2Id); // Most recent first
      expect(history[1].id).toBe(session1Id);
    });

    it("should respect limit parameter", async () => {
      // Create 5 sessions
      for (let i = 0; i < 5; i++) {
        const sessionId = await sessionDBService.startSession(testUserId);
        await sessionDBService.endSession(sessionId);
      }

      const history = await sessionDBService.getSessionHistory(testUserId, 3);
      expect(history).toHaveLength(3);
    });

    it("should respect offset parameter", async () => {
      // Create 3 sessions
      const sessionIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const sessionId = await sessionDBService.startSession(testUserId);
        sessionIds.push(sessionId);
        await sessionDBService.endSession(sessionId);
      }

      const history = await sessionDBService.getSessionHistory(
        testUserId,
        2,
        1,
      );
      expect(history).toHaveLength(2);
      expect(history[0].id).toBe(sessionIds[1]);
    });

    it("should return empty array if no sessions", async () => {
      const history = await sessionDBService.getSessionHistory(testUserId);
      expect(history).toEqual([]);
    });
  });

  describe("getActiveSessions", () => {
    it("should return all active sessions", async () => {
      // Create multiple active sessions for different users
      await sessionDBService.startSession("user-1");
      await sessionDBService.startSession("user-2");

      const activeSessions = await sessionDBService.getActiveSessions();
      expect(activeSessions).toHaveLength(2);
    });

    it("should not include ended sessions", async () => {
      const sessionId = await sessionDBService.startSession(testUserId);
      await sessionDBService.endSession(sessionId);

      const activeSessions = await sessionDBService.getActiveSessions();
      expect(activeSessions).toHaveLength(0);
    });

    it("should return empty array if no active sessions", async () => {
      const activeSessions = await sessionDBService.getActiveSessions();
      expect(activeSessions).toEqual([]);
    });
  });

  describe("Edge Cases", () => {
    it("should handle session with no goal duration", async () => {
      const sessionId = await sessionDBService.startSession(testUserId, {});

      const session = await db.sessions.get(sessionId);
      expect(session?.goalDuration).toBeUndefined();
    });

    it("should handle very long pause times", async () => {
      const sessionId = await sessionDBService.startSession(testUserId);

      // Simulate a long pause by manually setting the pause time
      await db.sessions.update(sessionId, {
        isPaused: true,
        pauseStartTime: new Date(Date.now() - 86400000), // 24 hours ago
      });

      await sessionDBService.resumeSession(sessionId);

      const session = await db.sessions.get(sessionId);
      expect(session?.accumulatedPauseTime).toBeGreaterThan(86000); // ~24 hours in seconds
    });

    it("should handle sessions across day boundaries", async () => {
      const sessionId = await sessionDBService.startSession(testUserId);

      // Manually set start time to yesterday
      await db.sessions.update(sessionId, {
        startTime: new Date(Date.now() - 86400000),
      });

      await sessionDBService.endSession(sessionId);

      const session = await db.sessions.get(sessionId);
      expect(session?.duration).toBeGreaterThan(86000); // ~24 hours in seconds
    });

    it("should handle concurrent session operations gracefully", async () => {
      // Start session and immediately try operations
      const sessionId = await sessionDBService.startSession(testUserId);

      const operations = [
        sessionDBService.pauseSession(sessionId),
        sessionDBService.getCurrentSession(testUserId),
      ];

      const [pauseResult, getCurrentResult] = await Promise.all(operations);

      expect(pauseResult).toBeDefined();
      expect(getCurrentResult).toBeDefined();
    });
  });
});
