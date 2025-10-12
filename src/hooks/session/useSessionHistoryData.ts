/**
 * useSessionHistoryData Hook
 * Handles session history data loading and calculations
 * Optimized with TanStack Query for better performance
 */
import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { serviceLogger } from "../../utils/logging";
import {
  calculateOverallCompletionRate,
  calculatePauseFrequency,
  calculateImprovementTrend,
  calculateConsistencyScore,
  calculateSessionLengthTrend,
  calculateGoalCompletionTrend,
  calculateConsistencyTrend,
  calculatePauseFrequencyTrend,
  calculateOverallProgressTrend,
} from "../../utils/sessionHistoryHelpers";
import type {
  HistoricalSession,
  HistoryInsights,
  HistoryTrends,
  HistoryPrivacySettings,
} from "./types/sessionHistory";

const logger = serviceLogger("useSessionHistoryData");

export function useSessionHistoryData(
  userId: string,
  relationshipId: string | undefined,
  privacySettings: HistoryPrivacySettings,
) {
  // Use TanStack Query for efficient data loading with caching
  const {
    data: sessions = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["sessions", "history", userId, relationshipId],
    queryFn: async () => {
      try {
        // This would integrate with your session database service
        // Load sessions with privacy filtering applied
        const allSessions: HistoricalSession[] = [];

        // Apply retention policy
        const retentionDate = new Date();
        retentionDate.setDate(
          retentionDate.getDate() - privacySettings.retentionPeriod,
        );

        const filteredSessions = allSessions.filter(
          (session) => session.startTime >= retentionDate,
        );

        return filteredSessions;
      } catch (error) {
        logger.error("Failed to load sessions", { error });
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    enabled: !!userId,
  });

  const [_error, _setError] = useState<string | null>(null);

  // Memoize insights calculation to prevent recalculation on every render
  const insights = useMemo<HistoryInsights>(() => {
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalEffectiveTime: 0,
        averageSessionLength: 0,
        longestSession: {} as HistoricalSession,
        shortestSession: {} as HistoricalSession,
        mostRecentSession: {} as HistoricalSession,
        goalCompletionRate: 0,
        pauseFrequency: 0,
        improvementTrend: "stable",
        consistencyScore: 0,
      };
    }

    const totalEffectiveTime = sessions.reduce(
      (sum, s) => sum + s.effectiveDuration,
      0,
    );
    const sortedByDuration = [...sessions].sort(
      (a, b) => b.effectiveDuration - a.effectiveDuration,
    );
    const sortedByDate = [...sessions].sort(
      (a, b) => b.startTime.getTime() - a.startTime.getTime(),
    );

    return {
      totalSessions: sessions.length,
      totalEffectiveTime,
      averageSessionLength: totalEffectiveTime / sessions.length,
      longestSession: sortedByDuration[0] || ({} as HistoricalSession),
      shortestSession:
        sortedByDuration[sortedByDuration.length - 1] ||
        ({} as HistoricalSession),
      mostRecentSession: sortedByDate[0] || ({} as HistoricalSession),
      goalCompletionRate: calculateOverallCompletionRate(sessions),
      pauseFrequency: calculatePauseFrequency(sessions),
      improvementTrend: calculateImprovementTrend(sessions),
      consistencyScore: calculateConsistencyScore(sessions),
    };
  }, [sessions]);

  // Memoize trends calculation to prevent recalculation on every render
  const trends = useMemo<HistoryTrends>(() => {
    return {
      sessionLength: calculateSessionLengthTrend(sessions),
      goalCompletion: calculateGoalCompletionTrend(sessions),
      consistency: calculateConsistencyTrend(sessions),
      pauseFrequency: calculatePauseFrequencyTrend(sessions),
      overallProgress: calculateOverallProgressTrend(sessions),
    };
  }, [sessions]);

  // Legacy callback for compatibility
  const calculateInsights = useCallback(async () => {
    // No-op: insights are now calculated via useMemo
    logger.debug("calculateInsights called (now computed via useMemo)");
  }, []);

  const calculateTrends = useCallback(async () => {
    // No-op: trends are now calculated via useMemo
    logger.debug("calculateTrends called (now computed via useMemo)");
  }, []);

  const setSessions = useCallback(() => {
    // No-op: sessions are now managed by TanStack Query
    logger.warn(
      "setSessions called but sessions are managed by TanStack Query",
    );
  }, []);

  return {
    sessions,
    insights,
    trends,
    isLoading,
    error: _error || (queryError ? String(queryError) : null),
    setSessions,
    calculateInsights,
    calculateTrends,
  };
}
