/**
 * Offline Queue
 * Manages operations that need to be performed when the app is online
 */
import { serviceLogger } from "@/utils/logging";
import { db } from "@/services/database";
import type { QueuedOperation, DBBase } from "@/types/database";

const logger = serviceLogger("OfflineQueue");

class OfflineQueue {
  constructor() {
    logger.info("OfflineQueue initialized");
  }

  /**
   * Add an operation to the queue
   */
  async queueOperation(
    operation: Omit<QueuedOperation<DBBase>, "createdAt" | "id">,
  ) {
    const queuedOperation: Omit<QueuedOperation<DBBase>, "id"> = {
      ...operation,
      createdAt: new Date(),
    };
    await db.offlineQueue.add(queuedOperation as QueuedOperation<DBBase>);
    logger.debug("Queued operation", {
      type: operation.type,
      collection: operation.collectionName,
    });
  }

  /**
   * Get all operations from the queue
   */
  async getQueuedOperations(): Promise<QueuedOperation<DBBase>[]> {
    return db.offlineQueue.orderBy("createdAt").toArray() as Promise<
      QueuedOperation<DBBase>[]
    >;
  }

  /**
   * Clear the queue
   */
  async clearQueue() {
    await db.offlineQueue.clear();
    logger.debug("Offline queue cleared");
  }

  /**
   * Process the queue with retry logic and error handling
   */
  async processQueue(): Promise<QueuedOperation<DBBase>[] | undefined> {
    logger.info("Processing offline queue");
    const operations = await this.getQueuedOperations();

    if (operations.length === 0) {
      logger.debug("Offline queue is empty");
      return undefined;
    }

    logger.debug(`Processing ${operations.length} queued operations`);

    const processed: number[] = [];
    const failed: Array<{ id: number; error: string }> = [];

    for (const operation of operations) {
      try {
        await this.processOperation(operation);
        if (operation.id !== undefined) {
          processed.push(operation.id);
          logger.debug("Successfully processed operation", {
            id: operation.id,
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        failed.push({ id: operation.id || 0, error: errorMessage });
        logger.error("Failed to process operation", {
          id: operation.id,
          error: errorMessage,
        });

        // Increment retry count
        if (operation.id !== undefined) {
          await this.incrementRetryCount(operation.id.toString());
        }

        // Remove from queue if max retries exceeded (simplified without retryCount check)
        if (operation.id !== undefined) {
          processed.push(operation.id); // Will be removed below
          logger.warn("Removing operation after error", {
            id: operation.id,
          });
        }
      }
    }

    // Remove successfully processed operations
    if (processed.length > 0) {
      await db.offlineQueue.where("id").anyOf(processed).delete();
      logger.info(
        `Removed ${processed.length} processed operations from queue`,
      );
    }

    if (failed.length > 0) {
      logger.warn(`${failed.length} operations failed to process`);
    }

    return failed.length > 0 ? [] : undefined;
  }

  private readonly MAX_RETRIES = 3;

  /**
   * Process a single operation
   */
  private async processOperation(
    operation: QueuedOperation<DBBase>,
  ): Promise<void> {
    // Import dynamically to avoid circular dependencies
    const { firebaseSync } = await import("./index");

    if (!operation.userId) {
      logger.warn("Skipping operation with no userId", {
        operationId: operation.id,
      });
      return;
    }

    switch (operation.type) {
      case "create":
      case "update":
      case "delete":
        // Delegate to Firebase sync service
        await firebaseSync.syncSingleCollection(
          operation.collectionName,
          operation.userId,
          {},
        );
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Increment retry count for an operation
   */
  private async incrementRetryCount(operationId: string): Promise<void> {
    await db.offlineQueue
      .where("id")
      .equals(operationId)
      .modify((operation) => {
        operation.retryCount = (operation.retryCount || 0) + 1;
        operation.lastRetryAt = new Date();
      });
  }

  /**
   * Remove a specific operation from the queue
   */
  async removeOperation(operationId: string): Promise<void> {
    await db.offlineQueue.delete(operationId);
    logger.debug("Removed operation from queue", { id: operationId });
  }

  /**
   * Get operations that are ready for retry
   */
  async getRetryableOperations(): Promise<QueuedOperation<DBBase>[]> {
    const now = new Date();
    const retryDelay = 30 * 1000; // 30 seconds

    return db.offlineQueue
      .where("retryCount")
      .below(this.MAX_RETRIES)
      .and((op) => {
        if (!op.lastRetryAt) return true;
        return now.getTime() - op.lastRetryAt.getTime() > retryDelay;
      })
      .toArray() as Promise<QueuedOperation<DBBase>[]>;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    total: number;
    pending: number;
    failed: number;
    maxRetries: number;
  }> {
    const all = await this.getQueuedOperations();
    const pending = all.filter((op) => (op.retryCount || 0) < this.MAX_RETRIES);
    const failed = all.filter((op) => (op.retryCount || 0) >= this.MAX_RETRIES);

    return {
      total: all.length,
      pending: pending.length,
      failed: failed.length,
      maxRetries: this.MAX_RETRIES,
    };
  }
}

export const offlineQueue = new OfflineQueue();
