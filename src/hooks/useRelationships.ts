/**
 * React Hook for Relationship Management
 * Provides state management and actions for the dual-account keyholder system
 */
import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { relationshipService } from "@/services/database/RelationshipService";
import { relationshipChastityService } from "@/services/database/RelationshipChastityService";
import { dataMigrationService } from "@/services/migration/DataMigrationService";
import {
  Relationship,
  RelationshipRequest,
  RelationshipStatus,
  RelationshipChastityData,
  RelationshipTask,
  RelationshipEvent,
  RelationshipSession,
  RelationshipPermissions,
} from "@/types/relationships";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("useRelationships");

export interface RelationshipState {
  relationships: Relationship[];
  pendingRequests: RelationshipRequest[];
  activeRelationship: Relationship | null;
  chastityData: RelationshipChastityData | null;
  tasks: RelationshipTask[];
  events: RelationshipEvent[];
  sessions: RelationshipSession[];
  isLoading: boolean;
  error: string | null;
  needsMigration: boolean;
}

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
  endSession: (relationshipId: string, sessionId: string, reason?: string) => Promise<void>;
  pauseSession: (relationshipId: string, sessionId: string, reason?: string) => Promise<void>;
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
  setActiveRelationship: (relationship: Relationship | null) => void;
  refreshData: () => Promise<void>;
  clearError: () => void;
}

export function useRelationships(): RelationshipState & RelationshipActions {
  const { user } = useAuthContext();
  const userId = user?.uid;

  // State
  const [state, setState] = useState<RelationshipState>({
    relationships: [],
    pendingRequests: [],
    activeRelationship: null,
    chastityData: null,
    tasks: [],
    events: [],
    sessions: [],
    isLoading: false,
    error: null,
    needsMigration: false,
  });

  // ==================== DATA LOADING ====================

  const loadRelationships = useCallback(async () => {
    if (!userId) return;

    try {
      const relationships = await relationshipService.getUserRelationships(userId);
      setState(prev => ({ ...prev, relationships }));

      // Set active relationship if there's only one
      if (relationships.length === 1 && !state.activeRelationship) {
        setState(prev => ({ ...prev, activeRelationship: relationships[0] }));
      }
    } catch (error) {
      logger.error("Failed to load relationships", { error, userId });
      setState(prev => ({ ...prev, error: (error as Error).message }));
    }
  }, [userId, state.activeRelationship]);

  const loadPendingRequests = useCallback(async () => {
    if (!userId) return;

    try {
      const pendingRequests = await relationshipService.getPendingRequests(userId);
      setState(prev => ({ ...prev, pendingRequests }));
    } catch (error) {
      logger.error("Failed to load pending requests", { error, userId });
      setState(prev => ({ ...prev, error: (error as Error).message }));
    }
  }, [userId]);

  const loadChastityData = useCallback(async (relationshipId: string) => {
    try {
      const chastityData = await relationshipChastityService.getChastityData(relationshipId);
      setState(prev => ({ ...prev, chastityData }));
    } catch (error) {
      logger.error("Failed to load chastity data", { error, relationshipId });
      setState(prev => ({ ...prev, error: (error as Error).message }));
    }
  }, []);

  const loadTasks = useCallback(async (relationshipId: string) => {
    try {
      const tasks = await relationshipChastityService.getTasks(relationshipId);
      setState(prev => ({ ...prev, tasks }));
    } catch (error) {
      logger.error("Failed to load tasks", { error, relationshipId });
      setState(prev => ({ ...prev, error: (error as Error).message }));
    }
  }, []);

  const loadEvents = useCallback(async (relationshipId: string) => {
    try {
      const events = await relationshipChastityService.getEvents(relationshipId);
      setState(prev => ({ ...prev, events }));
    } catch (error) {
      logger.error("Failed to load events", { error, relationshipId });
      setState(prev => ({ ...prev, error: (error as Error).message }));
    }
  }, []);

  const loadSessions = useCallback(async (relationshipId: string) => {
    try {
      const sessions = await relationshipChastityService.getSessionHistory(relationshipId);
      setState(prev => ({ ...prev, sessions }));
    } catch (error) {
      logger.error("Failed to load sessions", { error, relationshipId });
      setState(prev => ({ ...prev, error: (error as Error).message }));
    }
  }, []);

  // ==================== RELATIONSHIP MANAGEMENT ====================

  const sendRelationshipRequest = useCallback(async (
    targetUserId: string,
    role: "submissive" | "keyholder",
    message?: string,
  ) => {
    if (!userId) throw new Error("User not authenticated");

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await relationshipService.sendRelationshipRequest(userId, targetUserId, role, message);
      await loadRelationships();
      await loadPendingRequests();
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [userId, loadRelationships, loadPendingRequests]);

  const acceptRelationshipRequest = useCallback(async (requestId: string) => {
    if (!userId) throw new Error("User not authenticated");

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const relationshipId = await relationshipService.acceptRelationshipRequest(requestId, userId);
      await loadRelationships();
      await loadPendingRequests();
      
      // Set as active relationship if it's the user's first
      const relationships = await relationshipService.getUserRelationships(userId);
      if (relationships.length === 1) {
        setState(prev => ({ ...prev, activeRelationship: relationships[0] }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [userId, loadRelationships, loadPendingRequests]);

  const rejectRelationshipRequest = useCallback(async (requestId: string) => {
    if (!userId) throw new Error("User not authenticated");

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await relationshipService.rejectRelationshipRequest(requestId, userId);
      await loadPendingRequests();
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [userId, loadPendingRequests]);

  const endRelationship = useCallback(async (relationshipId: string) => {
    if (!userId) throw new Error("User not authenticated");

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await relationshipService.endRelationship(relationshipId, userId);
      await loadRelationships();
      
      // Clear active relationship if it was ended
      if (state.activeRelationship?.id === relationshipId) {
        setState(prev => ({ 
          ...prev, 
          activeRelationship: null,
          chastityData: null,
          tasks: [],
          events: [],
          sessions: [],
        }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [userId, loadRelationships, state.activeRelationship]);

  const updatePermissions = useCallback(async (
    relationshipId: string,
    permissions: RelationshipPermissions,
  ) => {
    if (!userId) throw new Error("User not authenticated");

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await relationshipService.updateRelationshipPermissions(relationshipId, permissions, userId);
      await loadRelationships();
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [userId, loadRelationships]);

  // ==================== SESSION MANAGEMENT ====================

  const startSession = useCallback(async (
    relationshipId: string,
    options?: {
      goalDuration?: number;
      isHardcoreMode?: boolean;
      notes?: string;
    },
  ) => {
    if (!userId) throw new Error("User not authenticated");

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await relationshipChastityService.startSession(relationshipId, userId, options || {});
      await loadChastityData(relationshipId);
      await loadSessions(relationshipId);
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [userId, loadChastityData, loadSessions]);

  const endSession = useCallback(async (
    relationshipId: string,
    sessionId: string,
    reason?: string,
  ) => {
    if (!userId) throw new Error("User not authenticated");

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await relationshipChastityService.endSession(relationshipId, sessionId, userId, reason);
      await loadChastityData(relationshipId);
      await loadSessions(relationshipId);
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [userId, loadChastityData, loadSessions]);

  const pauseSession = useCallback(async (
    relationshipId: string,
    sessionId: string,
    reason?: string,
  ) => {
    if (!userId) throw new Error("User not authenticated");

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await relationshipChastityService.pauseSession(relationshipId, sessionId, userId, reason);
      await loadChastityData(relationshipId);
      await loadSessions(relationshipId);
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [userId, loadChastityData, loadSessions]);

  const resumeSession = useCallback(async (
    relationshipId: string,
    sessionId: string,
  ) => {
    if (!userId) throw new Error("User not authenticated");

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await relationshipChastityService.resumeSession(relationshipId, sessionId, userId);
      await loadChastityData(relationshipId);
      await loadSessions(relationshipId);
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [userId, loadChastityData, loadSessions]);

  // ==================== TASK MANAGEMENT ====================

  const createTask = useCallback(async (
    relationshipId: string,
    taskData: {
      text: string;
      dueDate?: Date;
      consequence?: RelationshipTask["consequence"];
    },
  ) => {
    if (!userId) throw new Error("User not authenticated");

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await relationshipChastityService.createTask(relationshipId, taskData, userId);
      await loadTasks(relationshipId);
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [userId, loadTasks]);

  const updateTaskStatus = useCallback(async (
    relationshipId: string,
    taskId: string,
    status: RelationshipTask["status"],
    note?: string,
  ) => {
    if (!userId) throw new Error("User not authenticated");

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await relationshipChastityService.updateTaskStatus(relationshipId, taskId, status, userId, note);
      await loadTasks(relationshipId);
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [userId, loadTasks]);

  // ==================== EVENT LOGGING ====================

  const logEvent = useCallback(async (
    relationshipId: string,
    eventData: {
      type: RelationshipEvent["type"];
      details: RelationshipEvent["details"];
      isPrivate?: boolean;
      tags?: string[];
    },
  ) => {
    if (!userId) throw new Error("User not authenticated");

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await relationshipChastityService.logEvent(relationshipId, eventData, userId);
      await loadEvents(relationshipId);
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [userId, loadEvents]);

  // ==================== MIGRATION ====================

  const migrateSingleUserData = useCallback(async () => {
    if (!userId) throw new Error("User not authenticated");

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await dataMigrationService.migrateSingleUserData(userId);
      if (!result.success) {
        throw new Error(result.errors.join(", "));
      }

      // Refresh data after migration
      await loadRelationships();
      setState(prev => ({ ...prev, needsMigration: false }));

      logger.info("Migration completed successfully", { result });
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [userId, loadRelationships]);

  const checkMigrationStatus = useCallback(async () => {
    if (!userId) return;

    try {
      const needsMigration = await dataMigrationService.needsMigration(userId);
      setState(prev => ({ ...prev, needsMigration }));
    } catch (error) {
      logger.error("Failed to check migration status", { error, userId });
    }
  }, [userId]);

  // ==================== UTILITY FUNCTIONS ====================

  const setActiveRelationship = useCallback((relationship: Relationship | null) => {
    setState(prev => ({ ...prev, activeRelationship: relationship }));

    // Load data for the active relationship
    if (relationship) {
      loadChastityData(relationship.id);
      loadTasks(relationship.id);
      loadEvents(relationship.id);
      loadSessions(relationship.id);
    } else {
      setState(prev => ({
        ...prev,
        chastityData: null,
        tasks: [],
        events: [],
        sessions: [],
      }));
    }
  }, [loadChastityData, loadTasks, loadEvents, loadSessions]);

  const refreshData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await Promise.all([
        loadRelationships(),
        loadPendingRequests(),
        checkMigrationStatus(),
      ]);

      if (state.activeRelationship) {
        await Promise.all([
          loadChastityData(state.activeRelationship.id),
          loadTasks(state.activeRelationship.id),
          loadEvents(state.activeRelationship.id),
          loadSessions(state.activeRelationship.id),
        ]);
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [
    loadRelationships,
    loadPendingRequests,
    checkMigrationStatus,
    loadChastityData,
    loadTasks,
    loadEvents,
    loadSessions,
    state.activeRelationship,
  ]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // ==================== EFFECTS ====================

  // Initial data loading
  useEffect(() => {
    if (userId) {
      refreshData();
    }
  }, [userId, refreshData]);

  // Set up real-time listeners
  useEffect(() => {
    if (!userId) return;

    const unsubscribeRelationships = relationshipService.subscribeToUserRelationships(
      userId,
      (relationships) => {
        setState(prev => ({ ...prev, relationships }));
      },
    );

    return () => {
      unsubscribeRelationships();
    };
  }, [userId]);

  // Set up real-time listeners for active relationship data
  useEffect(() => {
    if (!state.activeRelationship) return;

    const relationshipId = state.activeRelationship.id;

    const unsubscribeChastityData = relationshipChastityService.subscribeToChastityData(
      relationshipId,
      (chastityData) => {
        setState(prev => ({ ...prev, chastityData }));
      },
    );

    const unsubscribeTasks = relationshipChastityService.subscribeToTasks(
      relationshipId,
      (tasks) => {
        setState(prev => ({ ...prev, tasks }));
      },
    );

    return () => {
      unsubscribeChastityData();
      unsubscribeTasks();
    };
  }, [state.activeRelationship]);

  return {
    ...state,
    sendRelationshipRequest,
    acceptRelationshipRequest,
    rejectRelationshipRequest,
    endRelationship,
    updatePermissions,
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    createTask,
    updateTaskStatus,
    logEvent,
    migrateSingleUserData,
    checkMigrationStatus,
    setActiveRelationship,
    refreshData,
    clearError,
  };
}