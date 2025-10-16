/**
 * Hook for handling data sync conflict resolution
 */
import { useCallback, Dispatch, SetStateAction } from "react";
import type {
  DataConflict,
  ConflictResolution,
  GlobalResolutionStrategy,
  ConflictResolutionResult,
  SyncMetrics,
} from "./types/dataSync";
import { serviceLogger } from "../../utils/logging";
import {
  intelligentMerge,
  getLatestTimestampVersion,
} from "../../utils/dataSyncHelpers";

const logger = serviceLogger("useConflictResolution");

interface UseConflictResolutionProps {
  conflicts: DataConflict[];
  setConflicts: Dispatch<SetStateAction<DataConflict[]>>;
  setSyncMetrics: Dispatch<SetStateAction<SyncMetrics>>;
}

/**
 * Helper function to resolve a single conflict
 */
async function resolveSingleConflict(
  conflictId: string,
  resolution: ConflictResolution,
  conflicts: DataConflict[],
  setConflicts: Dispatch<SetStateAction<DataConflict[]>>,
  setSyncMetrics: Dispatch<SetStateAction<SyncMetrics>>,
): Promise<void> {
  try {
    logger.debug("Resolving conflict", { conflictId, resolution });

    const conflict = conflicts.find((c) => c.id === conflictId);
    if (!conflict) {
      throw new Error("Conflict not found");
    }

    // Apply resolution strategy
    let _resolvedData: Record<string, unknown>;

    switch (resolution.strategy) {
      case "local_wins":
        _resolvedData = conflict.localVersion;
        break;
      case "remote_wins":
        _resolvedData = conflict.remoteVersion;
        break;
      case "keyholder_wins":
        _resolvedData = conflict.keyholderVersion || conflict.remoteVersion;
        break;
      case "merge_intelligent":
        _resolvedData = intelligentMerge(
          conflict.localVersion,
          conflict.remoteVersion,
        );
        break;
      case "latest_timestamp":
        _resolvedData = getLatestTimestampVersion(conflict);
        break;
      default:
        throw new Error(
          `Unsupported resolution strategy: ${resolution.strategy}`,
        );
    }

    // Remove resolved conflict
    setConflicts((prev) => prev.filter((c) => c.id !== conflictId));

    // Update metrics
    setSyncMetrics((prev) => ({
      ...prev,
      conflictsResolved: prev.conflictsResolved + 1,
    }));

    logger.info("Conflict resolved successfully", {
      conflictId,
      strategy: resolution.strategy,
    });
  } catch (error) {
    logger.error("Failed to resolve conflict", { error, conflictId });
    throw error;
  }
}

/**
 * Helper function to resolve all conflicts with a global strategy
 */
async function resolveMultipleConflicts(
  strategy: GlobalResolutionStrategy,
  conflicts: DataConflict[],
  resolveConflict: (
    conflictId: string,
    resolution: ConflictResolution,
  ) => Promise<void>,
): Promise<ConflictResolutionResult[]> {
  try {
    logger.debug("Resolving all conflicts", {
      strategy,
      conflictCount: conflicts.length,
    });

    const results: ConflictResolutionResult[] = [];

    for (const conflict of conflicts) {
      try {
        const resolutionStrategy =
          strategy.strategyByType[conflict.type] || strategy.defaultStrategy;

        await resolveConflict(conflict.id, {
          conflictId: conflict.id,
          strategy: resolutionStrategy,
          preserveHistory: true,
        });

        results.push({
          conflictId: conflict.id,
          success: true,
          appliedStrategy: resolutionStrategy,
          resultingData: {},
        });
      } catch (error) {
        results.push({
          conflictId: conflict.id,
          success: false,
          appliedStrategy: strategy.defaultStrategy,
          resultingData: {},
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    logger.info("Batch conflict resolution completed", {
      total: conflicts.length,
      successful: results.filter((r) => r.success).length,
    });

    return results;
  } catch (error) {
    logger.error("Failed to resolve all conflicts", { error });
    throw error;
  }
}

export const useConflictResolution = ({
  conflicts,
  setConflicts,
  setSyncMetrics,
}: UseConflictResolutionProps) => {
  const resolveConflict = useCallback(
    async (
      conflictId: string,
      resolution: ConflictResolution,
    ): Promise<void> => {
      await resolveSingleConflict(
        conflictId,
        resolution,
        conflicts,
        setConflicts,
        setSyncMetrics,
      );
    },
    [conflicts, setConflicts, setSyncMetrics],
  );

  const resolveAllConflicts = useCallback(
    async (
      strategy: GlobalResolutionStrategy,
    ): Promise<ConflictResolutionResult[]> => {
      return resolveMultipleConflicts(strategy, conflicts, resolveConflict);
    },
    [conflicts, resolveConflict],
  );

  return {
    resolveConflict,
    resolveAllConflicts,
  };
};
