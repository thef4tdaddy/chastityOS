/**
 * Session History Data Hook
 * Handles state management and data loading for session history
 */
import { useState, useCallback } from "react";
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
  createEmptyTrendData,
} from "../../utils/sessionHistoryHelpers";
import type {
  HistoricalSession,
  HistoryPrivacySettings,
  KeyholderHistoryAccess,
  HistoryInsights,
  HistoryTrends,
} from "./types/sessionHistory";

const logger = serviceLogger("useSessionHistoryData");

export const useSessionHistoryData = (
  _userId: string,
  _relationshipId?: string,
) => {
  const [sessions, setSessions] = useState<HistoricalSession[]>([]);
  const [privacySettings, setPrivacySettings] =
    useState<HistoryPrivacySettings>({
      shareWithKeyholder: false,
      shareDuration: true,
      shareGoals: true,
      sharePauses: false,
      shareNotes: false,
      shareRatings: false,
      retentionPeriod: 365, // 1 year
      allowExport: true,
      anonymizeOldData: false,
    });
  const [keyholderAccess, setKeyholderAccess] =
    useState<KeyholderHistoryAccess>({
      hasAccess: false,
      accessLevel: "summary",
      canViewRatings: false,
      canViewNotes: false,
      canViewPauses: false,
    });
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
    sessionLength: createEmptyTrendData(),
    goalCompletion: createEmptyTrendData(),
    consistency: createEmptyTrendData(),
    pauseFrequency: createEmptyTrendData(),
    overallProgress: createEmptyTrendData(),
  });

  const loadSessions = useCallback(async () => {
    try {
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

  const loadPrivacySettings = useCallback(async () => {
    try {
      // Load user's privacy preferences from database
    } catch (error) {
      logger.error("Failed to load privacy settings", { error });
    }
  }, []);

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

  return {
    sessions,
    setSessions,
    privacySettings,
    setPrivacySettings,
    keyholderAccess,
    setKeyholderAccess,
    insights,
    trends,
    loadSessions,
    loadPrivacySettings,
    calculateInsights,
    calculateTrends,
  };
};
