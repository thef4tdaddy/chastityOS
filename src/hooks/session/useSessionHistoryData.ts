/**
 * useSessionHistoryData Hook
 * Handles session history data loading and calculations
 */
import { useState, useCallback, useEffect } from "react";
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
  const [sessions, setSessions] = useState<HistoricalSession[]>([]);
  const [insights, setInsights] = useState<HistoryInsights>({
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
  });
  const [trends, setTrends] = useState<HistoryTrends>({
    sessionLength: { labels: [], values: [], trend: "stable" },
    goalCompletion: { labels: [], values: [], trend: "stable" },
    consistency: { labels: [], values: [], trend: "stable" },
    pauseFrequency: { labels: [], values: [], trend: "stable" },
    overallProgress: { labels: [], values: [], trend: "stable" },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
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

      setSessions(filteredSessions);
    } catch (error) {
      logger.error("Failed to load sessions", { error });
    }
  }, [privacySettings.retentionPeriod]);

  const calculateInsights = useCallback(async () => {
    try {
      if (sessions.length === 0) return;

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

      const newInsights: HistoryInsights = {
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

      setInsights(newInsights);
    } catch (error) {
      logger.error("Failed to calculate insights", { error });
    }
  }, [sessions]);

  const calculateTrends = useCallback(async () => {
    try {
      const newTrends: HistoryTrends = {
        sessionLength: calculateSessionLengthTrend(sessions),
        goalCompletion: calculateGoalCompletionTrend(sessions),
        consistency: calculateConsistencyTrend(sessions),
        pauseFrequency: calculatePauseFrequencyTrend(sessions),
        overallProgress: calculateOverallProgressTrend(sessions),
      };

      setTrends(newTrends);
    } catch (error) {
      logger.error("Failed to calculate trends", { error });
    }
  }, [sessions]);

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        setError(null);

        await Promise.all([
          loadSessions(),
          calculateInsights(),
          calculateTrends(),
        ]);
      } catch (err) {
        logger.error("Failed to initialize session history data", {
          error: err,
        });
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize session history data",
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, relationshipId]);

  return {
    sessions,
    insights,
    trends,
    isLoading,
    error,
    setSessions,
    calculateInsights,
    calculateTrends,
  };
}
