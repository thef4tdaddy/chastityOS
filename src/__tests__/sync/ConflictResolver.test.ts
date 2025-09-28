/**
 * ConflictResolver Tests
 * Tests for conflict resolution strategies
 */
/// <reference types="vitest/globals" />
import { conflictResolver } from "@/services/sync/ConflictResolver";
import type { DBSession, DBTask, DBSettings } from "@/types/database";

describe("ConflictResolver", () => {
  describe("resolveSessionConflict", () => {
    it("should choose session with latest timestamp", () => {
      const local: DBSession = {
        id: "session1",
        userId: "user1",
        startTime: new Date("2023-01-01"),
        isPaused: false,
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
        syncStatus: "pending",
        lastModified: new Date("2023-01-02T10:00:00Z"),
      };

      const remote: DBSession = {
        id: "session1",
        userId: "user1",
        startTime: new Date("2023-01-01"),
        isPaused: true,
        accumulatedPauseTime: 300,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
        syncStatus: "synced",
        lastModified: new Date("2023-01-02T09:00:00Z"),
      };

      const result = conflictResolver.resolveSessionConflict(local, remote);

      // Local has later timestamp, should win
      expect(result).toEqual(local);
    });
  });

  describe("resolveTaskConflict", () => {
    it("should preserve higher status progression", () => {
      const local: DBTask = {
        id: "task1",
        userId: "user1",
        text: "Test task",
        status: "completed",
        priority: "medium",
        assignedBy: "keyholder",
        createdAt: new Date("2023-01-01"),
        syncStatus: "pending",
        lastModified: new Date("2023-01-02T10:00:00Z"),
      };

      const remote: DBTask = {
        id: "task1",
        userId: "user1",
        text: "Test task",
        status: "submitted",
        priority: "medium",
        assignedBy: "keyholder",
        createdAt: new Date("2023-01-01"),
        syncStatus: "synced",
        lastModified: new Date("2023-01-02T11:00:00Z"),
      };

      const result = conflictResolver.resolveTaskConflict(local, remote);

      // Local has higher status (completed > submitted), should win status
      expect(result.status).toBe("completed");
      expect(result.syncStatus).toBe("synced");
      expect(result.lastModified).toBeInstanceOf(Date);
    });
  });
});
