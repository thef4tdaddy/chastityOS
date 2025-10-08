/**
 * useConnectionMonitoring Hook
 * Monitors network connection changes and manages event listeners
 */
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getNetworkInfo,
  getNetworkQuality,
} from "../../utils/system/offlineStatusHelpers";
import type { OfflineStatus, NetworkEvent } from "./useOfflineStatus";

/**
 * Options for the useConnectionMonitoring hook
 */
export interface ConnectionMonitoringOptions {
  /** Handlers for network events */
  handlers: {
    /** Called when the browser goes online */
    onOnline: () => void;
    /** Called when the browser goes offline */
    onOffline: () => void;
    /** Called to add a network event to the log */
    addNetworkEvent: (
      type: NetworkEvent["type"],
      details?: Record<string, unknown>,
    ) => void;
  };
  /** Current offline status */
  offlineStatus: OfflineStatus | undefined;
  /** State for last online timestamp */
  lastOnline: {
    /** Current last online timestamp */
    value: Date | null;
    /** Setter for last online timestamp */
    setValue: (date: Date) => void;
  };
}

export function useConnectionMonitoring(options: ConnectionMonitoringOptions) {
  const { handlers, offlineStatus, lastOnline } = options;
  const { onOnline, onOffline, addNetworkEvent } = handlers;
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
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

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
    if (navigator.onLine && !lastOnline.value) {
      lastOnline.setValue(new Date());
    }

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      if (connection && connection.removeEventListener) {
        connection.removeEventListener("change", handleConnectionChange);
      }
    };
    // addNetworkEvent, getNetworkInfo, getNetworkQuality are stable (no/stable deps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onOnline, onOffline, offlineStatus, queryClient, lastOnline]);
}
