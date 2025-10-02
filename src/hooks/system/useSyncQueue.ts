/**
 * Sync Queue Management
 *
 * Manages offline sync queue for operations that need to be synced when online.
 */
import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { logger } from "../../utils/logging";

export const useSyncQueue = () => {
  const queryClient = useQueryClient();
  const [syncQueue, setSyncQueue] = useState<Record<string, unknown>[]>([]);

  // Process sync queue
  const processSyncQueue = useCallback(async () => {
    if (!navigator.onLine || syncQueue.length === 0) return;

    logger.info("Processing sync queue", { queueSize: syncQueue.length });

    const processedItems: Record<string, unknown>[] = [];

    for (const item of syncQueue) {
      try {
        // Here you would implement actual sync logic
        // For now, we'll just simulate processing
        await new Promise((resolve) => setTimeout(resolve, 100));
        processedItems.push(item);
        logger.debug("Sync item processed", { item });
      } catch (error) {
        logger.error("Failed to sync item", { item, error });
        break; // Stop processing on error
      }
    }

    // Remove processed items from queue
    setSyncQueue((prev) =>
      prev.filter((item) => !processedItems.includes(item)),
    );

    if (processedItems.length > 0) {
      queryClient.invalidateQueries({ queryKey: ["network"] });
      logger.info("Sync queue processed", {
        processedCount: processedItems.length,
        remainingCount: syncQueue.length - processedItems.length,
      });
    }
  }, [syncQueue, queryClient]);

  // Add item to sync queue
  const queueForSync = useCallback((item: Record<string, unknown>) => {
    setSyncQueue((prev) => [...prev, { ...item, queuedAt: new Date() }]);
    logger.debug("Item queued for sync", { item });
  }, []);

  // Clear sync queue
  const clearSyncQueue = useCallback(() => {
    setSyncQueue([]);
    queryClient.invalidateQueries({ queryKey: ["network"] });
    logger.info("Sync queue cleared");
  }, [queryClient]);

  // Retry sync
  const retrySync = useCallback(() => {
    if (navigator.onLine) {
      processSyncQueue();
    } else {
      logger.warn("Cannot retry sync while offline");
    }
  }, [processSyncQueue]);

  return {
    syncQueue,
    processSyncQueue,
    queueForSync,
    clearSyncQueue,
    retrySync,
  };
};
