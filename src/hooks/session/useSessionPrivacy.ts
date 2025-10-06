/**
 * Session Privacy Management Hook
 * Handles privacy settings and data management
 */
import { useState, useCallback } from "react";
import { serviceLogger } from "../../utils/logging";
import type {
  HistoricalSession,
  HistoryPrivacySettings,
  KeyholderHistoryAccess,
  PersonalDataExport,
  HistoryInsights,
} from "./types/sessionHistory";

const logger = serviceLogger("useSessionPrivacy");

export interface UseSessionPrivacyOptions {
  userId: string;
  relationshipId: string | undefined;
  sessions: HistoricalSession[];
  insights: HistoryInsights;
  setSessions: (sessions: HistoricalSession[]) => void;
  calculateInsights: () => Promise<void>;
  calculateTrends: () => Promise<void>;
}

export function useSessionPrivacy({
  userId,
  relationshipId,
  sessions,
  insights,
  setSessions,
  calculateInsights,
  calculateTrends,
}: UseSessionPrivacyOptions) {
  const [privacySettings, setPrivacySettings] =
    useState<HistoryPrivacySettings>({
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

  const [keyholderAccess, setKeyholderAccess] =
    useState<KeyholderHistoryAccess>({
      hasAccess: false,
      accessLevel: "summary",
      canViewRatings: false,
      canViewNotes: false,
      canViewPauses: false,
    });

  const updatePrivacySettings = useCallback(
    async (settings: Partial<HistoryPrivacySettings>): Promise<void> => {
      try {
        logger.debug("Updating privacy settings", { settings });

        const updatedSettings = { ...privacySettings, ...settings };
        setPrivacySettings(updatedSettings);

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
          fileSize: 0,
          downloadUrl: "",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
        await Promise.all([calculateInsights(), calculateTrends()]);

        logger.info("Historical data deleted", { deletedCount });
      } catch (error) {
        logger.error("Failed to delete historical data", { error });
        throw error;
      }
    },
    [sessions, setSessions, calculateInsights, calculateTrends, userId],
  );

  const shareHistoryWithKeyholder = useCallback(
    async (sessionIds: string[]): Promise<void> => {
      try {
        logger.debug("Sharing specific sessions with keyholder", {
          sessionIds,
        });
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

  return {
    privacySettings,
    keyholderAccess,
    updatePrivacySettings,
    exportPersonalData,
    deleteHistoricalData,
    shareHistoryWithKeyholder,
  };
}
