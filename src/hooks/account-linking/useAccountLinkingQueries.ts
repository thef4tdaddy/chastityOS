/**
 * Account Linking Query Hooks
 * Query hooks for fetching relationship data
 * Optimized with centralized query keys and cache config
 */
import { useQuery } from "@tanstack/react-query";
import { AccountLinkingService } from "../../services/auth/account-linking";
import { queryKeys } from "../../services/queryKeys";
import { cacheConfig } from "../../services/cache-config";

/**
 * Hook for fetching admin relationships
 * Uses centralized query keys for consistent caching
 */
export function useAdminRelationshipsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.accountLinking.adminRelationships(userId || ""),
    queryFn: () => AccountLinkingService.getAdminRelationships(userId!),
    enabled: !!userId,
    staleTime: cacheConfig.relationships.staleTime,
    gcTime: cacheConfig.relationships.gcTime,
    refetchOnWindowFocus: cacheConfig.relationships.refetchOnWindowFocus,
  });
}

/**
 * Hook for validating link codes
 * Short cache time as codes expire quickly
 */
export function useLinkCodeValidation(code: string) {
  return useQuery({
    queryKey: queryKeys.accountLinking.linkCodeValidation(code),
    queryFn: () => AccountLinkingService.validateLinkCode(code),
    enabled: code.length > 0,
    staleTime: 30 * 1000, // 30 seconds - codes are time-sensitive
    gcTime: 1000 * 60 * 2, // 2 minutes
  });
}
