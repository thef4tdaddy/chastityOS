/**
 * Session TanStack Query Hooks
 * Manages chastity session data with Dexie as backend
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionDBService } from "@/services/database";
import { cacheConfig } from "@/services/cache-config";
import { firebaseSync } from "@/services/sync";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("useSessionQuery");

/**
 * Query for getting current active session
 */
export function useCurrentSession(userId: string | undefined) {
  return useQuery({
    queryKey: ["session", "current", userId],
    queryFn: async () => {
      if (!userId) return null;

      // Always read from local Dexie first for instant response
      const session = await sessionDBService.getCurrentSession(userId);

      // Trigger background sync if online to ensure data freshness
      if (navigator.onLine) {
        firebaseSync.syncUserSessions(userId).catch((error) => {
          logger.warn("Background session sync failed:", { error });
        });
      }

      return session;
    },
    ...cacheConfig.currentSession, // Apply specific cache settings
    enabled: !!userId, // The query will not run until the userId is available
  });
}

/**
 * Query for getting session history with pagination support
 */
export function useSessionHistory(
  userId: string | undefined,
  options: {
    enabled?: boolean;
    limit?: number;
    offset?: number;
  } = {},
) {
  const { enabled = true, limit = 50, offset = 0 } = options;

  return useQuery({
    queryKey: ["sessions", "history", userId, limit, offset],
    queryFn: async () => {
      if (!userId) return [];

      // Use paginated getSessionHistory method
      const sessions = await sessionDBService.getSessionHistory(
        userId,
        limit,
        offset,
      );

      // Trigger background sync if online (only for first page)
      if (navigator.onLine && offset === 0) {
        firebaseSync.syncUserSessions(userId).catch((error) => {
          logger.warn("Background session history sync failed:", { error });
        });
      }

      return sessions;
    },
    ...cacheConfig.sessionHistory,
    enabled: !!userId && enabled,
  });
}

/**
 * Query for getting total session count
 */
export function useSessionCount(userId: string | undefined) {
  return useQuery({
    queryKey: ["sessions", "count", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const sessions = await sessionDBService.findByUserId(userId);
      return sessions.length;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    enabled: !!userId,
  });
}

/**
 * Mutations for session operations
 */
export function useSessionMutations() {
  const queryClient = useQueryClient();

  const startSession = useMutation({
    mutationFn: async (params: {
      userId: string;
      startTime?: Date;
      requiredDuration?: number;
    }) => {
      // 1. Write to local Dexie immediately for optimistic update
      const sessionId = await sessionDBService.startSession(params.userId, {
        goalDuration: params.requiredDuration,
        notes: `Session started at ${params.startTime || new Date()}`,
      });

      // Get the created session
      const session = await sessionDBService.findById(sessionId);
      if (!session) {
        throw new Error("Failed to create session");
      }

      // 2. Trigger Firebase sync in background
      if (navigator.onLine) {
        firebaseSync.syncUserSessions(params.userId).catch((error) => {
          logger.warn("Session start sync failed:", { error });
        });
      }

      return session;
    },
    onSuccess: (data, variables) => {
      // Update the current session cache
      queryClient.setQueryData(["session", "current", variables.userId], data);

      // Invalidate session history to include new session
      queryClient.invalidateQueries({
        queryKey: ["sessions", "history", variables.userId],
      });
    },
    onError: (error) => {
      logger.error("Failed to start session:", { error });
    },
  });

  const endSession = useMutation({
    mutationFn: async (params: {
      userId: string;
      endTime?: Date;
      reason?: string;
    }) => {
      // 1. Get current session first
      const currentSession = await sessionDBService.getCurrentSession(
        params.userId,
      );
      if (!currentSession) {
        throw new Error("No active session to end");
      }

      // 2. End the session by sessionId
      await sessionDBService.endSession(
        currentSession.id,
        params.endTime || new Date(),
        params.reason,
      );

      // 3. Trigger Firebase sync in background
      if (navigator.onLine) {
        firebaseSync.syncUserSessions(params.userId).catch((error) => {
          logger.warn("Session end sync failed:", { error });
        });
      }

      return currentSession;
    },
    onSuccess: (data, variables) => {
      // Clear current session since it's ended
      queryClient.setQueryData(["session", "current", variables.userId], null);

      // Invalidate session history to reflect ended session
      queryClient.invalidateQueries({
        queryKey: ["sessions", "history", variables.userId],
      });
    },
    onError: (error) => {
      logger.error("Failed to end session:", { error });
    },
  });

  const pauseSession = useMutation({
    mutationFn: async (params: { userId: string; reason?: string }) => {
      // 1. Get current session first
      const currentSession = await sessionDBService.getCurrentSession(
        params.userId,
      );
      if (!currentSession) {
        throw new Error("No active session to pause");
      }

      // 2. Update local Dexie immediately
      await sessionDBService.pauseSession(currentSession.id, new Date());

      // 2. Trigger Firebase sync in background
      if (navigator.onLine) {
        firebaseSync.syncUserSessions(params.userId).catch((error) => {
          logger.warn("Session pause sync failed:", { error });
        });
      }

      // Return the updated session
      const updatedSession = await sessionDBService.getCurrentSession(
        params.userId,
      );
      return updatedSession;
    },
    onSuccess: (data, variables) => {
      // Update current session cache
      queryClient.setQueryData(["session", "current", variables.userId], data);
    },
    onError: (error) => {
      logger.error("Failed to pause session:", { error });
    },
  });

  const resumeSession = useMutation({
    mutationFn: async (params: { userId: string }) => {
      // 1. Update local Dexie immediately
      const updatedSession = await sessionDBService.resumeSession(
        params.userId,
      );

      // 2. Trigger Firebase sync in background
      if (navigator.onLine) {
        firebaseSync.syncUserSessions(params.userId).catch((error) => {
          logger.warn("Session resume sync failed:", { error });
        });
      }

      return updatedSession;
    },
    onSuccess: (data, variables) => {
      // Update current session cache
      queryClient.setQueryData(["session", "current", variables.userId], data);
    },
    onError: (error) => {
      logger.error("Failed to resume session:", { error });
    },
  });

  return {
    startSession,
    endSession,
    pauseSession,
    resumeSession,
  };
}
