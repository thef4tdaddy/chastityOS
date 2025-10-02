/**
 * Session History Privacy Hook
 * Handles privacy settings, data export, and deletion
 */
import { useCallback } from "react";
import { serviceLogger } from "../../utils/logging";
import type {
  HistoricalSession,
  HistoryPrivacySettings,
  KeyholderHistoryAccess,
  HistoryInsights,
  PersonalDataExport,
} from "./types/sessionHistory";

const logger = serviceLogger("useSessionHistoryPrivacy");

interface UseSessionHistoryPrivacyParams {
  userId: string;
  relationshipId?: string;
  sessions: HistoricalSession[];
  privacySettings: HistoryPrivacySettings;
  insights: HistoryInsights;
  setPrivacySettings: (settings: HistoryPrivacySettings) => void;
  setKeyholderAccess: (access: KeyholderHistoryAccess) => void;
  setSessions: (sessions: HistoricalSession[]) => void;
  loadSessions: () => Promise<void>;
  calculateInsights: () => Promise<void>;
  calculateTrends: () => Promise<void>;
}

export const useSessionHistoryPrivacy = ({
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
}: UseSessionHistoryPrivacyParams) => {
  const updatePrivacySettings = useCallback(
    async (settings: Partial<HistoryPrivacySettings>): Promise<void> => {
      try {
        logger.debug("Updating privacy settings", { settings });

        const updatedSettings = { ...privacySettings, ...settings };
        setPrivacySettings(updatedSettings);

        // Update keyholder access based on new settings
        if (relationshipId) {
          setKeyholderAccess({
            hasAccess: updatedSettings.shareWithKeyholder,
            accessLevel: updatedSettings.shareWithKeyholder
              ? "detailed"
              : "summary",
            canViewRatings: updatedSettings.shareRatings,
            canViewNotes: updatedSettings.shareNotes,
            canViewPauses: updatedSettings.sharePauses,
          });
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
    [
      privacySettings,
      relationshipId,
      loadSessions,
      setPrivacySettings,
      setKeyholderAccess,
    ],
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
    [sessions, calculateInsights, calculateTrends, userId, setSessions],
  );

  return {
    updatePrivacySettings,
    exportPersonalData,
    deleteHistoricalData,
  };
};
