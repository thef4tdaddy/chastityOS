/**
 * Task Mutation Hooks
 * Individual mutation hooks for tasks (split from useTaskQuery)
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskDBService } from "@/services/database";
import { firebaseSync } from "@/services/sync";
import type { DBTask, TaskStatus } from "@/types/database";
import { serviceLogger } from "@/utils/logging";
import { TaskNotificationService } from "@/services/notifications/TaskNotificationService";

const logger = serviceLogger("useTaskMutations");

/**
 * Hook for creating a task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
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
        text: params.description || params.title,
        priority: "medium" as const,
        assignedBy: "submissive" as const,
      });

      // 2. Trigger Firebase sync in background
      if (navigator.onLine) {
        firebaseSync.syncUserTasks(params.userId).catch((error) => {
          logger.warn("Task creation sync failed", { error });
        });
      }

      return task;
    },
    onSuccess: (_data, variables) => {
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
}

/**
 * Hook for updating task status
 */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tasks", "user", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["tasks", "pending", variables.userId],
      });
    },
    onError: (error) => {
      logger.error("Failed to update task status", { error });
    },
  });
}

/**
 * Hook for deleting a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
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

      queryClient.invalidateQueries({
        queryKey: ["tasks", "pending", variables.userId],
      });
    },
    onError: (error) => {
      logger.error("Failed to delete task", { error });
    },
  });
}

/**
 * Hook for submitting a task for review
 */
export function useSubmitTaskForReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      taskId: string;
      userId: string;
      note?: string;
      attachments?: string[];
      keyholderUserId?: string;
      submissiveName?: string;
    }) => {
      // 1. Update local Dexie immediately
      const updatedTask = await taskDBService.updateTaskStatus(
        params.taskId,
        "submitted",
        {
          submissiveNote: params.note,
          attachments: params.attachments,
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
      queryClient.invalidateQueries({
        queryKey: ["tasks", "user", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["tasks", "pending", variables.userId],
      });

      // Send notification to keyholder (if we have the keyholder ID)
      if (data && variables.keyholderUserId) {
        TaskNotificationService.notifyTaskSubmitted({
          taskId: data.id,
          taskTitle: data.text || data.title || "Task",
          userId: variables.userId,
          keyholderUserId: variables.keyholderUserId,
          submissiveName: variables.submissiveName,
          hasEvidence: (data.attachments?.length || 0) > 0,
        }).catch((error) => {
          logger.warn("Failed to send task submitted notification", { error });
        });
      }
    },
    onError: (error) => {
      logger.error("Failed to submit task for review", { error });
    },
  });
}

/**
 * Hook for approving a task
 */
export function useApproveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      taskId: string;
      userId: string;
      feedback?: string;
      points?: number;
    }) => {
      // 1. Update local Dexie immediately
      const updatedTask = await taskDBService.updateTaskStatus(
        params.taskId,
        "approved",
        {
          keyholderFeedback: params.feedback,
        },
      );

      // 2. If recurring, create next instance
      if (updatedTask?.isRecurring && updatedTask?.recurringConfig) {
        try {
          const { RecurringTaskService } = await import(
            "@/services/tasks/RecurringTaskService"
          );
          const nextInstanceId =
            await RecurringTaskService.createNextInstance(updatedTask);

          logger.info("Created next recurring task instance", {
            parentTaskId: params.taskId,
            nextInstanceId,
          });
        } catch (error) {
          logger.error("Failed to create recurring task instance", { error });
          // Don't fail the approval if recurring creation fails
        }
      }

      // 3. Trigger Firebase sync in background
      if (navigator.onLine) {
        firebaseSync.syncUserTasks(params.userId).catch((error) => {
          logger.warn("Task approval sync failed", { error });
        });
      }

      return updatedTask;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tasks", "user", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["tasks", "pending", variables.userId],
      });

      // Send notification to submissive
      if (data) {
        TaskNotificationService.notifyTaskApproved({
          taskId: data.id,
          taskTitle: data.text || data.title || "Task",
          userId: variables.userId,
          points: variables.points,
          reviewNotes: variables.feedback,
        }).catch((error) => {
          logger.warn("Failed to send task approved notification", { error });
        });
      }
    },
    onError: (error) => {
      logger.error("Failed to approve task", { error });
    },
  });
}

/**
 * Hook for rejecting a task
 */
export function useRejectTask() {
  const queryClient = useQueryClient();

  return useMutation({
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
      queryClient.invalidateQueries({
        queryKey: ["tasks", "user", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["tasks", "pending", variables.userId],
      });

      // Send notification to submissive
      if (data) {
        TaskNotificationService.notifyTaskRejected({
          taskId: data.id,
          taskTitle: data.text || data.title || "Task",
          userId: variables.userId,
          reason: variables.feedback,
        }).catch((error) => {
          logger.warn("Failed to send task rejected notification", { error });
        });
      }
    },
    onError: (error) => {
      logger.error("Failed to reject task", { error });
    },
  });
}

/**
 * Hook for assigning a task (keyholder creates task for wearer)
 */
export function useAssignTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      userId: string;
      title: string;
      description?: string;
      priority?: DBTask["priority"];
      dueDate?: Date;
      keyholderName?: string;
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
      queryClient.invalidateQueries({
        queryKey: ["tasks", "user", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["tasks", "pending", variables.userId],
      });

      // Send notification to submissive
      TaskNotificationService.notifyTaskAssigned({
        taskId: data,
        taskTitle: variables.title,
        userId: variables.userId,
        keyholderName: variables.keyholderName,
        dueDate: variables.dueDate,
      }).catch((error) => {
        logger.warn("Failed to send task assigned notification", { error });
      });
    },
    onError: (error) => {
      logger.error("Failed to assign task", { error });
    },
  });
}

/**
 * Aggregator hook for all task mutations (backward compatibility)
 */
export function useTaskMutations() {
  return {
    createTask: useCreateTask(),
    updateTaskStatus: useUpdateTaskStatus(),
    deleteTask: useDeleteTask(),
    submitTaskForReview: useSubmitTaskForReview(),
    approveTask: useApproveTask(),
    rejectTask: useRejectTask(),
    assignTask: useAssignTask(),
  };
}
