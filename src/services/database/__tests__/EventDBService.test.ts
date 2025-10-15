/**
 * EventDBService Tests
 * Ensures the service correctly handles database operations for events.
 */
import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import { eventDBService } from "@/services/database/EventDBService";
import { db } from "@/services/storage/ChastityDB";
import type { DBEvent } from "@/types/database";

// Mock the ChastityDB and other services
const mockCollection = {
  equals: vi.fn(),
  and: vi.fn(),
  reverse: vi.fn(),
  sortBy: vi.fn(),
  toArray: vi.fn(),
  first: vi.fn(),
};

vi.mock("@/services/storage/ChastityDB", () => ({
  db: {
    events: {
      add: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      where: vi.fn(() => mockCollection),
      orderBy: vi.fn(() => mockCollection),
      count: vi.fn(),
      clear: vi.fn(),
    },
  },
}));

vi.mock("@/services/database/EventDBService", async (importOriginal) => {
  const original = await importOriginal<any>();
  return {
    ...original,
    eventDBService: {
      ...original.eventDBService,
      logEvent: vi.fn(original.eventDBService.logEvent),
      getEvents: vi.fn(original.eventDBService.getEvents),
      getSessionEvents: vi.fn(original.eventDBService.getSessionEvents),
    },
  };
});

describe("EventDBService", () => {
  const testUserId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks for chainable queries
    (mockCollection.equals as Mock).mockReturnThis();
    (mockCollection.and as Mock).mockReturnThis();
    (mockCollection.reverse as Mock).mockReturnThis();
    (mockCollection.sortBy as Mock).mockResolvedValue([]);
    (mockCollection.toArray as Mock).mockResolvedValue([]);
    (mockCollection.first as Mock).mockResolvedValue(undefined);
  });

  const createMockEvent = (overrides: Partial<DBEvent>): DBEvent => ({
    id: "event-1",
    userId: testUserId,
    type: "TEST_EVENT",
    timestamp: new Date(),
    details: {},
    isPrivate: false,
    syncStatus: "synced",
    lastModified: new Date(),
    ...overrides,
  });

  describe("logEvent", () => {
    it("should log a new event with the provided details", async () => {
      await eventDBService.logEvent(
        testUserId,
        "GOAL_ACHIEVED",
        {
          title: "Test Goal Achieved",
          description: "User completed a test goal.",
          metadata: { goal: "Test Goal" },
        },
        { isPrivate: true },
      );

      expect(db.events.add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          type: "GOAL_ACHIEVED",
          details: expect.objectContaining({ title: "Test Goal Achieved" }),
          isPrivate: true,
        }),
      );
    });
  });

  describe("getEvents", () => {
    it("should return event history sorted by timestamp", async () => {
      const mockHistory = [
        createMockEvent({ type: "SESSION_END", timestamp: new Date() }),
        createMockEvent({
          type: "SESSION_START",
          timestamp: new Date(Date.now() - 1000),
        }),
      ];
      (mockCollection.sortBy as Mock).mockResolvedValue(mockHistory);

      const events = await eventDBService.getEvents(testUserId);

      expect(events).toHaveLength(2);
      expect(events[0]!.type).toBe("SESSION_END");
      expect(events[1]!.type).toBe("SESSION_START");
    });

    it("should retrieve events filtered by a specific type", async () => {
      const mockEvents = [
        createMockEvent({ type: "SESSION_START" }),
        createMockEvent({ type: "SESSION_START" }),
      ];
      (mockCollection.sortBy as Mock).mockResolvedValue(mockEvents);

      const events = await eventDBService.getEvents(testUserId, {
        type: "SESSION_START",
      });

      expect(events).toHaveLength(2);
      expect(events[0]!.type).toBe("SESSION_START");
    });
  });

  describe("getSessionEvents", () => {
    it("should retrieve all events for a given session ID", async () => {
      const sessionId = "session-abc";
      const mockEvents = [
        createMockEvent({ sessionId, type: "SESSION_START" }),
        createMockEvent({ sessionId, type: "PAUSE" }),
        createMockEvent({ sessionId, type: "SESSION_END" }),
      ];
      (mockCollection.sortBy as Mock).mockResolvedValue(mockEvents);

      const events = await eventDBService.getSessionEvents(sessionId);

      expect(events).toHaveLength(3);
      expect(events[0]!.type).toBe("SESSION_START");
      expect(events[2]!.type).toBe("SESSION_END");
    });
  });

  describe("Edge Cases", () => {
    it("should handle logging a large number of events", async () => {
      const eventPromises = Array.from({ length: 100 }, (_, i) =>
        eventDBService.logEvent(testUserId, "BULK_TEST", {
          metadata: { index: i },
        }),
      );

      await Promise.all(eventPromises);

      expect(db.events.add).toHaveBeenCalledTimes(100);
    });

    it("should return an empty array when no events are found", async () => {
      (mockCollection.sortBy as Mock).mockResolvedValue([]);
      const events = await eventDBService.getEvents(testUserId);
      expect(events).toEqual([]);
    });
  });
});
