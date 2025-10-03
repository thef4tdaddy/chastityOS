/**
 * Session Timer Hook
 * Provides real-time timer updates for active chastity sessions
 */
import { useMemo } from "react";
import type { DBSession } from "../types/database";
import { TimerService } from "../services/TimerService";
import { useSharedTimer } from "./useSharedTimer";

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

  // Cage off time data
  currentCageOffTime: number; // Current session cage off (pause time if paused)
  currentCageOffTimeFormatted: string;
  totalSessionPauseTime: number; // Total pause time for current session
  totalSessionPauseTimeFormatted: string;

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
  const { enabled = true } = options;

  // Use shared timer for perfect synchronization across all components
  const currentTime = useSharedTimer();

  // Track session state changes manually to avoid zustand warnings
  const sessionId = session?.id;

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
      currentCageOffTime: 0,
      currentCageOffTimeFormatted: "0s",
      totalSessionPauseTime: 0,
      totalSessionPauseTimeFormatted: "0s",
      isActive: false,
      isPaused: false,
      currentTime,
    };

    if (!session) {
      return defaultData;
    }

    // If session has ended, calculate time since end (cage off time)
    if (session.endTime) {
      const timeSinceEnd = Math.floor(
        (currentTime.getTime() - session.endTime.getTime()) / 1000,
      );
      return {
        ...defaultData,
        currentCageOffTime: timeSinceEnd,
        currentCageOffTimeFormatted: TimerService.formatDuration(timeSinceEnd),
        isActive: false,
        isPaused: false,
        currentTime,
      };
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

    // Calculate cage off time data
    const currentCageOffTime = TimerService.calculateCurrentCageOffTime(
      session,
      currentTime,
    );
    const totalSessionPauseTime = TimerService.calculateTotalSessionPauseTime(
      session,
      currentTime,
    );

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
      currentCageOffTime,
      currentCageOffTimeFormatted:
        TimerService.formatDuration(currentCageOffTime),
      totalSessionPauseTime,
      totalSessionPauseTimeFormatted: TimerService.formatDuration(
        totalSessionPauseTime,
      ),
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
  _options: UseSessionTimerOptions = {},
): SessionTimerData[] {
  // Use shared timer for perfect synchronization
  const currentTime = useSharedTimer();

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
          currentCageOffTime: 0,
          currentCageOffTimeFormatted: "0s",
          totalSessionPauseTime: 0,
          totalSessionPauseTimeFormatted: "0s",
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
      const currentCageOffTime = TimerService.calculateCurrentCageOffTime(
        session,
        currentTime,
      );
      const totalSessionPauseTime = TimerService.calculateTotalSessionPauseTime(
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
        currentCageOffTime,
        currentCageOffTimeFormatted:
          TimerService.formatDuration(currentCageOffTime),
        totalSessionPauseTime,
        totalSessionPauseTimeFormatted: TimerService.formatDuration(
          totalSessionPauseTime,
        ),
        isActive: true,
        isPaused: session.isPaused,
        currentTime,
      };
    });
  }, [sessions, currentTime]);

  return timerDataArray;
}
