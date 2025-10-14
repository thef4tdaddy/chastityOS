/**
 * Event Helper Tests
 *  for event combination and sorting utilities
 */

import { describe, it, expect } from "vitest";
import { combineAndSortEvents } from "../eventHelpers";

// Define a base type for events used in tests
type TestEvent = {
  id: string;
  type: string;
  timestamp: Date | number;
  [key: string]: unknown; // Allow other properties
};

describe("eventHelpers", () => {
  describe("combineAndSortEvents", () => {
    const ownerInfo = {
      userName: "Alice",
      userId: "user-123",
      submissiveName: "Bob",
      submissiveId: "user-456",
    };

    it("should combine events from two users", () => {
      const userEvents: TestEvent[] = [
        {
          id: "event-1",
          type: "SESSION_START",
          timestamp: new Date("2024-01-01T10:00:00Z"),
        },
      ];

      const submissiveEvents: TestEvent[] = [
        {
          id: "event-2",
          type: "TASK_COMPLETED",
          timestamp: new Date("2024-01-01T11:00:00Z"),
        },
      ];

      const combined = combineAndSortEvents(
        userEvents,
        submissiveEvents,
        ownerInfo,
      );

      expect(combined).toHaveLength(2);
      expect(combined[0]!).toHaveProperty("ownerName");
      expect(combined[1]!).toHaveProperty("ownerName");
    });

    it("should sort events by timestamp in descending order", () => {
      const userEvents: TestEvent[] = [
        {
          id: "event-1",
          type: "SESSION_START",
          timestamp: new Date("2024-01-01T10:00:00Z"),
        },
        {
          id: "event-3",
          type: "SESSION_END",
          timestamp: new Date("2024-01-01T12:00:00Z"),
        },
      ];

      const submissiveEvents: TestEvent[] = [
        {
          id: "event-2",
          type: "TASK_COMPLETED",
          timestamp: new Date("2024-01-01T11:00:00Z"),
        },
      ];

      const combined = combineAndSortEvents(
        userEvents,
        submissiveEvents,
        ownerInfo,
      );

      // Most recent first
      expect(combined[0]!.id).toBe("event-3");
      expect(combined[1]!.id).toBe("event-2");
      expect(combined[2]!.id).toBe("event-1");
    });

    it("should add ownerName to user events", () => {
      const userEvents: TestEvent[] = [
        {
          id: "event-1",
          type: "SESSION_START",
          timestamp: new Date("2024-01-01T10:00:00Z"),
        },
      ];

      const combined = combineAndSortEvents(userEvents, [], ownerInfo);

      expect(combined[0]!.ownerName).toBe("Alice");
      expect(combined[0]!.ownerId).toBe("user-123");
    });

    it("should add submissiveName to submissive events", () => {
      const submissiveEvents: TestEvent[] = [
        {
          id: "event-1",
          type: "TASK_COMPLETED",
          timestamp: new Date("2024-01-01T10:00:00Z"),
        },
      ];

      const combined = combineAndSortEvents([], submissiveEvents, ownerInfo);

      expect(combined[0]!.ownerName).toBe("Bob");
      expect(combined[0]!.ownerId).toBe("user-456");
    });

    it("should handle empty user events array", () => {
      const submissiveEvents: TestEvent[] = [
        {
          id: "event-1",
          type: "TASK_COMPLETED",
          timestamp: new Date("2024-01-01T10:00:00Z"),
        },
      ];

      const combined = combineAndSortEvents([], submissiveEvents, ownerInfo);

      expect(combined).toHaveLength(1);
      expect(combined[0]!.id).toBe("event-1");
    });

    it("should handle empty submissive events array", () => {
      const userEvents: TestEvent[] = [
        {
          id: "event-1",
          type: "SESSION_START",
          timestamp: new Date("2024-01-01T10:00:00Z"),
        },
      ];

      const combined = combineAndSortEvents(userEvents, [], ownerInfo);

      expect(combined).toHaveLength(1);
      expect(combined[0]!.id).toBe("event-1");
    });

    it("should handle both empty arrays", () => {
      const combined = combineAndSortEvents([], [], ownerInfo);

      expect(combined).toHaveLength(0);
    });

    it("should handle events with numeric timestamps", () => {
      const userEvents: TestEvent[] = [
        {
          id: "event-1",
          type: "SESSION_START",
          timestamp: 1704103200000, // 2024-01-01T10:00:00Z
        },
      ];

      const submissiveEvents: TestEvent[] = [
        {
          id: "event-2",
          type: "TASK_COMPLETED",
          timestamp: 1704106800000, // 2024-01-01T11:00:00Z
        },
      ];

      const combined = combineAndSortEvents(
        userEvents,
        submissiveEvents,
        ownerInfo,
      );

      expect(combined).toHaveLength(2);
      expect(combined[0]!.id).toBe("event-2"); // More recent
      expect(combined[1]!.id).toBe("event-1");
    });

    it("should handle events with mixed Date and numeric timestamps", () => {
      const userEvents: TestEvent[] = [
        {
          id: "event-1",
          type: "SESSION_START",
          timestamp: new Date("2024-01-01T10:00:00Z"),
        },
      ];

      const submissiveEvents: TestEvent[] = [
        {
          id: "event-2",
          type: "TASK_COMPLETED",
          timestamp: 1704106800000, // 2024-01-01T11:00:00Z
        },
      ];

      const combined = combineAndSortEvents(
        userEvents,
        submissiveEvents,
        ownerInfo,
      );

      expect(combined).toHaveLength(2);
      expect(combined[0]!.id).toBe("event-2"); // More recent
    });

    it("should preserve all event properties", () => {
      const userEvents: TestEvent[] = [
        {
          id: "event-1",
          type: "SESSION_START",
          timestamp: new Date("2024-01-01T10:00:00Z"),
          details: { duration: 3600 },
          notes: "Test note",
          customField: "custom value",
        },
      ];

      const combined = combineAndSortEvents(userEvents, [], ownerInfo);

      expect(combined[0]!).toMatchObject({
        id: "event-1",
        type: "SESSION_START",
        details: { duration: 3600 },
        notes: "Test note",
        customField: "custom value",
        ownerName: "Alice",
        ownerId: "user-123",
      });
    });

    it("should handle events with identical timestamps", () => {
      const timestamp = new Date("2024-01-01T10:00:00Z");
      const userEvents: TestEvent[] = [
        {
          id: "event-1",
          type: "SESSION_START",
          timestamp,
        },
      ];

      const submissiveEvents: TestEvent[] = [
        {
          id: "event-2",
          type: "TASK_COMPLETED",
          timestamp,
        },
      ];

      const combined = combineAndSortEvents(
        userEvents,
        submissiveEvents,
        ownerInfo,
      );

      expect(combined).toHaveLength(2);
      // Both events should be present, order doesn't matter when timestamps are equal
      expect(combined.map((e) => e.id)).toContain("event-1");
      expect(combined.map((e) => e.id)).toContain("event-2");
    });

    it("should handle large number of events efficiently", () => {
      const userEvents: TestEvent[] = Array.from({ length: 100 }, (_, i) => ({
        id: `user-event-${i}`,
        type: "SESSION_START",
        timestamp: new Date(
          `2024-01-01T${String(i % 24).padStart(2, "0")}:00:00Z`,
        ),
      }));

      const submissiveEvents: TestEvent[] = Array.from(
        { length: 100 },
        (_, i) => ({
          id: `sub-event-${i}`,
          type: "TASK_COMPLETED",
          timestamp: new Date(
            `2024-01-02T${String(i % 24).padStart(2, "0")}:00:00Z`,
          ),
        }),
      );

      const combined = combineAndSortEvents(
        userEvents,
        submissiveEvents,
        ownerInfo,
      );

      expect(combined).toHaveLength(200);
      // Verify sorting: first event should be from submissive (more recent dates)
      expect(combined[0]!.id).toMatch(/^sub-event-/);
    });

    it("should handle owner info without optional IDs", () => {
      const minimalOwnerInfo = {
        userName: "Alice",
        submissiveName: "Bob",
      };

      const userEvents: TestEvent[] = [
        {
          id: "event-1",
          type: "SESSION_START",
          timestamp: new Date("2024-01-01T10:00:00Z"),
        },
      ];

      const combined = combineAndSortEvents(userEvents, [], minimalOwnerInfo);

      expect(combined[0]!.ownerName).toBe("Alice");
      expect(combined[0]!.ownerId).toBeUndefined();
    });
  });
});
