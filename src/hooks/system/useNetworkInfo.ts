/**
 * Network Information Hook
 *
 * Provides network connectivity information and quality assessment.
 */
import { useCallback } from "react";
import { ConnectionType, NetworkQuality } from "./useOfflineStatus";

export const useNetworkInfo = () => {
  // Get network information if available
  const getNetworkInfo = useCallback(() => {
    const nav = navigator as Navigator & {
      connection?: {
        downlink?: number;
        rtt?: number;
        effectiveType?: string;
        type?: string;
      };
      mozConnection?: {
        downlink?: number;
        rtt?: number;
        effectiveType?: string;
        type?: string;
      };
      webkitConnection?: {
        downlink?: number;
        rtt?: number;
        effectiveType?: string;
        type?: string;
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

  return {
    getNetworkInfo,
    getNetworkQuality,
  };
};
