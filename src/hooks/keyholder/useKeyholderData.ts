/**
 * useKeyholderData Hook
 * Manages keyholder relationship data and statistics
 */
import { useState, useCallback, useMemo } from "react";
import { useKeyholderRelationships } from "../useKeyholderRelationships";
import { serviceLogger } from "../../utils/logging";
import { calculateKeyholderStatusAndStats } from "../../utils/keyholder/keyholderSystemHelpers";
import type { KeyholderRelationship } from "../../types/core";
import type { KeyholderStatus, KeyholderStats } from "./useKeyholderSystem";

const logger = serviceLogger("useKeyholderData");

export function useKeyholderData(effectiveKeyholderId: string | undefined) {
  const keyholderRelationships = useKeyholderRelationships();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeRelationships, setActiveRelationships] = useState<
    KeyholderRelationship[]
  >([]);
  const [keyholderStatus, setKeyholderStatus] = useState<KeyholderStatus>({
    isActiveKeyholder: false,
    hasPermissions: false,
    canCreateInvites: false,
    maxRelationships: 5,
    currentRelationships: 0,
  });
  const [stats, setStats] = useState<KeyholderStats>({
    totalSubmissives: 0,
    activeRelationships: 0,
    totalSessions: 0,
    averageSessionDuration: 0,
    totalRewardsGiven: 0,
    totalPunishmentsGiven: 0,
    lastActivity: null,
  });

  const refreshData = useCallback(async () => {
    if (!effectiveKeyholderId) return;

    setIsLoading(true);
    setError(null);

    try {
      logger.debug("Refreshing keyholder system data", {
        keyholderId: effectiveKeyholderId,
      });

      // Get relationships from the existing hook
      await keyholderRelationships.loadRelationships();

      const keyholderRelationshipsList =
        keyholderRelationships.relationships.asKeyholder;

      // Calculate keyholder status and stats
      const { keyholderStatus: newStatus, stats: newStats } =
        calculateKeyholderStatusAndStats(
          keyholderRelationshipsList,
          keyholderRelationships as unknown as Record<string, unknown>,
        );

      setActiveRelationships(keyholderRelationshipsList);
      setKeyholderStatus(newStatus);
      setStats(newStats);
      setIsLoading(false);
      setIsInitialized(true);

      logger.info("Keyholder system data refreshed", {
        relationshipCount: keyholderRelationshipsList.length,
        activeCount: newStats.activeRelationships,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to refresh keyholder data";
      setError(errorMessage);
      setIsLoading(false);
      logger.error("Failed to refresh keyholder system data", {
        error: err as Error,
      });
    }
  }, [effectiveKeyholderId, keyholderRelationships]);

  const computedValues = useMemo(
    () => ({
      hasActiveRelationships: activeRelationships.length > 0,
      activeRelationshipCount: activeRelationships.length,
      hasMaxRelationships:
        keyholderStatus.currentRelationships >=
        keyholderStatus.maxRelationships,
    }),
    [activeRelationships, keyholderStatus],
  );

  return {
    activeRelationships,
    keyholderStatus,
    stats,
    isLoading,
    isInitialized,
    error,
    refreshData,
    ...computedValues,
  };
}
