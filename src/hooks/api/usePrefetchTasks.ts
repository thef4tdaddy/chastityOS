/**
 * Task Prefetching Hook
 * Prefetch tasks before navigation for better perceived performance
 */
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { taskDBService } from "../../services/database/TaskDBService";
import { taskKeys } from "@/utils/tasks";
import { Task } from "../../types/database";
import { logger } from "../../utils/logging";

export function usePrefetchTasks() {
  const queryClient = useQueryClient();

  /**
   * Prefetch tasks for a user
   * Useful when hovering over navigation links or after login
   */
  const prefetchTasks = useCallback(
    async (userId: string) => {
      if (!userId) return;

      await queryClient.prefetchQuery({
        queryKey: taskKeys.list(userId),
        queryFn: async (): Promise<Task[]> => {
          logger.info("Prefetching tasks", { userId });
          return await taskDBService.findByUserId(userId);
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
      });
    },
    [queryClient],
  );

  /**
   * Prefetch task details
   */
  const prefetchTask = useCallback(
    async (taskId: string) => {
      if (!taskId) return;

      await queryClient.prefetchQuery({
        queryKey: taskKeys.detail(taskId),
        queryFn: async (): Promise<Task | null> => {
          logger.info("Prefetching task detail", { taskId });
          const task = await taskDBService.findById(taskId);
          return task ?? null;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    },
    [queryClient],
  );

  return {
    prefetchTasks,
    prefetchTask,
  };
}
