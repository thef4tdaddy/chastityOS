/**
 * useOfflineStatus Hook - Network Status Monitoring
 *
 * Monitor network connectivity and provide offline capabilities with intelligent
 * sync when connection is restored.
 */

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tantml:react-query";
import { logger } from "../../utils/logging";
import {
  getNetworkInfo,
  getNetworkQuality,
  processSyncQueueItems,
} from "./offlineStatusHelpers";
import { useConnectionMonitoring } from "./useConnectionMonitoring";

// Network quality enum
export enum NetworkQuality {
  EXCELLENT = "excellent",
  GOOD = "good",
  FAIR = "fair",
  POOR = "poor",
  OFFLINE = "offline",
}

// Connection type
export enum ConnectionType {
  WIFI = "wifi",
  CELLULAR = "cellular",
  ETHERNET = "ethernet",
  BLUETOOTH = "bluetooth",
  UNKNOWN = "unknown",
}

// Offline status interface
export interface OfflineStatus {
  isOnline: boolean;
  isOffline: boolean;
  networkQuality: NetworkQuality;
  connectionType: ConnectionType;
  downlink: number;
  rtt: number;
  effectiveType: string;
  lastOnline: Date | null;
  offlineDuration: number;
  hasPendingSync: boolean;
  syncQueueSize: number;
}

// Offline capabilities
export interface OfflineCapabilities {
  canReadCache: boolean;
  canWriteCache: boolean;
  canQueueOperations: boolean;
  estimatedStorageUsage: number;
  maxStorageLimit: number;
}

// Network event
export interface NetworkEvent {
  type: "online" | "offline" | "quality-change";
  timestamp: Date;
  details?: Record<string, unknown>;
}

/**
 * Network Status Hook
 */
export const useOfflineStatus = () => {
  const queryClient = useQueryClient();
  const [networkEvents, setNetworkEvents] = useState<NetworkEvent[]>([]);
  const [syncQueue, setSyncQueue] = useState<Record<string, unknown>[]>([]);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);

  // Current offline status query
  const { data: offlineStatus } = useQuery<OfflineStatus>({
    queryKey: ["network", "status"],
    queryFn: (): OfflineStatus => {
      const networkInfo = getNetworkInfo();
      const quality = getNetworkQuality(networkInfo.downlink, networkInfo.rtt);
      const now = new Date();

      const offlineDuration =
        lastOnline && !navigator.onLine
          ? now.getTime() - lastOnline.getTime()
          : 0;

      return {
        isOnline: navigator.onLine,
        isOffline: !navigator.onLine,
        networkQuality: quality,
        connectionType: networkInfo.type,
        downlink: networkInfo.downlink,
        rtt: networkInfo.rtt,
        effectiveType: networkInfo.effectiveType,
        lastOnline,
        offlineDuration,
        hasPendingSync: syncQueue.length > 0,
        syncQueueSize: syncQueue.length,
      };
    },
    refetchInterval: 5000, // Check every 5 seconds
    staleTime: 1000,
  });

  // Offline capabilities query
  const { data: capabilities } = useQuery<OfflineCapabilities>({
    queryKey: ["network", "capabilities"],
    queryFn: async () => {
      let storageUsage = 0;
      let storageLimit = 0;

      if ("storage" in navigator && "estimate" in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate();
          storageUsage = estimate.usage || 0;
          storageLimit = estimate.quota || 0;
        } catch (error) {
          logger.warn("Could not estimate storage", error);
        }
      }

      return {
        canReadCache: "caches" in window,
        canWriteCache: "caches" in window && navigator.onLine,
        canQueueOperations: true,
        estimatedStorageUsage: storageUsage,
        maxStorageLimit: storageLimit,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Add network event
  const addNetworkEvent = useCallback(
    (type: NetworkEvent["type"], details?: Record<string, unknown>) => {
      const event: NetworkEvent = {
        type,
        timestamp: new Date(),
        details,
      };

      setNetworkEvents((prev) => [...prev.slice(-49), event]); // Keep last 50 events
      logger.info(`Network event: ${type}`, details);
    },
    [],
  );

  // Process sync queue
  const processSyncQueue = useCallback(async () => {
    if (!navigator.onLine || syncQueue.length === 0) return;

    const { processedItems } = await processSyncQueueItems(syncQueue);

    // Remove processed items from queue
    setSyncQueue((prev) =>
      prev.filter((item) => !processedItems.includes(item)),
    );

    if (processedItems.length > 0) {
      queryClient.invalidateQueries({ queryKey: ["network"] });
    }
  }, [syncQueue, queryClient]);

  // Handle online event
  const handleOnline = useCallback(() => {
    setLastOnline(new Date());
    addNetworkEvent("online", {
      wasOffline: !navigator.onLine,
      syncQueueSize: syncQueue.length,
    });

    queryClient.invalidateQueries({ queryKey: ["network"] });

    // Process sync queue when back online
    if (syncQueue.length > 0) {
      processSyncQueue();
    }
  }, [syncQueue, addNetworkEvent, queryClient, processSyncQueue]);

  // Handle offline event
  const handleOffline = useCallback(() => {
    addNetworkEvent("offline", {
      lastOnline: lastOnline?.toISOString(),
      networkInfo: getNetworkInfo(),
    });

    queryClient.invalidateQueries({ queryKey: ["network"] });
  }, [lastOnline, addNetworkEvent, queryClient]);

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

  // Monitor connection changes
  useConnectionMonitoring({
    handlers: {
      onOnline: handleOnline,
      onOffline: handleOffline,
      addNetworkEvent,
    },
    offlineStatus,
    lastOnline: {
      value: lastOnline,
      setValue: setLastOnline,
    },
  });

  return {
    // Status
    ...offlineStatus,
    capabilities,

    // Events
    networkEvents,

    // Sync management
    queueForSync,
    clearSyncQueue,
    retrySync,
    processSyncQueue,

    // Computed properties
    connectionStrength: offlineStatus?.networkQuality ?? NetworkQuality.OFFLINE,
    canPerformOperations: offlineStatus?.isOnline ?? false,
    needsSync: (offlineStatus?.syncQueueSize ?? 0) > 0,

    // Helper methods
    isGoodConnection:
      offlineStatus?.networkQuality === NetworkQuality.EXCELLENT ||
      offlineStatus?.networkQuality === NetworkQuality.GOOD,
    isPoorConnection: offlineStatus?.networkQuality === NetworkQuality.POOR,
    hasRecentEvents:
      networkEvents.filter((e) => Date.now() - e.timestamp.getTime() < 60000)
        .length > 0,
  };
};
