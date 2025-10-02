/**
 * Session History Retrieval Hook
 * Handles session data retrieval by date range, goal, and search queries
 */
import { useCallback } from "react";
import {
  getSessionsByDateRange as getSessionsByDateRangeUtil,
  getSessionsByGoal as getSessionsByGoalUtil,
  searchSessions as searchSessionsUtil,
} from "../../utils/session-history-helpers";
import type {
  HistoricalSession,
  HistorySearchQuery,
} from "./types/sessionHistory";

interface UseSessionHistoryRetrievalParams {
  sessions: HistoricalSession[];
}

export const useSessionHistoryRetrieval = ({
  sessions,
}: UseSessionHistoryRetrievalParams) => {
  const getSessionsByDateRange = useCallback(
    (start: Date, end: Date): HistoricalSession[] =>
      getSessionsByDateRangeUtil(sessions, start, end),
    [sessions],
  );

  const getSessionsByGoal = useCallback(
    (goalType: string): HistoricalSession[] =>
      getSessionsByGoalUtil(sessions, goalType),
    [sessions],
  );

  const searchSessions = useCallback(
    (query: HistorySearchQuery): HistoricalSession[] =>
      searchSessionsUtil(sessions, query),
    [sessions],
  );

  return {
    getSessionsByDateRange,
    getSessionsByGoal,
    searchSessions,
  };
};
