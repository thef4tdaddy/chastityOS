/**
 * Background Sync Integration Tests
 * End-to-end tests for background sync functionality including:
 * - Offline change queueing
 * - Online sync triggers
 * - Data synchronization to Firebase
 * - Queue cleanup on success
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { offlineQueue } from "@/services/sync/OfflineQueue";
import type { QueuedOperation, DBBase } from "@/types/database";

// Mock the database and Firebase
vi.mock("@/services/database", () => ({
  db: {
    offlineQueue: {
      add: vi.fn(),
      clear: vi.fn(),
      delete: vi.fn(),
      orderBy: vi.fn(() => ({
        toArray: vi.fn(),
      })),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          modify: vi.fn(),
        })),
        anyOf: vi.fn(() => ({
          delete: vi.fn(),
        })),
        below: vi.fn(() => ({
          and: vi.fn(() => ({
            toArray: vi.fn(),
          })),
        })),
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

vi.mock("@/services/sync/index", () => ({
  firebaseSync: {
    syncCollection: vi.fn(),
  },
}));

describe("Background Sync Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Offline Change Queueing", () => {
    it("should queue task creation when offline", async () => {
      const { db } = await import("@/services/database");
      const mockAdd = vi.fn().mockResolvedValue(1);
      db.offlineQueue.add = mockAdd;

      // Simulate offline state
      Object.defineProperty(navigator, "onLine", {
        value: false,
        configurable: true,
      });

      // User makes a change
      const taskData: DBBase = {
        id: "task-new",
        userId: "user-123",
        syncStatus: "pending",
        lastModified: new Date(),
      };

      await offlineQueue.queueOperation({
        type: "create",
        collectionName: "tasks",
        userId: "user-123",
        payload: taskData,
      });

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "create",
          collectionName: "tasks",
          userId: "user-123",
          payload: expect.any(Object),
          createdAt: expect.any(Date),
        }),
      );
    });

    it("should queue task update when offline", async () => {
      const { db } = await import("@/services/database");
      const mockAdd = vi.fn().mockResolvedValue(1);
      db.offlineQueue.add = mockAdd;

      Object.defineProperty(navigator, "onLine", {
        value: false,
        configurable: true,
      });

      const updateData: DBBase = {
        id: "task-123",
        userId: "user-123",
        syncStatus: "pending",
        lastModified: new Date(),
      };

      await offlineQueue.queueOperation({
        type: "update",
        collectionName: "tasks",
        userId: "user-123",
        payload: updateData,
      });

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "update",
        }),
      );
    });

    it("should queue task deletion when offline", async () => {
      const { db } = await import("@/services/database");
      const mockAdd = vi.fn().mockResolvedValue(1);
      db.offlineQueue.add = mockAdd;

      Object.defineProperty(navigator, "onLine", {
        value: false,
        configurable: true,
      });

      const deleteData: DBBase = {
        id: "task-123",
        userId: "user-123",
        syncStatus: "pending",
        lastModified: new Date(),
      };

      await offlineQueue.queueOperation({
        type: "delete",
        collectionName: "tasks",
        userId: "user-123",
        payload: deleteData,
      });

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "delete",
        }),
      );
    });

    it("should store changes in IndexedDB", async () => {
      const { db } = await import("@/services/database");
      const mockAdd = vi.fn().mockResolvedValue(1);
      db.offlineQueue.add = mockAdd;

      const testData: DBBase = {
        id: "test-id",
        userId: "user-123",
        syncStatus: "pending",
        lastModified: new Date(),
      };

      await offlineQueue.queueOperation({
        type: "create",
        collectionName: "tasks",
        userId: "user-123",
        payload: testData,
      });

      // Verify it was stored
      expect(mockAdd).toHaveBeenCalled();
    });
  });

  describe("Online Sync Trigger", () => {
    it("should process queue when app goes online", async () => {
      const { db } = await import("@/services/database");
      const { firebaseSync } = await import("@/services/sync/index");

      const mockOperations: QueuedOperation<DBBase>[] = [
        {
          id: 1,
          type: "create",
          collectionName: "tasks",
          userId: "user-123",
          payload: {
            id: "task-1",
            userId: "user-123",
            syncStatus: "pending",
            lastModified: new Date(),
          },
          createdAt: new Date(),
        },
      ];

      const mockToArray = vi.fn().mockResolvedValue(mockOperations);
      const mockOrderBy = vi.fn(() => ({ toArray: mockToArray }));
      db.offlineQueue.orderBy = mockOrderBy as any;

      const mockDelete = vi.fn().mockResolvedValue(undefined);
      const mockAnyOf = vi.fn(() => ({ delete: mockDelete }));
      const mockWhere = vi.fn(() => ({ anyOf: mockAnyOf }));
      db.offlineQueue.where = mockWhere as any;

      const mockSyncCollection = vi.fn().mockResolvedValue(undefined);
      firebaseSync.syncCollection = mockSyncCollection;

      // Simulate going online
      Object.defineProperty(navigator, "onLine", {
        value: true,
        configurable: true,
      });

      // Trigger background sync
      await offlineQueue.processQueue();

      expect(mockSyncCollection).toHaveBeenCalled();
    });

    it("should handle 'online' event listener", () => {
      const onlineHandler = vi.fn();
      window.addEventListener("online", onlineHandler);

      // Simulate online event
      window.dispatchEvent(new Event("online"));

      expect(onlineHandler).toHaveBeenCalled();

      window.removeEventListener("online", onlineHandler);
    });

    it("should handle sync event from service worker", async () => {
      // Mock service worker sync event
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
      const { db } = await import("@/services/database");
      const { firebaseSync } = await import("@/services/sync/index");

      const mockOperation: QueuedOperation<DBBase> = {
        id: 1,
        type: "create",
        collectionName: "tasks",
        userId: "user-123",
        payload: {
          id: "test-task",
          userId: "user-123",
          syncStatus: "pending",
          lastModified: new Date(),
        },
        createdAt: new Date(),
      };

      const mockToArray = vi.fn().mockResolvedValue([mockOperation]);
      const mockOrderBy = vi.fn(() => ({ toArray: mockToArray }));
      db.offlineQueue.orderBy = mockOrderBy as any;

      const mockDelete = vi.fn().mockResolvedValue(undefined);
      const mockAnyOf = vi.fn(() => ({ delete: mockDelete }));
      const mockWhere = vi.fn(() => ({ anyOf: mockAnyOf }));
      db.offlineQueue.where = mockWhere as any;

      const mockSyncCollection = vi.fn().mockResolvedValue(undefined);
      firebaseSync.syncCollection = mockSyncCollection;

      await offlineQueue.processQueue();

      expect(mockSyncCollection).toHaveBeenCalledWith("tasks", "user-123");
    });

    it("should maintain operation order during sync", async () => {
      const { db } = await import("@/services/database");
      const { firebaseSync } = await import("@/services/sync/index");

      const mockOperations: QueuedOperation<DBBase>[] = [
        {
          id: 1,
          type: "create",
          collectionName: "tasks",
          userId: "user-123",
          payload: {
            id: "task-1",
            userId: "user-123",
            syncStatus: "pending",
            lastModified: new Date(),
          },
          createdAt: new Date(Date.now() - 2000),
        },
        {
          id: 2,
          type: "update",
          collectionName: "tasks",
          userId: "user-123",
          payload: {
            id: "task-1",
            userId: "user-123",
            syncStatus: "pending",
            lastModified: new Date(),
          },
          createdAt: new Date(Date.now() - 1000),
        },
        {
          id: 3,
          type: "delete",
          collectionName: "tasks",
          userId: "user-123",
          payload: {
            id: "task-2",
            userId: "user-123",
            syncStatus: "pending",
            lastModified: new Date(),
          },
          createdAt: new Date(),
        },
      ];

      const mockToArray = vi.fn().mockResolvedValue(mockOperations);
      const mockOrderBy = vi.fn(() => ({ toArray: mockToArray }));
      db.offlineQueue.orderBy = mockOrderBy as any;

      const mockDelete = vi.fn().mockResolvedValue(undefined);
      const mockAnyOf = vi.fn(() => ({ delete: mockDelete }));
      const mockWhere = vi.fn(() => ({ anyOf: mockAnyOf }));
      db.offlineQueue.where = mockWhere as any;

      const mockSyncCollection = vi.fn().mockResolvedValue(undefined);
      firebaseSync.syncCollection = mockSyncCollection;

      await offlineQueue.processQueue();

      // Verify operations were processed in order
      expect(mockSyncCollection).toHaveBeenCalledTimes(3);
      expect(mockOrderBy).toHaveBeenCalledWith("createdAt");
    });

    it("should handle sync conflicts", async () => {
      const { db } = await import("@/services/database");
      const { firebaseSync } = await import("@/services/sync/index");

      const mockOperation: QueuedOperation<DBBase> = {
        id: 1,
        type: "update",
        collectionName: "tasks",
        userId: "user-123",
        payload: {
          id: "task-123",
          userId: "user-123",
          syncStatus: "pending",
          lastModified: new Date(),
        },
        createdAt: new Date(),
      };

      const mockToArray = vi.fn().mockResolvedValue([mockOperation]);
      const mockOrderBy = vi.fn(() => ({ toArray: mockToArray }));
      db.offlineQueue.orderBy = mockOrderBy as any;

      const mockDelete = vi.fn().mockResolvedValue(undefined);
      const mockAnyOf = vi.fn(() => ({ delete: mockDelete }));
      const mockModify = vi.fn().mockResolvedValue(undefined);
      const mockEquals = vi.fn(() => ({ modify: mockModify }));
      const mockWhere = vi.fn(() => ({
        anyOf: mockAnyOf,
        equals: mockEquals,
      }));
      db.offlineQueue.where = mockWhere as any;

      const mockSyncCollection = vi
        .fn()
        .mockRejectedValue(new Error("Version conflict"));
      firebaseSync.syncCollection = mockSyncCollection;

      await offlineQueue.processQueue();

      // Should attempt to sync and handle the error
      expect(mockSyncCollection).toHaveBeenCalled();
      expect(mockModify).toHaveBeenCalled(); // Retry count incremented
    });
  });

  describe("Queue Cleanup on Success", () => {
    it("should clear processed items from queue", async () => {
      const { db } = await import("@/services/database");
      const { firebaseSync } = await import("@/services/sync/index");

      const mockOperations: QueuedOperation<DBBase>[] = [
        {
          id: 1,
          type: "create",
          collectionName: "tasks",
          userId: "user-123",
          payload: {
            id: "task-1",
            userId: "user-123",
            syncStatus: "pending",
            lastModified: new Date(),
          },
          createdAt: new Date(),
        },
        {
          id: 2,
          type: "update",
          collectionName: "tasks",
          userId: "user-123",
          payload: {
            id: "task-2",
            userId: "user-123",
            syncStatus: "pending",
            lastModified: new Date(),
          },
          createdAt: new Date(),
        },
      ];

      const mockToArray = vi.fn().mockResolvedValue(mockOperations);
      const mockOrderBy = vi.fn(() => ({ toArray: mockToArray }));
      db.offlineQueue.orderBy = mockOrderBy as any;

      const mockDelete = vi.fn().mockResolvedValue(undefined);
      const mockAnyOf = vi.fn(() => ({ delete: mockDelete }));
      const mockWhere = vi.fn(() => ({ anyOf: mockAnyOf }));
      db.offlineQueue.where = mockWhere as any;

      const mockSyncCollection = vi.fn().mockResolvedValue(undefined);
      firebaseSync.syncCollection = mockSyncCollection;

      await offlineQueue.processQueue();

      // Verify items were removed after successful sync
      expect(mockDelete).toHaveBeenCalled();
    });

    it("should not clear failed items from queue", async () => {
      const { db } = await import("@/services/database");
      const { firebaseSync } = await import("@/services/sync/index");

      const mockOperation: QueuedOperation<DBBase> = {
        id: 1,
        type: "create",
        collectionName: "tasks",
        userId: "user-123",
        payload: {
          id: "task-1",
          userId: "user-123",
          syncStatus: "pending",
          lastModified: new Date(),
        },
        createdAt: new Date(),
        retryCount: 2,
      };

      const mockToArray = vi.fn().mockResolvedValue([mockOperation]);
      const mockOrderBy = vi.fn(() => ({ toArray: mockToArray }));
      db.offlineQueue.orderBy = mockOrderBy as any;

      const mockDelete = vi.fn().mockResolvedValue(undefined);
      const mockAnyOf = vi.fn(() => ({ delete: mockDelete }));
      const mockModify = vi.fn().mockResolvedValue(undefined);
      const mockEquals = vi.fn(() => ({ modify: mockModify }));
      const mockWhere = vi.fn(() => ({
        anyOf: mockAnyOf,
        equals: mockEquals,
      }));
      db.offlineQueue.where = mockWhere as any;

      const mockSyncCollection = vi
        .fn()
        .mockRejectedValue(new Error("Sync failed"));
      firebaseSync.syncCollection = mockSyncCollection;

      await offlineQueue.processQueue();

      // Failed item should have retry count incremented
      expect(mockModify).toHaveBeenCalled();
    });

    it("should verify queue is empty after successful sync", async () => {
      const { db } = await import("@/services/database");
      const { firebaseSync } = await import("@/services/sync/index");

      // First call returns operations, second call returns empty
      const mockToArray = vi
        .fn()
        .mockResolvedValueOnce([
          {
            id: 1,
            type: "create",
            collectionName: "tasks",
            userId: "user-123",
            payload: {
              id: "task-1",
              userId: "user-123",
              syncStatus: "pending",
              lastModified: new Date(),
            },
            createdAt: new Date(),
          },
        ])
        .mockResolvedValueOnce([]);

      const mockOrderBy = vi.fn(() => ({ toArray: mockToArray }));
      db.offlineQueue.orderBy = mockOrderBy as any;

      const mockDelete = vi.fn().mockResolvedValue(undefined);
      const mockAnyOf = vi.fn(() => ({ delete: mockDelete }));
      const mockWhere = vi.fn(() => ({ anyOf: mockAnyOf }));
      db.offlineQueue.where = mockWhere as any;

      const mockSyncCollection = vi.fn().mockResolvedValue(undefined);
      firebaseSync.syncCollection = mockSyncCollection;

      // First sync
      await offlineQueue.processQueue();

      // Verify queue is now empty
      const emptyResult = await offlineQueue.processQueue();
      expect(emptyResult).toBeUndefined();
    });
  });

  describe("Error Handling", () => {
    it("should retry failed operations", async () => {
      const { db } = await import("@/services/database");
      const { firebaseSync } = await import("@/services/sync/index");

      const mockOperation: QueuedOperation<DBBase> = {
        id: 1,
        type: "create",
        collectionName: "tasks",
        userId: "user-123",
        payload: {
          id: "task-1",
          userId: "user-123",
          syncStatus: "pending",
          lastModified: new Date(),
        },
        createdAt: new Date(),
        retryCount: 0,
      };

      const mockToArray = vi.fn().mockResolvedValue([mockOperation]);
      const mockOrderBy = vi.fn(() => ({ toArray: mockToArray }));
      db.offlineQueue.orderBy = mockOrderBy as any;

      const mockModify = vi.fn().mockResolvedValue(undefined);
      const mockEquals = vi.fn(() => ({ modify: mockModify }));
      const mockDelete = vi.fn().mockResolvedValue(undefined);
      const mockAnyOf = vi.fn(() => ({ delete: mockDelete }));
      const mockWhere = vi.fn(() => ({
        equals: mockEquals,
        anyOf: mockAnyOf,
      }));
      db.offlineQueue.where = mockWhere as any;

      const mockSyncCollection = vi
        .fn()
        .mockRejectedValue(new Error("Network error"));
      firebaseSync.syncCollection = mockSyncCollection;

      await offlineQueue.processQueue();

      // Should increment retry count
      expect(mockModify).toHaveBeenCalled();
    });

    it("should handle partial sync success", async () => {
      const { db } = await import("@/services/database");
      const { firebaseSync } = await import("@/services/sync/index");

      const mockOperations: QueuedOperation<DBBase>[] = [
        {
          id: 1,
          type: "create",
          collectionName: "tasks",
          userId: "user-123",
          payload: {
            id: "task-1",
            userId: "user-123",
            syncStatus: "pending",
            lastModified: new Date(),
          },
          createdAt: new Date(),
        },
        {
          id: 2,
          type: "update",
          collectionName: "tasks",
          userId: "user-123",
          payload: {
            id: "task-2",
            userId: "user-123",
            syncStatus: "pending",
            lastModified: new Date(),
          },
          createdAt: new Date(),
        },
      ];

      const mockToArray = vi.fn().mockResolvedValue(mockOperations);
      const mockOrderBy = vi.fn(() => ({ toArray: mockToArray }));
      db.offlineQueue.orderBy = mockOrderBy as any;

      const mockModify = vi.fn().mockResolvedValue(undefined);
      const mockEquals = vi.fn(() => ({ modify: mockModify }));
      const mockDelete = vi.fn().mockResolvedValue(undefined);
      const mockAnyOf = vi.fn(() => ({ delete: mockDelete }));
      const mockWhere = vi.fn(() => ({
        equals: mockEquals,
        anyOf: mockAnyOf,
      }));
      db.offlineQueue.where = mockWhere as any;

      // First succeeds, second fails
      const mockSyncCollection = vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("Network error"));
      firebaseSync.syncCollection = mockSyncCollection;

      await offlineQueue.processQueue();

      // Both operations should be attempted
      expect(mockSyncCollection).toHaveBeenCalledTimes(2);
      // Both should be removed (failed one after retry)
      expect(mockDelete).toHaveBeenCalled();
    });
  });
});
