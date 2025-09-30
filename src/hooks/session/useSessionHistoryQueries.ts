/**
 * Session History Query Functions
 * Composable hook for querying and managing session history data
 */
import { useCallback } from "react";
import type {
  HistoricalSession,
  HistorySearchQuery,
  HistoryPrivacySettings,
  HistoryInsights,
  PersonalDataExport,
} from "./types/sessionHistory";
import { serviceLogger } from "../../utils/logging";

const logger = serviceLogger("useSessionHistoryQueries");

export const useSessionHistoryQueries = (
  sessions: HistoricalSession[],
  privacySettings: HistoryPrivacySettings,
  insights: HistoryInsights,
  userId: string,
  setSessions: (sessions: HistoricalSession[]) => void,
  setPrivacySettings: (settings: HistoryPrivacySettings) => void,
  calculateInsights: () => void,
  calculateTrends: () => void,
) => {
  // ==================== DATA RETRIEVAL ====================

  const getSessionsByDateRange = useCallback(
    (start: Date, end: Date): HistoricalSession[] => {
      return sessions.filter(
        (session) => session.startTime >= start && session.startTime <= end,
      );
    },
    [sessions],
  );

  const getSessionsByGoal = useCallback(
    (goalType: string): HistoricalSession[] => {
      return sessions.filter((session) =>
        session.goals.some((goal) => goal.type === goalType),
      );
    },
    [sessions],
  );

  const searchSessions = useCallback(
    (query: HistorySearchQuery): HistoricalSession[] => {
      let filteredSessions = [...sessions];

      // Date range filter
      if (query.dateRange) {
        filteredSessions = filteredSessions.filter(
          (session) =>
            session.startTime >= query.dateRange!.start &&
            session.startTime <= query.dateRange!.end,
        );
      }

      // Duration filters
      if (query.minDuration) {
        filteredSessions = filteredSessions.filter(
          (session) => session.effectiveDuration >= query.minDuration!,
        );
      }

      if (query.maxDuration) {
        filteredSessions = filteredSessions.filter(
          (session) => session.effectiveDuration <= query.maxDuration!,
        );
      }

      // Goal type filter
      if (query.goalTypes && query.goalTypes.length > 0) {
        filteredSessions = filteredSessions.filter((session) =>
          session.goals.some((goal) => query.goalTypes!.includes(goal.type)),
        );
      }

      // Keyholder control filter
      if (query.hasKeyholderControl !== undefined) {
        filteredSessions = filteredSessions.filter(
          (session) =>
            session.wasKeyholderControlled === query.hasKeyholderControl,
        );
      }

      // Completed goals filter
      if (query.completedGoals !== undefined) {
        filteredSessions = filteredSessions.filter((session) => {
          const hasCompletedGoals = session.goals.some(
            (goal) => goal.completed,
          );
          return query.completedGoals ? hasCompletedGoals : !hasCompletedGoals;
        });
      }

      // Tags filter
      if (query.tags && query.tags.length > 0) {
        filteredSessions = filteredSessions.filter((session) =>
          query.tags!.some((tag) => session.tags.includes(tag)),
        );
      }

      // Rating filter
      if (query.rating && query.rating.min && query.rating.max) {
        filteredSessions = filteredSessions.filter((session) => {
          if (!session.rating) return false;
          return (
            session.rating.overall >= query.rating!.min &&
            session.rating.overall <= query.rating!.max
          );
        });
      }

      // Text search (searches in notes and tags)
      if (query.textSearch) {
        const searchLower = query.textSearch.toLowerCase();
        filteredSessions = filteredSessions.filter(
          (session) =>
            session.notes.toLowerCase().includes(searchLower) ||
            session.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
        );
      }

      return filteredSessions;
    },
    [sessions],
  );

  // ==================== PRIVACY MANAGEMENT ====================

  const updatePrivacySettings = useCallback(
    async (newSettings: Partial<HistoryPrivacySettings>): Promise<void> => {
      try {
        logger.debug("Updating privacy settings", { newSettings, userId });

        const updatedSettings = {
          ...privacySettings,
          ...newSettings,
        };

        setPrivacySettings(updatedSettings);

        // If reducing sharing permissions, we may need to notify keyholder
        if (
          privacySettings.shareWithKeyholder &&
          !updatedSettings.shareWithKeyholder
        ) {
          logger.info("Keyholder access revoked", { userId });
        }
      } catch (error) {
        logger.error("Failed to update privacy settings", { error });
        throw error;
      }
    },
    [privacySettings, userId, setPrivacySettings],
  );

  const exportPersonalData =
    useCallback(async (): Promise<PersonalDataExport> => {
      try {
        logger.debug("Exporting personal data", { userId });

        const exportData: PersonalDataExport = {
          exportId: `export-${Date.now()}`,
          generatedAt: new Date(),
          format: "json",
          data: {
            sessions,
            goals: sessions.flatMap((s) => s.goals),
            settings: privacySettings,
            analytics: insights,
          },
          fileSize: 0, // Would be calculated based on actual data size
          downloadUrl: "", // Would be generated by backend
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        };

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
        calculateInsights();
        calculateTrends();

        logger.info("Historical data deleted", { deletedCount, userId });
      } catch (error) {
        logger.error("Failed to delete historical data", { error });
        throw error;
      }
    },
    [sessions, userId, setSessions, calculateInsights, calculateTrends],
  );

  return {
    // Data retrieval
    getSessionsByDateRange,
    getSessionsByGoal,
    searchSessions,

    // Privacy management
    updatePrivacySettings,
    exportPersonalData,
    deleteHistoricalData,
  };
};
