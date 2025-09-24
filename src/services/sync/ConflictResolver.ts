
/**
 * Conflict Resolver
 * Implements strategies for resolving data conflicts between local and remote versions
 */
import { serviceLogger } from "@/utils/logging";
import type { DBSession, DBTask, DBSettings } from "@/types/database";

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

    const resolvedStatus = localStatusIndex > remoteStatusIndex ? local.status : remote.status;

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
    // TODO: Implement settings conflict resolution
    return remote;
  }
}

export const conflictResolver = new ConflictResolver();
