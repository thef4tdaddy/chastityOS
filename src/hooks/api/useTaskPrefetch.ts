/**
 * Task Prefetching Hook
 * Prefetches tasks when navigating to related pages for better UX
 */
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { taskDBService } from "@/services/database";
import { taskKeys } from "@/utils/tasks";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("TaskPrefetch");

/**
 * Prefetch tasks for a user
 * Used on pages where user might navigate to tasks next
 */
export function useTaskPrefetch(userId: string | undefined) {
  const queryClient = useQueryClient();
  const location = useLocation();

  useEffect(() => {
    if (!userId) return;

    // Pages where we should prefetch tasks
    const prefetchPages = [
      "/",
      "/chastity-tracking",
      "/keyholder",
      "/dashboard",
    ];

    // Only prefetch if we're on a relevant page and not already on tasks page
    if (
      prefetchPages.includes(location.pathname) &&
      location.pathname !== "/tasks"
    ) {
      const queryKey = taskKeys.list(userId);

      // Check if data is already cached and fresh
      const cachedData = queryClient.getQueryData(queryKey);
      if (cachedData) {
        logger.info("Tasks already cached, skipping prefetch");
        return;
      }

      // Prefetch in the background
      logger.info("Prefetching tasks", { userId, page: location.pathname });
      queryClient.prefetchQuery({
        queryKey,
        queryFn: async () => {
          const tasks = await taskDBService.findByUserId(userId);
          return tasks;
        },
        staleTime: 1000 * 60 * 3, // 3 minutes
      });
    }
  }, [userId, location.pathname, queryClient]);
}
