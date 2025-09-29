/**
 * useMultiWearer Hook
 * Manages multiple submissive relationships from a single keyholder interface
 * Enables bulk operations and efficient relationship switching
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthState } from "../../contexts";
import { useKeyholderRelationships } from "../useKeyholderRelationships";
import { KeyholderRelationship } from "../../types/core";
import { SessionGoals } from "./useKeyholderSession";
import { serviceLogger } from "../../utils/logging";

const logger = serviceLogger("useMultiWearer");

// ==================== TYPES ====================

export interface MultiWearerStats {
  totalRelationships: number;
  activeRelationships: number;
  activeSessions: number;
  totalSessionTime: number;
  averageSessionDuration: number;
  totalRewards: number;
  totalPunishments: number;
  totalTasks: number;
  completedTasks: number;
  lastActivity: Date | null;
}

export interface RelationshipOverview {
  id: string;
  submissiveId: string;
  submissiveName: string;
  status: "active" | "paused" | "offline";
  hasActiveSession: boolean;
  sessionDuration?: number;
  goalProgress?: number;
  pendingTasks: number;
  needsAttention: boolean;
  lastActivity: Date | null;
  connectionStatus: "online" | "offline" | "unknown";
  batteryLevel?: number;
}

export interface BulkOperationStatus {
  id: string;
  operation: string;
  targetIds: string[];
  status: "pending" | "running" | "completed" | "failed" | "partial";
  progress: number; // 0-100
  results: {
    [relationshipId: string]: {
      success: boolean;
      message?: string;
      error?: string;
    };
  };
  startTime: Date;
  completedTime?: Date;
  error?: string;
}

export interface TaskTemplate {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: Date;
  category?: string;
  consequence?: {
    type: "reward" | "punishment";
    description: string;
  };
}

export interface ComparativeStats {
  relationshipIds: string[];
  metrics: {
    totalSessionTime: { [id: string]: number };
    averageSessionDuration: { [id: string]: number };
    taskCompletionRate: { [id: string]: number };
    rewardCount: { [id: string]: number };
    punishmentCount: { [id: string]: number };
    lastActivity: { [id: string]: Date | null };
  };
  rankings: {
    mostActive: string[];
    longestSessions: string[];
    bestTaskCompletion: string[];
  };
}

export interface BulkMessage {
  content: string;
  priority: "low" | "normal" | "high" | "urgent";
  requiresResponse?: boolean;
  expiresAt?: Date;
}

export interface MultiWearerState {
  // All relationships where user is keyholder
  relationships: KeyholderRelationship[];

  // Relationship overviews with current status
  relationshipOverviews: RelationshipOverview[];

  // Currently selected/active relationship
  activeRelationship: KeyholderRelationship | null;

  // Bulk operation status
  bulkOperations: BulkOperationStatus[];

  // Overview stats
  overviewStats: MultiWearerStats;

  // Filter and search
  filters: {
    status: "all" | "active" | "offline" | "needs_attention";
    hasActiveSession: boolean | null;
    searchTerm: string;
  };

  // Favorites and pinned relationships
  pinnedRelationships: string[];

  // UI state
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastRefresh: Date | null;
}

export interface MultiWearerActions {
  // Relationship switching
  switchToRelationship: (relationshipId: string) => void;

  // Bulk operations
  startBulkOperation: (
    operation: string,
    targetIds: string[],
    options?: any,
  ) => Promise<BulkOperationStatus>;
  cancelBulkOperation: (operationId: string) => void;
  clearCompletedOperations: () => void;

  // Bulk session management
  bulkStartSessions: (
    relationshipIds: string[],
    goals?: SessionGoals,
  ) => Promise<BulkOperationStatus>;
  bulkStopSessions: (
    relationshipIds: string[],
    reason?: string,
  ) => Promise<BulkOperationStatus>;
  bulkPauseSessions: (
    relationshipIds: string[],
    reason: string,
  ) => Promise<BulkOperationStatus>;
  bulkResumeSessions: (
    relationshipIds: string[],
  ) => Promise<BulkOperationStatus>;

  // Bulk task management
  bulkAssignTasks: (
    relationshipIds: string[],
    task: TaskTemplate,
  ) => Promise<BulkOperationStatus>;
  bulkApproveAllTasks: (
    relationshipIds: string[],
  ) => Promise<BulkOperationStatus>;

  // Bulk rewards/punishments
  bulkSendRewards: (
    relationshipIds: string[],
    rewardId: string,
    reason?: string,
  ) => Promise<BulkOperationStatus>;
  bulkSendPunishments: (
    relationshipIds: string[],
    punishmentId: string,
    reason: string,
  ) => Promise<BulkOperationStatus>;

  // Communication
  sendBroadcastMessage: (
    message: BulkMessage,
    recipients: string[],
  ) => Promise<void>;
  sendIndividualMessage: (
    relationshipId: string,
    message: string,
  ) => Promise<void>;

  // Analytics
  getOverviewStats: () => MultiWearerStats;
  getComparativeStats: (relationshipIds: string[]) => ComparativeStats;

  // Filtering and search
  setFilter: (key: keyof MultiWearerState["filters"], value: any) => void;
  clearFilters: () => void;

  // Favorites management
  pinRelationship: (relationshipId: string) => void;
  unpinRelationship: (relationshipId: string) => void;

  // Data management
  refreshAllData: () => Promise<void>;
  refreshRelationshipOverview: (relationshipId: string) => Promise<void>;
  resetError: () => void;
}

// ==================== CONSTANTS ====================

const DEFAULT_FILTERS = {
  status: "all" as const,
  hasActiveSession: null,
  searchTerm: "",
};

const DEFAULT_STATS: MultiWearerStats = {
  totalRelationships: 0,
  activeRelationships: 0,
  activeSessions: 0,
  totalSessionTime: 0,
  averageSessionDuration: 0,
  totalRewards: 0,
  totalPunishments: 0,
  totalTasks: 0,
  completedTasks: 0,
  lastActivity: null,
};

// ==================== INITIAL STATE ====================

const initialState: MultiWearerState = {
  relationships: [],
  relationshipOverviews: [],
  activeRelationship: null,
  bulkOperations: [],
  overviewStats: DEFAULT_STATS,
  filters: DEFAULT_FILTERS,
  pinnedRelationships: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastRefresh: null,
};

// ==================== UTILITIES ====================

const generateOperationId = (): string => {
  return `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const createRelationshipOverview = (
  relationship: KeyholderRelationship,
): RelationshipOverview => {
  return {
    id: relationship.id,
    submissiveId: relationship.submissiveUserId,
    submissiveName: `Submissive ${relationship.submissiveUserId.slice(-4)}`, // TODO: Get actual name
    status: relationship.status === "active" ? "active" : "offline",
    hasActiveSession: false, // TODO: Check actual session status
    pendingTasks: 0, // TODO: Get actual task count
    needsAttention: false, // TODO: Calculate based on various factors
    lastActivity: relationship.acceptedAt || relationship.createdAt,
    connectionStatus: "unknown",
  };
};

// ==================== MAIN HOOK ====================

export const useMultiWearer = (keyholderId?: string) => {
  const { user } = useAuthState();
  const keyholderRelationships = useKeyholderRelationships();

  // Use provided keyholderId or fall back to current user
  const effectiveKeyholderId = keyholderId || user?.uid;

  const [state, setState] = useState<MultiWearerState>(initialState);

  // ==================== COMPUTED VALUES ====================

  const computedValues = useMemo(() => {
    const {
      relationships,
      relationshipOverviews,
      filters,
      pinnedRelationships,
    } = state;

    // Apply filters
    let filteredOverviews = relationshipOverviews;

    if (filters.status !== "all") {
      filteredOverviews = filteredOverviews.filter((overview) => {
        switch (filters.status) {
          case "active":
            return overview.status === "active";
          case "offline":
            return overview.status === "offline";
          case "needs_attention":
            return overview.needsAttention;
          default:
            return true;
        }
      });
    }

    if (filters.hasActiveSession !== null) {
      filteredOverviews = filteredOverviews.filter(
        (overview) => overview.hasActiveSession === filters.hasActiveSession,
      );
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredOverviews = filteredOverviews.filter(
        (overview) =>
          overview.submissiveName.toLowerCase().includes(searchLower) ||
          overview.submissiveId.toLowerCase().includes(searchLower),
      );
    }

    // Sort: pinned first, then by last activity
    const sortedOverviews = [...filteredOverviews].sort((a, b) => {
      const aPinned = pinnedRelationships.includes(a.id);
      const bPinned = pinnedRelationships.includes(b.id);

      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      const aTime = a.lastActivity?.getTime() || 0;
      const bTime = b.lastActivity?.getTime() || 0;
      return bTime - aTime;
    });

    return {
      totalRelationships: relationships.length,
      activeRelationships: relationshipOverviews.filter(
        (r) => r.status === "active",
      ).length,
      activeSessions: relationshipOverviews.filter((r) => r.hasActiveSession)
        .length,
      requiresAttention: relationshipOverviews.filter((r) => r.needsAttention)
        .length,
      canPerformBulkOperations: relationships.length > 1,
      hasFiltersApplied:
        filters.status !== "all" ||
        filters.hasActiveSession !== null ||
        filters.searchTerm !== "",
      filteredOverviews: sortedOverviews,
      pinnedCount: pinnedRelationships.length,
      runningOperations: state.bulkOperations.filter(
        (op) => op.status === "running",
      ).length,
    };
  }, [state]);

  // ==================== RELATIONSHIP MANAGEMENT ====================

  const switchToRelationship = useCallback(
    (relationshipId: string) => {
      const relationship = state.relationships.find(
        (rel) => rel.id === relationshipId,
      );
      if (relationship) {
        setState((prev) => ({ ...prev, activeRelationship: relationship }));
        logger.debug("Switched active relationship", { relationshipId });
      }
    },
    [state.relationships],
  );

  const pinRelationship = useCallback((relationshipId: string) => {
    setState((prev) => ({
      ...prev,
      pinnedRelationships: [
        ...prev.pinnedRelationships.filter((id) => id !== relationshipId),
        relationshipId,
      ],
    }));
    logger.debug("Pinned relationship", { relationshipId });
  }, []);

  const unpinRelationship = useCallback((relationshipId: string) => {
    setState((prev) => ({
      ...prev,
      pinnedRelationships: prev.pinnedRelationships.filter(
        (id) => id !== relationshipId,
      ),
    }));
    logger.debug("Unpinned relationship", { relationshipId });
  }, []);

  // ==================== BULK OPERATIONS ====================

  const startBulkOperation = useCallback(
    async (
      operation: string,
      targetIds: string[],
      options?: any,
    ): Promise<BulkOperationStatus> => {
      const operationId = generateOperationId();
      const startTime = new Date();

      const bulkOperation: BulkOperationStatus = {
        id: operationId,
        operation,
        targetIds,
        status: "pending",
        progress: 0,
        results: {},
        startTime,
      };

      setState((prev) => ({
        ...prev,
        bulkOperations: [...prev.bulkOperations, bulkOperation],
      }));

      logger.info("Starting bulk operation", {
        operationId,
        operation,
        targetCount: targetIds.length,
      });

      try {
        // Update status to running
        setState((prev) => ({
          ...prev,
          bulkOperations: prev.bulkOperations.map((op) =>
            op.id === operationId ? { ...op, status: "running" } : op,
          ),
        }));

        // Process each target
        const results: {
          [relationshipId: string]: {
            success: boolean;
            message?: string;
            error?: string;
          };
        } = {};

        for (let i = 0; i < targetIds.length; i++) {
          const targetId = targetIds[i];

          try {
            // TODO: Implement actual operation logic based on operation type
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate operation

            results[targetId] = {
              success: true,
              message: `${operation} completed`,
            };

            // Update progress
            const progress = Math.round(((i + 1) / targetIds.length) * 100);
            setState((prev) => ({
              ...prev,
              bulkOperations: prev.bulkOperations.map((op) =>
                op.id === operationId
                  ? { ...op, progress, results: { ...op.results, ...results } }
                  : op,
              ),
            }));
          } catch (error) {
            results[targetId] = {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        }

        // Complete operation
        const completedTime = new Date();
        const hasFailures = Object.values(results).some(
          (result) => !result.success,
        );
        const finalStatus: BulkOperationStatus["status"] = hasFailures
          ? "partial"
          : "completed";

        setState((prev) => ({
          ...prev,
          bulkOperations: prev.bulkOperations.map((op) =>
            op.id === operationId
              ? {
                  ...op,
                  status: finalStatus,
                  progress: 100,
                  results,
                  completedTime,
                }
              : op,
          ),
        }));

        logger.info("Bulk operation completed", {
          operationId,
          status: finalStatus,
          successCount: Object.values(results).filter((r) => r.success).length,
          failureCount: Object.values(results).filter((r) => !r.success).length,
        });

        return {
          ...bulkOperation,
          status: finalStatus,
          progress: 100,
          results,
          completedTime,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Bulk operation failed";

        setState((prev) => ({
          ...prev,
          bulkOperations: prev.bulkOperations.map((op) =>
            op.id === operationId
              ? {
                  ...op,
                  status: "failed",
                  error: errorMessage,
                  completedTime: new Date(),
                }
              : op,
          ),
        }));

        logger.error("Bulk operation failed", {
          operationId,
          error: error as Error,
        });

        return {
          ...bulkOperation,
          status: "failed",
          error: errorMessage,
          completedTime: new Date(),
        };
      }
    },
    [],
  );

  const cancelBulkOperation = useCallback((operationId: string) => {
    setState((prev) => ({
      ...prev,
      bulkOperations: prev.bulkOperations.map((op) =>
        op.id === operationId && op.status === "running"
          ? {
              ...op,
              status: "failed",
              error: "Cancelled by user",
              completedTime: new Date(),
            }
          : op,
      ),
    }));
    logger.info("Bulk operation cancelled", { operationId });
  }, []);

  const clearCompletedOperations = useCallback(() => {
    setState((prev) => ({
      ...prev,
      bulkOperations: prev.bulkOperations.filter(
        (op) => op.status === "running" || op.status === "pending",
      ),
    }));
    logger.debug("Cleared completed bulk operations");
  }, []);

  // ==================== BULK SESSION MANAGEMENT ====================

  const bulkStartSessions = useCallback(
    async (
      relationshipIds: string[],
      goals?: SessionGoals,
    ): Promise<BulkOperationStatus> => {
      return await startBulkOperation("start_sessions", relationshipIds, {
        goals,
      });
    },
    [startBulkOperation],
  );

  const bulkStopSessions = useCallback(
    async (
      relationshipIds: string[],
      reason?: string,
    ): Promise<BulkOperationStatus> => {
      return await startBulkOperation("stop_sessions", relationshipIds, {
        reason,
      });
    },
    [startBulkOperation],
  );

  const bulkPauseSessions = useCallback(
    async (
      relationshipIds: string[],
      reason: string,
    ): Promise<BulkOperationStatus> => {
      return await startBulkOperation("pause_sessions", relationshipIds, {
        reason,
      });
    },
    [startBulkOperation],
  );

  const bulkResumeSessions = useCallback(
    async (relationshipIds: string[]): Promise<BulkOperationStatus> => {
      return await startBulkOperation("resume_sessions", relationshipIds);
    },
    [startBulkOperation],
  );

  // ==================== BULK TASK MANAGEMENT ====================

  const bulkAssignTasks = useCallback(
    async (
      relationshipIds: string[],
      task: TaskTemplate,
    ): Promise<BulkOperationStatus> => {
      return await startBulkOperation("assign_tasks", relationshipIds, {
        task,
      });
    },
    [startBulkOperation],
  );

  const bulkApproveAllTasks = useCallback(
    async (relationshipIds: string[]): Promise<BulkOperationStatus> => {
      return await startBulkOperation("approve_all_tasks", relationshipIds);
    },
    [startBulkOperation],
  );

  // ==================== BULK REWARDS/PUNISHMENTS ====================

  const bulkSendRewards = useCallback(
    async (
      relationshipIds: string[],
      rewardId: string,
      reason?: string,
    ): Promise<BulkOperationStatus> => {
      return await startBulkOperation("send_rewards", relationshipIds, {
        rewardId,
        reason,
      });
    },
    [startBulkOperation],
  );

  const bulkSendPunishments = useCallback(
    async (
      relationshipIds: string[],
      punishmentId: string,
      reason: string,
    ): Promise<BulkOperationStatus> => {
      return await startBulkOperation("send_punishments", relationshipIds, {
        punishmentId,
        reason,
      });
    },
    [startBulkOperation],
  );

  // ==================== COMMUNICATION ====================

  const sendBroadcastMessage = useCallback(
    async (message: BulkMessage, recipients: string[]): Promise<void> => {
      try {
        logger.info("Sending broadcast message", {
          recipientCount: recipients.length,
          priority: message.priority,
        });

        // TODO: Implement actual message sending
        // This would integrate with messaging service

        logger.info("Broadcast message sent successfully");
      } catch (error) {
        logger.error("Failed to send broadcast message", {
          error: error as Error,
        });
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Failed to send broadcast message",
        }));
      }
    },
    [],
  );

  const sendIndividualMessage = useCallback(
    async (relationshipId: string, message: string): Promise<void> => {
      try {
        logger.info("Sending individual message", { relationshipId });

        // TODO: Implement actual message sending
        // This would integrate with messaging service

        logger.info("Individual message sent successfully");
      } catch (error) {
        logger.error("Failed to send individual message", {
          error: error as Error,
        });
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Failed to send individual message",
        }));
      }
    },
    [],
  );

  // ==================== ANALYTICS ====================

  const getOverviewStats = useCallback((): MultiWearerStats => {
    return state.overviewStats;
  }, [state.overviewStats]);

  const getComparativeStats = useCallback(
    (relationshipIds: string[]): ComparativeStats => {
      // TODO: Implement actual comparative statistics calculation
      // This would pull data from various sources (sessions, tasks, rewards, etc.)

      const comparativeStats: ComparativeStats = {
        relationshipIds,
        metrics: {
          totalSessionTime: {},
          averageSessionDuration: {},
          taskCompletionRate: {},
          rewardCount: {},
          punishmentCount: {},
          lastActivity: {},
        },
        rankings: {
          mostActive: relationshipIds,
          longestSessions: relationshipIds,
          bestTaskCompletion: relationshipIds,
        },
      };

      // Populate with placeholder data
      relationshipIds.forEach((id) => {
        comparativeStats.metrics.totalSessionTime[id] = Math.random() * 100000;
        comparativeStats.metrics.averageSessionDuration[id] =
          Math.random() * 10000;
        comparativeStats.metrics.taskCompletionRate[id] = Math.random() * 100;
        comparativeStats.metrics.rewardCount[id] = Math.floor(
          Math.random() * 50,
        );
        comparativeStats.metrics.punishmentCount[id] = Math.floor(
          Math.random() * 20,
        );
        comparativeStats.metrics.lastActivity[id] = new Date();
      });

      return comparativeStats;
    },
    [],
  );

  // ==================== FILTERING AND SEARCH ====================

  const setFilter = useCallback(
    (key: keyof MultiWearerState["filters"], value: any) => {
      setState((prev) => ({
        ...prev,
        filters: {
          ...prev.filters,
          [key]: value,
        },
      }));
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      filters: DEFAULT_FILTERS,
    }));
  }, []);

  // ==================== DATA MANAGEMENT ====================

  const refreshAllData = useCallback(async (): Promise<void> => {
    if (!effectiveKeyholderId) return;

    setState((prev) => ({ ...prev, isRefreshing: true, error: null }));

    try {
      logger.debug("Refreshing all multi-wearer data", {
        keyholderId: effectiveKeyholderId,
      });

      // Load relationships from the existing hook
      await keyholderRelationships.loadRelationships();

      const relationships = keyholderRelationships.relationships.asKeyholder;

      // Create relationship overviews
      const relationshipOverviews = relationships.map(
        createRelationshipOverview,
      );

      // Calculate overview stats
      const overviewStats: MultiWearerStats = {
        totalRelationships: relationships.length,
        activeRelationships: relationshipOverviews.filter(
          (r) => r.status === "active",
        ).length,
        activeSessions: relationshipOverviews.filter((r) => r.hasActiveSession)
          .length,
        totalSessionTime: 0, // TODO: Calculate from actual data
        averageSessionDuration: 0, // TODO: Calculate from actual data
        totalRewards: 0, // TODO: Calculate from actual data
        totalPunishments: 0, // TODO: Calculate from actual data
        totalTasks: 0, // TODO: Calculate from actual data
        completedTasks: 0, // TODO: Calculate from actual data
        lastActivity: relationshipOverviews.reduce(
          (latest, r) => {
            if (!r.lastActivity) return latest;
            if (!latest || r.lastActivity > latest) return r.lastActivity;
            return latest;
          },
          null as Date | null,
        ),
      };

      setState((prev) => ({
        ...prev,
        relationships,
        relationshipOverviews,
        overviewStats,
        isRefreshing: false,
        lastRefresh: new Date(),
      }));

      logger.info("Multi-wearer data refreshed", {
        relationshipCount: relationships.length,
        activeCount: overviewStats.activeRelationships,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to refresh data";
      setState((prev) => ({
        ...prev,
        isRefreshing: false,
        error: errorMessage,
      }));
      logger.error("Failed to refresh multi-wearer data", {
        error: error as Error,
      });
    }
  }, [effectiveKeyholderId, keyholderRelationships]);

  const refreshRelationshipOverview = useCallback(
    async (relationshipId: string): Promise<void> => {
      try {
        logger.debug("Refreshing relationship overview", { relationshipId });

        // TODO: Fetch updated data for specific relationship
        // This would get current session status, task counts, etc.

        setState((prev) => ({
          ...prev,
          relationshipOverviews: prev.relationshipOverviews.map((overview) =>
            overview.id === relationshipId
              ? { ...overview, lastActivity: new Date() } // Placeholder update
              : overview,
          ),
        }));
      } catch (error) {
        logger.error("Failed to refresh relationship overview", {
          relationshipId,
          error: error as Error,
        });
      }
    },
    [],
  );

  const resetError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // ==================== EFFECTS ====================

  // Initialize data when user changes
  useEffect(() => {
    if (effectiveKeyholderId) {
      refreshAllData();
    }
  }, [effectiveKeyholderId, refreshAllData]);

  // Auto-refresh when relationships data changes
  useEffect(() => {
    if (
      keyholderRelationships.relationships.asKeyholder.length !==
      state.relationships.length
    ) {
      refreshAllData();
    }
  }, [
    keyholderRelationships.relationships.asKeyholder.length,
    state.relationships.length,
    refreshAllData,
  ]);

  // Clean up old bulk operations (keep last 10)
  useEffect(() => {
    if (state.bulkOperations.length > 10) {
      setState((prev) => ({
        ...prev,
        bulkOperations: prev.bulkOperations
          .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
          .slice(0, 10),
      }));
    }
  }, [state.bulkOperations.length]);

  // ==================== RETURN ====================

  const actions: MultiWearerActions = {
    switchToRelationship,
    startBulkOperation,
    cancelBulkOperation,
    clearCompletedOperations,
    bulkStartSessions,
    bulkStopSessions,
    bulkPauseSessions,
    bulkResumeSessions,
    bulkAssignTasks,
    bulkApproveAllTasks,
    bulkSendRewards,
    bulkSendPunishments,
    sendBroadcastMessage,
    sendIndividualMessage,
    getOverviewStats,
    getComparativeStats,
    setFilter,
    clearFilters,
    pinRelationship,
    unpinRelationship,
    refreshAllData,
    refreshRelationshipOverview,
    resetError,
  };

  return {
    // State
    ...state,

    // Computed
    ...computedValues,

    // Actions
    ...actions,
  };
};

export type UseMultiWearerReturn = ReturnType<typeof useMultiWearer>;
