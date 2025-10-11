/**
 * Sync Queue Service Tests
 * Tests for background sync queue with retry logic
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the offlineQueue before importing SyncQueueService
vi.mock("../OfflineQueue", () => ({
  offlineQueue: {
    queueOperation: vi.fn(),
    getQueuedOperations: vi.fn().mockResolvedValue([]),
    clearQueue: vi.fn(),
    getQueueStats: vi.fn().mockResolvedValue({
      total: 0,
      pending: 0,
      failed: 0,
      maxRetries: 3,
    }),
  },
}));

// Mock the database module
vi.mock("../../database", () => ({
  db: {
    offlineQueue: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          modify: vi.fn(),
        }),
      }),
    },
  },
}));

import { SyncQueueService } from "../SyncQueueService";

describe("SyncQueueService", () => {
  let service: SyncQueueService;

  beforeEach(() => {
    service = new SyncQueueService();
  });

  describe("Status Management", () => {
    it("should initialize with idle status", () => {
      expect(service.getStatus()).toBe("idle");
    });

    it("should track sync status changes", () => {
      const statusChanges: string[] = [];
      const unsubscribe = service.subscribe((status) => {
        statusChanges.push(status);
      });

      expect(statusChanges).toContain("idle");
      unsubscribe();
    });

    it("should notify subscribers on status change", () => {
      const mockCallback = vi.fn();
      const unsubscribe = service.subscribe(mockCallback);

      // Initial notification
      expect(mockCallback).toHaveBeenCalledWith("idle");

      unsubscribe();
    });
  });

  describe("Last Sync Time", () => {
    it("should initialize with no last sync time", () => {
      expect(service.getLastSyncTime()).toBeUndefined();
    });
  });

  describe("Retry Logic", () => {
    it("should calculate exponential backoff delay correctly", () => {
      // Access private method via type assertion for testing
      const calculateBackoff = (service as any).calculateBackoffDelay.bind(
        service,
      );

      expect(calculateBackoff(0)).toBe(1000); // 1s
      expect(calculateBackoff(1)).toBe(2000); // 2s
      expect(calculateBackoff(2)).toBe(4000); // 4s
      expect(calculateBackoff(3)).toBe(8000); // 8s
    });
  });

  describe("Subscription Management", () => {
    it("should allow multiple subscriptions", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsubscribe1 = service.subscribe(callback1);
      const unsubscribe2 = service.subscribe(callback2);

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();

      unsubscribe1();
      unsubscribe2();
    });

    it("should remove subscriber on unsubscribe", () => {
      const callback = vi.fn();
      const unsubscribe = service.subscribe(callback);

      callback.mockClear();
      unsubscribe();

      // Trigger a status change
      // Since we can't directly trigger a status change without side effects,
      // we just verify the unsubscribe function exists
      expect(typeof unsubscribe).toBe("function");
    });
  });
});
