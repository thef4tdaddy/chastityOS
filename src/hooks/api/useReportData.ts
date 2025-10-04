/**
 * Report Data TanStack Query Hook
 * Aggregates all data needed for Full Report page
 */
import { useQuery } from "@tanstack/react-query";
import { useCurrentSession, useSessionHistory } from "./useSessionQuery";
import { useEventHistory } from "./useEvents";
import { useTasksQuery } from "./useTaskQuery";
import { goalDBService } from "@/services/database";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("useReportData");

/**
 * Query for getting all user goals
 */
export function useGoalsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ["goals", "user", userId],
    queryFn: async () => {
      if (!userId) return [];

      const goals = await goalDBService.findByUserId(userId);

      logger.debug("Goals fetched for report", {
        userId,
        count: goals.length,
      });

      return goals;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Aggregates all data needed for Full Report page
 */
export function useReportData(userId: string | undefined) {
  const currentSession = useCurrentSession(userId);
  const sessions = useSessionHistory(userId);
  const events = useEventHistory(userId || "");
  const tasks = useTasksQuery(userId);
  const goals = useGoalsQuery(userId);

  return {
    currentSession: currentSession.data || null,
    sessions: sessions.data || [],
    events: events.data || [],
    tasks: tasks.data || [],
    goals: goals.data || [],
    isLoading:
      currentSession.isLoading ||
      sessions.isLoading ||
      events.isLoading ||
      tasks.isLoading ||
      goals.isLoading,
    error:
      currentSession.error ||
      sessions.error ||
      events.error ||
      tasks.error ||
      goals.error,
  };
}
