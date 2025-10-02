/**
 * Session History Keyholder Hook
 * Handles keyholder access and history sharing
 */
import { useCallback } from "react";
import { serviceLogger } from "../../utils/logging";
import { getKeyholderView as getKeyholderViewUtil } from "../../utils/session-history-helpers";
import type {
  HistoricalSession,
  HistoryPrivacySettings,
  KeyholderHistoryAccess,
  KeyholderHistoryView,
} from "./types/sessionHistory";

const logger = serviceLogger("useSessionHistoryKeyholder");

interface UseSessionHistoryKeyholderParams {
  sessions: HistoricalSession[];
  keyholderAccess: KeyholderHistoryAccess;
  privacySettings: HistoryPrivacySettings;
  averageSessionLength: number;
  goalCompletionRate: number;
}

export const useSessionHistoryKeyholder = ({
  sessions,
  keyholderAccess,
  privacySettings,
  averageSessionLength,
  goalCompletionRate,
}: UseSessionHistoryKeyholderParams) => {
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
    getKeyholderView,
    shareHistoryWithKeyholder,
  };
};
