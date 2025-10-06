/**
 * Account Linking Query Hooks
 * Query hooks for fetching relationship data
 */
import { useQuery } from "@tanstack/react-query";
import { AccountLinkingService } from "../../services/auth/account-linking";

// Internal query keys (not exported to comply with hook file restrictions)
const ACCOUNT_LINKING_QUERY_KEYS = {
  relationships: (userId: string) => ["adminRelationships", userId],
  validation: (code: string) => ["linkCodeValidation", code],
  adminSession: (relationshipId: string) => ["adminSession", relationshipId],
} as const;

/**
 * Hook for fetching admin relationships
 */
export function useAdminRelationshipsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ACCOUNT_LINKING_QUERY_KEYS.relationships(userId || ""),
    queryFn: () => AccountLinkingService.getAdminRelationships(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for validating link codes
 */
export function useLinkCodeValidation(code: string) {
  return useQuery({
    queryKey: ACCOUNT_LINKING_QUERY_KEYS.validation(code),
    queryFn: () => AccountLinkingService.validateLinkCode(code),
    enabled: code.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
}
