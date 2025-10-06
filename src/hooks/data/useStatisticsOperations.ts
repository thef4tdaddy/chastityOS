/**
 * Statistics Operations Hooks
 * Hooks for performing statistics queries and analysis
 */
import { useCallback } from "react";
import {
  getStatsForPeriod as calculateStatsForPeriod,
  getMonthlyTrends as calculateMonthlyTrends,
  getWeeklyBreakdown as calculateWeeklyBreakdown,
  compareWithPrevious as compareMetricsWithPrevious,
  getBenchmarkComparisons as calculateBenchmarkComparisons,
} from "../../utils/statistics/calculations";
import {
  generateKeyholderDashboard,
  generateRelationshipComparison,
} from "../../utils/statistics/keyholder";
import {
  generatePredictiveInsights,
  generateRecommendations,
} from "../../utils/statistics/predictions";
import { serviceLogger } from "../../utils/logging";
import type {
  TimePeriod,
  SessionStatistics,
  GoalStatistics,
  StatisticType,
  ExportFormat,
  StatisticsExport,
} from "./types/statistics";

const logger = serviceLogger("useStatisticsOperations");

/**
 * Hook for time-based queries
 */
export function useTimeBasedQueries() {
  const getStatsForPeriod = useCallback(
    (period: TimePeriod) => calculateStatsForPeriod(period),
    [],
  );

  const getMonthlyTrends = useCallback(
    (months: number) => calculateMonthlyTrends(months),
    [],
  );

  const getWeeklyBreakdown = useCallback(() => calculateWeeklyBreakdown(), []);

  return { getStatsForPeriod, getMonthlyTrends, getWeeklyBreakdown };
}

/**
 * Hook for comparative analysis
 */
export function useComparativeAnalysis(sessionStats: SessionStatistics) {
  const compareWithPrevious = useCallback(
    (period: TimePeriod) => compareMetricsWithPrevious(period, sessionStats),
    [sessionStats],
  );

  const getBenchmarkComparisons = useCallback(
    () => calculateBenchmarkComparisons(sessionStats),
    [sessionStats],
  );

  return { compareWithPrevious, getBenchmarkComparisons };
}

/**
 * Hook for keyholder features
 */
export function useKeyholderFeatures(
  consistencyRating: number,
  sessionStats: SessionStatistics,
  goalStats: GoalStatistics,
) {
  const getKeyholderDashboard = useCallback(
    () =>
      generateKeyholderDashboard(consistencyRating, sessionStats, goalStats),
    [consistencyRating, sessionStats, goalStats],
  );

  const getRelationshipComparison = useCallback(
    () => generateRelationshipComparison(sessionStats),
    [sessionStats],
  );

  return { getKeyholderDashboard, getRelationshipComparison };
}

/**
 * Hook for predictive analytics
 */
export function usePredictiveAnalytics() {
  const getPredictiveInsights = useCallback(
    () => generatePredictiveInsights(),
    [],
  );

  const getRecommendations = useCallback(() => generateRecommendations(), []);

  return { getPredictiveInsights, getRecommendations };
}

import type {
  AchievementStatistics,
  SharedStatistics,
} from "./types/statistics";
import type { Dispatch, SetStateAction } from "react";

interface ExportParams {
  userId: string;
  sessionStats: SessionStatistics;
  goalStats: GoalStatistics;
  achievementStats: AchievementStatistics;
  relationshipId: string | undefined;
  setSharedStats: Dispatch<SetStateAction<SharedStatistics>>;
}

/**
 * Hook for export and sharing operations
 */
export function useStatisticsExport(params: ExportParams) {
  const {
    userId,
    sessionStats,
    goalStats,
    achievementStats,
    relationshipId,
    setSharedStats,
  } = params;
  const exportStatistics = useCallback(
    async (format: ExportFormat): Promise<StatisticsExport> => {
      try {
        logger.debug("Exporting statistics", { format, userId });

        const exportData = {
          sessionStats,
          goalStats,
          achievementStats,
          exportedAt: new Date(),
        };

        return {
          format,
          data: exportData,
          generatedAt: new Date(),
          fileSize: JSON.stringify(exportData).length,
          downloadUrl: "https://example.com/download/stats",
        };
      } catch (error) {
        logger.error("Failed to export statistics", { error });
        throw error;
      }
    },
    [userId, sessionStats, goalStats, achievementStats],
  );

  const shareWithKeyholder = useCallback(
    async (statTypes: StatisticType[]): Promise<void> => {
      try {
        if (!relationshipId) {
          throw new Error("No keyholder relationship found");
        }

        logger.debug("Sharing statistics with keyholder", { statTypes });

        setSharedStats((prev) => ({
          ...prev,
          allowedMetrics: statTypes,
          lastSharedAt: new Date(),
        }));

        logger.info("Statistics shared with keyholder successfully");
      } catch (error) {
        logger.error("Failed to share statistics with keyholder", { error });
        throw error;
      }
    },
    [relationshipId, setSharedStats],
  );

  return { exportStatistics, shareWithKeyholder };
}
