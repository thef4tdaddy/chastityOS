/**
 * useStatisticsExport - Export and Sharing Operations
 * Handle data export and keyholder sharing
 */

import { useCallback } from "react";
import { serviceLogger } from "../../../utils/logging";
import type {
  SessionStatistics,
  GoalStatistics,
  AchievementStatistics,
  SharedStatistics,
  ExportFormat,
  StatisticsExport,
  StatisticType,
} from "../types/statistics";

const logger = serviceLogger("useStatisticsExport");

interface UseStatisticsExportOptions {
  userId: string;
  relationshipId?: string;
  sessionStats: SessionStatistics;
  goalStats: GoalStatistics;
  achievementStats: AchievementStatistics;
  setSharedStats: (
    updater: (prev: SharedStatistics) => SharedStatistics,
  ) => void;
}

export const useStatisticsExport = (options: UseStatisticsExportOptions) => {
  const {
    userId,
    relationshipId,
    sessionStats,
    goalStats,
    achievementStats,
    setSharedStats,
  } = options;

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

  return {
    exportStatistics,
    shareWithKeyholder,
  };
};
