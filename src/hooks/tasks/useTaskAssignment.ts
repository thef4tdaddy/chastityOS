/**
 * Hook for task assignment operations
 */
import { useCallback } from "react";
import { Task, TaskStatus } from "@/types/core";

interface TaskAssignmentParams {
  setError: (error: Error | null) => void;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task>;
}

export function useTaskAssignment({
  setError,
  updateTask,
}: TaskAssignmentParams) {
  // Assign a task to a wearer
  const assignTask = useCallback(
    async (taskId: string, _wearerId: string): Promise<void> => {
      setError(null);

      try {
        // In production, this would update the task's wearer assignment
        await updateTask(taskId, {
          // Custom field for wearer assignment (not in base Task type)
          // Would need to extend Task type or use metadata
        } as Partial<Task>);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to assign task");
        setError(error);
        throw error;
      }
    },
    [updateTask, setError],
  );

  // Bulk assign tasks to a wearer
  const bulkAssign = useCallback(
    async (taskIds: string[], wearerId: string): Promise<void> => {
      setError(null);

      try {
        await Promise.all(taskIds.map((id) => assignTask(id, wearerId)));
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to bulk assign tasks");
        setError(error);
        throw error;
      }
    },
    [assignTask, setError],
  );

  // Complete a task
  const completeTask = useCallback(
    async (id: string): Promise<void> => {
      setError(null);

      try {
        await updateTask(id, {
          status: TaskStatus.COMPLETED,
        });
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to complete task");
        setError(error);
        throw error;
      }
    },
    [updateTask, setError],
  );

  return { assignTask, bulkAssign, completeTask };
}
