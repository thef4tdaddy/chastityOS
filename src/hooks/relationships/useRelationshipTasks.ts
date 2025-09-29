/**
 * React Hook for Relationship Task and Event Management
 * Handles creating, updating tasks and logging events
 */
import { useState, useEffect, useCallback } from "react";
import { useAuthState } from "@/contexts/AuthContext";
import { relationshipChastityService } from "@/services/database/RelationshipChastityService";
import { RelationshipTask, RelationshipEvent } from "@/types/relationships";
import { BaseHookState, BaseHookActions } from "./types";
import { withErrorHandling, createBaseActions } from "./utils";

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

  const loadTasks = useCallback(async (relationshipId: string) => {
    return withErrorHandling(
      async () => {
        const tasks =
          await relationshipChastityService.getTasks(relationshipId);
        setState((prev) => ({ ...prev, tasks }));
      },
      "load tasks",
      setState,
    );
  }, []);

  const loadEvents = useCallback(async (relationshipId: string) => {
    return withErrorHandling(
      async () => {
        const events =
          await relationshipChastityService.getEvents(relationshipId);
        setState((prev) => ({ ...prev, events }));
      },
      "load events",
      setState,
    );
  }, []);

  const loadRelationshipData = useCallback(
    async (relationshipId: string) => {
      await Promise.all([
        loadTasks(relationshipId),
        loadEvents(relationshipId),
      ]);
    },
    [loadTasks, loadEvents],
  );

  const createTask = useCallback(
    async (
      relationshipId: string,
      taskData: {
        text: string;
        dueDate?: Date;
        consequence?: RelationshipTask["consequence"];
      },
    ) => {
      if (!userId) throw new Error("User not authenticated");

      return withErrorHandling(
        async () => {
          await relationshipChastityService.createTask(
            relationshipId,
            taskData,
            userId,
          );
          await loadTasks(relationshipId);
        },
        "create task",
        setState,
      );
    },
    [userId, loadTasks],
  );

  const updateTaskStatus = useCallback(
    async (
      relationshipId: string,
      taskId: string,
      status: RelationshipTask["status"],
      note?: string,
    ) => {
      if (!userId) throw new Error("User not authenticated");

      return withErrorHandling(
        async () => {
          await relationshipChastityService.updateTaskStatus(
            relationshipId,
            taskId,
            status,
            userId,
            note,
          );
          await loadTasks(relationshipId);
        },
        "update task status",
        setState,
      );
    },
    [userId, loadTasks],
  );

  const logEvent = useCallback(
    async (
      relationshipId: string,
      eventData: {
        type: RelationshipEvent["type"];
        details: RelationshipEvent["details"];
        isPrivate?: boolean;
        tags?: string[];
      },
    ) => {
      if (!userId) throw new Error("User not authenticated");

      return withErrorHandling(
        async () => {
          await relationshipChastityService.logEvent(
            relationshipId,
            eventData,
            userId,
          );
          await loadEvents(relationshipId);
        },
        "log event",
        setState,
      );
    },
    [userId, loadEvents],
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
