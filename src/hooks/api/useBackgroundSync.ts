/**
 * Background Sync Hook
 * Handles background synchronization of offline queue
 */
import { useEffect, useCallback } from "react";
import { offlineQueue } from "@/services/sync/OfflineQueue";
import { connectionStatus } from "@/services/sync/connectionStatus";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("useBackgroundSync");

/**
 * Hook to manage background sync for offline operations
 */
export function useBackgroundSync() {
  // Register background sync when service worker is available
  const registerBackgroundSync = useCallback(async () => {
    if (!("serviceWorker" in navigator)) {
      logger.warn("Service Worker not supported");
      return;
    }

    if (!("sync" in (window.ServiceWorkerRegistration || {}).prototype)) {
      logger.warn("Background Sync not supported");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register("offline-queue-sync");
      logger.info("Background sync registered");
    } catch (error) {
      logger.error("Failed to register background sync", error);
    }
  }, []);

  // Process queued operations when back online
  const processQueueWhenOnline = useCallback(async () => {
    if (!connectionStatus.getIsOnline()) {
      logger.debug("Still offline, skipping queue processing");
      return;
    }

    logger.info("Processing offline queue");
    await offlineQueue.processQueue();
  }, []);

  // Listen for messages from service worker
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const handleMessage = async (event: MessageEvent) => {
      const { data } = event;

      switch (data?.type) {
        case "SYNC_STARTED":
          logger.info(`Background sync started: ${data.count} operations`);
          break;

        case "SYNC_COMPLETE":
          logger.info(
            `Background sync complete: ${data.processed} processed, ${data.failed} failed`,
          );
          break;

        case "PROCESS_OPERATION":
          // Service worker is asking us to process an operation
          logger.debug("Processing operation from service worker");
          await processQueueWhenOnline();
          break;

        default:
          break;
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [processQueueWhenOnline]);

  // Listen for online/offline events
  useEffect(() => {
    const unsubscribe = connectionStatus.subscribe(async (isOnline) => {
      if (isOnline) {
        logger.info("Connection restored, triggering sync");
        await registerBackgroundSync();
        await processQueueWhenOnline();
      }
    });

    return unsubscribe;
  }, [registerBackgroundSync, processQueueWhenOnline]);

  return {
    registerBackgroundSync,
    processQueueWhenOnline,
  };
}
