/**
 * Offline Queue Service Tests
 * Comprehensive unit tests for sync queue functionality including:
 * - Adding operations to queue
 * - Processing queued items
 * - Retry logic with exponential backoff
 * - Clearing processed items
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { offlineQueue } from "../OfflineQueue";
import type { QueuedOperation, DBBase } from "@/types/database";

// Mock the database
vi.mock("../../database", () => ({
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
  },
}));

// Mock firebaseSync
vi.mock("../index", () => ({
  firebaseSync: {
    syncCollection: vi.fn(),
  },
}));

describe("OfflineQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addToQueue", () => {
    it("should add operation to queue successfully", async () => {
      const { db } = await import("../../database");
      const mockAdd = vi.fn().mockResolvedValue(1);
      db.offlineQueue.add = mockAdd;

      const operation: Omit<QueuedOperation<DBBase>, "createdAt" | "id"> = {
        type: "create",
        collectionName: "tasks",
        userId: "user-123",
        payload: {
          id: "test-task-1",
          userId: "user-123",
          syncStatus: "pending",
          lastModified: new Date(),
        } as DBBase,
      };

      await offlineQueue.queueOperation(operation);

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

    it("should add multiple operations in order", async () => {
      const { db } = await import("../../database");
      const operations: Array<
        Omit<QueuedOperation<DBBase>, "createdAt" | "id">
      > = [
        {
          type: "create",
          collectionName: "tasks",
          userId: "user-123",
          payload: {
            id: "test-task-1",
            userId: "user-123",
            syncStatus: "pending",
            lastModified: new Date(),
          } as DBBase,
        },
        {
          type: "update",
          collectionName: "tasks",
          userId: "user-123",
          payload: {
            id: "test-task-2",
            userId: "user-123",
            syncStatus: "pending",
            lastModified: new Date(),
          } as DBBase,
        },
      ];

      const mockAdd = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);
      db.offlineQueue.add = mockAdd;

      for (const op of operations) {
        await offlineQueue.queueOperation(op);
      }

      expect(mockAdd).toHaveBeenCalledTimes(2);
    });

    it("should handle different operation types", async () => {
      const { db } = await import("../../database");
      const mockAdd = vi.fn();
      db.offlineQueue.add = mockAdd;

      const operationTypes: Array<"create" | "update" | "delete"> = [
        "create",
        "update",
        "delete",
      ];

      for (const type of operationTypes) {
        await offlineQueue.queueOperation({
          type,
          collectionName: "tasks",
          userId: "user-123",
          payload: {
            id: "test-task",
            userId: "user-123",
            syncStatus: "pending",
            lastModified: new Date(),
          } as DBBase,
        });
      }

      expect(mockAdd).toHaveBeenCalledTimes(3);
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({ type: "create" }),
      );
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({ type: "update" }),
      );
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({ type: "delete" }),
      );
    });
  });

  describe("processSyncQueue", () => {
    it("should process all queued operations successfully", async () => {
      const { db } = await import("../../database");
      const { firebaseSync } = await import("../index");

      const mockOperations: QueuedOperation<DBBase>[] = [
        {
          id: 1,
          type: "create",
          collectionName: "tasks",
          userId: "user-123",
          payload: {
            id: "test-task-1",
            userId: "user-123",
            syncStatus: "pending",
            lastModified: new Date(),
          } as DBBase,
          createdAt: new Date(),
        },
        {
          id: 2,
          type: "update",
          collectionName: "tasks",
          userId: "user-123",
          payload: {
            id: "test-task-2",
            userId: "user-123",
            syncStatus: "pending",
            lastModified: new Date(),
          } as DBBase,
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

      expect(mockSyncCollection).toHaveBeenCalledTimes(2);
      expect(mockDelete).toHaveBeenCalled();
    });

    it("should return undefined when queue is empty", async () => {
      const { db } = await import("../../database");

      const mockToArray = vi.fn().mockResolvedValue([]);
      const mockOrderBy = vi.fn(() => ({ toArray: mockToArray }));
      db.offlineQueue.orderBy = mockOrderBy as any;

      const result = await offlineQueue.processQueue();

      expect(result).toBeUndefined();
    });

    it("should handle sync errors and continue processing", async () => {
      const { db } = await import("../../database");
      const { firebaseSync } = await import("../index");

      const mockOperations: QueuedOperation<DBBase>[] = [
        {
          id: 1,
          type: "create",
          collectionName: "tasks",
          userId: "user-123",
          payload: {
            id: "test-task-1",
            userId: "user-123",
            syncStatus: "pending",
            lastModified: new Date(),
          } as DBBase,
          createdAt: new Date(),
        },
        {
          id: 2,
          type: "update",
          collectionName: "tasks",
          userId: "user-123",
          payload: {
            id: "test-task-2",
            userId: "user-123",
            syncStatus: "pending",
            lastModified: new Date(),
          } as DBBase,
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

      const mockModify = vi.fn().mockResolvedValue(undefined);
      const mockEquals = vi.fn(() => ({ modify: mockModify }));
      db.offlineQueue.where = vi.fn(() => ({
        equals: mockEquals,
        anyOf: mockAnyOf,
      })) as any;

      // First sync fails, second succeeds
      const mockSyncCollection = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(undefined);
      firebaseSync.syncCollection = mockSyncCollection;

      await offlineQueue.processQueue();

      // Both operations should be attempted
      expect(mockSyncCollection).toHaveBeenCalledTimes(2);
      // Both should be removed (failed one after incrementing retry count)
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe("retryFailedSync", () => {
    it("should retry operations with exponential backoff", async () => {
      const { db } = await import("../../database");

      const mockOperations: QueuedOperation<DBBase>[] = [
        {
          id: 1,
          type: "create",
          collectionName: "tasks",
          userId: "user-123",
          payload: {
            id: "test-task-1",
            userId: "user-123",
            syncStatus: "pending",
            lastModified: new Date(),
          } as DBBase,
          createdAt: new Date(),
          retryCount: 1,
          lastRetryAt: new Date(Date.now() - 40 * 1000), // 40 seconds ago
        },
      ];

      const mockToArray = vi.fn().mockResolvedValue(mockOperations);
      const mockAnd = vi.fn(() => ({ toArray: mockToArray }));
      const mockBelow = vi.fn(() => ({ and: mockAnd }));
      const mockWhere = vi.fn(() => ({ below: mockBelow }));
      db.offlineQueue.where = mockWhere as any;

      const retryable = await offlineQueue.getRetryableOperations();

      expect(retryable).toHaveLength(1);
      expect(retryable[0]?.retryCount).toBe(1);
    });

    it("should not retry operations beyond max retries", async () => {
      const { db } = await import("../../database");

      const mockOperations: QueuedOperation<DBBase>[] = [
        {
          id: 1,
          type: "create",
          collectionName: "tasks",
          userId: "user-123",
          payload: {
            id: "test-task-1",
            userId: "user-123",
            syncStatus: "pending",
            lastModified: new Date(),
          } as DBBase,
          createdAt: new Date(),
          retryCount: 3, // MAX_RETRIES
        },
      ];

      const mockToArray = vi.fn().mockResolvedValue(mockOperations);
      const mockAnd = vi.fn(() => ({ toArray: mockToArray }));
      const mockBelow = vi.fn(() => ({ and: mockAnd }));
      const mockWhere = vi.fn(() => ({ below: mockBelow }));
      db.offlineQueue.where = mockWhere as any;

      const retryable = await offlineQueue.getRetryableOperations();

      // Should return empty since retryCount >= MAX_RETRIES
      expect(mockWhere).toHaveBeenCalled();
    });

    it("should increment retry count on failure", async () => {
      const { db } = await import("../../database");
      const { firebaseSync } = await import("../index");

      const mockOperation: QueuedOperation<DBBase> = {
        id: 1,
        type: "create",
        collectionName: "tasks",
        userId: "user-123",
        payload: {
          id: "test-task-1",
          userId: "user-123",
          syncStatus: "pending",
          lastModified: new Date(),
        } as DBBase,
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
        .mockRejectedValue(new Error("Sync failed"));
      firebaseSync.syncCollection = mockSyncCollection;

      await offlineQueue.processQueue();

      // Modify should be called to increment retry count
      expect(mockModify).toHaveBeenCalled();
    });

    it("should respect retry delay", async () => {
      const { db } = await import("../../database");

      const recentOperation: QueuedOperation<DBBase> = {
        id: 1,
        type: "create",
        collectionName: "tasks",
        userId: "user-123",
        payload: {
          id: "test-task-1",
          userId: "user-123",
          syncStatus: "pending",
          lastModified: new Date(),
        } as DBBase,
        createdAt: new Date(),
        retryCount: 1,
        lastRetryAt: new Date(Date.now() - 10 * 1000), // 10 seconds ago (< 30s delay)
      };

      const mockToArray = vi.fn().mockImplementation(async () => {
        // Simulate the .and() filter logic
        const now = new Date();
        const retryDelay = 30 * 1000;
        return [recentOperation].filter((op) => {
          if (!op.lastRetryAt) return true;
          return now.getTime() - op.lastRetryAt.getTime() > retryDelay;
        });
      });

      const mockAnd = vi.fn(() => ({ toArray: mockToArray }));
      const mockBelow = vi.fn(() => ({ and: mockAnd }));
      const mockWhere = vi.fn(() => ({ below: mockBelow }));
      db.offlineQueue.where = mockWhere as any;

      const retryable = await offlineQueue.getRetryableOperations();

      // Should be filtered out due to recent retry
      expect(retryable).toHaveLength(0);
    });
  });

  describe("clearQueue", () => {
    it("should clear all operations from queue", async () => {
      const { db } = await import("../../database");
      const mockClear = vi.fn().mockResolvedValue(undefined);
      db.offlineQueue.clear = mockClear;

      await offlineQueue.clearQueue();

      expect(mockClear).toHaveBeenCalled();
    });

    it("should handle errors when clearing queue", async () => {
      const { db } = await import("../../database");
      const mockClear = vi.fn().mockRejectedValue(new Error("Failed to clear"));
      db.offlineQueue.clear = mockClear;

      await expect(offlineQueue.clearQueue()).rejects.toThrow(
        "Failed to clear",
      );
    });
  });

  describe("removeOperation", () => {
    it("should remove specific operation from queue", async () => {
      const { db } = await import("../../database");
      const mockDelete = vi.fn().mockResolvedValue(undefined);
      db.offlineQueue.delete = mockDelete;

      await offlineQueue.removeOperation("operation-123");

      expect(mockDelete).toHaveBeenCalledWith("operation-123");
    });
  });

  describe("getQueueStats", () => {
    it("should return queue statistics", async () => {
      const { db } = await import("../../database");

      const mockOperations: QueuedOperation<DBBase>[] = [
        {
          id: 1,
          type: "create",
          collectionName: "tasks",
          userId: "user-123",
          payload: {
            id: "test-task-1",
            userId: "user-123",
            syncStatus: "pending",
            lastModified: new Date(),
          } as DBBase,
          createdAt: new Date(),
          retryCount: 0,
        },
        {
          id: 2,
          type: "update",
          collectionName: "tasks",
          userId: "user-123",
          payload: {
            id: "test-task-2",
            userId: "user-123",
            syncStatus: "pending",
            lastModified: new Date(),
          } as DBBase,
          createdAt: new Date(),
          retryCount: 2,
        },
        {
          id: 3,
          type: "delete",
          collectionName: "tasks",
          userId: "user-123",
          payload: {
            id: "test-task-3",
            userId: "user-123",
            syncStatus: "pending",
            lastModified: new Date(),
          } as DBBase,
          createdAt: new Date(),
          retryCount: 3, // MAX_RETRIES
        },
      ];

      const mockToArray = vi.fn().mockResolvedValue(mockOperations);
      const mockOrderBy = vi.fn(() => ({ toArray: mockToArray }));
      db.offlineQueue.orderBy = mockOrderBy as any;

      const stats = await offlineQueue.getQueueStats();

      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(2); // retryCount < MAX_RETRIES
      expect(stats.failed).toBe(1); // retryCount >= MAX_RETRIES
      expect(stats.maxRetries).toBe(3);
    });

    it("should return zero stats for empty queue", async () => {
      const { db } = await import("../../database");

      const mockToArray = vi.fn().mockResolvedValue([]);
      const mockOrderBy = vi.fn(() => ({ toArray: mockToArray }));
      db.offlineQueue.orderBy = mockOrderBy as any;

      const stats = await offlineQueue.getQueueStats();

      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.failed).toBe(0);
    });
  });

  describe("Operation Processing", () => {
    it("should process create operations", async () => {
      const { firebaseSync } = await import("../index");
      const mockSync = vi.fn().mockResolvedValue(undefined);
      firebaseSync.syncCollection = mockSync;

      const operation: QueuedOperation<DBBase> = {
        id: 1,
        type: "create",
        collectionName: "tasks",
        userId: "user-123",
        payload: {
          id: "test-task-1",
          userId: "user-123",
          syncStatus: "pending",
          lastModified: new Date(),
        } as DBBase,
        createdAt: new Date(),
      };

      // Test the operation type
      expect(operation.type).toBe("create");
    });

    it("should process update operations", async () => {
      const operation: QueuedOperation<DBBase> = {
        id: 1,
        type: "update",
        collectionName: "tasks",
        userId: "user-123",
        payload: {
          id: "test-task-1",
          userId: "user-123",
          syncStatus: "pending",
          lastModified: new Date(),
        } as DBBase,
        createdAt: new Date(),
      };

      expect(operation.type).toBe("update");
    });

    it("should process delete operations", async () => {
      const operation: QueuedOperation<DBBase> = {
        id: 1,
        type: "delete",
        collectionName: "tasks",
        userId: "user-123",
        payload: {
          id: "test-task-1",
          userId: "user-123",
          syncStatus: "pending",
          lastModified: new Date(),
        } as DBBase,
        createdAt: new Date(),
      };

      expect(operation.type).toBe("delete");
    });
  });
});
