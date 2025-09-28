/**
 * Conflict Resolver
 * Implements strategies for resolving data conflicts between local and remote versions
 */
import { serviceLogger } from "@/utils/logging";
import type {
  DBSession,
  DBTask,
  DBSettings,
  ConflictInfo,
  SettingsConflict,
} from "@/types/database";

const logger = serviceLogger("ConflictResolver");

class ConflictResolver {
  constructor() {
    logger.info("ConflictResolver initialized");
  }

  /**
   * Resolve conflict for a session document
   * Strategy: Latest timestamp wins
   */
  resolveSessionConflict(local: DBSession, remote: DBSession): DBSession {
    logger.debug(`Resolving session conflict for ${local.id}`);
    return local.lastModified > remote.lastModified ? local : remote;
  }

  /**
   * Resolve conflict for a task document
   * Strategy: Merge status updates intelligently
   */
  resolveTaskConflict(local: DBTask, remote: DBTask): DBTask {
    logger.debug(`Resolving task conflict for ${local.id}`);

    const statusOrder: DBTask["status"][] = [
      "pending",
      "submitted",
      "rejected",
      "approved",
      "completed",
      "cancelled",
    ];

    const localStatusIndex = statusOrder.indexOf(local.status);
    const remoteStatusIndex = statusOrder.indexOf(remote.status);

    const resolvedStatus =
      localStatusIndex > remoteStatusIndex ? local.status : remote.status;

    return {
      ...remote, // remote wins for most fields
      ...local, // but local wins for some fields if newer
      status: resolvedStatus,
      lastModified: new Date(), // new timestamp
      syncStatus: "synced", // mark as synced
    };
  }

  /**
   * Resolve conflict for a settings document
   * Strategy: Merge non-conflicting fields and queue user choice for conflicts
   */
  resolveSettingsConflict(local: DBSettings, remote: DBSettings): DBSettings {
    logger.debug(`Resolving settings conflict for ${local.userId}`);

    // Start with the remote settings as base
    const merged: DBSettings = { ...remote };
    const conflicts: SettingsConflict[] = [];

    // System fields that should use latest timestamp
    const systemFields = ["lastModified", "syncStatus", "userId"];

    // Check each field for conflicts
    Object.keys(local).forEach((key) => {
      if (local[key as keyof DBSettings] !== remote[key as keyof DBSettings]) {
        if (systemFields.includes(key)) {
          // System fields: latest timestamp wins
          if (local.lastModified > remote.lastModified) {
            (merged as Record<string, unknown>)[key] = (local as Record<string, unknown>)[key];
          }
        } else {
          // For complex objects, do deep comparison
          const localVal = (local as Record<string, unknown>)[key];
          const remoteVal = (remote as Record<string, unknown>)[key];

          if (typeof localVal === "object" && typeof remoteVal === "object") {
            // Merge objects recursively where possible
            if (
              key === "notifications" ||
              key === "privacy" ||
              key === "chastity" ||
              key === "display"
            ) {
              (merged as Record<string, unknown>)[key] = this.mergeSettingsObject(
                localVal as Record<string, unknown>,
                remoteVal as Record<string, unknown>,
                local.lastModified,
                remote.lastModified,
              );
            } else {
              // For other objects, use timestamp rule
              (merged as Record<string, unknown>)[key] =
                local.lastModified > remote.lastModified ? localVal : remoteVal;
            }
          } else {
            // Simple values: use timestamp rule for automatic resolution
            (merged as Record<string, unknown>)[key] =
              local.lastModified > remote.lastModified ? localVal : remoteVal;
          }
        }
      }
    });

    // Update metadata
    merged.lastModified = new Date();
    merged.syncStatus = "synced";

    logger.info(`Settings conflict resolved for ${local.userId}`, {
      conflictsFound: conflicts.length,
      resolvedAutomatically: true,
    });

    return merged;
  }

  /**
   * Merge settings objects intelligently
   */
  private mergeSettingsObject(
    local: Record<string, any>,
    remote: Record<string, any>,
    localTimestamp: Date,
    remoteTimestamp: Date,
  ): Record<string, any> {
    const merged = { ...remote };

    Object.keys(local).forEach((key) => {
      if (local[key] !== remote[key]) {
        // Use latest timestamp for individual settings
        merged[key] =
          localTimestamp > remoteTimestamp ? local[key] : remote[key];
      }
    });

    return merged;
  }

  /**
   * Check if two documents have a conflict
   */
  hasConflict<T extends { lastModified: Date; syncStatus: string }>(
    local: T,
    remote: T,
  ): boolean {
    // If both have been modified since last sync, there's a potential conflict
    return (
      local.syncStatus === "pending" &&
      Math.abs(local.lastModified.getTime() - remote.lastModified.getTime()) >
        1000
    ); // 1 second tolerance
  }

  /**
   * Create conflict info for manual resolution
   */
  createConflictInfo(
    type: ConflictInfo["type"],
    collection: string,
    documentId: string,
    localData: Record<string, unknown>,
    remoteData: Record<string, unknown>,
  ): ConflictInfo {
    return {
      type,
      collection,
      documentId,
      localData,
      remoteData,
      detectedAt: new Date(),
      resolution: "pending",
    };
  }
}

export const conflictResolver = new ConflictResolver();
