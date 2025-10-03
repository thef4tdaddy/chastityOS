/**
 * React Hook for Relationship Task and Event Management
 * Handles creating, updating tasks and logging events
 */
import { useState, useEffect, useCallback } from "react";
import { useAuthState } from "@/contexts/AuthContext";
import { RelationshipTask, RelationshipEvent } from "@/types/relationships";
import { BaseHookState, BaseHookActions } from "./types";
import { createBaseActions } from "@/utils/error-handling/handlers";
import { useRelationshipTaskOperations } from "./useRelationshipTaskOperations";
import { useRelationshipEventOperations } from "./useRelationshipEventOperations";

interface RelationshipTasksState extends BaseHookState {
  tasks: RelationshipTask[];
  events: RelationshipEvent[];
}

interface RelationshipTasksActions extends BaseHookActions {
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
  logEvent: (
    relationshipId: string,
    eventData: {
      type: RelationshipEvent["type"];
      details: RelationshipEvent["details"];
      isPrivate?: boolean;
      tags?: string[];
    },
  ) => Promise<void>;
  loadRelationshipData: (relationshipId: string) => Promise<void>;
}

export function useRelationshipTasks(): RelationshipTasksState &
  RelationshipTasksActions {
  const { user } = useAuthState();
  const userId = user?.uid;

  const [state, setState] = useState<RelationshipTasksState>({
    tasks: [],
    events: [],
    isLoading: false,
    error: null,
  });

  const { clearError: clearErrorFn } = createBaseActions();

  const { loadTasks, createTask, updateTaskStatus } =
    useRelationshipTaskOperations({ userId, setState });

  const { loadEvents, logEvent } = useRelationshipEventOperations({
    userId,
    setState,
  });

  const loadRelationshipData = useCallback(
    async (relationshipId: string) => {
      await Promise.all([
        loadTasks(relationshipId),
        loadEvents(relationshipId),
      ]);
    },
    [loadTasks, loadEvents],
  );

  const clearError = useCallback(() => {
    clearErrorFn(setState);
  }, [clearErrorFn]);

  // Set up real-time listeners for tasks
  useEffect(() => {
    // This would be called externally when activeRelationship changes
    // The parent hook will need to manage this subscription
  }, []);

  return {
    ...state,
    createTask,
    updateTaskStatus,
    logEvent,
    loadRelationshipData,
    clearError,
  };
}
