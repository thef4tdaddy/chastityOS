/**
 * Sync Queue Service
 * Enhanced queue management with exponential backoff and status tracking
 * Part of Background Sync implementation (#392)
 */
import { serviceLogger } from "@/utils/logging";
import { db } from "../database";
import type { QueuedOperation, DBBase } from "@/types/database";
import { offlineQueue } from "./OfflineQueue";

const logger = serviceLogger("SyncQueueService");

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

export interface SyncStats {
  total: number;
  pending: number;
  failed: number;
  lastSyncTime?: Date;
  lastSyncStatus: SyncStatus;
}

export class SyncQueueService {
  private readonly MAX_RETRIES = 3;
  private readonly BASE_DELAY = 1000; // 1 second base delay
  private syncStatus: SyncStatus = "idle";
  private lastSyncTime?: Date;
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  constructor() {
    logger.info("SyncQueueService initialized");
  }

  /**
   * Add an operation to the sync queue
   */
  async addToQueue(
    operation: "create" | "update" | "delete",
    collectionName: string,
    data: DBBase,
  ): Promise<void> {
    try {
      await offlineQueue.queueOperation({
        type: operation,
        collectionName,
        payload: data,
        userId: data.userId,
      });
      logger.debug("Added operation to queue", {
        operation,
        collection: collectionName,
      });
    } catch (error) {
      logger.error("Failed to add operation to queue", error);
      throw error;
    }
  }

  /**
   * Process all queued operations with exponential backoff retry logic
   */
  async processSyncQueue(): Promise<void> {
    if (this.syncStatus === "syncing") {
      logger.debug("Sync already in progress, skipping");
      return;
    }

    this.updateStatus("syncing");

    try {
      const operations = await offlineQueue.getQueuedOperations();

      if (operations.length === 0) {
        logger.debug("No operations to sync");
        this.updateStatus("synced");
        this.lastSyncTime = new Date();
        return;
      }

      logger.info(`Processing ${operations.length} queued operations`);

      const processed: number[] = [];
      const failed: QueuedOperation<DBBase>[] = [];

      for (const operation of operations) {
        try {
          const shouldRetry = await this.shouldRetryOperation(operation);

          if (!shouldRetry) {
            // Max retries exceeded, mark as failed and remove
            if (operation.id !== undefined) {
              processed.push(operation.id);
            }
            logger.warn("Operation exceeded max retries", {
              id: operation.id,
              retryCount: operation.retryCount,
            });
            continue;
          }

          await this.processOperation(operation);

          // Successfully processed
          if (operation.id !== undefined) {
            processed.push(operation.id);
          }
          logger.debug("Successfully processed operation", {
            id: operation.id,
          });
        } catch (error) {
          logger.error("Failed to process operation", {
            id: operation.id,
            error,
          });

          // Increment retry count and update last retry time
          if (operation.id !== undefined) {
            await this.incrementRetryCount(operation.id);

            // Add to failed list for potential retry
            failed.push(operation);
          }
        }
      }

      // Remove successfully processed operations
      if (processed.length > 0) {
        await db.offlineQueue.where("id").anyOf(processed).delete();
        logger.info(`Removed ${processed.length} processed operations`);
      }

      // Update status based on results
      if (failed.length > 0) {
        this.updateStatus("error");
        logger.warn(`${failed.length} operations failed, will retry later`);
      } else {
        this.updateStatus("synced");
      }

      this.lastSyncTime = new Date();
    } catch (error) {
      logger.error("Error processing sync queue", error);
      this.updateStatus("error");
      throw error;
    }
  }

  /**
   * Check if an operation should be retried based on retry count and delay
   */
  private async shouldRetryOperation(
    operation: QueuedOperation<DBBase>,
  ): Promise<boolean> {
    const retryCount = operation.retryCount || 0;

    // Check max retries
    if (retryCount >= this.MAX_RETRIES) {
      return false;
    }

    // Check if enough time has passed since last retry (exponential backoff)
    if (operation.lastRetryAt) {
      const delay = this.calculateBackoffDelay(retryCount);
      const timeSinceLastRetry =
        Date.now() - new Date(operation.lastRetryAt).getTime();

      if (timeSinceLastRetry < delay) {
        logger.debug("Operation not ready for retry", {
          id: operation.id,
          retryCount,
          delay,
          timeSinceLastRetry,
        });
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate exponential backoff delay
   * Formula: BASE_DELAY * (2 ^ retryCount)
   */
  private calculateBackoffDelay(retryCount: number): number {
    return this.BASE_DELAY * Math.pow(2, retryCount);
  }

  /**
   * Process a single operation by delegating to the appropriate sync service
   */
  private async processOperation(
    operation: QueuedOperation<DBBase>,
  ): Promise<void> {
    // Import dynamically to avoid circular dependencies
    const { firebaseSync } = await import("./index");

    switch (operation.type) {
      case "create":
      case "update":
      case "delete":
        // Delegate to Firebase sync service
        await firebaseSync.syncCollection(
          operation.collectionName,
          operation.userId,
        );
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Increment retry count and update last retry timestamp
   */
  private async incrementRetryCount(operationId: number): Promise<void> {
    await db.offlineQueue
      .where("id")
      .equals(operationId)
      .modify((operation) => {
        operation.retryCount = (operation.retryCount || 0) + 1;
        operation.lastRetryAt = new Date();
      });
  }

  /**
   * Clear all processed items from the queue
   */
  async clearQueue(): Promise<void> {
    await offlineQueue.clearQueue();
    logger.info("Queue cleared");
    this.updateStatus("idle");
  }

  /**
   * Get current sync statistics
   */
  async getStats(): Promise<SyncStats> {
    const stats = await offlineQueue.getQueueStats();

    return {
      total: stats.total,
      pending: stats.pending,
      failed: stats.failed,
      lastSyncTime: this.lastSyncTime,
      lastSyncStatus: this.syncStatus,
    };
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return this.syncStatus;
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): Date | undefined {
    return this.lastSyncTime;
  }

  /**
   * Subscribe to sync status changes
   */
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify with current status
    listener(this.syncStatus);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Update sync status and notify listeners
   */
  private updateStatus(status: SyncStatus): void {
    if (this.syncStatus === status) return;

    this.syncStatus = status;
    logger.debug("Sync status changed", { status });

    // Notify all listeners
    this.listeners.forEach((listener) => listener(status));
  }

  /**
   * Manually trigger a sync
   */
  async triggerSync(): Promise<void> {
    logger.info("Manual sync triggered");
    await this.processSyncQueue();
  }
}

export const syncQueueService = new SyncQueueService();
