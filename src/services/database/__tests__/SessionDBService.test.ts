/**
 * SessionDBService Tests
 * Ensures the service correctly handles database operations for sessions.
 */
import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import { sessionDBService } from "@/services/database/SessionDBService";
import { db } from "@/services/storage/ChastityDB";
import type { DBSession } from "@/types/database";

// Mock the ChastityDB and other services
vi.mock("@/services/storage/ChastityDB", () => ({
  db: {
    sessions: {
      add: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({ and: vi.fn(() => ({ first: vi.fn() })) })),
        reverse: vi.fn(() => ({ sortBy: vi.fn() })),
        anyOf: vi.fn(() => ({ toArray: vi.fn() })),
      })),
      orderBy: vi.fn(() => ({ reverse: vi.fn(() => ({ toArray: vi.fn() })) })),
      count: vi.fn(),
      clear: vi.fn(),
      filter: vi.fn(() => ({ toArray: vi.fn() })),
    },
  },
}));

vi.mock("@/services/database/EventDBService", () => ({
  eventDBService: {
    logEvent: vi.fn(),
  },
}));

vi.mock("@/services/GoalTrackerService", () => ({
  GoalTrackerService: {
    trackSessionCompletion: vi.fn(),
  },
}));

describe("SessionDBService", () => {
  const testUserId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockSession = (overrides: Partial<DBSession>): DBSession => ({
    id: "session-1",
    userId: testUserId,
    startTime: new Date(),
    isPaused: false,
    accumulatedPauseTime: 0,
    isHardcoreMode: false,
    keyholderApprovalRequired: false,
    syncStatus: "synced",
    lastModified: new Date(),
    ...overrides,
  });

  describe("startSession", () => {
    it("should create a new session with default values", async () => {
      (
        db.sessions.where("userId").equals(testUserId).and as Mock
      ).mockReturnValue({ first: () => Promise.resolve(undefined) });
      const newSessionId = await sessionDBService.startSession(testUserId);

      expect(db.sessions.add).toHaveBeenCalledWith(
        expect.objectContaining({
          id: newSessionId,
          userId: testUserId,
          isPaused: false,
          accumulatedPauseTime: 0,
          isHardcoreMode: false,
          keyholderApprovalRequired: false,
        }),
      );
    });
  });

  describe("endSession", () => {
    it("should end an active session and set end time", async () => {
      const sessionId = "session-to-end";
      const mockSession = createMockSession({ id: sessionId });
      (db.sessions.get as Mock).mockResolvedValue(mockSession);

      await sessionDBService.endSession(sessionId, new Date(), "Test end");

      const [updatedId, updatedData] = (db.sessions.update as Mock).mock
        .calls[0]!;
      expect(updatedId).toBe(sessionId);
      expect(updatedData.endTime).toBeInstanceOf(Date);
      expect(updatedData.endReason).toBe("Test end");
    });
  });

  describe("pauseSession", () => {
    it("should pause an active session", async () => {
      const sessionId = "session-to-pause";
      const mockSession = createMockSession({ id: sessionId });
      (db.sessions.get as Mock).mockResolvedValue(mockSession);

      await sessionDBService.pauseSession(sessionId, new Date());

      const [updatedId, updatedData] = (db.sessions.update as Mock).mock
        .calls[0]!;
      expect(updatedId).toBe(sessionId);
      expect(updatedData.isPaused).toBe(true);
      expect(updatedData.pauseStartTime).toBeInstanceOf(Date);
    });
  });

  describe("resumeSession", () => {
    it("should resume a paused session and update pause time", async () => {
      const sessionId = "session-to-resume";
      const pauseStartTime = new Date(Date.now() - 600 * 1000); // 10 mins ago
      const mockSession = createMockSession({
        id: sessionId,
        isPaused: true,
        pauseStartTime,
        accumulatedPauseTime: 300, // 5 minutes
      });
      (db.sessions.get as Mock).mockResolvedValue(mockSession);

      await sessionDBService.resumeSession(sessionId, new Date());

      const [, updatedData] = (db.sessions.update as Mock).mock.calls[0]!;
      expect(updatedData.isPaused).toBe(false);
      expect(updatedData.accumulatedPauseTime).toBeGreaterThan(300);
    });
  });

  describe("getSessionHistory", () => {
    it("should return session history sorted by start time", async () => {
      const session1Id = "session-1";
      const session2Id = "session-2";
      const mockHistory = [
        createMockSession({
          id: session2Id,
          startTime: new Date(Date.now() - 86400 * 1000),
        }),
        createMockSession({
          id: session1Id,
          startTime: new Date(Date.now() - 2 * 86400 * 1000),
        }),
      ];
      (
        db.sessions.where("userId").equals(testUserId).reverse as Mock
      ).mockReturnValue({ sortBy: () => Promise.resolve(mockHistory) });

      const history = await sessionDBService.getSessionHistory(testUserId);

      expect(history).toHaveLength(2);
      expect(history[0]!.id).toBe(session2Id); // Most recent first
      expect(history[1]!.id).toBe(session1Id);
    });
  });

  describe("Edge Cases", () => {
    it("should handle ending a session that doesn\'t exist", async () => {
      (db.sessions.get as Mock).mockResolvedValue(undefined);
      await expect(
        sessionDBService.endSession("non-existent", new Date()),
      ).rejects.toThrow("Session not found");
    });

    it("should handle a session with a very long duration", async () => {
      const sessionId = "long-session";
      const startTime = new Date(Date.now() - 86400 * 1000 * 30); // 30 days ago
      const endTime = new Date();
      const mockSession = createMockSession({ id: sessionId, startTime });
      (db.sessions.get as Mock).mockResolvedValue(mockSession);

      await sessionDBService.endSession(
        sessionId,
        endTime,
        "Long session ended",
      );

      expect(db.sessions.update).toHaveBeenCalledWith(
        sessionId,
        expect.any(Object),
      );
    });

    it("should correctly handle concurrent operations", async () => {
      const sessionId = "concurrent-session";
      const mockSession = createMockSession({ id: sessionId });
      (db.sessions.get as Mock).mockResolvedValue(mockSession);
      (
        db.sessions.where("userId").equals(testUserId).and as Mock
      ).mockReturnValue({ first: () => Promise.resolve(mockSession) });

      // Simulate concurrent calls
      await Promise.all([
        sessionDBService.pauseSession(sessionId, new Date()),
        sessionDBService.getCurrentSession(testUserId),
      ]);

      // Verify state consistency (simplified check)
      expect(db.sessions.update).toHaveBeenCalled();
      expect(db.sessions.where).toHaveBeenCalled();
    });
  });
});
