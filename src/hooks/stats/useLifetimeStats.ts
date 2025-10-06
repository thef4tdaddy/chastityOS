/**
 * Lifetime Stats Hook
 * Calculates cumulative stats across all user sessions
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { sessionDBService } from "../../services/database/SessionDBService";
import { serviceLogger } from "../../utils/logging";
import { useSharedTimer } from "../useSharedTimer";
import type { DBSession } from "../../types/database";
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
 */
export function useLifetimeStats(userId: string | undefined): LifetimeStats {
  const [sessions, setSessions] = useState<DBSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Use shared timer for perfect synchronization with other timer hooks
  const currentTime = useSharedTimer();

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (!userId) return;

    try {
      const allSessions = await sessionDBService.getSessionHistory(
        userId,
        1000,
      );
      setSessions(allSessions);
      logger.debug("Refreshed sessions for lifetime stats", {
        count: allSessions.length,
      });
    } catch (error) {
      logger.error("Failed to refresh sessions for lifetime stats", {
        error: error as Error,
      });
    }
  }, [userId]);

  // Load all sessions for the user
  useEffect(() => {
    if (!userId) {
      setSessions([]);
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const loadSessions = async () => {
      try {
        setIsLoading(true);
        const allSessions = await sessionDBService.getSessionHistory(
          userId,
          1000,
        ); // Get all sessions
        if (mounted) {
          setSessions(allSessions);
          logger.debug("Loaded sessions for lifetime stats", {
            count: allSessions.length,
          });
        }
      } catch (error) {
        logger.error("Failed to load sessions for lifetime stats", {
          error: error as Error,
        });
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadSessions();

    return () => {
      mounted = false;
    };
  }, [userId]);

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
    refresh,
  };
}
