/**
 * Account Linking Derived State Hook
 * Computes derived state and filters for account linking
 */
import { useMemo } from "react";
import type { AdminRelationship } from "../../types/account-linking";

/**
 * Hook for computing derived state from relationships
 */
export function useAccountLinkingDerived(
  relationships: AdminRelationship[],
  userId: string | undefined,
  selectedWearerId: string | null,
) {
  // User role calculations
  const userRoles = useMemo(
    () => ({
      isKeyholder: relationships.some((r) => r.keyholderId === userId),
      isWearer: relationships.some((r) => r.wearerId === userId),
      hasActiveRelationships: relationships.some((r) => r.status === "active"),
    }),
    [relationships, userId],
  );

  // Relationship filtering
  const relationshipsByRole = useMemo(
    () => ({
      keyholderRelationships: relationships.filter(
        (r) => r.keyholderId === userId,
      ),
      wearerRelationships: relationships.filter((r) => r.wearerId === userId),
    }),
    [relationships, userId],
  );

  const selectedRelationship = selectedWearerId
    ? relationships.find((r) => r.wearerId === selectedWearerId)
    : null;

  return {
    ...userRoles,
    ...relationshipsByRole,
    selectedRelationship,
  };
}
