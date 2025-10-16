/**
 * TanStack Query hooks for Keyholder Relationships
 * Optimized queries with proper caching and invalidation
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyholderRelationshipService } from "@/services/KeyholderRelationshipService";
import { queryKeys } from "@/services/queryKeys";
import { cacheConfig } from "@/services/cache-config";
import { serviceLogger } from "@/utils/logging";
import { KeyholderPermissions } from "@/types/core";

const logger = serviceLogger("useKeyholderRelationshipQueries");

/**
 * Query for fetching user relationships (as keyholder and submissive)
 */
export function useKeyholderRelationships(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.keyholderRelationships.list(userId || ""),
    queryFn: () =>
      KeyholderRelationshipService.getUserRelationships(userId || ""),
    enabled: !!userId,
    staleTime: cacheConfig.relationships.staleTime,
    gcTime: cacheConfig.relationships.gcTime,
    refetchOnWindowFocus: cacheConfig.relationships.refetchOnWindowFocus,
  });
}

/**
 * Query for fetching active keyholder
 */
export function useActiveKeyholder(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.keyholderRelationships.activeKeyholder(userId || ""),
    queryFn: () =>
      KeyholderRelationshipService.getActiveKeyholder(userId || ""),
    enabled: !!userId,
    staleTime: cacheConfig.relationships.staleTime,
    gcTime: cacheConfig.relationships.gcTime,
    refetchOnWindowFocus: cacheConfig.relationships.refetchOnWindowFocus,
  });
}

/**
 * Query for fetching active invite codes
 */
export function useActiveInviteCodes(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.keyholderRelationships.inviteCodes(userId || ""),
    queryFn: () =>
      KeyholderRelationshipService.getActiveInviteCodes(userId || ""),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes - invite codes can change
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * Query for fetching relationship summary
 */
export function useRelationshipSummary(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.keyholderRelationships.summary(userId || ""),
    queryFn: () =>
      KeyholderRelationshipService.getRelationshipSummary(userId || ""),
    enabled: !!userId,
    staleTime: cacheConfig.relationships.staleTime,
    gcTime: cacheConfig.relationships.gcTime,
    refetchOnWindowFocus: cacheConfig.relationships.refetchOnWindowFocus,
  });
}

/**
 * Mutation for creating invite code
 */
export function useCreateInviteCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      displayName,
      expirationHours,
    }: {
      userId: string;
      displayName?: string;
      expirationHours?: number;
    }) =>
      KeyholderRelationshipService.createInviteCode(
        userId,
        displayName,
        expirationHours,
      ),
    onSuccess: async (_, variables) => {
      // Invalidate invite codes query to refetch
      await queryClient.invalidateQueries({
        queryKey: queryKeys.keyholderRelationships.inviteCodes(
          variables.userId,
        ),
      });
      logger.info("Invite code created, cache invalidated");
    },
  });
}

/**
 * Mutation for accepting invite code
 */
export function useAcceptInviteCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      code,
      keyholderUserId,
      keyholderName,
    }: {
      code: string;
      keyholderUserId: string;
      keyholderName?: string;
    }) =>
      KeyholderRelationshipService.acceptInviteCode(
        code,
        keyholderUserId,
        keyholderName,
      ),
    onSuccess: async (_, variables) => {
      // Invalidate all relevant queries
      await queryClient.invalidateQueries({
        queryKey: queryKeys.keyholderRelationships.list(
          variables.keyholderUserId,
        ),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.keyholderRelationships.activeKeyholder(
          variables.keyholderUserId,
        ),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.keyholderRelationships.summary(
          variables.keyholderUserId,
        ),
      });
      logger.info("Invite code accepted, cache invalidated");
    },
  });
}

/**
 * Mutation for revoking invite code
 */
export function useRevokeInviteCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ codeId, userId }: { codeId: string; userId: string }) =>
      KeyholderRelationshipService.revokeInviteCode(codeId, userId),
    onSuccess: async (_, variables) => {
      // Invalidate invite codes query
      await queryClient.invalidateQueries({
        queryKey: queryKeys.keyholderRelationships.inviteCodes(
          variables.userId,
        ),
      });
      logger.info("Invite code revoked, cache invalidated");
    },
  });
}

/**
 * Mutation for updating permissions
 */
export function useUpdatePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      relationshipId,
      permissions,
      userId,
    }: {
      relationshipId: string;
      permissions: Partial<KeyholderPermissions>; // Use Partial for type safety
      userId: string;
    }) =>
      KeyholderRelationshipService.updatePermissions(
        relationshipId,
        permissions as KeyholderPermissions, // Cast to KeyholderPermissions
        userId,
      ),
    onSuccess: async (_, variables) => {
      // Invalidate relationships and permissions queries
      await queryClient.invalidateQueries({
        queryKey: queryKeys.keyholderRelationships.list(variables.userId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.keyholderRelationships.all,
      });
      logger.info("Permissions updated, cache invalidated");
    },
  });
}

/**
 * Mutation for ending relationship
 */
export function useEndRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      relationshipId,
      userId,
    }: {
      relationshipId: string;
      userId: string;
    }) => KeyholderRelationshipService.endRelationship(relationshipId, userId),
    onSuccess: async (_, variables) => {
      // Invalidate all relationship queries
      await queryClient.invalidateQueries({
        queryKey: queryKeys.keyholderRelationships.list(variables.userId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.keyholderRelationships.activeKeyholder(
          variables.userId,
        ),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.keyholderRelationships.summary(variables.userId),
      });
      logger.info("Relationship ended, cache invalidated");
    },
  });
}
