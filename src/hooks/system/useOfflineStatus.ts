/**
 * useOfflineStatus Hook - Network Status Monitoring
 *
 * Monitor network connectivity and provide offline capabilities with intelligent
 * sync when connection is restored.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { logger } from "../../utils/logging";
import { useNetworkInfo } from "./useNetworkInfo";
import { useSyncQueue } from "./useSyncQueue";
import { useNetworkEvents } from "./useNetworkEvents";
import { useNetworkMonitoring } from "./useNetworkMonitoring";

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
  const [lastOnline, setLastOnline] = useState<Date | null>(null);

  // Network information helpers
  const { getNetworkInfo, getNetworkQuality } = useNetworkInfo();

  // Sync queue management
  const {
    syncQueue,
    processSyncQueue,
    queueForSync,
    clearSyncQueue,
    retrySync,
  } = useSyncQueue();

  // Network event tracking
  const { networkEvents, addNetworkEvent, handleOnline, handleOffline } =
    useNetworkEvents({
      syncQueueLength: syncQueue.length,
      lastOnline,
      setLastOnline,
      processSyncQueue,
      getNetworkInfo,
    });

  // Current offline status query
  const { data: offlineStatus } = useQuery<OfflineStatus>({
    queryKey: ["network", "status"],
    queryFn: () => {
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

  // Monitor connection changes
  useNetworkMonitoring({
    lastOnline,
    setLastOnline,
    offlineStatus,
    handleOnline,
    handleOffline,
    addNetworkEvent,
    getNetworkInfo,
    getNetworkQuality,
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
    connectionStrength: offlineStatus?.networkQuality || NetworkQuality.OFFLINE,
    canPerformOperations: offlineStatus?.isOnline || false,
    needsSync: (offlineStatus?.syncQueueSize || 0) > 0,

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
