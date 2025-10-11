/**
 * Sync Status Hook
 * React hook for monitoring background sync status
 * Part of Background Sync implementation (#392)
 */
import { useState, useEffect, useCallback } from "react";
import {
  syncQueueService,
  type SyncStatus,
  type SyncStats,
} from "@/services/sync/SyncQueueService";
import { connectionStatus } from "@/services/sync/connectionStatus";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("useSyncStatus");

export interface UseSyncStatusReturn {
  syncStatus: SyncStatus;
  stats: SyncStats | null;
  isOnline: boolean;
  lastSyncTime?: Date;
  triggerSync: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

/**
 * Hook to monitor sync status and control manual sync
 */
export function useSyncStatus(): UseSyncStatusReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    syncQueueService.getStatus(),
  );
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [isOnline, setIsOnline] = useState(connectionStatus.getIsOnline());
  const [lastSyncTime, setLastSyncTime] = useState<Date | undefined>(
    syncQueueService.getLastSyncTime(),
  );

  // Refresh stats from the sync queue service
  const refreshStats = useCallback(async () => {
    try {
      const currentStats = await syncQueueService.getStats();
      setStats(currentStats);
      setLastSyncTime(currentStats.lastSyncTime);
    } catch (error) {
      logger.error("Failed to refresh sync stats", error);
    }
  }, []);

  // Subscribe to sync status changes
  useEffect(() => {
    const unsubscribe = syncQueueService.subscribe((status) => {
      setSyncStatus(status);
      // Refresh stats when status changes
      refreshStats();
    });

    return unsubscribe;
  }, [refreshStats]);

  // Subscribe to online/offline changes
  useEffect(() => {
    const unsubscribe = connectionStatus.subscribe((online) => {
      setIsOnline(online);
    });

    return unsubscribe;
  }, []);

  // Initial stats load
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // Trigger manual sync
  const triggerSync = useCallback(async () => {
    try {
      logger.info("Manual sync triggered from UI");
      await syncQueueService.triggerSync();
      await refreshStats();
    } catch (error) {
      logger.error("Failed to trigger manual sync", error);
      throw error;
    }
  }, [refreshStats]);

  return {
    syncStatus,
    stats,
    isOnline,
    lastSyncTime,
    triggerSync,
    refreshStats,
  };
}
