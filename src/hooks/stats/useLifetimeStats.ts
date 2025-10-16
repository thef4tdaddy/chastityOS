/**
 * Lifetime Stats Hook
 * Calculates cumulative stats across all user sessions
 * Optimized with TanStack Query for better caching and performance
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { sessionDBService } from "../../services/database/SessionDBService";
import { serviceLogger } from "../../utils/logging";
import { useSharedTimer } from "../useSharedTimer";
import {
  calculateSessionEffectiveTime,
  calculateSessionPauseTime,
  calculateTimeBetweenSessions,
  calculateTimeSinceSessionEnd,
} from "../../utils/stats/lifetimeStatsHelpers";

const logger = serviceLogger("useLifetimeStats");

export interface LifetimeStats {
  totalChastityTime: number; // Total effective locked time across all sessions
  totalCageOffTime: number; // Total pause time + time between sessions
  totalSessions: number;
  isLoading: boolean;
  refresh: () => Promise<void>; // Manual refresh function
}

/**
 * Hook to calculate lifetime stats across all sessions
 * Updates in real-time as sessions change
 * Optimized with TanStack Query for better performance
 */
export function useLifetimeStats(userId: string | undefined): LifetimeStats {
  // Use shared timer for perfect synchronization with other timer hooks
  const currentTime = useSharedTimer();

  // Use TanStack Query for efficient caching and automatic refetching
  const {
    data: sessions = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["sessions", "lifetime", userId],
    queryFn: async () => {
      if (!userId) return [];

      const allSessions = await sessionDBService.getSessionHistory(
        userId,
        1000,
      ); // Get all sessions
      logger.debug("Loaded sessions for lifetime stats", {
        count: allSessions.length,
      });
      return allSessions;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - stats don't need to be super fresh
    gcTime: 1000 * 60 * 30, // 30 minutes
    enabled: !!userId,
    refetchOnWindowFocus: false, // Don't refetch on window focus to reduce load
  });

  // Calculate lifetime stats
  const stats = useMemo(() => {
    if (!userId || sessions.length === 0) {
      return {
        totalChastityTime: 0,
        totalCageOffTime: 0,
        totalSessions: 0,
        isLoading,
      };
    }

    let totalChastityTime = 0;
    let totalCageOffTime = 0;

    sessions.forEach((session, index) => {
      // Calculate effective chastity time using helper
      totalChastityTime += calculateSessionEffectiveTime(session, currentTime);

      // Calculate pause time using helper
      totalCageOffTime += calculateSessionPauseTime(session, currentTime);

      // Calculate time between sessions using helper
      if (session.endTime && index > 0) {
        const nextSession = sessions[index - 1]; // Sessions are sorted newest first
        totalCageOffTime += calculateTimeBetweenSessions(session, nextSession);
      }

      // If this is the most recent session and it has ended, add time since end
      if (index === 0 && session.endTime) {
        totalCageOffTime += calculateTimeSinceSessionEnd(session, currentTime);
      }
    });

    return {
      totalChastityTime,
      totalCageOffTime,
      totalSessions: sessions.length,
      isLoading,
    };
  }, [sessions, currentTime, userId, isLoading]);

  return {
    ...stats,
    refresh: async () => {
      await refetch();
    },
  };
}
