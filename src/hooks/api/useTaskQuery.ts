/**
 * Task TanStack Query Hooks
 * Manages server state for tasks with Dexie as backend
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskDBService } from "@/services/database";
import { cacheConfig } from "@/services/cache-config";
import { firebaseSync } from "@/services/sync";
import type { DBTask, TaskStatus } from "@/types/database";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("useTaskQuery");

/**
 * Query for getting all tasks for a user
 */
export function useTasksQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ["tasks", "user", userId],
    queryFn: async () => {
      if (!userId) return [];

      // Always read from local Dexie first for instant response
      const tasks = await taskDBService.findByUserId(userId);

      // Trigger background sync if online to ensure data freshness
      if (navigator.onLine) {
        firebaseSync.syncUserTasks(userId).catch((error) => {
          logger.warn("Background task sync failed", { error });
        });
      }

      return tasks;
    },
    ...cacheConfig.tasks, // Apply specific cache settings
    enabled: !!userId, // Only run when userId is available
  });
}

/**
 * Query for getting pending tasks that need keyholder attention
 */
export function usePendingTasksQuery(
  userId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ["tasks", "pending", userId],
    queryFn: async () => {
      if (!userId) return [];

      const allTasks = await taskDBService.findByUserId(userId);
      return allTasks.filter((task) =>
        ["pending", "submitted"].includes(task.status),
      );
    },
    ...cacheConfig.tasks,
    enabled: !!userId && enabled,
  });
}

/**
 * Mutations for task operations
 */
export function useTaskMutations() {
  const queryClient = useQueryClient();

  const createTask = useMutation({
    mutationFn: async (params: {
      userId: string;
      title: string;
      description?: string;
      deadline?: Date;
    }) => {
      // 1. Write to local Dexie immediately for optimistic update
      const task = await taskDBService.createTask({
        ...params,
        status: "pending" as TaskStatus,
        text: params.description || params.title, // Use description or title as text
        priority: "medium" as const, // Default priority
        assignedBy: "submissive" as const, // Default assignment source
      });

      // 2. Trigger Firebase sync in background
      if (navigator.onLine) {
        firebaseSync.syncUserTasks(params.userId).catch((error) => {
          logger.warn("Task creation sync failed", { error });
        });
      }

      return task;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch tasks queries
      queryClient.invalidateQueries({
        queryKey: ["tasks", "user", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["tasks", "pending", variables.userId],
      });
    },
    onError: (error) => {
      logger.error("Failed to create task", { error });
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async (params: {
      taskId: string;
      userId: string;
      status: TaskStatus;
      feedback?: string;
    }) => {
      // 1. Update local Dexie immediately
      const updatedTask = await taskDBService.updateTaskStatus(
        params.taskId,
        params.status,
        {
          keyholderFeedback: params.feedback,
        },
      );

      // 2. Trigger Firebase sync in background
      if (navigator.onLine) {
        firebaseSync.syncUserTasks(params.userId).catch((error) => {
          logger.warn("Task status update sync failed", { error });
        });
      }

      return updatedTask;
    },
    onSuccess: (data, variables) => {
      // Update specific task in cache
      queryClient.setQueryData(
        ["tasks", "user", variables.userId],
        (oldTasks: DBTask[] | undefined) => {
          if (!oldTasks) return oldTasks;
          return oldTasks.map((task) =>
            task.id === variables.taskId
              ? { ...task, ...(data as Partial<DBTask>) }
              : task,
          );
        },
      );

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["tasks", "pending", variables.userId],
      });
    },
    onError: (error) => {
      logger.error("Failed to update task status", { error });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (params: { taskId: string; userId: string }) => {
      // 1. Delete from local Dexie immediately
      await taskDBService.deleteTask(params.taskId);

      // 2. Trigger Firebase sync in background
      if (navigator.onLine) {
        firebaseSync.syncUserTasks(params.userId).catch((error) => {
          logger.warn("Task deletion sync failed", { error });
        });
      }

      return params.taskId;
    },
    onSuccess: (taskId, variables) => {
      // Remove task from cache
      queryClient.setQueryData(
        ["tasks", "user", variables.userId],
        (oldTasks: DBTask[] | undefined) => {
          if (!oldTasks) return oldTasks;
          return oldTasks.filter((task) => task.id !== taskId);
        },
      );

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["tasks", "pending", variables.userId],
      });
    },
    onError: (error) => {
      logger.error("Failed to delete task", { error });
    },
  });

  const submitTaskForReview = useMutation({
    mutationFn: async (params: {
      taskId: string;
      userId: string;
      note?: string;
    }) => {
      // 1. Update local Dexie immediately
      const updatedTask = await taskDBService.updateTaskStatus(
        params.taskId,
        "submitted",
        {
          submissiveNote: params.note,
        },
      );

      // 2. Trigger Firebase sync in background
      if (navigator.onLine) {
        firebaseSync.syncUserTasks(params.userId).catch((error) => {
          logger.warn("Task submission sync failed", { error });
        });
      }

      return updatedTask;
    },
    onSuccess: (data, variables) => {
      // Update task in cache
      queryClient.setQueryData(
        ["tasks", "user", variables.userId],
        (oldTasks: DBTask[] | undefined) => {
          if (!oldTasks) return oldTasks;
          return oldTasks.map((task) =>
            task.id === variables.taskId
              ? { ...task, ...(data as Partial<DBTask>) }
              : task,
          );
        },
      );

      // Invalidate pending tasks since this affects that query
      queryClient.invalidateQueries({
        queryKey: ["tasks", "pending", variables.userId],
      });
    },
    onError: (error) => {
      logger.error("Failed to submit task for review", { error });
    },
  });

  const approveTask = useMutation({
    mutationFn: async (params: {
      taskId: string;
      userId: string;
      feedback?: string;
    }) => {
      // 1. Update local Dexie immediately
      const updatedTask = await taskDBService.updateTaskStatus(
        params.taskId,
        "approved",
        {
          keyholderFeedback: params.feedback,
        },
      );

      // 2. Trigger Firebase sync in background
      if (navigator.onLine) {
        firebaseSync.syncUserTasks(params.userId).catch((error) => {
          logger.warn("Task approval sync failed", { error });
        });
      }

      return updatedTask;
    },
    onSuccess: (data, variables) => {
      // Update task in cache
      queryClient.setQueryData(
        ["tasks", "user", variables.userId],
        (oldTasks: DBTask[] | undefined) => {
          if (!oldTasks) return oldTasks;
          return oldTasks.map((task) =>
            task.id === variables.taskId
              ? { ...task, ...(data as Partial<DBTask>) }
              : task,
          );
        },
      );

      // Invalidate pending tasks query
      queryClient.invalidateQueries({
        queryKey: ["tasks", "pending", variables.userId],
      });
    },
    onError: (error) => {
      logger.error("Failed to approve task", { error });
    },
  });

  const rejectTask = useMutation({
    mutationFn: async (params: {
      taskId: string;
      userId: string;
      feedback?: string;
    }) => {
      // 1. Update local Dexie immediately
      const updatedTask = await taskDBService.updateTaskStatus(
        params.taskId,
        "rejected",
        {
          keyholderFeedback: params.feedback,
        },
      );

      // 2. Trigger Firebase sync in background
      if (navigator.onLine) {
        firebaseSync.syncUserTasks(params.userId).catch((error) => {
          logger.warn("Task rejection sync failed", { error });
        });
      }

      return updatedTask;
    },
    onSuccess: (data, variables) => {
      // Update task in cache
      queryClient.setQueryData(
        ["tasks", "user", variables.userId],
        (oldTasks: DBTask[] | undefined) => {
          if (!oldTasks) return oldTasks;
          return oldTasks.map((task) =>
            task.id === variables.taskId
              ? { ...task, ...(data as Partial<DBTask>) }
              : task,
          );
        },
      );

      // Invalidate pending tasks query
      queryClient.invalidateQueries({
        queryKey: ["tasks", "pending", variables.userId],
      });
    },
    onError: (error) => {
      logger.error("Failed to reject task", { error });
    },
  });

  const assignTask = useMutation({
    mutationFn: async (params: {
      userId: string;
      title: string;
      description?: string;
      priority?: DBTask["priority"];
      dueDate?: Date;
    }) => {
      // 1. Write to local Dexie immediately for optimistic update
      const task = await taskDBService.createTask({
        userId: params.userId,
        text: params.title,
        description: params.description,
        status: "pending" as TaskStatus,
        priority: params.priority || "medium",
        assignedBy: "keyholder" as const,
        dueDate: params.dueDate,
      });

      // 2. Trigger Firebase sync in background
      if (navigator.onLine) {
        firebaseSync.syncUserTasks(params.userId).catch((error) => {
          logger.warn("Task assignment sync failed", { error });
        });
      }

      return task;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch tasks queries
      queryClient.invalidateQueries({
        queryKey: ["tasks", "user", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["tasks", "pending", variables.userId],
      });
    },
    onError: (error) => {
      logger.error("Failed to assign task", { error });
    },
  });

  return {
    createTask,
    updateTaskStatus,
    deleteTask,
    submitTaskForReview,
    approveTask,
    rejectTask,
    assignTask,
  };
}
