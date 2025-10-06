/**
 * useKeyholderActions Hook
 * Manages keyholder relationship actions (invite, accept, remove)
 */
import { useState, useCallback } from "react";
import { useKeyholderRelationships } from "../useKeyholderRelationships";
import { serviceLogger } from "../../utils/logging";
import {
  handleInviteCodeCreation,
  handleInviteCodeError,
  handleSubmissiveAcceptance,
  handleSubmissiveAcceptanceError,
} from "./keyholderSystemHelpers";
import type { KeyholderRelationship } from "../../types/core";
import type { InviteOptions } from "./useKeyholderSystem";

const logger = serviceLogger("useKeyholderActions");

export function useKeyholderActions(
  effectiveKeyholderId: string | undefined,
  activeRelationships: KeyholderRelationship[],
  selectedRelationship: KeyholderRelationship | null,
  onRefreshData: () => Promise<void>,
  onRelationshipRemoved: (relationshipId: string) => void,
) {
  const keyholderRelationships = useKeyholderRelationships();
  const [error, setError] = useState<string | null>(null);

  const createInviteCode = useCallback(
    async (options: InviteOptions = {}): Promise<string | null> => {
      if (!effectiveKeyholderId) return null;

      try {
        logger.debug("Creating invite code", {
          keyholderId: effectiveKeyholderId,
          options,
        });

        const inviteCode = await keyholderRelationships.createInviteCode(
          options.expirationHours,
        );

        return await handleInviteCodeCreation(inviteCode, onRefreshData);
      } catch (err) {
        logger.error("Failed to create invite code", { error: err as Error });
        setError(
          err instanceof Error ? err.message : "Failed to create invite code",
        );
        return null;
      }
    },
    [effectiveKeyholderId, keyholderRelationships, onRefreshData],
  );

  const acceptSubmissive = useCallback(
    async (inviteCode: string): Promise<KeyholderRelationship | null> => {
      if (!effectiveKeyholderId) return null;

      try {
        logger.debug("Accepting submissive", {
          keyholderId: effectiveKeyholderId,
          inviteCode,
        });

        const success =
          await keyholderRelationships.acceptInviteCode(inviteCode);

        return await handleSubmissiveAcceptance(
          success,
          onRefreshData,
          activeRelationships,
        );
      } catch (err) {
        logger.error("Failed to accept submissive", { error: err as Error });
        setError(
          err instanceof Error ? err.message : "Failed to accept submissive",
        );
        return null;
      }
    },
    [
      effectiveKeyholderId,
      keyholderRelationships,
      onRefreshData,
      activeRelationships,
    ],
  );

  const removeSubmissive = useCallback(
    async (relationshipId: string): Promise<void> => {
      if (!effectiveKeyholderId) return;

      try {
        logger.debug("Removing submissive", {
          keyholderId: effectiveKeyholderId,
          relationshipId,
        });

        await keyholderRelationships.endRelationship(relationshipId);

        // Refresh data to update state
        await onRefreshData();

        // Clear selected relationship if it was the removed one
        if (selectedRelationship?.id === relationshipId) {
          onRelationshipRemoved(relationshipId);
        }
      } catch (err) {
        logger.error("Failed to remove submissive", { error: err as Error });
        setError(
          err instanceof Error ? err.message : "Failed to remove submissive",
        );
      }
    },
    [
      effectiveKeyholderId,
      keyholderRelationships,
      onRefreshData,
      selectedRelationship,
      onRelationshipRemoved,
    ],
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createInviteCode,
    acceptSubmissive,
    removeSubmissive,
    error,
    resetError,
  };
}
