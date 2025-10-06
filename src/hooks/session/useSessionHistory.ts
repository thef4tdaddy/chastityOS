/**
 * Session History Management Hook
 * Provides comprehensive session history with privacy controls,
 * data visualization support, and keyholder access management
 */
import { useState, useCallback, useMemo } from "react";
import type { KeyholderRelationship } from "../../types/core";
import { serviceLogger } from "../../utils/logging";
import { useSessionHistoryData } from "./useSessionHistoryData";
import { useSessionHistoryRetrieval as _useSessionHistoryRetrieval } from "./useSessionHistoryRetrieval";
import {
  createEmptyTrendData as _createEmptyTrendData,
  calculateOverallCompletionRate,
  calculateLongestStreak,
  calculatePauseFrequency as _calculatePauseFrequency,
  calculateImprovementTrend as _calculateImprovementTrend,
  calculateConsistencyScore as _calculateConsistencyScore,
  calculateSessionLengthTrend as _calculateSessionLengthTrend,
  calculateGoalCompletionTrend as _calculateGoalCompletionTrend,
  calculateConsistencyTrend as _calculateConsistencyTrend,
  calculatePauseFrequencyTrend as _calculatePauseFrequencyTrend,
  calculateOverallProgressTrend as _calculateOverallProgressTrend,
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
  HistoryInsights as _HistoryInsights,
  HistoryTrends as _HistoryTrends,
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
export const useSessionHistory = (userId: string, relationshipId?: string) => {
  // ==================== STATE ====================

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
  const [_relationship, _setRelationship] =
    useState<KeyholderRelationship | null>(null);

  // Use data hook
  const {
    sessions,
    insights,
    trends,
    isLoading,
    error,
    setSessions,
    calculateInsights,
    calculateTrends,
  } = useSessionHistoryData(userId, relationshipId, privacySettings);

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

  // Note: Initialization is handled by useSessionHistoryData hook

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

        // Note: Sessions are automatically reloaded by useSessionHistoryData hook

        logger.info("Privacy settings updated successfully");
      } catch (error) {
        logger.error("Failed to update privacy settings", { error });
        throw error;
      }
    },
    [privacySettings, relationshipId],
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
    [sessions, setSessions, calculateInsights, calculateTrends, userId],
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
