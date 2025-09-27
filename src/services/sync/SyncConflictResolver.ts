/**
 * Sync Conflict Resolver
 * Handles cross-type conflict resolution for Firebase sync operations
 */
import { serviceLogger } from "@/utils/logging";
import type {
  DBBase,
  DBSession,
  DBTask,
  DBSettings,
  DBEvent,
  DBGoal,
  ConflictInfo,
} from "@/types/database";
import { conflictResolver } from "./ConflictResolver";

const logger = serviceLogger("SyncConflictResolver");

export class SyncConflictResolver {
  private conflictQueue: ConflictInfo[] = [];

  constructor() {
    logger.info("SyncConflictResolver initialized");
  }

  /**
   * Auto-resolve conflict using collection-specific strategies
   */
  async autoResolveConflict(conflict: ConflictInfo): Promise<DBBase> {
    const { collection: collectionName, localData, remoteData } = conflict;

    logger.debug(`Auto-resolving conflict for ${collectionName}`, {
      documentId: conflict.documentId,
    });

    let resolvedDoc: DBBase;

    switch (collectionName) {
      case "sessions":
        resolvedDoc = conflictResolver.resolveSessionConflict(
          localData as unknown as DBSession,
          remoteData as unknown as DBSession,
        );
        break;
      case "tasks":
        resolvedDoc = conflictResolver.resolveTaskConflict(
          localData as unknown as DBTask,
          remoteData as unknown as DBTask,
        );
        break;
      case "settings":
        resolvedDoc = conflictResolver.resolveSettingsConflict(
          localData as unknown as DBSettings,
          remoteData as unknown as DBSettings,
        );
        break;
      case "events":
        // Events: latest timestamp wins
        resolvedDoc = this.resolveEventConflict(
          localData as unknown as DBEvent,
          remoteData as unknown as DBEvent,
        );
        break;
      case "goals":
        // Goals: merge progress intelligently
        resolvedDoc = this.resolveGoalConflict(
          localData as unknown as DBGoal,
          remoteData as unknown as DBGoal,
        );
        break;
      default:
        // Default: remote wins for unknown collections
        resolvedDoc = remoteData as unknown as DBBase;
        logger.warn(
          `Using default resolution (remote wins) for ${collectionName}`,
        );
        break;
    }

    logger.info("Auto-resolved conflict", {
      collection: collectionName,
      documentId: conflict.documentId,
    });

    return resolvedDoc;
  }

  /**
   * Resolve event conflicts - latest timestamp wins
   */
  private resolveEventConflict(local: DBEvent, remote: DBEvent): DBEvent {
    logger.debug(`Resolving event conflict for ${local.id}`);
    return local.lastModified > remote.lastModified ? local : remote;
  }

  /**
   * Resolve goal conflicts - merge progress intelligently
   */
  private resolveGoalConflict(local: DBGoal, remote: DBGoal): DBGoal {
    logger.debug(`Resolving goal conflict for ${local.id}`);

    // Use the one with most recent progress update
    const localProgress = local.progress || 0;
    const remoteProgress = remote.progress || 0;

    // If one has more progress, use that one
    if (localProgress !== remoteProgress) {
      return localProgress > remoteProgress ? local : remote;
    }

    // If progress is same, use latest timestamp
    return local.lastModified > remote.lastModified ? local : remote;
  }

  /**
   * Handle conflicts based on resolution strategy
   */
  async handleConflicts(
    conflicts: ConflictInfo[],
    strategy: "auto" | "manual" = "auto",
  ): Promise<DBBase[]> {
    const resolvedDocs: DBBase[] = [];

    if (strategy === "auto") {
      for (const conflict of conflicts) {
        try {
          const resolved = await this.autoResolveConflict(conflict);
          resolvedDocs.push(resolved);
        } catch (error) {
          logger.error("Failed to auto-resolve conflict", {
            error: error as Error,
            conflict: conflict.documentId,
          });
          // Queue for manual resolution on auto-resolve failure
          this.conflictQueue.push(conflict);
        }
      }
    } else {
      // Queue all for manual resolution
      this.conflictQueue.push(...conflicts);
    }

    return resolvedDocs;
  }

  /**
   * Get pending conflicts for manual resolution
   */
  getPendingConflicts(): ConflictInfo[] {
    return [...this.conflictQueue];
  }

  /**
   * Clear resolved conflicts from queue
   */
  clearResolvedConflicts(resolvedConflictIds: string[]): void {
    this.conflictQueue = this.conflictQueue.filter(
      (conflict) =>
        !resolvedConflictIds.includes(
          `${conflict.collection}-${conflict.documentId}`,
        ),
    );
  }

  /**
   * Check if a conflict exists between local and remote documents
   */
  hasConflict(local: DBBase, remote: DBBase): boolean {
    return conflictResolver.hasConflict(local, remote);
  }

  /**
   * Create conflict info for tracking
   */
  createConflictInfo(
    type: ConflictInfo["type"],
    collection: string,
    documentId: string,
    localData: Record<string, unknown>,
    remoteData: Record<string, unknown>,
  ): ConflictInfo {
    return conflictResolver.createConflictInfo(
      type,
      collection,
      documentId,
      localData,
      remoteData,
    );
  }
}

export const syncConflictResolver = new SyncConflictResolver();
