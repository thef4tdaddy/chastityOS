/**
 * Session History Management Hook
 * Provides comprehensive session history with privacy controls,
 * data visualization support, and keyholder access management
 */
import { useMemo } from "react";
import {
  calculateOverallCompletionRate,
  calculateLongestStreak,
} from "../../utils/sessionHistoryHelpers";
import { useSessionHistoryData } from "./useSessionHistoryData";
import { useSessionHistoryPrivacy } from "./useSessionHistoryPrivacy";
import { useSessionHistoryKeyholder } from "./useSessionHistoryKeyholder";
import { useSessionHistoryAnalytics } from "./useSessionHistoryAnalytics";
import { useSessionHistoryRetrieval } from "./useSessionHistoryRetrieval";
import { useSessionHistoryInitialization } from "./useSessionHistoryInitialization";

export type * from "./types/sessionHistory";

export const useSessionHistory = (userId: string, relationshipId?: string) => {
  // Load session history data and state
  const {
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
  } = useSessionHistoryData(userId, relationshipId);

  // Computed values
  const totalSessions = useMemo(() => sessions.length, [sessions]);
  const averageSessionLength = useMemo(
    () =>
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.effectiveDuration, 0) /
          sessions.length
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

  // Data retrieval
  const { getSessionsByDateRange, getSessionsByGoal, searchSessions } =
    useSessionHistoryRetrieval({ sessions });

  // Privacy management
  const { updatePrivacySettings, exportPersonalData, deleteHistoricalData } =
    useSessionHistoryPrivacy({
      userId,
      relationshipId,
      sessions,
      privacySettings,
      insights,
      setPrivacySettings,
      setKeyholderAccess,
      setSessions,
      loadSessions,
      calculateInsights,
      calculateTrends,
    });

  // Keyholder access
  const { getKeyholderView, shareHistoryWithKeyholder } =
    useSessionHistoryKeyholder({
      sessions,
      keyholderAccess,
      privacySettings,
      averageSessionLength,
      goalCompletionRate,
    });

  // Analytics
  const { getPerformanceTrends, getGoalProgressHistory, getComparisonMetrics } =
    useSessionHistoryAnalytics({
      sessions,
      trends,
      averageSessionLength,
      goalCompletionRate,
      consistencyScore: insights.consistencyScore,
      longestStreak,
    });

  // Initialization
  const { isLoading, error } = useSessionHistoryInitialization({
    userId,
    relationshipId,
    privacySettings,
    setKeyholderAccess,
    loadSessions,
    loadPrivacySettings,
    calculateInsights,
    calculateTrends,
  });

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
