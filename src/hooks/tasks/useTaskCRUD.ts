/**
 * Hook for task CRUD operations
 */
import { useCallback, useRef, useEffect } from "react";
import { Task, TaskStatus, TaskPriority } from "@/types/core";
import { Timestamp } from "firebase/firestore";
import { CreateTaskInput, UpdateTaskInput } from "./useTaskManagement";

interface TaskCRUDParams {
  tasks: Task[];
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
  setError: (error: Error | null) => void;
  setIsCreating: (isCreating: boolean) => void;
  setIsUpdating: (isUpdating: boolean) => void;
  setIsDeleting: (isDeleting: boolean) => void;
}

export function useTaskCRUD({
  tasks,
  setTasks,
  setError,
  setIsCreating,
  setIsUpdating,
  setIsDeleting,
}: TaskCRUDParams) {
  // Use a ref to always have access to the latest tasks
  const tasksRef = useRef(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Create a new task
  const createTask = useCallback(
    async (task: CreateTaskInput): Promise<Task> => {
      setIsCreating(true);
      setError(null);

      try {
        // Mock implementation - in production, this would call Firebase/API
        const newTask: Task = {
          id: `task-${Date.now()}`,
          userId: "current-user-id", // Would come from auth context
          title: task.title,
          description: task.description,
          category: task.category,
          status: TaskStatus.PENDING,
          priority: task.priority ?? TaskPriority.MEDIUM,
          assignedBy: task.assignedBy ?? "submissive",
          createdAt: Timestamp.fromDate(new Date()),
          dueDate: task.dueDate ? Timestamp.fromDate(task.dueDate) : undefined,
          isRecurring: false,
        };

        setTasks((prev) => {
          const newTasks = [...prev, newTask];
          tasksRef.current = newTasks; // Update ref immediately
          return newTasks;
        });
        return newTask;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to create task");
        setError(error);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [setTasks, setError, setIsCreating],
  );

  // Update an existing task
  const updateTask = useCallback(
    async (id: string, updates: UpdateTaskInput): Promise<Task> => {
      setIsUpdating(true);
      setError(null);

      try {
        const currentTasks = tasksRef.current;
        const taskIndex = currentTasks.findIndex((t) => t.id === id);

        if (taskIndex === -1) {
          throw new Error(`Task with id ${id} not found`);
        }

        const updatedTask = { ...currentTasks[taskIndex], ...updates } as Task;
        const newTasks = [...currentTasks];
        newTasks[taskIndex] = updatedTask;

        setTasks(newTasks);
        tasksRef.current = newTasks; // Update ref immediately

        return updatedTask;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to update task");
        setError(error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [setTasks, setError, setIsUpdating],
  );

  // Delete a task
  const deleteTask = useCallback(
    async (id: string): Promise<void> => {
      setIsDeleting(true);
      setError(null);

      try {
        setTasks((prev) => {
          const newTasks = prev.filter((t) => t.id !== id);
          tasksRef.current = newTasks; // Update ref immediately
          return newTasks;
        });
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to delete task");
        setError(error);
        throw error;
      } finally {
        setIsDeleting(false);
      }
    },
    [setTasks, setError, setIsDeleting],
  );

  return { createTask, updateTask, deleteTask };
}
