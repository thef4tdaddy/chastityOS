/**
 * Session History Management Hook
 * Provides comprehensive session history with privacy controls,
 * data visualization support, and keyholder access management
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import type { DBSession, DBGoal } from "../../types/database";
import type { KeyholderRelationship } from "../../types/core";
import { serviceLogger } from "../../utils/logging";
import { useSessionHistoryQueries } from "./useSessionHistoryQueries";
import type {
  HistoricalSession,
  SessionGoal,
  GoalCompletionRecord,
  PauseEvent,
  KeyholderInteraction,
  SessionRating,
  HistoryPrivacySettings,
  KeyholderHistoryAccess,
  HistoryInsights,
  HistoryTrends,
  TrendData,
  TrendPoint,
  SessionHistoryState,
  HistorySearchQuery,
  PersonalDataExport,
  KeyholderHistoryView,
  PerformanceTrends,
  GoalProgressHistory,
  ComparisonMetrics,
} from "./types/sessionHistory";
import {
  createEmptyTrendData,
  calculateOverallCompletionRate,
  calculateLongestStreak,
  calculatePauseFrequency,
  calculateImprovementTrend,
  calculateConsistencyScore,
  calculateSessionLengthTrend,
  calculateGoalCompletionTrend,
  calculateConsistencyTrend,
  calculatePauseFrequencyTrend,
  calculateOverallProgressTrend,
} from "../../utils/helpers/sessionHistory";

const logger = serviceLogger("useSessionHistory");

// Re-export types for backward compatibility
export type {
  HistoricalSession,
  SessionGoal,
  GoalCompletionRecord,
  PauseEvent,
  KeyholderInteraction,
  SessionRating,
  HistoryPrivacySettings,
  KeyholderHistoryAccess,
  HistoryInsights,
  HistoryTrends,
  TrendData,
  TrendPoint,
  SessionHistoryState,
  HistorySearchQuery,
  PersonalDataExport,
  KeyholderHistoryView,
  PerformanceTrends,
  GoalProgressHistory,
  ComparisonMetrics,
};

// ==================== HOOK IMPLEMENTATION ====================

export const useSessionHistory = (userId: string, relationshipId?: string) => {
  // ==================== STATE ====================

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
  const [relationship, setRelationship] =
    useState<KeyholderRelationship | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==================== COMPUTED VALUES ====================

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

  const hasPrivacyRestrictions = useMemo(
    () => !privacySettings.shareWithKeyholder,
    [privacySettings.shareWithKeyholder],
  );

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    const initializeHistory = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Load relationship data if available
        if (relationshipId) {
          // Set keyholder access based on relationship permissions
          setKeyholderAccess({
            hasAccess: privacySettings.shareWithKeyholder,
            accessLevel: privacySettings.shareWithKeyholder
              ? "detailed"
              : "summary",
            canViewRatings: privacySettings.shareRatings,
            canViewNotes: privacySettings.shareNotes,
            canViewPauses: privacySettings.sharePauses,
          });
        }

        // Load historical data
        await Promise.all([
          loadSessions(),
          loadPrivacySettings(),
          calculateInsights(),
          calculateTrends(),
        ]);
      } catch (err) {
        logger.error("Failed to initialize session history", { error: err });
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize session history",
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeHistory();
  }, [
    userId,
    relationshipId,
    loadSessions,
    loadPrivacySettings,
    calculateTrends,
    calculateInsights,
  ]);

  // ==================== DATA LOADING FUNCTIONS ====================

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
  }, [userId, privacySettings.retentionPeriod]);

  const loadPrivacySettings = useCallback(async () => {
    try {
      // Load user's privacy preferences from database
      // For now, use defaults
    } catch (error) {
      logger.error("Failed to load privacy settings", { error });
    }
  }, [userId]);

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
        longestSession: sortedByDuration[0],
        shortestSession: sortedByDuration[sortedByDuration.length - 1],
        mostRecentSession: sortedByDate[0],
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
  // ==================== DATA RETRIEVAL & PRIVACY ====================
  // Using composable hook for query and privacy functions
  const {
    getSessionsByDateRange,
    getSessionsByGoal,
    searchSessions,
    updatePrivacySettings,
    exportPersonalData,
    deleteHistoricalData,
  } = useSessionHistoryQueries(
    sessions,
    privacySettings,
    insights,
    userId,
    setSessions,
    setPrivacySettings,
    calculateInsights,
    calculateTrends,
  );

  // ==================== KEYHOLDER ACCESS ====================

  const getKeyholderView = useCallback((): KeyholderHistoryView => {
    if (!keyholderAccess.hasAccess) {
      return {
        allowedSessions: [],
        summaryStats: {
          totalSessions: 0,
          averageDuration: 0,
          goalCompletionRate: 0,
          lastSessionDate: new Date(),
        },
        accessLevel: "summary",
        restrictions: ["No access granted by submissive"],
      };
    }

    const allowedSessions = sessions.map((session) => {
      const filteredSession: Partial<HistoricalSession> = {
        id: session.id,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: privacySettings.shareDuration ? session.duration : undefined,
        effectiveDuration: privacySettings.shareDuration
          ? session.effectiveDuration
          : undefined,
        goals: privacySettings.shareGoals ? session.goals : [],
        pauseEvents: privacySettings.sharePauses ? session.pauseEvents : [],
        notes: privacySettings.shareNotes ? session.notes : "",
        rating: privacySettings.shareRatings ? session.rating : undefined,
        keyholderInteractions: session.keyholderInteractions,
      };

      return filteredSession;
    });

    return {
      allowedSessions,
      summaryStats: {
        totalSessions: sessions.length,
        averageDuration: averageSessionLength,
        goalCompletionRate,
        lastSessionDate:
          sessions.length > 0 ? sessions[0].startTime : new Date(),
      },
      accessLevel: keyholderAccess.accessLevel,
      restrictions: [],
    };
  }, [
    keyholderAccess,
    sessions,
    privacySettings,
    averageSessionLength,
    goalCompletionRate,
  ]);

  const shareHistoryWithKeyholder = useCallback(
    async (sessionIds: string[]): Promise<void> => {
      try {
        logger.debug("Sharing specific sessions with keyholder", {
          sessionIds,
        });

        // This would create a special sharing link or send specific data
        // For now, just log the action
        logger.info("History shared with keyholder", {
          sessionCount: sessionIds.length,
        });
      } catch (error) {
        logger.error("Failed to share history with keyholder", { error });
        throw error;
      }
    },
    [],
  );

  // ==================== ANALYTICS ====================

  const getPerformanceTrends = useCallback((): PerformanceTrends => {
    return {
      sessionDuration: {
        average: averageSessionLength,
        trend: trends.sessionLength.direction,
        weeklyChange: trends.sessionLength.changePercentage,
      },
      goalAchievement: {
        rate: goalCompletionRate,
        trend: trends.goalCompletion.direction,
        weeklyChange: trends.goalCompletion.changePercentage,
      },
      consistency: {
        score: insights.consistencyScore,
        streak: longestStreak,
        trend: trends.consistency.direction,
      },
    };
  }, [
    averageSessionLength,
    trends,
    goalCompletionRate,
    insights.consistencyScore,
    longestStreak,
  ]);

  const getGoalProgressHistory = useCallback((): GoalProgressHistory[] => {
    const goalProgressMap = new Map<string, GoalProgressHistory>();

    sessions.forEach((session) => {
      session.goals.forEach((goal) => {
        if (!goalProgressMap.has(goal.id)) {
          goalProgressMap.set(goal.id, {
            goalId: goal.id,
            goalName: goal.type,
            progressOverTime: [],
            milestones: [],
          });
        }

        const progressHistory = goalProgressMap.get(goal.id)!;
        progressHistory.progressOverTime.push({
          date: session.startTime,
          progress: goal.progress,
        });
      });
    });

    return Array.from(goalProgressMap.values());
  }, [sessions]);

  const getComparisonMetrics = useCallback((): ComparisonMetrics => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const thisWeekSessions = getSessionsByDateRange(weekAgo, now);
    const lastWeekSessions = getSessionsByDateRange(twoWeeksAgo, weekAgo);
    const thisMonthSessions = getSessionsByDateRange(monthAgo, now);
    const lastMonthSessions = getSessionsByDateRange(twoMonthsAgo, monthAgo);

    return {
      thisWeek: {
        sessions: thisWeekSessions.length,
        totalTime: thisWeekSessions.reduce(
          (sum, s) => sum + s.effectiveDuration,
          0,
        ),
        goalCompletion: calculateOverallCompletionRate(thisWeekSessions),
      },
      lastWeek: {
        sessions: lastWeekSessions.length,
        totalTime: lastWeekSessions.reduce(
          (sum, s) => sum + s.effectiveDuration,
          0,
        ),
        goalCompletion: calculateOverallCompletionRate(lastWeekSessions),
      },
      thisMonth: {
        sessions: thisMonthSessions.length,
        totalTime: thisMonthSessions.reduce(
          (sum, s) => sum + s.effectiveDuration,
          0,
        ),
        goalCompletion: calculateOverallCompletionRate(thisMonthSessions),
      },
      lastMonth: {
        sessions: lastMonthSessions.length,
        totalTime: lastMonthSessions.reduce(
          (sum, s) => sum + s.effectiveDuration,
          0,
        ),
        goalCompletion: calculateOverallCompletionRate(lastMonthSessions),
      },
    };
  }, [getSessionsByDateRange]);

  // ==================== RETURN HOOK INTERFACE ====================

  return {
    // History data
    sessions,
    insights,
    trends,
    privacySettings,

    // Data retrieval
    getSessionsByDateRange,
    getSessionsByGoal,
    searchSessions,

    // Privacy management
    updatePrivacySettings,
    exportPersonalData,
    deleteHistoricalData,

    // Keyholder access
    getKeyholderView,
    shareHistoryWithKeyholder,

    // Analytics
    getPerformanceTrends,
    getGoalProgressHistory,
    getComparisonMetrics,

    // Computed values
    totalSessions,
    averageSessionLength,
    goalCompletionRate,
    longestStreak,
    hasPrivacyRestrictions,

    // Loading states
    isLoading,
    error,
  };
};

export default useSessionHistory;
