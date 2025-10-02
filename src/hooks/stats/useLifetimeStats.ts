/**
 * Lifetime Stats Hook
 * Calculates cumulative stats across all user sessions
 */
import { useState, useEffect, useMemo } from "react";
import { sessionDBService } from "../../services/database/SessionDBService";
import { serviceLogger } from "../../utils/logging";

const logger = serviceLogger("useLifetimeStats");

export interface LifetimeStats {
  totalChastityTime: number; // Total effective locked time across all sessions
  totalCageOffTime: number; // Total pause time + time between sessions
  totalSessions: number;
  isLoading: boolean;
}

/**
 * Hook to calculate lifetime stats across all sessions
 * Updates in real-time as sessions change
 */
export function useLifetimeStats(userId: string | undefined): LifetimeStats {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

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

    // Reload sessions every 2 seconds to catch updates from pause/resume/end
    const intervalId = setInterval(() => {
      loadSessions();
    }, 2000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [userId]);

  // Update current time every second for real-time calculations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate lifetime stats
  const stats = useMemo((): LifetimeStats => {
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
      // Calculate effective chastity time (total time - pauses)
      const startTime = session.startTime;
      const endTime = session.endTime || currentTime;

      if (startTime) {
        const sessionDuration = Math.floor(
          (endTime.getTime() - startTime.getTime()) / 1000,
        );
        const effectiveTime = Math.max(
          0,
          sessionDuration - (session.accumulatedPauseTime || 0),
        );

        // If session is currently paused, subtract current pause duration
        if (session.isPaused && session.pauseStartTime && !session.endTime) {
          const currentPauseDuration = Math.floor(
            (currentTime.getTime() - session.pauseStartTime.getTime()) / 1000,
          );
          totalChastityTime += Math.max(
            0,
            effectiveTime - currentPauseDuration,
          );
        } else {
          totalChastityTime += effectiveTime;
        }

        // Add accumulated pause time to cage-off time
        totalCageOffTime += session.accumulatedPauseTime || 0;

        // If currently paused, add current pause duration
        if (session.isPaused && session.pauseStartTime && !session.endTime) {
          const currentPauseDuration = Math.floor(
            (currentTime.getTime() - session.pauseStartTime.getTime()) / 1000,
          );
          totalCageOffTime += currentPauseDuration;
        }
      }

      // Calculate time between this session and the next one (cage off time)
      if (session.endTime && index > 0) {
        const nextSession = sessions[index - 1]; // Sessions are sorted newest first
        if (nextSession && nextSession.startTime) {
          const timeBetween = Math.floor(
            (nextSession.startTime.getTime() - session.endTime.getTime()) /
              1000,
          );
          totalCageOffTime += Math.max(0, timeBetween);
        }
      }

      // If this is the most recent session and it has ended, add time since end
      if (index === 0 && session.endTime) {
        const timeSinceEnd = Math.floor(
          (currentTime.getTime() - session.endTime.getTime()) / 1000,
        );
        totalCageOffTime += Math.max(0, timeSinceEnd);
      }
    });

    return {
      totalChastityTime,
      totalCageOffTime,
      totalSessions: sessions.length,
      isLoading,
    };
  }, [sessions, currentTime, userId, isLoading]);

  return stats;
}
