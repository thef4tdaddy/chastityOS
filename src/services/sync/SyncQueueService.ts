/**
 * SyncQueueService
 * Comprehensive service for managing sync queue operations
 * Handles queuing, processing, and tracking of offline operations
 */
import { serviceLogger } from "@/utils/logging";
import { db } from "../database";
import { offlineQueue } from "./OfflineQueue";
import { connectionStatus } from "./connectionStatus";
import type { DBBase } from "@/types/database";

const logger = serviceLogger("SyncQueueService");

export type SyncOperationType = "create" | "update" | "delete";
export type SyncableCollection =
  | "tasks"
  | "sessions"
  | "events"
  | "settings"
  | "goals"
  | "achievements"
  | "userAchievements";

export interface SyncQueueStats {
  total: number;
  pending: number;
  failed: number;
  inProgress: number;
  lastProcessedAt: Date | null;
  nextRetryAt: Date | null;
}

export interface OperationStatus {
  id: number;
  type: SyncOperationType;
  collection: SyncableCollection;
  status: "pending" | "processing" | "success" | "failed";
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  createdAt: Date;
  lastRetryAt?: Date;
}

export class SyncQueueService {
  private isProcessing = false;
  private lastProcessedAt: Date | null = null;
  private readonly MAX_RETRIES = 3;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the service and set up listeners
   */
  private initialize() {
    logger.info("SyncQueueService initialized");

    // Listen for connection changes
    connectionStatus.subscribe((isOnline) => {
      if (isOnline) {
        logger.info("Connection restored, triggering sync");
        this.processSyncQueue().catch((error) => {
          logger.error("Auto-sync after reconnection failed", { error });
        });
      }
    });
  }

  /**
   * Add an operation to the sync queue
   * @param operation - The operation type (create, update, delete)
   * @param collection - The collection to sync
   * @param data - The data to sync
   * @param userId - The user ID
   */
  async addToQueue(
    operation: SyncOperationType,
    collection: SyncableCollection,
    data: DBBase,
    userId: string,
  ): Promise<void> {
    try {
      await offlineQueue.queueOperation({
        type: operation,
        collectionName: collection,
        payload: data,
        userId,
      });

      logger.info("Operation added to sync queue", {
        operation,
        collection,
        userId,
      });

      // Try to sync immediately if online
      if (connectionStatus.getIsOnline() && !this.isProcessing) {
        this.processSyncQueue().catch((error) => {
          logger.warn("Failed to process queue after adding operation", {
            error,
          });
        });
      }
    } catch (error) {
      logger.error("Failed to add operation to queue", {
        error,
        operation,
        collection,
      });
      throw error;
    }
  }

  /**
   * Process all queued operations
   * Implements retry logic with exponential backoff
   */
  async processSyncQueue(): Promise<void> {
    // Prevent concurrent processing
    if (this.isProcessing) {
      logger.debug("Queue processing already in progress");
      return;
    }

    // Check if online
    if (!connectionStatus.getIsOnline()) {
      logger.debug("Offline, skipping queue processing");
      return;
    }

    this.isProcessing = true;

    try {
      await offlineQueue.processQueue();
      this.lastProcessedAt = new Date();
      logger.info("Sync queue processed successfully");
    } catch (error) {
      logger.error("Failed to process sync queue", { error });
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Clear all processed items from the queue
   */
  async clearQueue(): Promise<void> {
    try {
      await offlineQueue.clearQueue();
      logger.info("Sync queue cleared");
    } catch (error) {
      logger.error("Failed to clear sync queue", { error });
      throw error;
    }
  }

  /**
   * Get detailed statistics about the sync queue
   */
  async getQueueStats(): Promise<SyncQueueStats> {
    try {
      const stats = await offlineQueue.getQueueStats();
      const retryableOps = await offlineQueue.getRetryableOperations();

      // Calculate next retry time
      let nextRetryAt: Date | null = null;
      if (retryableOps.length > 0) {
        const operation = retryableOps[0];
        if (operation.lastRetryAt) {
          const retryDelay = 30 * 1000 * Math.pow(2, operation.retryCount || 0);
          nextRetryAt = new Date(operation.lastRetryAt.getTime() + retryDelay);
        }
      }

      return {
        total: stats.total,
        pending: stats.pending,
        failed: stats.failed,
        inProgress: this.isProcessing ? 1 : 0,
        lastProcessedAt: this.lastProcessedAt,
        nextRetryAt,
      };
    } catch (error) {
      logger.error("Failed to get queue stats", { error });
      throw error;
    }
  }

  /**
   * Get status of all operations in the queue
   */
  async getOperationStatuses(): Promise<OperationStatus[]> {
    try {
      const operations = await offlineQueue.getQueuedOperations();

      return operations.map((op) => ({
        id: op.id || 0,
        type: op.type,
        collection: op.collectionName as SyncableCollection,
        status: (op.retryCount || 0) >= this.MAX_RETRIES ? "failed" : "pending",
        retryCount: op.retryCount || 0,
        maxRetries: this.MAX_RETRIES,
        createdAt: op.createdAt,
        lastRetryAt: op.lastRetryAt,
      }));
    } catch (error) {
      logger.error("Failed to get operation statuses", { error });
      throw error;
    }
  }

  /**
   * Retry failed operations
   */
  async retryFailedOperations(): Promise<void> {
    try {
      logger.info("Retrying failed operations");

      // Reset retry count for failed operations
      const failedOps = await db.offlineQueue
        .where("retryCount")
        .aboveOrEqual(this.MAX_RETRIES)
        .toArray();

      for (const op of failedOps) {
        if (op.id !== undefined) {
          await db.offlineQueue.update(op.id, {
            retryCount: 0,
            lastRetryAt: undefined,
          });
        }
      }

      // Process the queue
      await this.processSyncQueue();

      logger.info(`Retried ${failedOps.length} failed operations`);
    } catch (error) {
      logger.error("Failed to retry operations", { error });
      throw error;
    }
  }

  /**
   * Remove a specific operation from the queue
   */
  async removeOperation(operationId: string): Promise<void> {
    try {
      await offlineQueue.removeOperation(operationId);
      logger.info("Operation removed from queue", { operationId });
    } catch (error) {
      logger.error("Failed to remove operation", { error, operationId });
      throw error;
    }
  }

  /**
   * Check if the queue is empty
   */
  async isEmpty(): Promise<boolean> {
    const stats = await this.getQueueStats();
    return stats.total === 0;
  }

  /**
   * Get the processing state
   */
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }
}

export const syncQueueService = new SyncQueueService();
