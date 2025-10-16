/**
 * React Hook for Relationship Management (Composed)
 * Provides state management and actions for the dual-account keyholder system
 * Refactored to use focused hooks for better maintainability
 */
import { useEffect, useCallback, useMemo } from "react";
import { relationshipChastityService } from "@/services/database/RelationshipChastityService";
import {
  RelationshipTask,
  RelationshipEvent,
  RelationshipPermissions,
  Relationship,
} from "@/types/relationships";
import type { KeyholderRelationship, UserRole } from "@/types/core";
import {
  useRelationshipList,
  useRelationshipInvites,
  useRelationshipActions,
  useRelationshipStatus,
  useRelationshipPermissions,
  useRelationshipTasks,
  useRelationshipValidation,
} from "./relationships";

// Re-export types from the shared types file
export type {
  RelationshipState,
  BaseHookState,
  BaseHookActions,
} from "./relationships/types";

/**
 * Hook to load active relationship data when it changes
 */
function useActiveRelationshipLoader(
  activeRelationship: Relationship | null,
  relationshipStatus: ReturnType<typeof useRelationshipStatus>,
  relationshipTasks: ReturnType<typeof useRelationshipTasks>,
) {
  useEffect(() => {
    if (activeRelationship) {
      const relationshipId = activeRelationship.id;
      relationshipStatus.loadRelationshipData(relationshipId);
      relationshipTasks.loadRelationshipData(relationshipId);
    }
  }, [activeRelationship, relationshipStatus, relationshipTasks]);
}

/**
 * Hook to set up real-time listeners for active relationship
 */
function useRelationshipSubscriptions(
  activeRelationship: Relationship | null,
  relationshipStatus: ReturnType<typeof useRelationshipStatus>,
  relationshipTasks: ReturnType<typeof useRelationshipTasks>,
) {
  useEffect(() => {
    if (!activeRelationship) return;

    const relationshipId = activeRelationship.id;
    let unsubscribeChastityData: (() => void) | null = null;
    let unsubscribeTasks: (() => void) | null = null;

    const setupSubscriptions = async () => {
      unsubscribeChastityData =
        await relationshipChastityService.subscribeToChastityData(
          relationshipId,
          () => {
            relationshipStatus.loadRelationshipData(relationshipId);
          },
        );

      unsubscribeTasks = await relationshipChastityService.subscribeToTasks(
        relationshipId,
        () => {
          relationshipTasks.loadRelationshipData(relationshipId);
        },
      );
    };

    setupSubscriptions();

    return () => {
      if (unsubscribeChastityData) unsubscribeChastityData();
      if (unsubscribeTasks) unsubscribeTasks();
    };
  }, [activeRelationship, relationshipStatus, relationshipTasks]);
}

/**
 * Hook to combine errors from all relationship hooks
 */
function useCombinedErrors(hooks: {
  relationshipList: ReturnType<typeof useRelationshipList>;
  relationshipInvites: ReturnType<typeof useRelationshipInvites>;
  relationshipActions: ReturnType<typeof useRelationshipActions>;
  relationshipStatus: ReturnType<typeof useRelationshipStatus>;
  relationshipPermissions: ReturnType<typeof useRelationshipPermissions>;
  relationshipTasks: ReturnType<typeof useRelationshipTasks>;
  relationshipValidation: ReturnType<typeof useRelationshipValidation>;
}) {
  return useMemo(() => {
    const errors = [
      hooks.relationshipList.error,
      hooks.relationshipInvites.error,
      hooks.relationshipActions.error,
      hooks.relationshipStatus.error,
      hooks.relationshipPermissions.error,
      hooks.relationshipTasks.error,
      hooks.relationshipValidation.error,
    ].filter(Boolean);

    return errors.length > 0 ? errors[0] : null;
  }, [
    hooks.relationshipList.error,
    hooks.relationshipInvites.error,
    hooks.relationshipActions.error,
    hooks.relationshipStatus.error,
    hooks.relationshipPermissions.error,
    hooks.relationshipTasks.error,
    hooks.relationshipValidation.error,
  ]);
}

/**
 * Hook to combine loading states from all relationship hooks
 */
function useCombinedLoading(hooks: {
  relationshipList: ReturnType<typeof useRelationshipList>;
  relationshipInvites: ReturnType<typeof useRelationshipInvites>;
  relationshipActions: ReturnType<typeof useRelationshipActions>;
  relationshipStatus: ReturnType<typeof useRelationshipStatus>;
  relationshipPermissions: ReturnType<typeof useRelationshipPermissions>;
  relationshipTasks: ReturnType<typeof useRelationshipTasks>;
  relationshipValidation: ReturnType<typeof useRelationshipValidation>;
}) {
  return useMemo(() => {
    return !!(
      hooks.relationshipList.isLoading ||
      hooks.relationshipInvites.isLoading ||
      hooks.relationshipActions.isLoading ||
      hooks.relationshipStatus.isLoading ||
      hooks.relationshipPermissions.isLoading ||
      hooks.relationshipTasks.isLoading ||
      hooks.relationshipValidation.isLoading
    );
  }, [
    hooks.relationshipList.isLoading,
    hooks.relationshipInvites.isLoading,
    hooks.relationshipActions.isLoading,
    hooks.relationshipStatus.isLoading,
    hooks.relationshipPermissions.isLoading,
    hooks.relationshipTasks.isLoading,
    hooks.relationshipValidation.isLoading,
  ]);
}

/**
 * Hook for unified error clearing across all relationship hooks
 */
function useClearErrors(hooks: {
  relationshipList: ReturnType<typeof useRelationshipList>;
  relationshipInvites: ReturnType<typeof useRelationshipInvites>;
  relationshipActions: ReturnType<typeof useRelationshipActions>;
  relationshipStatus: ReturnType<typeof useRelationshipStatus>;
  relationshipPermissions: ReturnType<typeof useRelationshipPermissions>;
  relationshipTasks: ReturnType<typeof useRelationshipTasks>;
  relationshipValidation: ReturnType<typeof useRelationshipValidation>;
}) {
  return useCallback(() => {
    hooks.relationshipList.clearError();
    hooks.relationshipInvites.clearError();
    hooks.relationshipActions.clearError();
    hooks.relationshipStatus.clearError();
    hooks.relationshipPermissions.clearError();
    hooks.relationshipTasks.clearError();
    hooks.relationshipValidation.clearError();
  }, [
    hooks.relationshipList,
    hooks.relationshipInvites,
    hooks.relationshipActions,
    hooks.relationshipStatus,
    hooks.relationshipPermissions,
    hooks.relationshipTasks,
    hooks.relationshipValidation,
  ]);
}

/**
 * Hook for setting active relationship with data clearing
 */
function useSetActiveRelationship(
  relationshipList: ReturnType<typeof useRelationshipList>,
) {
  return useCallback(
    (relationship: KeyholderRelationship | null) => {
      relationshipList.setActiveRelationship(
        relationship as Relationship | null,
      );
    },
    [relationshipList],
  );
}

/**
 * Hook for coordinated data refresh across all relationship hooks
 */
function useRefreshData(
  relationshipList: ReturnType<typeof useRelationshipList>,
  relationshipInvites: ReturnType<typeof useRelationshipInvites>,
  relationshipValidation: ReturnType<typeof useRelationshipValidation>,
  relationshipStatus: ReturnType<typeof useRelationshipStatus>,
  relationshipTasks: ReturnType<typeof useRelationshipTasks>,
) {
  return useCallback(async () => {
    await Promise.all([
      relationshipList.refreshRelationships(),
      relationshipInvites.refreshPendingRequests(),
      relationshipValidation.checkMigrationStatus(),
    ]);

    if (relationshipList.activeRelationship) {
      const relationshipId = relationshipList.activeRelationship.id;
      await Promise.all([
        relationshipStatus.loadRelationshipData(relationshipId),
        relationshipTasks.loadRelationshipData(relationshipId),
      ]);
    }
  }, [
    relationshipList,
    relationshipInvites,
    relationshipValidation,
    relationshipStatus,
    relationshipTasks,
  ]);
}

// Maintain backward compatibility with the original interface
export interface RelationshipActions {
  // Relationship management
  sendRelationshipRequest: (
    targetUserId: string,
    role: UserRole,
    message?: string,
  ) => Promise<void>;
  acceptRelationshipRequest: (requestId: string) => Promise<void>;
  rejectRelationshipRequest: (requestId: string) => Promise<void>;
  endRelationship: (relationshipId: string) => Promise<void>;
  updatePermissions: (
    relationshipId: string,
    permissions: RelationshipPermissions,
  ) => Promise<void>;

  // Session management
  startSession: (
    relationshipId: string,
    options?: {
      goalDuration?: number;
      isHardcoreMode?: boolean;
      notes?: string;
    },
  ) => Promise<void>;
  endSession: (
    relationshipId: string,
    sessionId: string,
    reason?: string,
  ) => Promise<void>;
  pauseSession: (
    relationshipId: string,
    sessionId: string,
    reason?: string,
  ) => Promise<void>;
  resumeSession: (relationshipId: string, sessionId: string) => Promise<void>;

  // Task management
  createTask: (
    relationshipId: string,
    taskData: {
      text: string;
      dueDate?: Date;
      consequence?: RelationshipTask["consequence"];
    },
  ) => Promise<void>;
  updateTaskStatus: (
    relationshipId: string,
    taskId: string,
    status: RelationshipTask["status"],
    note?: string,
  ) => Promise<void>;

  // Event logging
  logEvent: (
    relationshipId: string,
    eventData: {
      type: RelationshipEvent["type"];
      details: RelationshipEvent["details"];
      isPrivate?: boolean;
      tags?: string[];
    },
  ) => Promise<void>;

  // Migration
  migrateSingleUserData: () => Promise<void>;
  checkMigrationStatus: () => Promise<void>;

  // Utility
  setActiveRelationship: (relationship: KeyholderRelationship | null) => void;
  refreshData: () => Promise<void>;
  clearError: () => void;
}

export function useRelationships() {
  // Use focused hooks for specific functionalities
  const relationshipList = useRelationshipList();
  const relationshipInvites = useRelationshipInvites();
  const relationshipActions = useRelationshipActions();
  const relationshipStatus = useRelationshipStatus();
  const relationshipPermissions = useRelationshipPermissions();
  const relationshipTasks = useRelationshipTasks();
  const relationshipValidation = useRelationshipValidation();

  // Load data and set up subscriptions for active relationship
  useActiveRelationshipLoader(
    relationshipList.activeRelationship,
    relationshipStatus,
    relationshipTasks,
  );
  useRelationshipSubscriptions(
    relationshipList.activeRelationship,
    relationshipStatus,
    relationshipTasks,
  );

  const refreshData = useRefreshData(
    relationshipList,
    relationshipInvites,
    relationshipValidation,
    relationshipStatus,
    relationshipTasks,
  );

  // Combine errors and loading states from all hooks
  const hooks = {
    relationshipList,
    relationshipInvites,
    relationshipActions,
    relationshipStatus,
    relationshipPermissions,
    relationshipTasks,
    relationshipValidation,
  };
  const combinedError = useCombinedErrors(hooks);
  const isLoading = useCombinedLoading(hooks);
  const clearError = useClearErrors(hooks);
  const setActiveRelationship = useSetActiveRelationship(relationshipList);

  // Return combined state and actions for backward compatibility
  return {
    relationships: relationshipList.relationships,
    pendingRequests: relationshipInvites.pendingRequests,
    activeRelationship: relationshipList.activeRelationship,
    chastityData: relationshipStatus.chastityData,
    tasks: relationshipTasks.tasks,
    events: relationshipTasks.events,
    sessions: relationshipStatus.sessions,
    isLoading,
    error: combinedError,
    needsMigration: relationshipValidation.needsMigration,
    sendRelationshipRequest: relationshipInvites.sendRelationshipRequest,
    acceptRelationshipRequest: relationshipActions.acceptRelationshipRequest,
    rejectRelationshipRequest: relationshipActions.rejectRelationshipRequest,
    endRelationship: relationshipActions.endRelationship,
    updatePermissions: relationshipPermissions.updatePermissions,
    startSession: relationshipStatus.startSession,
    endSession: relationshipStatus.endSession,
    pauseSession: relationshipStatus.pauseSession,
    resumeSession: relationshipStatus.resumeSession,
    createTask: relationshipTasks.createTask,
    updateTaskStatus: relationshipTasks.updateTaskStatus,
    logEvent: relationshipTasks.logEvent,
    migrateSingleUserData: relationshipValidation.migrateSingleUserData,
    checkMigrationStatus: relationshipValidation.checkMigrationStatus,
    setActiveRelationship,
    refreshData,
    clearError,
  };
}
