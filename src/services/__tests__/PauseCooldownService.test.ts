/**
 * Tests for PauseCooldownService
 * Focuses on 4-hour cooldown logic and edge cases
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PauseCooldownService } from "../PauseCooldownService";
import { db } from "../storage/dexie";

// Mock the database
vi.mock("../storage/dexie", () => ({
  db: {
    sessions: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          and: vi.fn(() => ({
            first: vi.fn(),
          })),
        })),
      })),
    },
    events: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          and: vi.fn(() => ({
            reverse: vi.fn(() => ({
              first: vi.fn(),
            })),
          })),
        })),
      })),
    },
  },
}));

describe("PauseCooldownService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("canUserPause", () => {
    it("should allow pause when no active session exists", async () => {
      const mockChain = {
        equals: vi.fn(() => ({
          and: vi.fn(() => ({
            first: vi.fn().mockResolvedValue(null),
          })),
        })),
      };
      (db.sessions.where as any).mockReturnValue(mockChain);

      const result = await PauseCooldownService.canUserPause("user123");

      expect(result.canPause).toBe(false);
    });

    it("should allow pause when no previous pause events exist", async () => {
      const mockSession = {
        id: "session123",
        userId: "user123",
        isPaused: false,
      };
      const sessionMockChain = {
        equals: vi.fn(() => ({
          and: vi.fn(() => ({
            first: vi.fn().mockResolvedValue(mockSession),
          })),
        })),
      };
      const eventMockChain = {
        equals: vi.fn(() => ({
          and: vi.fn(() => ({
            reverse: vi.fn(() => ({
              first: vi.fn().mockResolvedValue(null),
            })),
          })),
        })),
      };
      (db.sessions.where as any).mockReturnValue(sessionMockChain);
      (db.events.where as any).mockReturnValue(eventMockChain);

      const result = await PauseCooldownService.canUserPause("user123");

      expect(result.canPause).toBe(true);
      expect(result.lastPauseTime).toBeUndefined();
      expect(result.nextPauseAvailable).toBeUndefined();
      expect(result.cooldownRemaining).toBeUndefined();
    });

    it("should allow pause when cooldown period has elapsed", async () => {
      const mockSession = {
        id: "session123",
        userId: "user123",
        isPaused: false,
      };
      const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
      const mockPauseEvent = {
        id: "event123",
        timestamp: fiveHoursAgo,
        type: "session_pause",
      };

      const sessionMockChain = {
        equals: vi.fn(() => ({
          and: vi.fn(() => ({
            first: vi.fn().mockResolvedValue(mockSession),
          })),
        })),
      };
      const eventMockChain = {
        equals: vi.fn(() => ({
          and: vi.fn(() => ({
            reverse: vi.fn(() => ({
              first: vi.fn().mockResolvedValue(mockPauseEvent),
            })),
          })),
        })),
      };
      (db.sessions.where as any).mockReturnValue(sessionMockChain);
      (db.events.where as any).mockReturnValue(eventMockChain);

      const result = await PauseCooldownService.canUserPause("user123");

      expect(result.canPause).toBe(true);
    });

    it("should deny pause when cooldown period is active", async () => {
      const mockSession = {
        id: "session123",
        userId: "user123",
        isPaused: false,
      };
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const mockPauseEvent = {
        id: "event123",
        timestamp: twoHoursAgo,
        type: "session_pause",
      };

      const sessionMockChain = {
        equals: vi.fn(() => ({
          and: vi.fn(() => ({
            first: vi.fn().mockResolvedValue(mockSession),
          })),
        })),
      };
      const eventMockChain = {
        equals: vi.fn(() => ({
          and: vi.fn(() => ({
            reverse: vi.fn(() => ({
              first: vi.fn().mockResolvedValue(mockPauseEvent),
            })),
          })),
        })),
      };
      (db.sessions.where as any).mockReturnValue(sessionMockChain);
      (db.events.where as any).mockReturnValue(eventMockChain);

      const result = await PauseCooldownService.canUserPause("user123");

      expect(result.canPause).toBe(false);
      expect(result.lastPauseTime).toEqual(twoHoursAgo);
      expect(result.nextPauseAvailable).toBeDefined();
      expect(result.cooldownRemaining).toBeGreaterThan(0);
      expect(result.cooldownRemaining).toBeLessThanOrEqual(2 * 60 * 60); // Max 2 hours remaining
    });
  });

  describe("formatTimeRemaining", () => {
    it("should format time with hours, minutes, and seconds", () => {
      const result = PauseCooldownService.formatTimeRemaining(3665); // 1h 1m 5s
      expect(result).toBe("1h 1m 5s");
    });

    it("should format time with only minutes and seconds", () => {
      const result = PauseCooldownService.formatTimeRemaining(125); // 2m 5s
      expect(result).toBe("2m 5s");
    });

    it("should format time with only seconds", () => {
      const result = PauseCooldownService.formatTimeRemaining(45);
      expect(result).toBe("45s");
    });

    it("should handle zero seconds", () => {
      const result = PauseCooldownService.formatTimeRemaining(0);
      expect(result).toBe("0s");
    });
  });

  describe("getCooldownHours", () => {
    it("should return 4 hours as specified in requirements", () => {
      const result = PauseCooldownService.getCooldownHours();
      expect(result).toBe(4);
    });
  });
});
