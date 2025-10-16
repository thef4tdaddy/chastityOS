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
 * Configuration options for useReportData
 */
export interface ReportDataOptions {
  enableSessions?: boolean;
  enableEvents?: boolean;
  enableTasks?: boolean;
  enableGoals?: boolean;
  deferHeavyQueries?: boolean; // Defer heavy queries until needed
}

/**
 * Internal sub-hook: runs all queries and returns the raw query results.
 * This reduces the complexity inside the top-level hook.
 */
function useReportQueries(
  userId: string | undefined,
  options: ReportDataOptions,
) {
  const {
    enableSessions = true,
    enableEvents = true,
    enableTasks = true,
    enableGoals = true,
    deferHeavyQueries = false,
  } = options;

  // Always fetch current session first (critical data)
  const currentSession = useCurrentSession(userId);

  // Defer heavy queries if specified for better initial load performance
  const shouldLoadHeavyQueries = !deferHeavyQueries || currentSession.isSuccess;

  // Selective query execution based on options
  const sessions = useSessionHistory(userId, {
    enabled: enableSessions && shouldLoadHeavyQueries,
  });
  const events = useEventHistory(userId || "", {
    enabled: enableEvents && shouldLoadHeavyQueries && !!userId,
  });
  const tasks = useTasksQuery(userId);
  const goals = useGoalsQuery(userId);

  return {
    currentSession,
    sessions,
    events,
    tasks,
    goals,
    flags: {
      enableSessions,
      enableEvents,
      enableTasks,
      enableGoals,
      shouldLoadHeavyQueries,
    },
  };
}

function computeIsLoading(queries: ReturnType<typeof useReportQueries>) {
  const { currentSession, sessions, events, tasks, goals, flags } = queries;
  const {
    enableSessions,
    enableEvents,
    enableTasks,
    enableGoals,
    shouldLoadHeavyQueries,
  } = flags;

  return (
    currentSession.isLoading ||
    (enableSessions && shouldLoadHeavyQueries && sessions.isLoading) ||
    (enableEvents && shouldLoadHeavyQueries && events.isLoading) ||
    (enableTasks && tasks.isLoading) ||
    (enableGoals && goals.isLoading)
  );
}

function collectErrors(queries: ReturnType<typeof useReportQueries>) {
  const { currentSession, sessions, events, tasks, goals, flags } = queries;
  const { enableSessions, enableEvents, enableTasks, enableGoals } = flags;

  const errors = [
    currentSession.error,
    enableSessions && sessions.error,
    enableEvents && events.error,
    enableTasks && tasks.error,
    enableGoals && goals.error,
  ].filter((err): err is Error => err !== null && err !== undefined);

  return errors;
}

function buildRefetchAll(
  currentSession: ReturnType<typeof useCurrentSession>,
  sessions: ReturnType<typeof useSessionHistory>,
  events: ReturnType<typeof useEventHistory>,
  tasks: ReturnType<typeof useTasksQuery>,
  goals: ReturnType<typeof useGoalsQuery>,
) {
  return {
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
  };
}

/**
 * Pure aggregator: compose returned object from query results.
 * Kept as a thin orchestrator that delegates to small helpers to reduce complexity.
 */
function buildReportFromQueries(
  userId: string | undefined,
  queries: ReturnType<typeof useReportQueries>,
) {
  // rename unused 'flags' to '_flags' to satisfy the lint rule for allowed unused vars
  const {
    currentSession,
    sessions,
    events,
    tasks,
    goals,
    flags: _flags,
  } = queries;

  const isLoading = computeIsLoading(queries);
  const errors = collectErrors(queries);

  if (errors.length > 0) {
    logger.error("Error(s) in report data aggregation", {
      userId,
      errorCount: errors.length,
      errors: errors.map((e) => ({
        message: e?.message || String(e),
        name: e?.name || "Unknown",
        stack: e?.stack,
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
    error: errors.length > 0 ? errors[0] : null,
    hasPartialData: !isLoading && errors.length > 0 && errors.length < 5,
    errors: {
      currentSession: currentSession.error,
      sessions: sessions.error,
      events: events.error,
      tasks: tasks.error,
      goals: goals.error,
    },
    refetch: buildRefetchAll(currentSession, sessions, events, tasks, goals),
  };
}

/**
 * Top-level hook: now a thin composer that uses the sub-hook and aggregator.
 * Complexity is reduced by delegating work to the two helpers above.
 */
export function useReportData(
  userId: string | undefined,
  options: ReportDataOptions = {},
) {
  const queries = useReportQueries(userId, options);
  return buildReportFromQueries(userId, queries);
}
