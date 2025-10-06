/**
 * Helper functions for useKeyholderSystem hook
 * Extracted to reduce function complexity
 */
import type { KeyholderRelationship } from "../../types/core";
import type { InviteCode } from "../../services/database/KeyholderRelationshipDBService";
import { serviceLogger } from "../../utils/logging";
import type {
  KeyholderStatus,
  KeyholderStats,
  KeyholderSystemState,
} from "./useKeyholderSystem";

const logger = serviceLogger("keyholderSystemHelpers");

/**
 * Calculate keyholder status and statistics from relationships
 */
export function calculateKeyholderStatusAndStats(
  keyholderRelationshipsList: KeyholderRelationship[],
  keyholderRelationships: Record<string, unknown>,
): { keyholderStatus: KeyholderStatus; stats: KeyholderStats } {
  // Calculate keyholder status
  const keyholderStatus: KeyholderStatus = {
    isActiveKeyholder: keyholderRelationshipsList.length > 0,
    hasPermissions: keyholderRelationshipsList.some(
      (rel) =>
        rel.permissions && Object.values(rel.permissions).some((perm) => perm),
    ),
    canCreateInvites:
      typeof keyholderRelationships.canCreateInviteCode === "function"
        ? keyholderRelationships.canCreateInviteCode()
        : false,
    maxRelationships: 5, // Could be user-specific in the future
    currentRelationships: keyholderRelationshipsList.length,
  };

  // Calculate basic stats
  const stats: KeyholderStats = {
    totalSubmissives: keyholderRelationshipsList.length,
    activeRelationships: keyholderRelationshipsList.filter(
      (rel) => rel.status === "active",
    ).length,
    totalSessions: 0, // TODO: Calculate from session data
    averageSessionDuration: 0, // TODO: Calculate from session data
    totalRewardsGiven: 0, // TODO: Calculate from reward data
    totalPunishmentsGiven: 0, // TODO: Calculate from punishment data
    lastActivity: null, // TODO: Calculate from activity data
  };

  return { keyholderStatus, stats };
}

/**
 * Handle successful invite code creation
 */
export async function handleInviteCodeCreation(
  inviteCode: InviteCode | null,
  refreshData: () => Promise<void>,
): Promise<string | null> {
  if (inviteCode) {
    // Refresh data to update state
    await refreshData();
    return inviteCode.code;
  }
  return null;
}

/**
 * Handle invite code creation error
 */
export function handleInviteCodeError(
  error: unknown,
  setState: React.Dispatch<React.SetStateAction<KeyholderSystemState>>,
): null {
  logger.error("Failed to create invite code", { error: error as Error });
  setState((prev) => ({
    ...prev,
    error:
      error instanceof Error ? error.message : "Failed to create invite code",
  }));
  return null;
}

/**
 * Handle successful submissive acceptance
 */
export async function handleSubmissiveAcceptance(
  success: boolean,
  refreshData: () => Promise<void>,
  activeRelationships: KeyholderRelationship[],
): Promise<KeyholderRelationship | null> {
  if (success) {
    // Refresh data to get the new relationship
    await refreshData();

    // Return the newest relationship (should be the one just created)
    const newestRelationship = activeRelationships.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )[0];

    return newestRelationship || null;
  }
  return null;
}

/**
 * Handle submissive acceptance error
 */
export function handleSubmissiveAcceptanceError(
  error: unknown,
  setState: React.Dispatch<React.SetStateAction<KeyholderSystemState>>,
): null {
  logger.error("Failed to accept submissive", { error: error as Error });
  setState((prev) => ({
    ...prev,
    error:
      error instanceof Error ? error.message : "Failed to accept submissive",
  }));
  return null;
}
