/**
 * Session History Management Hook
 * Provides comprehensive session history with privacy controls,
 * data visualization support, and keyholder access management
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import type { KeyholderRelationship } from "../../types/core";
import { serviceLogger } from "../../utils/logging";
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
} from "../../utils/sessionHistoryHelpers";
import {
  getSessionsByDateRange as getSessionsByDateRangeUtil,
  getSessionsByGoal as getSessionsByGoalUtil,
  searchSessions as searchSessionsUtil,
  getKeyholderView as getKeyholderViewUtil,
  getPerformanceTrends as getPerformanceTrendsUtil,
  getGoalProgressHistory as getGoalProgressHistoryUtil,
  getComparisonMetrics as getComparisonMetricsUtil,
} from "../../utils/session-history-helpers";
import type {
  HistoricalSession,
  HistoryPrivacySettings,
  KeyholderHistoryAccess,
  HistoryInsights,
  HistoryTrends,
  HistorySearchQuery,
  PersonalDataExport,
  KeyholderHistoryView,
  PerformanceTrends,
  GoalProgressHistory,
  ComparisonMetrics,
} from "./types/sessionHistory";

// Re-export types for backward compatibility
export type * from "./types/sessionHistory";

const logger = serviceLogger("useSessionHistory");

// ==================== HOOK IMPLEMENTATION ====================

// Complex session history management with privacy controls and analytics
// eslint-disable-next-line max-statements
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
  const [_relationship, _setRelationship] =
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
    // Store actions and stable callbacks should not be in dependency arrays
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userId,
    relationshipId,
    privacySettings.shareWithKeyholder,
    privacySettings.shareRatings,
    privacySettings.shareNotes,
    privacySettings.sharePauses,
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
  }, [privacySettings.retentionPeriod]);

  const loadPrivacySettings = useCallback(async () => {
    try {
      // Load user's privacy preferences from database
      // For now, use defaults
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

  // ==================== DATA RETRIEVAL ====================

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

  // ==================== PRIVACY MANAGEMENT ====================

  const updatePrivacySettings = useCallback(
    async (settings: Partial<HistoryPrivacySettings>): Promise<void> => {
      try {
        logger.debug("Updating privacy settings", { settings });

        const updatedSettings = { ...privacySettings, ...settings };
        setPrivacySettings(updatedSettings);

        // Update keyholder access based on new settings
        if (relationshipId) {
          setKeyholderAccess((prev) => ({
            ...prev,
            hasAccess: updatedSettings.shareWithKeyholder,
            accessLevel: updatedSettings.shareWithKeyholder
              ? "detailed"
              : "summary",
            canViewRatings: updatedSettings.shareRatings,
            canViewNotes: updatedSettings.shareNotes,
            canViewPauses: updatedSettings.sharePauses,
          }));
        }

        // Reload sessions if retention period changed
        if (
          settings.retentionPeriod &&
          settings.retentionPeriod !== privacySettings.retentionPeriod
        ) {
          await loadSessions();
        }

        logger.info("Privacy settings updated successfully");
      } catch (error) {
        logger.error("Failed to update privacy settings", { error });
        throw error;
      }
    },
    [privacySettings, relationshipId, loadSessions],
  );

  const exportPersonalData =
    useCallback(async (): Promise<PersonalDataExport> => {
      try {
        logger.debug("Exporting personal data", { userId });

        const exportData: PersonalDataExport = {
          exportId: `export_${Date.now()}`,
          generatedAt: new Date(),
          format: "json",
          data: {
            sessions,
            goals: sessions.flatMap((s) => s.goals),
            settings: privacySettings,
            analytics: insights,
          },
          fileSize: 0, // Would be calculated
          downloadUrl: "", // Would be generated
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        };

        logger.info("Personal data export created", {
          exportId: exportData.exportId,
        });
        return exportData;
      } catch (error) {
        logger.error("Failed to export personal data", { error });
        throw error;
      }
    }, [sessions, privacySettings, insights, userId]);

  const deleteHistoricalData = useCallback(
    async (before: Date): Promise<void> => {
      try {
        logger.debug("Deleting historical data", { before, userId });

        const sessionsToKeep = sessions.filter(
          (session) => session.startTime >= before,
        );
        const deletedCount = sessions.length - sessionsToKeep.length;

        setSessions(sessionsToKeep);

        // Recalculate insights and trends
        await Promise.all([calculateInsights(), calculateTrends()]);

        logger.info("Historical data deleted", { deletedCount });
      } catch (error) {
        logger.error("Failed to delete historical data", { error });
        throw error;
      }
    },
    [sessions, calculateInsights, calculateTrends, userId],
  );

  // ==================== KEYHOLDER ACCESS ====================

  const getKeyholderView = useCallback(
    (): KeyholderHistoryView =>
      getKeyholderViewUtil(
        sessions,
        keyholderAccess,
        privacySettings,
        averageSessionLength,
        goalCompletionRate,
      ),
    [
      keyholderAccess,
      sessions,
      privacySettings,
      averageSessionLength,
      goalCompletionRate,
    ],
  );

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

  const getPerformanceTrends = useCallback(
    (): PerformanceTrends =>
      getPerformanceTrendsUtil(
        averageSessionLength,
        trends,
        goalCompletionRate,
        insights.consistencyScore,
        longestStreak,
      ),
    [
      averageSessionLength,
      trends,
      goalCompletionRate,
      insights.consistencyScore,
      longestStreak,
    ],
  );

  const getGoalProgressHistory = useCallback(
    (): GoalProgressHistory[] => getGoalProgressHistoryUtil(sessions),
    [sessions],
  );

  const getComparisonMetrics = useCallback(
    (): ComparisonMetrics => getComparisonMetricsUtil(sessions),
    [sessions],
  );

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
