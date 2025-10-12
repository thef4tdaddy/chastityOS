/**
 * Report Data TanStack Query Hook
 * Aggregates all data needed for Full Report page
 * Enhanced with error handling and retry mechanisms
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
 * Enhanced with error handling and retry logic
 */
export function useGoalsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ["goals", "user", userId],
    queryFn: async () => {
      if (!userId) return [];

      try {
        const goals = await goalDBService.findByUserId(userId);

        logger.debug("Goals fetched for report", {
          userId,
          count: goals.length,
        });

        return goals;
      } catch (error) {
        logger.error("Error fetching goals for report", {
          userId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

/**
 * Aggregates all data needed for Full Report page
 * Enhanced with comprehensive error handling and retry capabilities
 */
export function useReportData(userId: string | undefined) {
  const currentSession = useCurrentSession(userId);
  const sessions = useSessionHistory(userId);
  const events = useEventHistory(userId || "");
  const tasks = useTasksQuery(userId);
  const goals = useGoalsQuery(userId);

  // Determine if any queries are loading
  const isLoading =
    currentSession.isLoading ||
    sessions.isLoading ||
    events.isLoading ||
    tasks.isLoading ||
    goals.isLoading;

  // Collect all errors for comprehensive error reporting
  const errors = [
    currentSession.error,
    sessions.error,
    events.error,
    tasks.error,
    goals.error,
  ].filter((err): err is Error => err !== null && err !== undefined);

  // Log aggregated errors if any exist
  if (errors.length > 0) {
    logger.error("Error(s) in report data aggregation", {
      userId,
      errorCount: errors.length,
      errors: errors.map((e) => ({
        message: e.message,
        name: e.name,
      })),
    });
  }

  return {
    currentSession: currentSession.data || null,
    sessions: sessions.data || [],
    events: events.data || [],
    tasks: tasks.data || [],
    goals: goals.data || [],
    isLoading,
    error: errors.length > 0 ? errors[0] : null, // Return first error for simplicity
    hasPartialData: !isLoading && errors.length > 0 && errors.length < 5, // Some queries succeeded
    // Provide individual error states for granular error handling
    errors: {
      currentSession: currentSession.error,
      sessions: sessions.error,
      events: events.error,
      tasks: tasks.error,
      goals: goals.error,
    },
    // Provide retry functions for each query
    refetch: {
      currentSession: currentSession.refetch,
      sessions: sessions.refetch,
      events: events.refetch,
      tasks: tasks.refetch,
      goals: goals.refetch,
      all: async () => {
        await Promise.all([
          currentSession.refetch(),
          sessions.refetch(),
          events.refetch(),
          tasks.refetch(),
          goals.refetch(),
        ]);
      },
    },
  };
}
