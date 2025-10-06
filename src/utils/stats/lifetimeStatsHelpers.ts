/**
 * Lifetime Stats Calculation Helpers
 * Extracted helper functions to reduce complexity
 */
import type { DBSession } from "../../types/database";

/**
 * Calculate effective chastity time for a session
 */
export function calculateSessionEffectiveTime(
  session: DBSession,
  currentTime: Date,
): number {
  const startTime = session.startTime;
  const endTime = session.endTime || currentTime;

  if (!startTime) return 0;

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
    return Math.max(0, effectiveTime - currentPauseDuration);
  }

  return effectiveTime;
}

/**
 * Calculate accumulated pause time for a session
 */
export function calculateSessionPauseTime(
  session: DBSession,
  currentTime: Date,
): number {
  let totalPauseTime = session.accumulatedPauseTime || 0;

  // If currently paused, add current pause duration
  if (session.isPaused && session.pauseStartTime && !session.endTime) {
    const currentPauseDuration = Math.floor(
      (currentTime.getTime() - session.pauseStartTime.getTime()) / 1000,
    );
    totalPauseTime += currentPauseDuration;
  }

  return totalPauseTime;
}

/**
 * Calculate time between sessions
 */
export function calculateTimeBetweenSessions(
  currentSession: DBSession,
  nextSession: DBSession | undefined,
): number {
  if (!currentSession.endTime || !nextSession?.startTime) return 0;

  const timeBetween = Math.floor(
    (nextSession.startTime.getTime() - currentSession.endTime.getTime()) / 1000,
  );
  return Math.max(0, timeBetween);
}

/**
 * Calculate time since most recent session ended
 */
export function calculateTimeSinceSessionEnd(
  session: DBSession,
  currentTime: Date,
): number {
  if (!session.endTime) return 0;

  const timeSinceEnd = Math.floor(
    (currentTime.getTime() - session.endTime.getTime()) / 1000,
  );
  return Math.max(0, timeSinceEnd);
}
