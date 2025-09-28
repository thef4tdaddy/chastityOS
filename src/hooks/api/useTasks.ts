import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { taskDBService } from "../../services/database/TaskDBService";
import { Task, TaskStatus } from "../../types/database";
import { logger } from "../../utils/logging";

/**
 * Task Management Hooks - TanStack Query Integration
 *
 * Integrates with:
 * - taskDBService → Dexie → Firebase sync
 * - TasksPage.tsx, TaskManagement.tsx (critical fixes needed)
 *
 * Fixes:
 * - TasksPage.tsx:20 (taskDBService.findByUserId)
 * - TasksPage.tsx:34 (taskDBService.updateTaskStatus)
 *
 * Strategy: Optimistic update + background sync
 */

// Query Keys
export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (userId: string, filters?: TaskFilters) =>
    [...taskKeys.lists(), userId, filters] as const,
  detail: (taskId: string) => [...taskKeys.all, "detail", taskId] as const,
  byStatus: (userId: string, status: TaskStatus) =>
    [...taskKeys.all, "status", userId, status] as const,
  assigned: (userId: string) => [...taskKeys.all, "assigned", userId] as const,
  assignedBy: (keyholderUid: string) =>
    [...taskKeys.all, "assignedBy", keyholderUid] as const,
} as const;

// Types
interface TaskFilters {
  status?: TaskStatus;
  priority?: "low" | "medium" | "high";
  category?: string;
  assignedBy?: string;
  dueDate?: {
    start?: Date;
    end?: Date;
  };
}

interface CreateTaskData {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  category?: string;
  dueDate?: Date;
  assignedBy?: string; // keyholder UID
  metadata?: Record<string, any>;
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  category?: string;
  dueDate?: Date;
  metadata?: Record<string, any>;
}

/**
 * Get tasks for a user with optional filtering
 * Fixes: TasksPage.tsx:20 (taskDBService.findByUserId)
 */
export function useTasks(userId: string, filters?: TaskFilters) {
  return useQuery({
    queryKey: taskKeys.list(userId, filters),
    queryFn: async (): Promise<Task[]> => {
      logger.info("Fetching tasks", { userId, filters });

      try {
        const tasks = await taskDBService.findByUserId(userId);

        // Apply filters
        let filteredTasks = tasks;

        if (filters?.status) {
          filteredTasks = filteredTasks.filter(
            (task) => task.status === filters.status,
          );
        }

        if (filters?.priority) {
          filteredTasks = filteredTasks.filter(
            (task) => task.priority === filters.priority,
          );
        }

        if (filters?.category) {
          filteredTasks = filteredTasks.filter(
            (task) => task.category === filters.category,
          );
        }

        if (filters?.assignedBy) {
          filteredTasks = filteredTasks.filter(
            (task) => task.assignedBy === filters.assignedBy,
          );
        }

        if (filters?.dueDate) {
          filteredTasks = filteredTasks.filter((task) => {
            if (!task.dueDate) return false;
            const taskDue = new Date(task.dueDate);

            if (filters.dueDate?.start && taskDue < filters.dueDate.start)
              return false;
            if (filters.dueDate?.end && taskDue > filters.dueDate.end)
              return false;

            return true;
          });
        }

        // Sort by priority and due date
        filteredTasks.sort((a, b) => {
          // Priority sorting (high > medium > low)
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority || "medium"];
          const bPriority = priorityOrder[b.priority || "medium"];

          if (aPriority !== bPriority) {
            return bPriority - aPriority;
          }

          // Due date sorting (sooner first)
          if (a.dueDate && b.dueDate) {
            return (
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            );
          }

          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && b.dueDate) return 1;

          // Created date sorting (newest first)
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        logger.info("Tasks retrieved successfully", {
          userId,
          totalTasks: tasks.length,
          filteredTasks: filteredTasks.length,
        });

        return filteredTasks;
      } catch (error) {
        logger.error("Failed to fetch tasks", {
          error: error instanceof Error ? error.message : String(error),
          userId,
          filters,
        });
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - active data
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
    enabled: !!userId,
  });
}

/**
 * Get tasks by status (useful for kanban boards)
 */
export function useTasksByStatus(userId: string, status: TaskStatus) {
  return useQuery({
    queryKey: taskKeys.byStatus(userId, status),
    queryFn: async (): Promise<Task[]> => {
      const tasks = await taskDBService.findByUserId(userId);
      return tasks.filter((task) => task.status === status);
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!userId,
  });
}

/**
 * Get single task by ID
 */
export function useTask(taskId: string) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: async (): Promise<Task | null> => {
      logger.info("Fetching task detail", { taskId });
      const task = await taskDBService.findById(taskId);
      return task ?? null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - task details are stable
    enabled: !!taskId,
  });
}

/**
 * Get tasks assigned by a specific keyholder
 */
export function useTasksAssignedBy(keyholderUid: string) {
  return useQuery({
    queryKey: taskKeys.assignedBy(keyholderUid),
    queryFn: async (): Promise<Task[]> => {
      logger.info("Fetching tasks assigned by keyholder", { keyholderUid });

      // Note: This would require a different query method in the future
      // For now, we'll need to scan all tasks (inefficient but works)
      const allTasks = await taskDBService.getAll();
      return allTasks.filter((task: Task) => task.assignedBy === keyholderUid);
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!keyholderUid,
  });
}

/**
 * Create new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      taskData,
    }: {
      userId: string;
      taskData: CreateTaskData;
    }): Promise<Task> => {
      logger.info("Creating new task", { userId, title: taskData.title });

      // Generate task ID
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newTask: Task = {
        id: taskId,
        userId,
        title: taskData.title,
        description: taskData.description || "",
        status: "pending",
        priority: taskData.priority || "medium",
        category: taskData.category,
        dueDate: taskData.dueDate,
        assignedBy:
          (taskData.assignedBy as "submissive" | "keyholder") || "submissive",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Dexie-first write for immediate UI response
      await taskDBService.create(newTask);

      logger.info("Task created successfully", {
        taskId,
        userId,
        title: taskData.title,
      });

      return newTask;
    },
    onSuccess: (
      newTask: Task,
      { userId }: { userId: string; taskData: any },
    ) => {
      logger.info("Task creation successful", { taskId: newTask.id, userId });

      // Invalidate task lists to trigger refetch
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: taskKeys.byStatus(userId, "pending"),
      });

      // Optimistically add to cache if we have existing data
      queryClient.setQueriesData(
        { queryKey: taskKeys.list(userId) },
        (oldData: Task[] | undefined) => {
          if (!oldData) return undefined;
          return [newTask, ...oldData];
        },
      );
    },
    onError: (error, { userId, taskData }) => {
      logger.error("Task creation failed", {
        error: error instanceof Error ? error.message : String(error),
        userId,
        title: taskData.title,
      });
    },
  });
}

/**
 * Update task status (most common operation)
 * Fixes: TasksPage.tsx:34 (taskDBService.updateTaskStatus)
 * Strategy: Optimistic update + background sync
 */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      userId,
      status,
      completedAt,
    }: {
      taskId: string;
      userId: string;
      status: TaskStatus;
      completedAt?: Date;
    }): Promise<Task> => {
      logger.info("Updating task status", { taskId, userId, status });

      const existingTask = await taskDBService.findById(taskId);
      if (!existingTask) {
        throw new Error(`Task not found: ${taskId}`);
      }

      const updatedTask: Task = {
        ...existingTask,
        status,
        completedAt:
          status === "completed" ? completedAt || new Date() : undefined,
        updatedAt: new Date(),
      };

      await taskDBService.updateTaskStatus(taskId, status);

      logger.info("Task status updated successfully", {
        taskId,
        userId,
        status,
      });

      return updatedTask;
    },
    onMutate: async ({ taskId, userId, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) });
      await queryClient.cancelQueries({ queryKey: taskKeys.list(userId) });

      // Snapshot previous values
      const previousTask = queryClient.getQueryData(taskKeys.detail(taskId));
      const previousTasks = queryClient.getQueryData(taskKeys.list(userId));

      // Optimistically update task detail
      queryClient.setQueryData(
        taskKeys.detail(taskId),
        (old: Task | undefined) => {
          if (!old) return old;
          return { ...old, status, updatedAt: new Date() };
        },
      );

      // Optimistically update task lists
      queryClient.setQueriesData(
        { queryKey: taskKeys.list(userId) },
        (oldData: Task[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((task) =>
            task.id === taskId
              ? { ...task, status, updatedAt: new Date() }
              : task,
          );
        },
      );

      return { previousTask, previousTasks };
    },
    onSuccess: (
      updatedTask: Task,
      { userId, taskId }: { userId: string; taskId: string; status: any },
    ) => {
      logger.info("Task status update successful", {
        taskId,
        userId,
        status: updatedTask.status,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: taskKeys.byStatus(userId, updatedTask.status),
      });

      // If task was completed, invalidate pending tasks
      if (updatedTask.status === "completed") {
        queryClient.invalidateQueries({
          queryKey: taskKeys.byStatus(userId, "pending"),
        });
      }
    },
    onError: (error, { taskId, userId }, context) => {
      logger.error("Task status update failed", {
        error: error instanceof Error ? error.message : String(error),
        taskId,
        userId,
      });

      // Rollback optimistic updates
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(taskId), context.previousTask);
      }
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.list(userId), context.previousTasks);
      }
    },
  });
}

/**
 * Update full task details
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      userId,
      updates,
    }: {
      taskId: string;
      userId: string;
      updates: UpdateTaskData;
    }): Promise<Task> => {
      logger.info("Updating task", { taskId, userId });

      const existingTask = await taskDBService.findById(taskId);
      if (!existingTask) {
        throw new Error(`Task not found: ${taskId}`);
      }

      const updatedTask: Task = {
        ...existingTask,
        ...updates,
        updatedAt: new Date(),
      };

      await taskDBService.update(taskId, updatedTask);

      logger.info("Task updated successfully", { taskId, userId });

      return updatedTask;
    },
    onSuccess: (
      updatedTask: Task,
      {
        userId,
        taskId,
      }: { userId: string; taskId: string; updates: UpdateTaskData },
    ) => {
      logger.info("Task update successful", { taskId, userId });

      // Update detail cache
      queryClient.setQueryData(taskKeys.detail(taskId), updatedTask);

      // Invalidate list queries to reflect changes
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: taskKeys.byStatus(userId, updatedTask.status),
      });
    },
    onError: (error, { taskId, userId }) => {
      logger.error("Task update failed", {
        error: error instanceof Error ? error.message : String(error),
        taskId,
        userId,
      });
    },
  });
}

/**
 * Delete task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      userId,
    }: {
      taskId: string;
      userId: string;
    }): Promise<void> => {
      logger.info("Deleting task", { taskId, userId });

      await taskDBService.delete(taskId);

      logger.info("Task deleted successfully", { taskId, userId });
    },
    onSuccess: (
      _: void,
      { taskId, userId }: { taskId: string; userId: string },
    ) => {
      logger.info("Task deletion successful", { taskId, userId });

      // Remove from detail cache
      queryClient.removeQueries({ queryKey: taskKeys.detail(taskId) });

      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: taskKeys.byStatus(userId, "pending"),
      });
      queryClient.invalidateQueries({
        queryKey: taskKeys.byStatus(userId, "completed"),
      });

      // Optimistically remove from cached lists
      queryClient.setQueriesData(
        { queryKey: taskKeys.list(userId) },
        (oldData: Task[] | undefined) => {
          if (!oldData) return undefined;
          return oldData.filter((task) => task.id !== taskId);
        },
      );
    },
    onError: (error, { taskId, userId }) => {
      logger.error("Task deletion failed", {
        error: error instanceof Error ? error.message : String(error),
        taskId,
        userId,
      });
    },
  });
}

/**
 * Get task statistics for dashboard
 */
export function useTaskStats(userId: string) {
  return useQuery({
    queryKey: [...taskKeys.all, "stats", userId],
    queryFn: async () => {
      logger.info("Calculating task statistics", { userId });

      const tasks = await taskDBService.findByUserId(userId);

      const stats = {
        total: tasks.length,
        pending: tasks.filter((t) => t.status === "pending").length,
        inProgress: tasks.filter((t) => t.status === "in_progress").length,
        completed: tasks.filter((t) => t.status === "completed").length,
        overdue: tasks.filter((t) => {
          if (!t.dueDate || t.status === "completed") return false;
          return new Date(t.dueDate) < new Date();
        }).length,
        byPriority: {
          high: tasks.filter((t) => t.priority === "high").length,
          medium: tasks.filter((t) => t.priority === "medium").length,
          low: tasks.filter((t) => t.priority === "low").length,
        },
        completionRate:
          tasks.length > 0
            ? Math.round(
                (tasks.filter((t) => t.status === "completed").length /
                  tasks.length) *
                  100,
              )
            : 0,
      };

      return stats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId,
  });
}
