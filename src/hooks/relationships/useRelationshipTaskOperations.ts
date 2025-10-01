/**
 * Hook for relationship task CRUD operations
 */
import { useCallback } from "react";
import { RelationshipTask } from "@/types/relationships";
import { withErrorHandling } from "./utils";
import {
  loadTasksFromService,
  createTaskInService,
  updateTaskStatusInService,
} from "./task-operations";

interface TaskState {
  tasks: RelationshipTask[];
  isLoading: boolean;
  error: string | null;
}

interface TaskOperationsParams {
  userId: string | undefined;
  setState: (fn: (prev: TaskState) => TaskState) => void;
}

export function useRelationshipTaskOperations({
  userId,
  setState,
}: TaskOperationsParams) {
  const loadTasks = useCallback(
    async (relationshipId: string) => {
      return withErrorHandling(
        async () => {
          const tasks = await loadTasksFromService(relationshipId);
          setState((prev) => ({ ...prev, tasks }));
        },
        "load tasks",
        setState,
      );
    },
    [setState],
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
          await createTaskInService(relationshipId, taskData, userId);
          await loadTasks(relationshipId);
        },
        "create task",
        setState,
      );
    },
    [userId, loadTasks, setState],
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
          await updateTaskStatusInService(
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
    [userId, loadTasks, setState],
  );

  return { loadTasks, createTask, updateTaskStatus };
}
