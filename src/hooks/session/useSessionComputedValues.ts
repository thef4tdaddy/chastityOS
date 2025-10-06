/**
 * Session Computed Values Hook
 * Calculates derived values from session history
 */
import { useMemo } from "react";
import {
  calculateOverallCompletionRate,
  calculateLongestStreak,
} from "../../utils/sessionHistoryHelpers";
import type { HistoricalSession } from "./types/sessionHistory";

export function useSessionComputedValues(sessions: HistoricalSession[]) {
  const totalSessions = useMemo(() => sessions.length, [sessions]);

  const averageSessionLength = useMemo(
    () =>
      sessions.length > 0
        ? sessions.reduce(
            (sum, session) => sum + session.effectiveDuration,
            0,
          ) / sessions.length
        : 0,
    [sessions],
  );

  const goalCompletionRate = useMemo(
    () => calculateOverallCompletionRate(sessions),
    [sessions],
  );

  const longestStreak = useMemo(
    () => calculateLongestStreak(sessions),
    [sessions],
  );

  return {
    totalSessions,
    averageSessionLength,
    goalCompletionRate,
    longestStreak,
  };
}
