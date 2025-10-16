/**
 * Session History Management Hook
 * Provides comprehensive session history with privacy controls,
 * data visualization support, and keyholder access management
 */
import { useCallback, useMemo } from "react";
import { useSessionHistoryData } from "./useSessionHistoryData";
import { useSessionHistoryRetrieval } from "./useSessionHistoryRetrieval";
import { useSessionPrivacy } from "./useSessionPrivacy";
import { useSessionAnalytics } from "./useSessionAnalytics";
import { useSessionComputedValues } from "./useSessionComputedValues";
import { getKeyholderView as getKeyholderViewUtil } from "../../utils/session-history-helpers";
import type { KeyholderHistoryView } from "./types/sessionHistory";

// Re-export types for backward compatibility
export type * from "./types/sessionHistory";

export const useSessionHistory = (userId: string, relationshipId?: string) => {
  const {
    sessions,
    insights,
    trends,
    isLoading,
    error,
    setSessions,
    calculateInsights,
    calculateTrends,
  } = useSessionHistoryData(userId, relationshipId, {
    shareWithKeyholder: false,
    shareDuration: true,
    shareGoals: true,
    sharePauses: false,
    shareNotes: false,
    shareRatings: false,
    retentionPeriod: 365,
    allowExport: true,
    anonymizeOldData: false,
  });

  const {
    totalSessions,
    averageSessionLength,
    goalCompletionRate,
    longestStreak,
  } = useSessionComputedValues(sessions);
  const {
    privacySettings,
    keyholderAccess,
    updatePrivacySettings,
    exportPersonalData,
    deleteHistoricalData,
    shareHistoryWithKeyholder,
  } = useSessionPrivacy({
    userId,
    relationshipId,
    sessions,
    insights,
    setSessions,
    calculateInsights,
    calculateTrends,
  });

  const {
    getSessionsByDateRange,
    getSessionsByGoal,
    searchSessions,
    getKeyholderView: _getKeyholderView,
  } = useSessionHistoryRetrieval({
    sessions,
    keyholderAccess,
    privacySettings,
    averageSessionLength,
    goalCompletionRate,
    trends,
    insights,
    longestStreak,
  });

  const { getPerformanceTrends, getGoalProgressHistory, getComparisonMetrics } =
    useSessionAnalytics({
      sessions,
      trends,
      insights,
      averageSessionLength,
      goalCompletionRate,
      longestStreak,
    });

  const hasPrivacyRestrictions = useMemo(
    () => !privacySettings.shareWithKeyholder,
    [privacySettings.shareWithKeyholder],
  );

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
