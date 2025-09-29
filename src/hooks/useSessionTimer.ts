/**
 * Session Timer Hook
 * Provides real-time timer updates for active chastity sessions
 */
import { useState, useEffect, useMemo, useRef } from "react";
import type { DBSession } from "../types/database";
import { TimerService } from "../services/TimerService";

export interface SessionTimerData {
  // Core timer values
  effectiveTime: number; // Time in seconds excluding pauses
  totalElapsedTime: number; // Total time including pauses
  currentPauseDuration: number; // Current pause duration if paused

  // Formatted strings
  effectiveTimeFormatted: string;
  totalElapsedTimeFormatted: string;
  currentPauseDurationFormatted: string;

  // Goal-related data
  goalProgress: number; // Percentage (0-100)
  remainingGoalTime: number; // Seconds remaining to goal
  remainingGoalTimeFormatted: string;
  isGoalCompleted: boolean;

  // State flags
  isActive: boolean; // Session exists and not ended
  isPaused: boolean;

  // Current time reference
  currentTime: Date;
}

export interface UseSessionTimerOptions {
  updateInterval?: number; // Milliseconds, default 1000
  enabled?: boolean; // Enable/disable timer updates, default true
}

/**
 * Hook for real-time session timer with live updates
 */
export function useSessionTimer(
  session: DBSession | null | undefined,
  options: UseSessionTimerOptions = {},
): SessionTimerData {
  const { updateInterval = 1000, enabled = true } = options;

  const [currentTime, setCurrentTime] = useState(() => new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track session state changes manually to avoid zustand warnings
  const sessionId = session?.id;
  const sessionEndTime = session?.endTime;
  const isSessionActive = enabled && sessionId && !sessionEndTime;

  // Update current time every second
  useEffect(() => {
    if (!isSessionActive) {
      // Clear interval if timer is disabled or session is not active
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const updateCurrentTime = () => {
      setCurrentTime(new Date());
    };

    // Set up interval
    intervalRef.current = setInterval(updateCurrentTime, updateInterval);

    // Cleanup on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isSessionActive, updateInterval]); // eslint-disable-line zustand-safe-patterns/zustand-no-store-actions-in-deps

  // Memoized calculations to prevent unnecessary recalculations
  const timerData = useMemo((): SessionTimerData => {
    // Default values when no session or session ended
    const defaultData: SessionTimerData = {
      effectiveTime: 0,
      totalElapsedTime: 0,
      currentPauseDuration: 0,
      effectiveTimeFormatted: "0s",
      totalElapsedTimeFormatted: "0s",
      currentPauseDurationFormatted: "0s",
      goalProgress: 0,
      remainingGoalTime: 0,
      remainingGoalTimeFormatted: "0s",
      isGoalCompleted: false,
      isActive: false,
      isPaused: false,
      currentTime,
    };

    if (!session || session.endTime) {
      return defaultData;
    }

    // Calculate timer values
    const effectiveTime = TimerService.calculateEffectiveTime(
      session,
      currentTime,
    );
    const totalElapsedTime = TimerService.calculateTotalElapsedTime(
      session,
      currentTime,
    );
    const currentPauseDuration = TimerService.calculateCurrentPauseDuration(
      session,
      currentTime,
    );

    // Calculate goal-related data
    const goalProgress = TimerService.calculateGoalProgress(
      session,
      currentTime,
    );
    const remainingGoalTime = TimerService.calculateRemainingGoalTime(
      session,
      currentTime,
    );
    const isGoalCompleted = TimerService.isGoalCompleted(session, currentTime);

    return {
      effectiveTime,
      totalElapsedTime,
      currentPauseDuration,
      effectiveTimeFormatted: TimerService.formatDuration(effectiveTime),
      totalElapsedTimeFormatted: TimerService.formatDuration(totalElapsedTime),
      currentPauseDurationFormatted:
        TimerService.formatDuration(currentPauseDuration),
      goalProgress,
      remainingGoalTime,
      remainingGoalTimeFormatted:
        TimerService.formatDuration(remainingGoalTime),
      isGoalCompleted,
      isActive: true,
      isPaused: session.isPaused,
      currentTime,
    };
  }, [session, currentTime]);

  return timerData;
}

/**
 * Hook for getting a snapshot of timer data without live updates
 * Useful for components that don't need real-time updates
 */
export function useSessionTimerSnapshot(
  session: DBSession | null | undefined,
): SessionTimerData {
  return useSessionTimer(session, { enabled: false });
}

/**
 * Hook for multiple sessions timer data (useful for dashboards)
 */
export function useMultiSessionTimer(
  sessions: (DBSession | null | undefined)[],
  options: UseSessionTimerOptions = {},
): SessionTimerData[] {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const { updateInterval = 1000, enabled = true } = options;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check if we have any active sessions
  const hasActiveSessions = useMemo(() => {
    return sessions.some((session) => session && !session.endTime);
  }, [sessions]);

  // Update current time for all sessions
  useEffect(() => {
    if (!enabled || !hasActiveSessions) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const updateCurrentTime = () => {
      setCurrentTime(new Date());
    };

    intervalRef.current = setInterval(updateCurrentTime, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, hasActiveSessions, updateInterval]); // eslint-disable-line zustand-safe-patterns/zustand-no-store-actions-in-deps

  // Calculate timer data for each session
  const timerDataArray = useMemo(() => {
    return sessions.map((session) => {
      if (!session || session.endTime) {
        return {
          effectiveTime: 0,
          totalElapsedTime: 0,
          currentPauseDuration: 0,
          effectiveTimeFormatted: "0s",
          totalElapsedTimeFormatted: "0s",
          currentPauseDurationFormatted: "0s",
          goalProgress: 0,
          remainingGoalTime: 0,
          remainingGoalTimeFormatted: "0s",
          isGoalCompleted: false,
          isActive: false,
          isPaused: false,
          currentTime,
        };
      }

      const effectiveTime = TimerService.calculateEffectiveTime(
        session,
        currentTime,
      );
      const totalElapsedTime = TimerService.calculateTotalElapsedTime(
        session,
        currentTime,
      );
      const currentPauseDuration = TimerService.calculateCurrentPauseDuration(
        session,
        currentTime,
      );
      const goalProgress = TimerService.calculateGoalProgress(
        session,
        currentTime,
      );
      const remainingGoalTime = TimerService.calculateRemainingGoalTime(
        session,
        currentTime,
      );
      const isGoalCompleted = TimerService.isGoalCompleted(
        session,
        currentTime,
      );

      return {
        effectiveTime,
        totalElapsedTime,
        currentPauseDuration,
        effectiveTimeFormatted: TimerService.formatDuration(effectiveTime),
        totalElapsedTimeFormatted:
          TimerService.formatDuration(totalElapsedTime),
        currentPauseDurationFormatted:
          TimerService.formatDuration(currentPauseDuration),
        goalProgress,
        remainingGoalTime,
        remainingGoalTimeFormatted:
          TimerService.formatDuration(remainingGoalTime),
        isGoalCompleted,
        isActive: true,
        isPaused: session.isPaused,
        currentTime,
      };
    });
  }, [sessions, currentTime]);

  return timerDataArray;
}
