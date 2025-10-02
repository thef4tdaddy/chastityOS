/**
 * useOfflineStatus Hook - Network Status Monitoring
 *
 * Monitor network connectivity and provide offline capabilities with intelligent
 * sync when connection is restored.
 */

import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { logger } from "../../utils/logging";

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
  details?: Record<string, string | number | boolean>;
}

/**
 * Network Status Hook
 */
export const useOfflineStatus = () => {
  const queryClient = useQueryClient();
  const [networkEvents, setNetworkEvents] = useState<NetworkEvent[]>([]);
  const [syncQueue, setSyncQueue] = useState<Record<string, unknown>[]>([]);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);

  // Get network information if available
  const getNetworkInfo = useCallback(() => {
    const nav = navigator as Navigator & {
      connection?: {
        downlink?: number;
        rtt?: number;
        effectiveType?: string;
        type?: string;
        addEventListener?: (
          type: string,
          listener: (event: Event) => void,
        ) => void;
      };
      mozConnection?: {
        downlink?: number;
        rtt?: number;
        effectiveType?: string;
        type?: string;
        addEventListener?: (
          type: string,
          listener: (event: Event) => void,
        ) => void;
      };
      webkitConnection?: {
        downlink?: number;
        rtt?: number;
        effectiveType?: string;
        type?: string;
        addEventListener?: (
          type: string,
          listener: (event: Event) => void,
        ) => void;
      };
    };
    const connection =
      nav.connection || nav.mozConnection || nav.webkitConnection;

    return {
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      effectiveType: connection?.effectiveType || "unknown",
      type: connection?.type || ConnectionType.UNKNOWN,
    };
  }, []);

  // Determine network quality
  const getNetworkQuality = useCallback(
    (downlink: number, rtt: number): NetworkQuality => {
      if (!navigator.onLine) return NetworkQuality.OFFLINE;

      if (downlink >= 10 && rtt < 100) return NetworkQuality.EXCELLENT;
      if (downlink >= 5 && rtt < 200) return NetworkQuality.GOOD;
      if (downlink >= 1.5 && rtt < 500) return NetworkQuality.FAIR;
      return NetworkQuality.POOR;
    },
    [],
  );

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
    (
      type: NetworkEvent["type"],
      details?: Record<string, string | number | boolean>,
    ) => {
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
  }, [lastOnline, addNetworkEvent, getNetworkInfo, queryClient]);

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

  // Monitor connection changes
  useEffect(() => {
    const handleConnectionChange = () => {
      const networkInfo = getNetworkInfo();
      const newQuality = getNetworkQuality(
        networkInfo.downlink,
        networkInfo.rtt,
      );

      if (offlineStatus && newQuality !== offlineStatus?.networkQuality) {
        addNetworkEvent("quality-change", {
          oldQuality: offlineStatus?.networkQuality,
          newQuality,
          networkInfo,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["network", "status"] });
    };

    // Listen for online/offline events
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen for connection changes if supported
    const nav = navigator as Navigator & {
      connection?: {
        downlink?: number;
        rtt?: number;
        effectiveType?: string;
        type?: string;
        addEventListener?: (
          type: string,
          listener: (event: Event) => void,
        ) => void;
        removeEventListener?: (
          type: string,
          listener: (event: Event) => void,
        ) => void;
      };
      mozConnection?: {
        downlink?: number;
        rtt?: number;
        effectiveType?: string;
        type?: string;
        addEventListener?: (
          type: string,
          listener: (event: Event) => void,
        ) => void;
        removeEventListener?: (
          type: string,
          listener: (event: Event) => void,
        ) => void;
      };
      webkitConnection?: {
        downlink?: number;
        rtt?: number;
        effectiveType?: string;
        type?: string;
        addEventListener?: (
          type: string,
          listener: (event: Event) => void,
        ) => void;
        removeEventListener?: (
          type: string,
          listener: (event: Event) => void,
        ) => void;
      };
    };
    const connection =
      nav.connection || nav.mozConnection || nav.webkitConnection;
    if (connection) {
      connection.addEventListener("change", handleConnectionChange);
    }

    // Set initial online status
    if (navigator.onLine && !lastOnline) {
      setLastOnline(new Date());
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (connection) {
        connection.removeEventListener("change", handleConnectionChange);
      }
    };
    // addNetworkEvent, getNetworkInfo, getNetworkQuality are stable (no/stable deps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleOnline, handleOffline, offlineStatus, queryClient, lastOnline]);

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
