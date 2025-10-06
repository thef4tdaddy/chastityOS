/**
 * useConnectionMonitoring Hook
 * Monitors network connection changes and manages event listeners
 */
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getNetworkInfo, getNetworkQuality } from "./offlineStatusHelpers";
import type { OfflineStatus, NetworkEvent } from "./useOfflineStatus";

export function useConnectionMonitoring(
  handleOnline: () => void,
  handleOffline: () => void,
  addNetworkEvent: (
    type: NetworkEvent["type"],
    details?: Record<string, unknown>,
  ) => void,
  offlineStatus: OfflineStatus | undefined,
  lastOnline: Date | null,
  setLastOnline: (date: Date) => void,
) {
  const queryClient = useQueryClient();

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
    if (connection && connection.addEventListener) {
      connection.addEventListener("change", handleConnectionChange);
    }

    // Set initial online status
    if (navigator.onLine && !lastOnline) {
      setLastOnline(new Date());
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (connection && connection.removeEventListener) {
        connection.removeEventListener("change", handleConnectionChange);
      }
    };
    // addNetworkEvent, getNetworkInfo, getNetworkQuality are stable (no/stable deps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleOnline, handleOffline, offlineStatus, queryClient, lastOnline]);
}
