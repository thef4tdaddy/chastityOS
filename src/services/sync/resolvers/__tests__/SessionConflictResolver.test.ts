/**
 * Session Conflict Resolver Tests
 * Unit tests for type-safe DBSession conflict resolution
 */
import { describe, it, expect, beforeEach } from "vitest";
import { SessionConflictResolver } from "../SessionConflictResolver";
import type { DBSession } from "@/types/database";

describe("SessionConflictResolver", () => {
  let resolver: SessionConflictResolver;

  beforeEach(() => {
    resolver = new SessionConflictResolver();
  });

  const createBaseSession = (overrides?: Partial<DBSession>): DBSession => ({
    id: "session-1",
    userId: "user-123",
    syncStatus: "synced",
    lastModified: new Date("2024-01-01T10:00:00Z"),
    startTime: new Date("2024-01-01T08:00:00Z"),
    endTime: new Date("2024-01-01T10:00:00Z"),
    isPaused: false,
    accumulatedPauseTime: 0,
    isHardcoreMode: false,
    keyholderApprovalRequired: false,
    ...overrides,
  });

  describe("resolve", () => {
    it("should prefer active local session over completed remote session", () => {
      const local = createBaseSession({
        endTime: undefined,
        lastModified: new Date("2024-01-01T10:00:00Z"),
      });

      const remote = createBaseSession({
        endTime: new Date("2024-01-01T12:00:00Z"),
        lastModified: new Date("2024-01-01T12:00:00Z"),
      });

      const result = resolver.resolve(local, remote);

      expect(result.endTime).toBeUndefined();
      expect(result.syncStatus).toBe("synced");
    });

    it("should prefer active remote session over completed local session", () => {
      const local = createBaseSession({
        endTime: new Date("2024-01-01T10:00:00Z"),
        lastModified: new Date("2024-01-01T10:00:00Z"),
      });

      const remote = createBaseSession({
        endTime: undefined,
        lastModified: new Date("2024-01-01T12:00:00Z"),
      });

      const result = resolver.resolve(local, remote);

      expect(result.endTime).toBeUndefined();
      expect(result.syncStatus).toBe("synced");
    });

    it("should use latest timestamp when both sessions are completed", () => {
      const local = createBaseSession({
        endTime: new Date("2024-01-01T10:00:00Z"),
        lastModified: new Date("2024-01-01T12:00:00Z"),
        notes: "Local notes",
      });

      const remote = createBaseSession({
        endTime: new Date("2024-01-01T10:00:00Z"),
        lastModified: new Date("2024-01-01T10:00:00Z"),
        notes: "Remote notes",
      });

      const result = resolver.resolve(local, remote);

      expect(result.notes).toBe("Local notes");
      expect(result.syncStatus).toBe("synced");
    });

    it("should use remote when remote is newer", () => {
      const local = createBaseSession({
        endTime: new Date("2024-01-01T10:00:00Z"),
        lastModified: new Date("2024-01-01T10:00:00Z"),
        notes: "Local notes",
      });

      const remote = createBaseSession({
        endTime: new Date("2024-01-01T10:00:00Z"),
        lastModified: new Date("2024-01-01T12:00:00Z"),
        notes: "Remote notes",
      });

      const result = resolver.resolve(local, remote);

      expect(result.notes).toBe("Remote notes");
      expect(result.syncStatus).toBe("synced");
    });

    it("should update lastModified to current time", () => {
      const local = createBaseSession({
        lastModified: new Date("2024-01-01T10:00:00Z"),
      });
      const remote = createBaseSession({
        lastModified: new Date("2024-01-01T10:00:00Z"),
      });

      const beforeResolve = new Date();
      const result = resolver.resolve(local, remote);
      const afterResolve = new Date();

      expect(result.lastModified.getTime()).toBeGreaterThanOrEqual(
        beforeResolve.getTime(),
      );
      expect(result.lastModified.getTime()).toBeLessThanOrEqual(
        afterResolve.getTime(),
      );
    });

    it("should always set syncStatus to synced", () => {
      const local = createBaseSession({
        syncStatus: "pending",
      });
      const remote = createBaseSession({
        syncStatus: "conflict",
      });

      const result = resolver.resolve(local, remote);

      expect(result.syncStatus).toBe("synced");
    });

    it("should handle null endTime as active session", () => {
      const local = createBaseSession({
        endTime: null as any,
        lastModified: new Date("2024-01-01T10:00:00Z"),
      });

      const remote = createBaseSession({
        endTime: new Date("2024-01-01T12:00:00Z"),
        lastModified: new Date("2024-01-01T12:00:00Z"),
      });

      const result = resolver.resolve(local, remote);

      expect(result.endTime).toBeNull();
    });
  });

  describe("isActiveSession", () => {
    it("should return true for session with undefined endTime", () => {
      const session = createBaseSession({
        endTime: undefined,
      });

      expect(resolver.isActiveSession(session)).toBe(true);
    });

    it("should return true for session with null endTime", () => {
      const session = createBaseSession({
        endTime: null as any,
      });

      expect(resolver.isActiveSession(session)).toBe(true);
    });

    it("should return false for session with endTime", () => {
      const session = createBaseSession({
        endTime: new Date("2024-01-01T10:00:00Z"),
      });

      expect(resolver.isActiveSession(session)).toBe(false);
    });
  });

  describe("mergeSessionMetadata", () => {
    it("should combine notes from both versions", () => {
      const local = createBaseSession({
        notes: "Local notes",
      });

      const remote = createBaseSession({
        notes: "Remote notes",
      });

      const base = createBaseSession();

      const result = resolver.mergeSessionMetadata(local, remote, base);

      expect(result.notes).toContain("Local notes");
      expect(result.notes).toContain("Remote notes");
      expect(result.notes).toContain("---");
    });

    it("should use single notes if only one exists", () => {
      const local = createBaseSession({
        notes: "Local notes",
      });

      const remote = createBaseSession({
        notes: undefined,
      });

      const base = createBaseSession();

      const result = resolver.mergeSessionMetadata(local, remote, base);

      expect(result.notes).toBe("Local notes");
    });

    it("should preserve emergency unlock flags from either version", () => {
      const local = createBaseSession({
        isEmergencyUnlock: true,
        emergencyReason: "Local reason",
      });

      const remote = createBaseSession({
        isEmergencyUnlock: false,
        emergencyNotes: "Remote notes",
      });

      const base = createBaseSession();

      const result = resolver.mergeSessionMetadata(local, remote, base);

      expect(result.isEmergencyUnlock).toBe(true);
      expect(result.emergencyReason).toBe("Local reason");
      expect(result.emergencyNotes).toBe("Remote notes");
    });

    it("should preserve hasLockCombination from either version", () => {
      const local = createBaseSession({
        hasLockCombination: false,
      });

      const remote = createBaseSession({
        hasLockCombination: true,
      });

      const base = createBaseSession();

      const result = resolver.mergeSessionMetadata(local, remote, base);

      expect(result.hasLockCombination).toBe(true);
    });
  });
});
