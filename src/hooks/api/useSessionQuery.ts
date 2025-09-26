/**
 * Session TanStack Query Hooks
 * Manages chastity session data with Dexie as backend
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionDBService } from "@/services/database";
import { cacheConfig } from "@/services/cache-config";
import { firebaseSync } from "@/services/sync";
import type { DBSession } from "@/types/database";
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
 * Query for getting session history
 */
export function useSessionHistory(userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["sessions", "history", userId],
    queryFn: async () => {
      if (!userId) return [];

      const sessions = await sessionDBService.findByUserId(userId);

      // Trigger background sync if online
      if (navigator.onLine) {
        firebaseSync.syncUserSessions(userId).catch((error) => {
          logger.warn("Background session history sync failed:", { error });
        });
      }

      return sessions.sort(
        (a, b) => b.startTime.getTime() - a.startTime.getTime(),
      );
    },
    ...cacheConfig.sessionHistory,
    enabled: !!userId && enabled,
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
      const session = await sessionDBService.startSession({
        userId: params.userId,
        startTime: params.startTime || new Date(),
        requiredDuration: params.requiredDuration,
      });

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
      // 1. Update local Dexie immediately
      const updatedSession = await sessionDBService.endSession(
        params.userId,
        params.endTime || new Date(),
        params.reason,
      );

      // 2. Trigger Firebase sync in background
      if (navigator.onLine) {
        firebaseSync.syncUserSessions(params.userId).catch((error) => {
          logger.warn("Session end sync failed:", { error });
        });
      }

      return updatedSession;
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
      // 1. Update local Dexie immediately
      const updatedSession = await sessionDBService.pauseSession(
        params.userId,
        params.reason,
      );

      // 2. Trigger Firebase sync in background
      if (navigator.onLine) {
        firebaseSync.syncUserSessions(params.userId).catch((error) => {
          logger.warn("Session pause sync failed:", { error });
        });
      }

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
