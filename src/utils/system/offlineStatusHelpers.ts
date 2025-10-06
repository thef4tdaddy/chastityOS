/**
 * Helper functions for useOfflineStatus hook
 * Extracted to reduce function complexity
 */
import { logger } from "../../utils/logging";
import type { NetworkQuality, ConnectionType } from "./useOfflineStatus";

/**
 * Get network information if available
 */
export function getNetworkInfo() {
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
    type: (connection?.type || "unknown") as ConnectionType,
  };
}

/**
 * Determine network quality
 */
export function getNetworkQuality(
  downlink: number,
  rtt: number,
): NetworkQuality {
  if (!navigator.onLine) return "offline" as NetworkQuality;

  if (downlink >= 10 && rtt < 100) return "excellent" as NetworkQuality;
  if (downlink >= 5 && rtt < 200) return "good" as NetworkQuality;
  if (downlink >= 1.5 && rtt < 500) return "fair" as NetworkQuality;
  return "poor" as NetworkQuality;
}

/**
 * Process sync queue
 */
export async function processSyncQueueItems(
  syncQueue: Record<string, unknown>[],
): Promise<{
  processedItems: Record<string, unknown>[];
  hasError: boolean;
}> {
  if (!navigator.onLine || syncQueue.length === 0) {
    return { processedItems: [], hasError: false };
  }

  logger.info("Processing sync queue", { queueSize: syncQueue.length });

  const processedItems: Record<string, unknown>[] = [];
  let hasError = false;

  for (const item of syncQueue) {
    try {
      // Here you would implement actual sync logic
      // For now, we'll just simulate processing
      await new Promise((resolve) => setTimeout(resolve, 100));
      processedItems.push(item);
      logger.debug("Sync item processed", { item });
    } catch (error) {
      logger.error("Failed to sync item", { item, error });
      hasError = true;
      break; // Stop processing on error
    }
  }

  logger.info("Sync queue processed", {
    processedCount: processedItems.length,
    remainingCount: syncQueue.length - processedItems.length,
  });

  return { processedItems, hasError };
}
