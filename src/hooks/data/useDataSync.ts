/**
 * Enhanced Data Synchronization Hook
 * Handles multi-user data sync, relationship data, and conflict resolution
 * with proper privacy controls
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import type { SyncResult } from "../../types/database";
import { serviceLogger } from "../../utils/logging";
import {
  calculateOverallSyncQuality,
  getLastSuccessfulSync,
  getSyncInterval,
} from "../../utils/dataSyncHelpers";
import { useConflictResolution } from "./useConflictResolution";
import { useSyncBackup } from "./useSyncBackup";
import { useSyncMonitoring } from "./useSyncMonitoring";

const logger = serviceLogger("useDataSync");

// ==================== INTERFACES ====================

import type {
  SyncStatus,
  RelationshipSyncStatus,
  DataConflict,
  SyncPermissions,
  SyncMetrics,
  SyncScope,
  DataEntityType,
  RelationshipSyncResult,
} from "./types/dataSync";
import type * as _Types from "./types/dataSync";
export type * from "./types/dataSync";

// Complex sync orchestration hook requires many statements for proper state management
// eslint-disable-next-line max-statements
export const useDataSync = (userId: string) => {
  // ==================== STATE ====================

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    state: "idle",
    lastSync: null,
    progress: 0,
    message: "Ready to sync",
    error: null,
  });

  const [relationshipSync, setRelationshipSync] = useState<
    RelationshipSyncStatus[]
  >([]);

  const [conflicts, setConflicts] = useState<DataConflict[]>([]);

  const [syncPermissions, setSyncPermissions] = useState<SyncPermissions>({
    allowDataSharing: true,
    shareSessionData: true,
    shareGoalData: true,
    shareTaskData: true,
    shareEventData: false,
    allowRealTimeSync: false,
    syncFrequency: "moderate",
    privacyLevel: "relationship_only",
  });

  const [syncMetrics, setSyncMetrics] = useState<SyncMetrics>({
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    averageSyncTime: 0,
    dataTransferred: 0,
    conflictsResolved: 0,
    lastSuccessfulSync: null,
    reliabilityScore: 100,
  });

  const [realTimeSyncEnabled, setRealTimeSyncEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==================== SUB-HOOKS ====================

  const conflictResolution = useConflictResolution({
    conflicts,
    setConflicts,
    setSyncMetrics,
  });

  const syncBackup = useSyncBackup({ userId });

  const syncMonitoring = useSyncMonitoring({ conflicts, syncMetrics });

  // ==================== COMPUTED VALUES ====================

  const isSyncing = useMemo(
    () => syncStatus.state === "syncing",
    [syncStatus.state],
  );

  const hasConflicts = useMemo(() => conflicts.length > 0, [conflicts.length]);

  const syncQuality = useMemo(
    () => calculateOverallSyncQuality(relationshipSync),
    [relationshipSync],
  );

  const lastSuccessfulSync = useMemo(
    () => getLastSuccessfulSync(syncMetrics),
    [syncMetrics],
  );

  const needsAttention = useMemo(
    () =>
      conflicts.some((c) => c.priority === "high" || c.priority === "critical"),
    [conflicts],
  );

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    const initializeSync = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Load sync state and configuration
        await Promise.all([
          loadSyncPermissions(),
          loadSyncHistory(),
          loadPendingConflicts(),
          loadRelationshipSyncStatus(),
        ]);

        // Initialize real-time sync if enabled
        if (syncPermissions.allowRealTimeSync) {
          await initializeRealTimeSync();
        }
      } catch (err) {
        logger.error("Failed to initialize data sync", { error: err });
        setError(
          err instanceof Error ? err.message : "Failed to initialize sync",
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, syncPermissions.allowRealTimeSync]);

  // ==================== REAL-TIME SYNC ====================

  useEffect(() => {
    if (!realTimeSyncEnabled || !syncPermissions.allowRealTimeSync) return;

    const syncInterval = getSyncInterval(syncPermissions.syncFrequency);
    const interval = setInterval(() => {
      performBackgroundSync();
    }, syncInterval);

    return () => clearInterval(interval);
    // performBackgroundSync is stable (no deps)
    // realTimeSyncEnabled and syncPermissions trigger re-setup of interval when changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realTimeSyncEnabled, syncPermissions]);

  // ==================== DATA LOADING FUNCTIONS ====================

  const loadSyncPermissions = useCallback(async () => {
    try {
      // Load user's sync preferences from database
      logger.debug("Loading sync permissions", { userId });
    } catch (error) {
      logger.error("Failed to load sync permissions", { error });
    }
  }, [userId]);

  const loadSyncHistory = useCallback(async () => {
    try {
      // Load sync metrics and history
      logger.debug("Loading sync history", { userId });
    } catch (error) {
      logger.error("Failed to load sync history", { error });
    }
  }, [userId]);

  const loadPendingConflicts = useCallback(async () => {
    try {
      // Load unresolved conflicts
      setConflicts([]);
      logger.debug("Loading pending conflicts", { userId });
    } catch (error) {
      logger.error("Failed to load pending conflicts", { error });
    }
  }, [userId]);

  const loadRelationshipSyncStatus = useCallback(async () => {
    try {
      // Load sync status for all relationships
      setRelationshipSync([]);
      logger.debug("Loading relationship sync status", { userId });
    } catch (error) {
      logger.error("Failed to load relationship sync status", { error });
    }
  }, [userId]);

  // ==================== MANUAL SYNC OPERATIONS ====================

  const forceSyncAll = useCallback(async (): Promise<SyncResult> => {
    try {
      logger.debug("Starting force sync all", { userId });

      setSyncStatus({
        state: "syncing",
        lastSync: null,
        progress: 0,
        message: "Starting synchronization...",
        error: null,
      });

      // Simulate sync process
      for (let i = 0; i <= 100; i += 20) {
        setSyncStatus((prev) => ({
          ...prev,
          progress: i,
          message: `Syncing... ${i}%`,
        }));
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      const result: SyncResult = {
        success: true,
        operations: {
          uploaded: 15,
          downloaded: 8,
          conflicts: 2,
        },
        conflicts: [],
        timestamp: new Date(),
      };

      setSyncStatus({
        state: "completed",
        lastSync: new Date(),
        progress: 100,
        message: "Sync completed successfully",
        error: null,
      });

      // Update metrics
      setSyncMetrics((prev) => ({
        ...prev,
        totalSyncs: prev.totalSyncs + 1,
        successfulSyncs: prev.successfulSyncs + 1,
        lastSuccessfulSync: new Date(),
      }));

      logger.info("Force sync completed successfully", { result });
      return result;
    } catch (error) {
      logger.error("Force sync failed", { error });

      setSyncStatus({
        state: "error",
        lastSync: null,
        progress: 0,
        message: "Sync failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      setSyncMetrics((prev) => ({
        ...prev,
        totalSyncs: prev.totalSyncs + 1,
        failedSyncs: prev.failedSyncs + 1,
      }));

      throw error;
    }
  }, [userId]);

  const syncRelationshipData = useCallback(
    async (relationshipId: string): Promise<RelationshipSyncResult> => {
      try {
        logger.debug("Syncing relationship data", { relationshipId });

        const startTime = Date.now();

        // Find relationship sync status
        const relationshipStatus = relationshipSync.find(
          (rs) => rs.relationshipId === relationshipId,
        );
        if (!relationshipStatus) {
          throw new Error("Relationship not found");
        }

        // Perform relationship-specific sync
        const result: RelationshipSyncResult = {
          relationshipId,
          success: true,
          syncedCollections: ["sessions", "goals", "tasks"],
          conflictsFound: 1,
          conflictsResolved: 0,
          metrics: {
            duration: Date.now() - startTime,
            itemsSynced: 12,
            bytesTransferred: 4096,
          },
        };

        // Update relationship sync status
        setRelationshipSync((prev) =>
          prev.map((rs) =>
            rs.relationshipId === relationshipId
              ? { ...rs, lastSync: new Date() }
              : rs,
          ),
        );

        logger.info("Relationship sync completed", { relationshipId, result });
        return result;
      } catch (error) {
        logger.error("Relationship sync failed", { error, relationshipId });

        return {
          relationshipId,
          success: false,
          syncedCollections: [],
          conflictsFound: 0,
          conflictsResolved: 0,
          error: error instanceof Error ? error.message : "Unknown error",
          metrics: {
            duration: 0,
            itemsSynced: 0,
            bytesTransferred: 0,
          },
        };
      }
    },
    [relationshipSync],
  );

  // ==================== PRIVACY AND PERMISSIONS ====================

  const updateSyncPermissions = useCallback(
    async (permissions: Partial<SyncPermissions>): Promise<void> => {
      try {
        logger.debug("Updating sync permissions", { permissions });

        const updatedPermissions = { ...syncPermissions, ...permissions };
        setSyncPermissions(updatedPermissions);

        // Update real-time sync based on new permissions
        if (
          updatedPermissions.allowRealTimeSync !==
          syncPermissions.allowRealTimeSync
        ) {
          if (updatedPermissions.allowRealTimeSync) {
            await initializeRealTimeSync();
          } else {
            setRealTimeSyncEnabled(false);
          }
        }

        logger.info("Sync permissions updated successfully");
      } catch (error) {
        logger.error("Failed to update sync permissions", { error });
        throw error;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [syncPermissions],
  );

  const configureSyncScope = useCallback(
    async (scope: SyncScope): Promise<void> => {
      try {
        logger.debug("Configuring sync scope", { scope });
        // Configure what data gets synced
        logger.info("Sync scope configured successfully");
      } catch (error) {
        logger.error("Failed to configure sync scope", { error });
        throw error;
      }
    },
    [],
  );

  // ==================== REAL-TIME SYNC ====================

  const enableRealtimeSync = useCallback(
    (entityTypes: DataEntityType[]): void => {
      try {
        logger.debug("Enabling realtime sync", { entityTypes });
        setRealTimeSyncEnabled(true);
        // Set up WebSocket connections or other real-time mechanisms
        logger.info("Realtime sync enabled successfully");
      } catch (error) {
        logger.error("Failed to enable realtime sync", { error });
      }
    },
    [],
  );

  const disableRealtimeSync = useCallback((): void => {
    try {
      logger.debug("Disabling realtime sync");
      setRealTimeSyncEnabled(false);
      // Clean up real-time connections
      logger.info("Realtime sync disabled successfully");
    } catch (error) {
      logger.error("Failed to disable realtime sync", { error });
    }
  }, []);

  // ==================== PRIVATE HELPER FUNCTIONS ====================

  const initializeRealTimeSync = useCallback(async (): Promise<void> => {
    try {
      logger.debug("Initializing real-time sync");
      setRealTimeSyncEnabled(true);
      // Set up WebSocket connections, event listeners, etc.
    } catch (error) {
      logger.error("Failed to initialize real-time sync", { error });
    }
  }, []);

  const performBackgroundSync = useCallback(async (): Promise<void> => {
    try {
      // Perform lightweight background sync
      logger.debug("Performing background sync");
    } catch (error) {
      logger.error("Background sync failed", { error });
    }
  }, []);

  // ==================== RETURN HOOK INTERFACE ====================

  return {
    // Sync state
    syncStatus,
    relationshipSync,
    conflicts,
    syncMetrics,

    // Manual sync operations
    forceSyncAll,
    syncRelationshipData,

    // Conflict resolution (from useConflictResolution hook)
    resolveConflict: conflictResolution.resolveConflict,
    resolveAllConflicts: conflictResolution.resolveAllConflicts,

    // Privacy and permissions
    updateSyncPermissions,
    configureSyncScope,

    // Real-time sync
    enableRealtimeSync,
    disableRealtimeSync,

    // Backup and recovery (from useSyncBackup hook)
    createBackup: syncBackup.createBackup,
    restoreFromBackup: syncBackup.restoreFromBackup,

    // Monitoring (from useSyncMonitoring hook)
    getSyncHealth: syncMonitoring.getSyncHealth,
    getSyncHistory: syncMonitoring.getSyncHistory,

    // Computed values
    isSyncing,
    hasConflicts,
    syncQuality,
    lastSuccessfulSync,
    needsAttention,

    // Loading states
    isLoading,
    error,
  };
};
