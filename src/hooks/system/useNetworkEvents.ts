/**
 * Network Event Tracking
 *
 * Tracks and manages network connectivity events.
 */
import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { logger } from "../../utils/logging";
import type { NetworkEvent } from "./useOfflineStatus";

interface UseNetworkEventsProps {
  syncQueueLength: number;
  lastOnline: Date | null;
  setLastOnline: (date: Date | null) => void;
  processSyncQueue: () => void;
  getNetworkInfo: () => {
    downlink: number;
    rtt: number;
    effectiveType: string;
    type: string;
  };
}

export const useNetworkEvents = ({
  syncQueueLength,
  lastOnline,
  setLastOnline,
  processSyncQueue,
  getNetworkInfo,
}: UseNetworkEventsProps) => {
  const queryClient = useQueryClient();
  const [networkEvents, setNetworkEvents] = useState<NetworkEvent[]>([]);

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
      syncQueueSize: syncQueueLength,
    });

    queryClient.invalidateQueries({ queryKey: ["network"] });

    // Process sync queue when back online
    if (syncQueueLength > 0) {
      processSyncQueue();
    }
  }, [
    syncQueueLength,
    addNetworkEvent,
    queryClient,
    processSyncQueue,
    setLastOnline,
  ]);

  // Handle offline event
  const handleOffline = useCallback(() => {
    addNetworkEvent("offline", {
      lastOnline: lastOnline?.toISOString(),
      networkInfo: getNetworkInfo(),
    });

    queryClient.invalidateQueries({ queryKey: ["network"] });
  }, [lastOnline, addNetworkEvent, getNetworkInfo, queryClient]);

  return {
    networkEvents,
    addNetworkEvent,
    handleOnline,
    handleOffline,
  };
};
