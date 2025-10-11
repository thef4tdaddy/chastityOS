/**
 * Session Conflict Resolver
 * Type-safe conflict resolution specifically for DBSession objects
 */
import { serviceLogger } from "@/utils/logging";
import type { DBSession } from "@/types/database";

const logger = serviceLogger("SessionConflictResolver");

export class SessionConflictResolver {
  /**
   * Resolve conflict for a session document
   * Strategy:
   * - Active sessions (no endTime) always take precedence
   * - For completed sessions, latest timestamp wins
   * - Preserve important session metadata
   */
  resolve(local: DBSession, remote: DBSession): DBSession {
    logger.debug(`Resolving session conflict for ${local.id}`);

    // If one is active (no endTime), it wins
    if (local.endTime === null || local.endTime === undefined) {
      logger.info(`Local session is active, taking precedence`);
      return {
        ...local,
        lastModified: new Date(),
        syncStatus: "synced",
      };
    }

    if (remote.endTime === null || remote.endTime === undefined) {
      logger.info(`Remote session is active, taking precedence`);
      return {
        ...remote,
        lastModified: new Date(),
        syncStatus: "synced",
      };
    }

    // Both sessions are completed - use latest timestamp
    const winner = local.lastModified > remote.lastModified ? local : remote;

    logger.info(`Session conflict resolved using timestamp for ${local.id}`, {
      winnerSource: winner === local ? "local" : "remote",
    });

    return {
      ...winner,
      lastModified: new Date(),
      syncStatus: "synced",
    };
  }

  /**
   * Check if a session is currently active
   */
  isActiveSession(session: DBSession): boolean {
    return session.endTime === null || session.endTime === undefined;
  }

  /**
   * Merge session metadata for edge cases where both versions have valuable data
   * This is rarely used but helpful for preserving notes and flags
   */
  mergeSessionMetadata(
    local: DBSession,
    remote: DBSession,
    base: DBSession,
  ): DBSession {
    return {
      ...base,
      // Combine notes if both exist
      notes:
        local.notes && remote.notes && local.notes !== remote.notes
          ? `${local.notes}\n---\n${remote.notes}`
          : local.notes || remote.notes,
      // Preserve emergency unlock flags from either version
      isEmergencyUnlock: local.isEmergencyUnlock || remote.isEmergencyUnlock,
      emergencyReason: local.emergencyReason || remote.emergencyReason,
      emergencyNotes: local.emergencyNotes || remote.emergencyNotes,
      emergencyPinUsed: local.emergencyPinUsed || remote.emergencyPinUsed,
      hasLockCombination: local.hasLockCombination || remote.hasLockCombination,
    };
  }
}

export const sessionConflictResolver = new SessionConflictResolver();
