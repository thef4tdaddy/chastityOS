/**
 * Conflict Resolver
 * Implements strategies for resolving data conflicts between local and remote versions
 * Routes to specialized resolvers for type-safe conflict resolution
 */
import { serviceLogger } from "@/utils/logging";
import type {
  DBSession,
  DBTask,
  DBSettings,
  ConflictInfo,
} from "@/types/database";
import { settingsConflictResolver } from "./resolvers/SettingsConflictResolver";
import { sessionConflictResolver } from "./resolvers/SessionConflictResolver";

const logger = serviceLogger("ConflictResolver");

class ConflictResolver {
  constructor() {
    logger.info("ConflictResolver initialized");
  }

  /**
   * Resolve conflict for a session document
   * Delegates to SessionConflictResolver for type-safe resolution
   */
  resolveSessionConflict(local: DBSession, remote: DBSession): DBSession {
    logger.debug(`Delegating session conflict resolution for ${local.id}`);
    return sessionConflictResolver.resolve(local, remote);
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
   * Delegates to SettingsConflictResolver for type-safe resolution
   */
  resolveSettingsConflict(local: DBSettings, remote: DBSettings): DBSettings {
    logger.debug(`Delegating settings conflict resolution for ${local.userId}`);
    return settingsConflictResolver.resolve(local, remote);
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
