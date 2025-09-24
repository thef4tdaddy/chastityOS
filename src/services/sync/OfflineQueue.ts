
/**
 * Offline Queue
 * Manages operations that need to be performed when the app is online
 */
import { serviceLogger } from "@/utils/logging";
import { db } from "../database";
import type { QueuedOperation } from "@/types/database";

const logger = serviceLogger("OfflineQueue");

class OfflineQueue {
  constructor() {
    logger.info("OfflineQueue initialized");
  }

  /**
   * Add an operation to the queue
   */
  async queueOperation(operation: Omit<QueuedOperation, "createdAt" | "id">) {
    const queuedOperation: Omit<QueuedOperation, "id"> = {
      ...operation,
      createdAt: new Date(),
    };
    await db.offlineQueue.add(queuedOperation as QueuedOperation);
    logger.debug("Queued operation", { type: operation.type, collection: operation.collectionName });
  }

  /**
   * Get all operations from the queue
   */
  async getQueuedOperations(): Promise<QueuedOperation[]> {
    return db.offlineQueue.orderBy("createdAt").toArray();
  }

  /**
   * Clear the queue
   */
  async clearQueue() {
    await db.offlineQueue.clear();
    logger.debug("Offline queue cleared");
  }

  /**
   * Process the queue
   */
  async processQueue() {
    logger.info("Processing offline queue");
    const operations = await this.getQueuedOperations();

    if (operations.length === 0) {
      logger.debug("Offline queue is empty");
      return;
    }

    logger.debug(`Processing ${operations.length} queued operations`);

    // TODO: Implement the logic to process the operations (e.g., push to Firebase)

    // For now, we'll just clear the queue
    await this.clearQueue();
  }
}

export const offlineQueue = new OfflineQueue();
