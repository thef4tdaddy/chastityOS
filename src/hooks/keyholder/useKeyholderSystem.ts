/**
 * useKeyholderSystem Hook
 * Unified management interface for all keyholder functionality
 * Acts as the primary entry point for keyholder operations
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthState } from "../../contexts";
import { useKeyholderRelationships } from "../useKeyholderRelationships";
import { KeyholderRelationship, KeyholderPermissions } from "../../types/core";
import { Task } from "../../types";
import { InviteCode } from "../../services/database/KeyholderRelationshipDBService";
import { serviceLogger } from "../../utils/logging";

const logger = serviceLogger("useKeyholderSystem");

// ==================== TYPES ====================

export interface KeyholderStats {
  totalSubmissives: number;
  activeRelationships: number;
  totalSessions: number;
  averageSessionDuration: number;
  totalRewardsGiven: number;
  totalPunishmentsGiven: number;
  lastActivity: Date | null;
}

export interface KeyholderStatus {
  isActiveKeyholder: boolean;
  hasPermissions: boolean;
  canCreateInvites: boolean;
  maxRelationships: number;
  currentRelationships: number;
}

export interface AdminSession {
  id: string;
  keyholderId: string;
  relationshipId: string;
  startTime: Date;
  expiresAt: Date;
  permissions: string[];
  isActive: boolean;
  lastActivity: Date;
}

export interface KeyholderSystemState {
  // Active relationships where user is keyholder
  activeRelationships: KeyholderRelationship[];
  // Current admin session if active
  adminSession: AdminSession | null;
  // Overall keyholder status and permissions
  keyholderStatus: KeyholderStatus;
  // Quick stats for dashboard
  stats: KeyholderStats;
  // Currently selected relationship for operations
  selectedRelationship: KeyholderRelationship | null;
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

export interface InviteOptions {
  expirationHours?: number;
  maxUses?: number;
  customNote?: string;
}

export interface BulkOperations {
  startSessions: (
    relationshipIds: string[],
    options?: { duration?: number; message?: string },
  ) => Promise<void>;
  stopSessions: (relationshipIds: string[], reason?: string) => Promise<void>;
  sendMessages: (relationshipIds: string[], message: string) => Promise<void>;
  assignTasks: (
    relationshipIds: string[],
    task: Omit<Task, "id" | "createdAt">,
  ) => Promise<void>;
}

export interface KeyholderSystemActions {
  // Relationship management
  createInviteCode: (options?: InviteOptions) => Promise<string | null>;
  acceptSubmissive: (
    inviteCode: string,
  ) => Promise<KeyholderRelationship | null>;
  removeSubmissive: (relationshipId: string) => Promise<void>;

  // Session management
  startAdminSession: (relationshipId: string) => Promise<AdminSession | null>;
  endAdminSession: () => Promise<void>;

  // Multi-user operations
  switchActiveRelationship: (relationshipId: string) => void;
  getBulkOperations: () => BulkOperations;

  // Data management
  refreshData: () => Promise<void>;
  resetError: () => void;
}

// ==================== INITIAL STATE ====================

const initialKeyholderStatus: KeyholderStatus = {
  isActiveKeyholder: false,
  hasPermissions: false,
  canCreateInvites: false,
  maxRelationships: 5, // Default limit
  currentRelationships: 0,
};

const initialStats: KeyholderStats = {
  totalSubmissives: 0,
  activeRelationships: 0,
  totalSessions: 0,
  averageSessionDuration: 0,
  totalRewardsGiven: 0,
  totalPunishmentsGiven: 0,
  lastActivity: null,
};

const initialState: KeyholderSystemState = {
  activeRelationships: [],
  adminSession: null,
  keyholderStatus: initialKeyholderStatus,
  stats: initialStats,
  selectedRelationship: null,
  isLoading: false,
  isInitialized: false,
  error: null,
};

// ==================== MAIN HOOK ====================

export const useKeyholderSystem = (keyholderId?: string) => {
  const { user } = useAuthState();
  const keyholderRelationships = useKeyholderRelationships();

  // Use provided keyholderId or fall back to current user
  const effectiveKeyholderId = keyholderId || user?.uid;

  const [state, setState] = useState<KeyholderSystemState>(initialState);

  // ==================== COMPUTED VALUES ====================

  const computedValues = useMemo(() => {
    const { activeRelationships, adminSession, keyholderStatus } = state;

    return {
      hasActiveRelationships: activeRelationships.length > 0,
      canStartAdminSession: adminSession === null,
      activeRelationshipCount: activeRelationships.length,
      hasMaxRelationships:
        keyholderStatus.currentRelationships >=
        keyholderStatus.maxRelationships,
      selectedRelationshipId: state.selectedRelationship?.id || null,
    };
  }, [state]);

  // ==================== ACTIONS ====================

  const refreshData = useCallback(async () => {
    if (!effectiveKeyholderId) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      logger.debug("Refreshing keyholder system data", {
        keyholderId: effectiveKeyholderId,
      });

      // Get relationships from the existing hook
      await keyholderRelationships.loadRelationships();

      const keyholderRelationshipsList =
        keyholderRelationships.relationships.asKeyholder;

      // Calculate keyholder status and stats
      const { keyholderStatus, stats } = calculateKeyholderStatusAndStats(
        keyholderRelationshipsList,
        keyholderRelationships,
      );

      setState((prev) => ({
        ...prev,
        activeRelationships: keyholderRelationshipsList,
        keyholderStatus,
        stats,
        isLoading: false,
        isInitialized: true,
      }));

      logger.info("Keyholder system data refreshed", {
        relationshipCount: keyholderRelationshipsList.length,
        activeCount: stats.activeRelationships,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to refresh keyholder data";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      logger.error("Failed to refresh keyholder system data", {
        error: error as Error,
      });
    }
  }, [effectiveKeyholderId, keyholderRelationships]);

  const createInviteCode = useCallback(
    async (options: InviteOptions = {}): Promise<string | null> => {
      if (!effectiveKeyholderId) return null;

      try {
        logger.debug("Creating invite code", {
          keyholderId: effectiveKeyholderId,
          options,
        });

        const inviteCode = await keyholderRelationships.createInviteCode(
          options.expirationHours,
        );

        return await handleInviteCodeCreation(inviteCode, refreshData);
      } catch (error) {
        return handleInviteCodeError(error, setState);
      }
    },
    [effectiveKeyholderId, keyholderRelationships, refreshData],
  );

  const acceptSubmissive = useCallback(
    async (inviteCode: string): Promise<KeyholderRelationship | null> => {
      if (!effectiveKeyholderId) return null;

      try {
        logger.debug("Accepting submissive", {
          keyholderId: effectiveKeyholderId,
          inviteCode,
        });

        const success =
          await keyholderRelationships.acceptInviteCode(inviteCode);

        return await handleSubmissiveAcceptance(
          success,
          refreshData,
          state.activeRelationships,
        );
      } catch (error) {
        return handleSubmissiveAcceptanceError(error, setState);
      }
    },
    [
      effectiveKeyholderId,
      keyholderRelationships,
      refreshData,
      state.activeRelationships,
    ],
  );

  const removeSubmissive = useCallback(
    async (relationshipId: string): Promise<void> => {
      if (!effectiveKeyholderId) return;

      try {
        logger.debug("Removing submissive", {
          keyholderId: effectiveKeyholderId,
          relationshipId,
        });

        await keyholderRelationships.endRelationship(relationshipId);

        // Refresh data to update state
        await refreshData();

        // Clear selected relationship if it was the removed one
        if (state.selectedRelationship?.id === relationshipId) {
          setState((prev) => ({ ...prev, selectedRelationship: null }));
        }
      } catch (error) {
        logger.error("Failed to remove submissive", { error: error as Error });
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Failed to remove submissive",
        }));
      }
    },
    [
      effectiveKeyholderId,
      keyholderRelationships,
      refreshData,
      state.selectedRelationship,
    ],
  );

  const switchActiveRelationship = useCallback(
    (relationshipId: string) => {
      const relationship = state.activeRelationships.find(
        (rel) => rel.id === relationshipId,
      );
      if (relationship) {
        setState((prev) => ({ ...prev, selectedRelationship: relationship }));
        logger.debug("Switched active relationship", { relationshipId });
      }
    },
    [state.activeRelationships],
  );

  // Admin session management (placeholder implementation)
  const startAdminSession = useCallback(
    async (relationshipId: string): Promise<AdminSession | null> => {
      if (!effectiveKeyholderId) return null;

      try {
        logger.debug("Starting admin session", {
          keyholderId: effectiveKeyholderId,
          relationshipId,
        });

        // TODO: Implement actual admin session creation
        const adminSession: AdminSession = {
          id: `admin_${Date.now()}`,
          keyholderId: effectiveKeyholderId,
          relationshipId,
          startTime: new Date(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          permissions: ["session_control", "task_management", "rewards"], // Default permissions
          isActive: true,
          lastActivity: new Date(),
        };

        setState((prev) => ({ ...prev, adminSession }));

        logger.info("Admin session started", { sessionId: adminSession.id });
        return adminSession;
      } catch (error) {
        logger.error("Failed to start admin session", {
          error: error as Error,
        });
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Failed to start admin session",
        }));
        return null;
      }
    },
    [effectiveKeyholderId],
  );

  const endAdminSession = useCallback(async (): Promise<void> => {
    if (!state.adminSession) return;

    try {
      logger.debug("Ending admin session", {
        sessionId: state.adminSession.id,
      });

      // TODO: Implement actual admin session cleanup
      setState((prev) => ({ ...prev, adminSession: null }));

      logger.info("Admin session ended");
    } catch (error) {
      logger.error("Failed to end admin session", { error: error as Error });
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to end admin session",
      }));
    }
  }, [state.adminSession]);

  const getBulkOperations = useCallback((): BulkOperations => {
    return {
      startSessions: async (
        relationshipIds: string[],
        options?: { duration?: number; message?: string },
      ) => {
        logger.debug("Bulk starting sessions", { relationshipIds, options });
        // TODO: Implement bulk session start
      },
      stopSessions: async (relationshipIds: string[], reason?: string) => {
        logger.debug("Bulk stopping sessions", { relationshipIds, reason });
        // TODO: Implement bulk session stop
      },
      sendMessages: async (relationshipIds: string[], message: string) => {
        logger.debug("Bulk sending messages", { relationshipIds, message });
        // TODO: Implement bulk messaging
      },
      assignTasks: async (
        relationshipIds: string[],
        task: Omit<Task, "id" | "createdAt">,
      ) => {
        logger.debug("Bulk assigning tasks", { relationshipIds, task });
        // TODO: Implement bulk task assignment
      },
    };
  }, []);

  const resetError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // ==================== EFFECTS ====================

  // Initialize data when user changes
  useEffect(() => {
    if (effectiveKeyholderId && !state.isInitialized) {
      refreshData();
    }
  }, [effectiveKeyholderId, state.isInitialized, refreshData]);

  // Auto-refresh when relationships data changes
  useEffect(() => {
    if (
      keyholderRelationships.relationships.asKeyholder.length !==
      state.activeRelationships.length
    ) {
      refreshData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    keyholderRelationships.relationships.asKeyholder.length,
    state.activeRelationships.length,
  ]);

  // Admin session auto-expiry
  useEffect(() => {
    if (state.adminSession && state.adminSession.expiresAt < new Date()) {
      logger.info("Admin session expired, ending session");
      endAdminSession();
    }
    // endAdminSession is stable as it only depends on state.adminSession which is already in deps
  }, [state.adminSession]);

  // ==================== RETURN ====================

  const actions: KeyholderSystemActions = {
    createInviteCode,
    acceptSubmissive,
    removeSubmissive,
    startAdminSession,
    endAdminSession,
    switchActiveRelationship,
    getBulkOperations,
    refreshData,
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

export type UseKeyholderSystemReturn = ReturnType<typeof useKeyholderSystem>;

// Helper functions for useKeyholderSystem
function calculateKeyholderStatusAndStats(
  keyholderRelationshipsList: KeyholderRelationship[],
  keyholderRelationships: Record<string, unknown>,
): { keyholderStatus: KeyholderStatus; stats: KeyholderStats } {
  // Calculate keyholder status
  const keyholderStatus: KeyholderStatus = {
    isActiveKeyholder: keyholderRelationshipsList.length > 0,
    hasPermissions: keyholderRelationshipsList.some(
      (rel) =>
        rel.permissions && Object.values(rel.permissions).some((perm) => perm),
    ),
    canCreateInvites: keyholderRelationships.canCreateInviteCode
      ? keyholderRelationships.canCreateInviteCode()
      : false,
    maxRelationships: 5, // Could be user-specific in the future
    currentRelationships: keyholderRelationshipsList.length,
  };

  // Calculate basic stats
  const stats: KeyholderStats = {
    totalSubmissives: keyholderRelationshipsList.length,
    activeRelationships: keyholderRelationshipsList.filter(
      (rel) => rel.status === "active",
    ).length,
    totalSessions: 0, // TODO: Calculate from session data
    averageSessionDuration: 0, // TODO: Calculate from session data
    totalRewardsGiven: 0, // TODO: Calculate from reward data
    totalPunishmentsGiven: 0, // TODO: Calculate from punishment data
    lastActivity: null, // TODO: Calculate from activity data
  };

  return { keyholderStatus, stats };
}

async function handleInviteCodeCreation(
  inviteCode: InviteCode | null,
  refreshData: () => Promise<void>,
): Promise<string | null> {
  if (inviteCode) {
    // Refresh data to update state
    await refreshData();
    return inviteCode.code;
  }
  return null;
}

function handleInviteCodeError(
  error: unknown,
  setState: React.Dispatch<React.SetStateAction<KeyholderSystemState>>,
): null {
  logger.error("Failed to create invite code", { error: error as Error });
  setState((prev) => ({
    ...prev,
    error:
      error instanceof Error ? error.message : "Failed to create invite code",
  }));
  return null;
}

async function handleSubmissiveAcceptance(
  success: boolean,
  refreshData: () => Promise<void>,
  activeRelationships: KeyholderRelationship[],
): Promise<KeyholderRelationship | null> {
  if (success) {
    // Refresh data to get the new relationship
    await refreshData();

    // Return the newest relationship (should be the one just created)
    const newestRelationship = activeRelationships.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )[0];

    return newestRelationship || null;
  }
  return null;
}

function handleSubmissiveAcceptanceError(
  error: unknown,
  setState: React.Dispatch<React.SetStateAction<KeyholderSystemState>>,
): null {
  logger.error("Failed to accept submissive", { error: error as Error });
  setState((prev) => ({
    ...prev,
    error:
      error instanceof Error ? error.message : "Failed to accept submissive",
  }));
  return null;
}
