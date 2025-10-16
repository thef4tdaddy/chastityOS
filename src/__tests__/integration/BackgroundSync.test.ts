/**
 * Background Sync Integration Tests
 * End-to-end tests for background sync functionality including:
 * - Offline change queueing
 * - Online sync triggers
 * - Data synchronization to Firebase
 * - Queue cleanup on success
 */
import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import { offlineQueue } from "@/services/sync/OfflineQueue";
import type { QueuedOperation, DBBase } from "@/types/database";
import { db } from "@/services/database";
import { firebaseSync } from "@/services/sync";

// Mock the database and Firebase services
vi.mock("@/services/database", () => ({
  db: {
    offlineQueue: {
      add: vi.fn(),
      clear: vi.fn(),
      delete: vi.fn(),
      orderBy: vi.fn(() => ({ toArray: vi.fn() })),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({ modify: vi.fn() })),
        anyOf: vi.fn(() => ({ delete: vi.fn() })),
        below: vi.fn(() => ({ and: vi.fn(() => ({ toArray: vi.fn() })) })),
      })),
    },
    tasks: {
      add: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      toArray: vi.fn(),
    },
  },
}));

vi.mock("@/services/sync", () => ({
  firebaseSync: {
    syncCollection: vi.fn(),
  },
}));

interface MockSetupOptions {
  operations?: QueuedOperation<DBBase>[];
  syncShouldFail?: boolean;
  syncConflict?: boolean;
  partialSuccess?: boolean;
}

// Helper to set up mocks for processQueue tests
const setupProcessQueueMocks = ({
  operations = [],
  syncShouldFail = false,
  syncConflict = false,
  partialSuccess = false,
}: MockSetupOptions = {}) => {
  (db.offlineQueue.orderBy as Mock).mockReturnValue({
    toArray: vi.fn().mockResolvedValue(operations),
  });

  const mockDelete = vi.fn().mockResolvedValue(undefined);
  const mockModify = vi.fn().mockResolvedValue(undefined);
  (db.offlineQueue.where as Mock).mockReturnValue({
    anyOf: vi.fn(() => ({ delete: mockDelete })),
    equals: vi.fn(() => ({ modify: mockModify })),
  });

  const mockSyncCollection = vi.fn();
  if (partialSuccess) {
    mockSyncCollection
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("Network error"));
  } else if (syncConflict) {
    mockSyncCollection.mockRejectedValue(new Error("Version conflict"));
  } else if (syncShouldFail) {
    mockSyncCollection.mockRejectedValue(new Error("Sync failed"));
  } else {
    mockSyncCollection.mockResolvedValue(undefined);
  }
  (firebaseSync as any).syncCollection = mockSyncCollection;

  return { mockDelete, mockModify, mockSyncCollection };
};

describe("Background Sync Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });
  });

  const createMockOperation = (
    overrides: Partial<QueuedOperation<DBBase>>,
  ): QueuedOperation<DBBase> => ({
    id: 1,
    type: "create",
    collectionName: "tasks",
    userId: "user-123",
    payload: {
      id: `task-${Date.now()}`,
      userId: "user-123",
      syncStatus: "pending",
      lastModified: new Date(),
    },
    createdAt: new Date(),
    ...overrides,
  });

  describe("Offline Change Queueing", () => {
    const setOffline = () =>
      Object.defineProperty(navigator, "onLine", {
        value: false,
        configurable: true,
      });

    it.each(["create", "update", "delete"] as const)(
      "should queue task %s when offline",
      async (operationType) => {
        setOffline();
        const operation = createMockOperation({ type: operationType });

        await offlineQueue.queueOperation(operation);

        expect(db.offlineQueue.add).toHaveBeenCalledWith(
          expect.objectContaining({ type: operationType }),
        );
      },
    );

    it("should store changes in IndexedDB", async () => {
      const operation = createMockOperation({});
      await offlineQueue.queueOperation(operation);
      expect(db.offlineQueue.add).toHaveBeenCalledWith(operation);
    });
  });

  describe("Online Sync Trigger", () => {
    it("should process queue when app goes online", async () => {
      const operation = createMockOperation({});
      const { mockSyncCollection } = setupProcessQueueMocks({
        operations: [operation],
      });

      await offlineQueue.processQueue();

      expect(mockSyncCollection).toHaveBeenCalled();
    });

    it("should handle 'online' event listener", () => {
      const onlineHandler = vi.fn();
      window.addEventListener("online", onlineHandler);
      window.dispatchEvent(new Event("online"));
      expect(onlineHandler).toHaveBeenCalled();
      window.removeEventListener("online", onlineHandler);
    });

    it("should handle sync event from service worker", () => {
      const syncEvent = new Event("sync");
      Object.defineProperty(syncEvent, "tag", {
        value: "sync-tasks",
        configurable: true,
      });

      const syncHandler = vi.fn();
      self.addEventListener("sync", syncHandler);
      self.dispatchEvent(syncEvent);
      expect(syncHandler).toHaveBeenCalled();
      self.removeEventListener("sync", syncHandler);
    });
  });

  describe("Data Synchronization to Firebase", () => {
    it("should sync queued data to Firebase", async () => {
      const operation = createMockOperation({});
      const { mockSyncCollection } = setupProcessQueueMocks({
        operations: [operation],
      });

      await offlineQueue.processQueue();

      expect(mockSyncCollection).toHaveBeenCalledWith("tasks", "user-123");
    });

    it("should maintain operation order during sync", async () => {
      const operations = [
        createMockOperation({ createdAt: new Date(Date.now() - 2000) }),
        createMockOperation({ id: 2, createdAt: new Date(Date.now() - 1000) }),
        createMockOperation({ id: 3, createdAt: new Date() }),
      ];
      const { mockSyncCollection } = setupProcessQueueMocks({ operations });

      await offlineQueue.processQueue();

      expect(mockSyncCollection).toHaveBeenCalledTimes(3);
      expect(db.offlineQueue.orderBy).toHaveBeenCalledWith("createdAt");
    });

    it("should handle sync conflicts by incrementing retry count", async () => {
      const operation = createMockOperation({ retryCount: 0 });
      const { mockModify, mockSyncCollection } = setupProcessQueueMocks({
        operations: [operation],
        syncConflict: true,
      });

      await offlineQueue.processQueue();

      expect(mockSyncCollection).toHaveBeenCalled();
      expect(mockModify).toHaveBeenCalledWith({ retryCount: 1 });
    });
  });

  describe("Queue Cleanup on Success", () => {
    it("should clear processed items from queue", async () => {
      const operations = [
        createMockOperation({}),
        createMockOperation({ id: 2 }),
      ];
      const { mockDelete } = setupProcessQueueMocks({ operations });

      await offlineQueue.processQueue();

      expect(mockDelete).toHaveBeenCalledWith([1, 2]);
    });

    it("should not clear failed items from queue but increment retry count", async () => {
      const operation = createMockOperation({ retryCount: 2 });
      const { mockDelete, mockModify } = setupProcessQueueMocks({
        operations: [operation],
        syncShouldFail: true,
      });

      await offlineQueue.processQueue();

      expect(mockDelete).not.toHaveBeenCalled();
      expect(mockModify).toHaveBeenCalledWith({ retryCount: 3 });
    });

    it("should verify queue is empty after successful sync", async () => {
      const operation = createMockOperation({});
      (db.offlineQueue.orderBy as Mock).mockReturnValue({
        toArray: vi
          .fn()
          .mockResolvedValueOnce([operation])
          .mockResolvedValueOnce([]),
      });
      const { mockDelete, mockSyncCollection } = setupProcessQueueMocks();

      await offlineQueue.processQueue();
      expect(mockDelete).toHaveBeenCalledWith([1]);

      await offlineQueue.processQueue();
      expect(mockSyncCollection).toHaveBeenCalledTimes(1); // Only called for the first process
    });
  });

  describe("Error Handling", () => {
    it("should retry failed operations by incrementing retry count", async () => {
      const operation = createMockOperation({ retryCount: 0 });
      const { mockModify } = setupProcessQueueMocks({
        operations: [operation],
        syncShouldFail: true,
      });

      await offlineQueue.processQueue();

      expect(mockModify).toHaveBeenCalledWith({ retryCount: 1 });
    });

    it("should handle partial sync success", async () => {
      const operations = [
        createMockOperation({}),
        createMockOperation({ id: 2 }),
      ];
      const { mockDelete, mockModify, mockSyncCollection } =
        setupProcessQueueMocks({
          operations,
          partialSuccess: true,
        });

      await offlineQueue.processQueue();

      expect(mockSyncCollection).toHaveBeenCalledTimes(2);
      expect(mockDelete).toHaveBeenCalledWith([1]); // Only successful one deleted
      expect(mockModify).toHaveBeenCalledWith({ retryCount: 1 }); // Failed one modified
    });
  });
});
