/**
 * Session History Initialization Hook
 * Handles initialization and loading of session history data
 */
import { useState, useEffect } from "react";
import { serviceLogger } from "../../utils/logging";
import type {
  HistoryPrivacySettings,
  KeyholderHistoryAccess,
} from "./types/sessionHistory";

const logger = serviceLogger("useSessionHistoryInitialization");

interface UseSessionHistoryInitializationParams {
  userId: string;
  relationshipId?: string;
  privacySettings: HistoryPrivacySettings;
  setKeyholderAccess: (access: KeyholderHistoryAccess) => void;
  loadSessions: () => Promise<void>;
  loadPrivacySettings: () => Promise<void>;
  calculateInsights: () => Promise<void>;
  calculateTrends: () => Promise<void>;
}

export const useSessionHistoryInitialization = ({
  userId,
  relationshipId,
  privacySettings,
  setKeyholderAccess,
  loadSessions,
  loadPrivacySettings,
  calculateInsights,
  calculateTrends,
}: UseSessionHistoryInitializationParams) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeHistory = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Load relationship data if available
        if (relationshipId) {
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

  return {
    isLoading,
    error,
  };
};
