/**
 * EventDBService Tests
 * Unit tests for event database operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { eventDBService } from "../EventDBService";
import { db } from "../../storage/ChastityDB";
import type { DBEvent } from "@/types/database";

// Mock the logger
vi.mock("../../../utils/logging", () => ({
  serviceLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

// Mock UUID generation for unique IDs
let idCounter = 0;
vi.mock("../../../utils", () => ({
  generateUUID: vi.fn(() => `test-event-${++idCounter}`),
}));

describe("EventDBService", () => {
  const mockUserId = "test-user-123";
  const mockSessionId = "test-session-456";
  const mockEvent: Omit<DBEvent, "id" | "lastModified" | "syncStatus"> = {
    userId: mockUserId,
    type: "SESSION_START",
    timestamp: new Date("2024-01-01T10:00:00Z"),
    details: {
      action: "start",
      title: "Session Started",
      description: "User started a new chastity session",
    },
    sessionId: mockSessionId,
    isPrivate: false,
  };

  beforeEach(async () => {
    // Clear the database before each test
    await db.events.clear();
    // Reset ID counter
    idCounter = 0;
  });

  afterEach(async () => {
    // Clean up after each test
    await db.events.clear();
  });

  describe("logEvent", () => {
    it("should create a new event with generated ID", async () => {
      const eventId = await eventDBService.logEvent(
        mockUserId,
        "SESSION_START",
        {
          action: "start",
          title: "Session Started",
        },
      );

      expect(eventId).toBe("test-event-1");
      expect(typeof eventId).toBe("string");

      const event = await db.events.get(eventId);
      expect(event).toBeDefined();
      expect(event?.userId).toBe(mockUserId);
      expect(event?.type).toBe("SESSION_START");
      expect(event?.details.action).toBe("start");
      expect(event?.isPrivate).toBe(false);
    });

    it("should set custom timestamp when provided", async () => {
      const customTimestamp = new Date("2024-06-15T14:30:00Z");

      const eventId = await eventDBService.logEvent(
        mockUserId,
        "TASK_COMPLETED",
        {},
        {
          timestamp: customTimestamp,
        },
      );

      const event = await db.events.get(eventId);
      expect(event?.timestamp).toEqual(customTimestamp);
    });

    it("should set isPrivate flag when provided", async () => {
      const eventId = await eventDBService.logEvent(
        mockUserId,
        "PERSONAL_GOAL_SET",
        { goal: "Test Goal" },
        { isPrivate: true },
      );

      const event = await db.events.get(eventId);
      expect(event?.isPrivate).toBe(true);
    });

    it("should include sessionId when provided", async () => {
      const eventId = await eventDBService.logEvent(
        mockUserId,
        "SESSION_START",
        {},
        { sessionId: mockSessionId },
      );

      const event = await db.events.get(eventId);
      expect(event?.sessionId).toBe(mockSessionId);
    });

    it("should set default timestamp if not provided", async () => {
      const beforeTime = new Date();

      const eventId = await eventDBService.logEvent(
        mockUserId,
        "SESSION_START",
        {},
      );

      const afterTime = new Date();
      const event = await db.events.get(eventId);

      expect(event?.timestamp).toBeInstanceOf(Date);
      expect(event!.timestamp.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      );
      expect(event!.timestamp.getTime()).toBeLessThanOrEqual(
        afterTime.getTime(),
      );
    });
  });

  describe("getEvents", () => {
    it("should retrieve events for a user", async () => {
      // Create test events
      await eventDBService.logEvent(
        mockUserId,
        "SESSION_START",
        {
          title: "Event 1",
        },
        { timestamp: new Date("2024-01-01T10:00:00Z") },
      );

      await eventDBService.logEvent(
        mockUserId,
        "SESSION_END",
        {
          title: "Event 2",
        },
        { timestamp: new Date("2024-01-01T12:00:00Z") },
      );

      const events = await eventDBService.getEvents(mockUserId);

      expect(events).toHaveLength(2);
      expect(events[0].type).toBe("SESSION_END"); // Most recent first
      expect(events[1].type).toBe("SESSION_START");
    });

    it("should filter events by type", async () => {
      // Create events of different types
      await eventDBService.logEvent(
        mockUserId,
        "SESSION_START",
        {},
        { timestamp: new Date("2024-01-01T10:00:00Z") },
      );
      await eventDBService.logEvent(
        mockUserId,
        "SESSION_END",
        {},
        { timestamp: new Date("2024-01-01T11:00:00Z") },
      );
      await eventDBService.logEvent(
        mockUserId,
        "TASK_COMPLETED",
        {},
        { timestamp: new Date("2024-01-01T12:00:00Z") },
      );

      const events = await eventDBService.getEvents(mockUserId, {
        type: "SESSION_START",
      });

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("SESSION_START");
    });

    it("should filter events by sessionId", async () => {
      const session1 = "session-1";
      const session2 = "session-2";

      await eventDBService.logEvent(
        mockUserId,
        "SESSION_START",
        {},
        { sessionId: session1 },
      );
      await eventDBService.logEvent(
        mockUserId,
        "SESSION_END",
        {},
        { sessionId: session1 },
      );
      await eventDBService.logEvent(
        mockUserId,
        "SESSION_START",
        {},
        { sessionId: session2 },
      );

      const events = await eventDBService.getEvents(mockUserId, {
        sessionId: session1,
      });

      expect(events).toHaveLength(2);
      expect(events.every((e) => e.sessionId === session1)).toBe(true);
    });

    it("should filter events by date range", async () => {
      await eventDBService.logEvent(
        mockUserId,
        "SESSION_START",
        {},
        { timestamp: new Date("2024-01-01T10:00:00Z") },
      );
      await eventDBService.logEvent(
        mockUserId,
        "SESSION_END",
        {},
        { timestamp: new Date("2024-01-15T10:00:00Z") },
      );
      await eventDBService.logEvent(
        mockUserId,
        "TASK_COMPLETED",
        {},
        { timestamp: new Date("2024-02-01T10:00:00Z") },
      );

      const dateRange = {
        start: new Date("2024-01-01T00:00:00Z"),
        end: new Date("2024-01-31T23:59:59Z"),
      };

      const events = await eventDBService.getEvents(mockUserId, { dateRange });

      expect(events).toHaveLength(2);
      expect(
        events.every(
          (e) => e.timestamp >= dateRange.start && e.timestamp <= dateRange.end,
        ),
      ).toBe(true);
    });

    it("should filter events by isPrivate flag", async () => {
      await eventDBService.logEvent(
        mockUserId,
        "SESSION_START",
        {},
        { isPrivate: false },
      );
      await eventDBService.logEvent(
        mockUserId,
        "SESSION_END",
        {},
        { isPrivate: true },
      );
      await eventDBService.logEvent(
        mockUserId,
        "TASK_COMPLETED",
        {},
        { isPrivate: true },
      );

      const privateEvents = await eventDBService.getEvents(mockUserId, {
        isPrivate: true,
      });
      const publicEvents = await eventDBService.getEvents(mockUserId, {
        isPrivate: false,
      });

      expect(privateEvents).toHaveLength(2);
      expect(publicEvents).toHaveLength(1);
    });

    it("should apply limit and offset for pagination", async () => {
      // Create 25 events
      for (let i = 0; i < 25; i++) {
        await eventDBService.logEvent(
          mockUserId,
          "SESSION_START",
          { index: i },
          { timestamp: new Date(2024, 0, 1, 10, i) },
        );
      }

      const page1 = await eventDBService.getEvents(mockUserId, {}, 10, 0);
      const page2 = await eventDBService.getEvents(mockUserId, {}, 10, 10);
      const page3 = await eventDBService.getEvents(mockUserId, {}, 10, 20);

      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(10);
      expect(page3).toHaveLength(5);
    });

    it("should return empty array for non-existent user", async () => {
      await eventDBService.logEvent(mockUserId, "SESSION_START", {});

      const events = await eventDBService.getEvents("different-user");

      expect(events).toHaveLength(0);
    });
  });

  describe("getSessionEvents", () => {
    it("should retrieve all events for a specific session", async () => {
      const session1 = "session-1";
      const session2 = "session-2";

      // Create events for different sessions
      await eventDBService.logEvent(
        mockUserId,
        "SESSION_START",
        {},
        { sessionId: session1, timestamp: new Date("2024-01-01T10:00:00Z") },
      );
      await eventDBService.logEvent(
        mockUserId,
        "TASK_COMPLETED",
        {},
        { sessionId: session1, timestamp: new Date("2024-01-01T11:00:00Z") },
      );
      await eventDBService.logEvent(
        mockUserId,
        "SESSION_END",
        {},
        { sessionId: session1, timestamp: new Date("2024-01-01T12:00:00Z") },
      );
      await eventDBService.logEvent(
        mockUserId,
        "SESSION_START",
        {},
        { sessionId: session2, timestamp: new Date("2024-01-01T13:00:00Z") },
      );

      const events = await eventDBService.getSessionEvents(session1);

      expect(events).toHaveLength(3);
      expect(events.every((e) => e.sessionId === session1)).toBe(true);
      // Should be sorted by timestamp
      expect(events[0].type).toBe("SESSION_START");
      expect(events[2].type).toBe("SESSION_END");
    });

    it("should return empty array when session has no events", async () => {
      const events = await eventDBService.getSessionEvents(
        "non-existent-session",
      );

      expect(events).toEqual([]);
    });
  });

  describe("createEvent", () => {
    it("should create a new event with generated ID", async () => {
      const eventId = await eventDBService.createEvent(mockEvent);

      expect(eventId).toMatch(/^test-event-\d+$/);

      const event = await db.events.get(eventId);
      expect(event).toBeDefined();
      expect(event?.userId).toBe(mockUserId);
      expect(event?.type).toBe("SESSION_START");
    });
  });

  describe("updateEvent", () => {
    it("should update an existing event", async () => {
      const eventId = await eventDBService.createEvent(mockEvent);

      const updates = {
        details: {
          action: "updated",
          title: "Updated Title",
        },
      };

      await eventDBService.updateEvent(eventId, updates);

      const event = await db.events.get(eventId);
      expect(event?.details.action).toBe("updated");
      expect(event?.details.title).toBe("Updated Title");
    });

    it("should update lastModified timestamp", async () => {
      const eventId = await eventDBService.createEvent(mockEvent);
      const originalEvent = await db.events.get(eventId);

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      await eventDBService.updateEvent(eventId, {
        details: { action: "updated" },
      });

      const updatedEvent = await db.events.get(eventId);
      expect(updatedEvent!.lastModified.getTime()).toBeGreaterThan(
        originalEvent!.lastModified.getTime(),
      );
    });
  });

  describe("deleteEvent", () => {
    it("should delete an event", async () => {
      const eventId = await eventDBService.createEvent(mockEvent);

      let event = await db.events.get(eventId);
      expect(event).toBeDefined();

      await eventDBService.deleteEvent(eventId);

      event = await db.events.get(eventId);
      expect(event).toBeUndefined();
    });

    it("should not throw when deleting non-existent event", async () => {
      // Dexie doesn't throw on delete of non-existent items
      await expect(
        eventDBService.deleteEvent("non-existent-id"),
      ).resolves.not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle events with minimal details", async () => {
      const eventId = await eventDBService.logEvent(
        mockUserId,
        "SESSION_START",
        {},
      );

      const event = await db.events.get(eventId);
      expect(event?.details).toEqual({});
    });

    it("should handle events with complex nested details", async () => {
      const complexDetails = {
        action: "complex",
        metadata: {
          nested: {
            deeply: {
              value: "test",
            },
          },
          array: [1, 2, 3],
        },
        tags: ["tag1", "tag2"],
      };

      const eventId = await eventDBService.logEvent(
        mockUserId,
        "TASK_COMPLETED",
        complexDetails,
      );

      const event = await db.events.get(eventId);
      expect(event?.details).toEqual(complexDetails);
    });

    it("should handle empty userId gracefully", async () => {
      const eventId = await eventDBService.logEvent("", "SESSION_START", {});

      const event = await db.events.get(eventId);
      expect(event?.userId).toBe("");
    });

    it("should handle multiple events with same timestamp", async () => {
      const timestamp = new Date("2024-01-01T10:00:00Z");

      await eventDBService.logEvent(
        mockUserId,
        "SESSION_START",
        {},
        { timestamp },
      );
      await eventDBService.logEvent(
        mockUserId,
        "TASK_COMPLETED",
        {},
        { timestamp },
      );
      await eventDBService.logEvent(
        mockUserId,
        "SESSION_END",
        {},
        { timestamp },
      );

      const events = await eventDBService.getEvents(mockUserId);

      expect(events).toHaveLength(3);
      expect(
        events.every((e) => e.timestamp.getTime() === timestamp.getTime()),
      ).toBe(true);
    });

    it("should handle special characters in details", async () => {
      const details = {
        title: "Test \"quotes\" and 'apostrophes'",
        description: "Line 1\nLine 2\nLine 3",
        notes: "Special: <>&\"'",
      };

      const eventId = await eventDBService.logEvent(
        mockUserId,
        "SESSION_START",
        details,
      );

      const event = await db.events.get(eventId);
      expect(event?.details).toEqual(details);
    });

    it("should handle very long detail strings", async () => {
      const longString = "a".repeat(10000);
      const details = {
        description: longString,
      };

      const eventId = await eventDBService.logEvent(
        mockUserId,
        "SESSION_START",
        details,
      );

      const event = await db.events.get(eventId);
      expect(event?.details.description).toBe(longString);
    });

    it("should maintain syncStatus as pending for new events", async () => {
      const eventId = await eventDBService.logEvent(
        mockUserId,
        "SESSION_START",
        {},
      );

      const event = await db.events.get(eventId);
      expect(event?.syncStatus).toBe("pending");
    });

    it("should set lastModified timestamp on creation", async () => {
      const beforeTime = new Date();

      const eventId = await eventDBService.logEvent(
        mockUserId,
        "SESSION_START",
        {},
      );

      const afterTime = new Date();
      const event = await db.events.get(eventId);

      expect(event?.lastModified).toBeInstanceOf(Date);
      expect(event!.lastModified.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      );
      expect(event!.lastModified.getTime()).toBeLessThanOrEqual(
        afterTime.getTime(),
      );
    });
  });
});
