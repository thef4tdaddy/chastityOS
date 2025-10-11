/**
 * useSyncStatus Hook
 * Provides comprehensive sync status information for UI components
 */
import { useState, useEffect, useCallback } from "react";
import { syncQueueService } from "@/services/sync/SyncQueueService";
import { connectionStatus } from "@/services/sync/connectionStatus";
import type { SyncQueueStats } from "@/services/sync/SyncQueueService";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("useSyncStatus");

export type SyncStatus = "syncing" | "synced" | "failed" | "offline" | "idle";

export interface SyncStatusInfo {
  status: SyncStatus;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  queueStats: SyncQueueStats | null;
  pendingOperations: number;
  failedOperations: number;
  errorMessage: string | null;
}

export interface SyncStatusActions {
  manualSync: () => Promise<void>;
  retryFailed: () => Promise<void>;
  clearQueue: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

export function useSyncStatus(): SyncStatusInfo & SyncStatusActions {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [queueStats, setQueueStats] = useState<SyncQueueStats | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Update sync status based on current state
   */
  const updateStatus = useCallback(() => {
    if (!isOnline) {
      setStatus("offline");
    } else if (isSyncing || syncQueueService.isCurrentlyProcessing()) {
      setStatus("syncing");
    } else if (queueStats && queueStats.failed > 0) {
      setStatus("failed");
    } else if (queueStats && queueStats.pending > 0) {
      setStatus("syncing");
    } else {
      setStatus("synced");
    }
  }, [isOnline, isSyncing, queueStats]);

  /**
   * Refresh sync status and queue statistics
   */
  const refreshStatus = useCallback(async () => {
    try {
      const stats = await syncQueueService.getQueueStats();
      setQueueStats(stats);

      if (stats.lastProcessedAt) {
        setLastSyncedAt(stats.lastProcessedAt);
      }

      updateStatus();
    } catch (error) {
      logger.error("Failed to refresh sync status", { error });
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to refresh status",
      );
    }
  }, [updateStatus]);

  /**
   * Trigger a manual sync
   */
  const manualSync = useCallback(async () => {
    if (!isOnline) {
      throw new Error("Cannot sync while offline");
    }

    setIsSyncing(true);
    setErrorMessage(null);

    try {
      await syncQueueService.processSyncQueue();
      setLastSyncedAt(new Date());
      await refreshStatus();
      logger.info("Manual sync completed successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sync failed";
      setErrorMessage(message);
      logger.error("Manual sync failed", { error });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, refreshStatus]);

  /**
   * Retry failed operations
   */
  const retryFailed = useCallback(async () => {
    if (!isOnline) {
      throw new Error("Cannot retry while offline");
    }

    setIsSyncing(true);
    setErrorMessage(null);

    try {
      await syncQueueService.retryFailedOperations();
      await refreshStatus();
      logger.info("Retry of failed operations completed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Retry failed";
      setErrorMessage(message);
      logger.error("Failed to retry operations", { error });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, refreshStatus]);

  /**
   * Clear the sync queue
   */
  const clearQueue = useCallback(async () => {
    setErrorMessage(null);

    try {
      await syncQueueService.clearQueue();
      await refreshStatus();
      logger.info("Sync queue cleared");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to clear queue";
      setErrorMessage(message);
      logger.error("Failed to clear queue", { error });
      throw error;
    }
  }, [refreshStatus]);

  // Listen for connection status changes
  useEffect(() => {
    const unsubscribe = connectionStatus.subscribe((online) => {
      setIsOnline(online);

      if (online) {
        // Automatically try to sync when coming back online
        logger.info("Connection restored, triggering auto-sync");
        refreshStatus();
      }
    });

    return unsubscribe;
  }, [refreshStatus]);

  // Listen for service worker messages
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      const { data } = event;

      switch (data?.type) {
        case "SYNC_STARTED":
          setIsSyncing(true);
          logger.debug("Service worker sync started");
          break;

        case "SYNC_COMPLETE":
          setIsSyncing(false);
          setLastSyncedAt(new Date());
          refreshStatus();
          logger.debug("Service worker sync completed");
          break;

        case "SYNC_FAILED":
          setIsSyncing(false);
          setErrorMessage(data.error || "Sync failed");
          refreshStatus();
          logger.error("Service worker sync failed", { error: data.error });
          break;

        default:
          break;
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [refreshStatus]);

  // Periodic status refresh
  useEffect(() => {
    // Initial refresh
    refreshStatus();

    // Refresh every 10 seconds
    const interval = setInterval(refreshStatus, 10000);

    return () => clearInterval(interval);
  }, [refreshStatus]);

  // Update status whenever dependencies change
  useEffect(() => {
    updateStatus();
  }, [updateStatus]);

  return {
    status,
    isOnline,
    isSyncing,
    lastSyncedAt,
    queueStats,
    pendingOperations: queueStats?.pending || 0,
    failedOperations: queueStats?.failed || 0,
    errorMessage,
    manualSync,
    retryFailed,
    clearQueue,
    refreshStatus,
  };
}
