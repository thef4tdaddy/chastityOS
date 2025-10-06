/**
 * Task TanStack Query Hooks
 * Manages server state for tasks with Dexie as backend
 */
import { useQuery } from "@tanstack/react-query";
import { taskDBService } from "@/services/database";
import { cacheConfig } from "@/services/cache-config";
import { firebaseSync } from "@/services/sync";
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

// Re-export mutations from separate file
export {
  useCreateTask,
  useUpdateTaskStatus,
  useDeleteTask,
  useSubmitTaskForReview,
  useApproveTask,
  useRejectTask,
  useAssignTask,
  useTaskMutations,
} from "./useTaskMutations";
