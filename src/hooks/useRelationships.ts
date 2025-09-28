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
} from "@/types/relationships";
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

// Maintain backward compatibility with the original interface
export interface RelationshipActions {
  // Relationship management
  sendRelationshipRequest: (
    targetUserId: string,
    role: "submissive" | "keyholder",
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
  setActiveRelationship: (relationship: any) => void;
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

  // Load data for active relationship when it changes
  useEffect(() => {
    if (relationshipList.activeRelationship) {
      const relationshipId = relationshipList.activeRelationship.id;
      relationshipStatus.loadRelationshipData(relationshipId);
      relationshipTasks.loadRelationshipData(relationshipId);
    }
  }, [relationshipList.activeRelationship, relationshipStatus, relationshipTasks]);

  // Set up real-time listeners for active relationship data
  useEffect(() => {
    if (!relationshipList.activeRelationship) return;

    const relationshipId = relationshipList.activeRelationship.id;

    const unsubscribeChastityData =
      relationshipChastityService.subscribeToChastityData(
        relationshipId,
        (_chastityData) => {
          // Update the status hook with new data
          relationshipStatus.loadRelationshipData(relationshipId);
        },
      );

    const unsubscribeTasks = relationshipChastityService.subscribeToTasks(
      relationshipId,
      (_tasks) => {
        // Update the tasks hook with new data
        relationshipTasks.loadRelationshipData(relationshipId);
      },
    );

    return () => {
      unsubscribeChastityData();
      unsubscribeTasks();
    };
  }, [relationshipList.activeRelationship, relationshipStatus, relationshipTasks]);

  // Enhanced refresh function that coordinates all hooks
  const refreshData = useCallback(async () => {
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

  // Unified error handling - combine errors from all hooks
  const hasError = useMemo(() => {
    return !!(
      relationshipList.error ||
      relationshipInvites.error ||
      relationshipActions.error ||
      relationshipStatus.error ||
      relationshipPermissions.error ||
      relationshipTasks.error ||
      relationshipValidation.error
    );
  }, [
    relationshipList.error,
    relationshipInvites.error,
    relationshipActions.error,
    relationshipStatus.error,
    relationshipPermissions.error,
    relationshipTasks.error,
    relationshipValidation.error,
  ]);

  const combinedError = useMemo(() => {
    const errors = [
      relationshipList.error,
      relationshipInvites.error,
      relationshipActions.error,
      relationshipStatus.error,
      relationshipPermissions.error,
      relationshipTasks.error,
      relationshipValidation.error,
    ].filter(Boolean);

    return errors.length > 0 ? errors[0] : null;
  }, [
    relationshipList.error,
    relationshipInvites.error,
    relationshipActions.error,
    relationshipStatus.error,
    relationshipPermissions.error,
    relationshipTasks.error,
    relationshipValidation.error,
  ]);

  // Unified loading state - true if any hook is loading
  const isLoading = useMemo(() => {
    return !!(
      relationshipList.isLoading ||
      relationshipInvites.isLoading ||
      relationshipActions.isLoading ||
      relationshipStatus.isLoading ||
      relationshipPermissions.isLoading ||
      relationshipTasks.isLoading ||
      relationshipValidation.isLoading
    );
  }, [
    relationshipList.isLoading,
    relationshipInvites.isLoading,
    relationshipActions.isLoading,
    relationshipStatus.isLoading,
    relationshipPermissions.isLoading,
    relationshipTasks.isLoading,
    relationshipValidation.isLoading,
  ]);

  // Unified clear error function
  const clearError = useCallback(() => {
    relationshipList.clearError();
    relationshipInvites.clearError();
    relationshipActions.clearError();
    relationshipStatus.clearError();
    relationshipPermissions.clearError();
    relationshipTasks.clearError();
    relationshipValidation.clearError();
  }, [
    relationshipList,
    relationshipInvites,
    relationshipActions,
    relationshipStatus,
    relationshipPermissions,
    relationshipTasks,
    relationshipValidation,
  ]);

  // Enhanced setActiveRelationship that clears data when switching
  const setActiveRelationship = useCallback(
    (relationship: any) => {
      relationshipList.setActiveRelationship(relationship);

      // Clear old data when switching relationships
      if (!relationship) {
        // Data will be automatically cleared since hooks are reactive
      }
    },
    [relationshipList],
  );

  // Return combined state and actions for backward compatibility
  return {
    // Combined state - maintaining backward compatibility
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

    // Combined actions - maintaining backward compatibility
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
