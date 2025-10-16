/**
 * Enhanced Data Synchronization Hook
 * Handles multi-user data sync, relationship data, and conflict resolution
 * with proper privacy controls
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { serviceLogger } from "../../utils/logging";
import {
  calculateOverallSyncQuality,
  getLastSuccessfulSync,
  getSyncInterval,
} from "../../utils/dataSyncHelpers";
import { useConflictResolution } from "./useConflictResolution";
import { useSyncBackup } from "./useSyncBackup";
import { useSyncMonitoring } from "./useSyncMonitoring";
import {
  useSyncPermissionsLoader,
  useSyncHistoryLoader,
  usePendingConflictsLoader,
  useRelationshipSyncLoader,
} from "./useDataSyncLoaders";
import {
  useManualSyncOperations,
  useSyncPermissionsManagement,
  useRealTimeSyncControls,
} from "./useDataSyncOperations";
import type {
  SyncStatus,
  SyncPermissions,
  SyncMetrics,
} from "./types/dataSync";

const logger = serviceLogger("useDataSync");

// Re-export types
export type * from "./types/dataSync";

// Complex sync orchestration hook requires many statements and lines for proper state management
// eslint-disable-next-line max-statements, max-lines-per-function
export const useDataSync = (userId: string) => {
  // ==================== STATE ====================

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    state: "idle",
    lastSync: null,
    progress: 0,
    message: "Ready to sync",
    error: null,
  });

  // Data loading hooks
  const { loadSyncPermissions } = useSyncPermissionsLoader(userId);
  const { loadSyncHistory } = useSyncHistoryLoader(userId);
  const { loadPendingConflicts, conflicts, setConflicts } =
    usePendingConflictsLoader(userId);
  const { loadRelationshipSyncStatus, relationshipSync, setRelationshipSync } =
    useRelationshipSyncLoader(userId);

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

  // ==================== REAL-TIME SYNC ====================

  useEffect(() => {
    if (!realTimeSyncEnabled || !syncPermissions.allowRealTimeSync) return;

    const syncInterval = getSyncInterval(syncPermissions.syncFrequency);
    const interval = setInterval(() => {
      performBackgroundSync();
    }, syncInterval);

    return () => clearInterval(interval);
  }, [realTimeSyncEnabled, syncPermissions, performBackgroundSync]);

  // ==================== SYNC OPERATIONS ====================

  const { forceSyncAll, syncRelationshipData } = useManualSyncOperations(
    userId,
    {
      syncStatus,
      setSyncStatus,
      setSyncMetrics,
      relationshipSync,
      setRelationshipSync,
    },
  );

  // ==================== PRIVACY AND PERMISSIONS ====================

  const { updateSyncPermissions, configureSyncScope } =
    useSyncPermissionsManagement(
      syncPermissions,
      setSyncPermissions,
      initializeRealTimeSync,
      setRealTimeSyncEnabled,
    );

  // ==================== REAL-TIME SYNC CONTROLS ====================

  const { enableRealtimeSync, disableRealtimeSync } = useRealTimeSyncControls(
    setRealTimeSyncEnabled,
  );

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
