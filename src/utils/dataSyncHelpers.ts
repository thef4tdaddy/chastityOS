/**
 * Helper functions for data synchronization
 */
import type {
  RelationshipSyncStatus,
  SyncMetrics,
  SyncPermissions,
  DataConflict,
} from "../types/dataSync";

/**
 * Calculate the overall sync quality score across all relationships
 */
export function calculateOverallSyncQuality(
  relationshipSync: RelationshipSyncStatus[],
): number {
  if (relationshipSync.length === 0) return 100;

  const totalQuality = relationshipSync.reduce(
    (sum, rs) => sum + rs.syncQuality.score,
    0,
  );
  return Math.floor(totalQuality / relationshipSync.length);
}

/**
 * Get the date of the last successful sync from metrics
 */
export function getLastSuccessfulSync(metrics: SyncMetrics): Date | null {
  return metrics.lastSuccessfulSync;
}

/**
 * Get sync interval in milliseconds based on frequency setting
 */
export function getSyncInterval(
  frequency: SyncPermissions["syncFrequency"],
): number {
  switch (frequency) {
    case "realtime":
      return 5000; // 5 seconds
    case "frequent":
      return 30000; // 30 seconds
    case "moderate":
      return 300000; // 5 minutes
    case "minimal":
      return 3600000; // 1 hour
    default:
      return 300000;
  }
}

/**
 * Intelligently merge local and remote data objects
 */
export function intelligentMerge(
  local: Record<string, unknown>,
  remote: Record<string, unknown>,
): Record<string, unknown> {
  // Implement intelligent merge strategy
  // This is a simplified version - real implementation would be more sophisticated
  const merged = { ...local };

  Object.keys(remote).forEach((key) => {
    if (!(key in local)) {
      merged[key] = remote[key];
    } else if (
      typeof local[key] === "object" &&
      typeof remote[key] === "object"
    ) {
      // Recursively merge objects
      merged[key] = intelligentMerge(
        local[key] as Record<string, unknown>,
        remote[key] as Record<string, unknown>,
      );
    } else {
      // Use remote value if it's newer (simplified logic)
      merged[key] = remote[key];
    }
  });

  return merged;
}

/**
 * Get the version with the latest timestamp from a conflict
 */
export function getLatestTimestampVersion(
  conflict: DataConflict,
): Record<string, unknown> {
  const localTimestamp = new Date(
    (conflict.localVersion.lastModified as string) || 0,
  ).getTime();
  const remoteTimestamp = new Date(
    (conflict.remoteVersion.lastModified as string) || 0,
  ).getTime();

  return localTimestamp > remoteTimestamp
    ? conflict.localVersion
    : conflict.remoteVersion;
}
