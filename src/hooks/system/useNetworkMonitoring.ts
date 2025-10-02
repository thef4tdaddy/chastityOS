/**
 * Network Monitoring
 *
 * Monitors network connection changes and sets up event listeners.
 */
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { OfflineStatus } from "./useOfflineStatus";

interface UseNetworkMonitoringProps {
  lastOnline: Date | null;
  setLastOnline: (date: Date | null) => void;
  offlineStatus: OfflineStatus | undefined;
  handleOnline: () => void;
  handleOffline: () => void;
  addNetworkEvent: (
    type: "online" | "offline" | "quality-change",
    details?: Record<string, string | number | boolean>,
  ) => void;
  getNetworkInfo: () => {
    downlink: number;
    rtt: number;
    effectiveType: string;
    type: string;
  };
  getNetworkQuality: (downlink: number, rtt: number) => string;
}

export const useNetworkMonitoring = ({
  lastOnline,
  setLastOnline,
  offlineStatus,
  handleOnline,
  handleOffline,
  addNetworkEvent,
  getNetworkInfo,
  getNetworkQuality,
}: UseNetworkMonitoringProps) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleConnectionChange = () => {
      const networkInfo = getNetworkInfo();
      const newQuality = getNetworkQuality(
        networkInfo.downlink,
        networkInfo.rtt,
      );

      if (offlineStatus && newQuality !== offlineStatus.networkQuality) {
        addNetworkEvent("quality-change", {
          oldQuality: offlineStatus.networkQuality,
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
  }, [
    handleOnline,
    handleOffline,
    offlineStatus,
    queryClient,
    lastOnline,
    setLastOnline,
  ]);
};
