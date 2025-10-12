/**
 * TanStack Query hooks for Keyholder Relationships
 * Optimized queries with proper caching and invalidation
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyholderRelationshipService } from "@/services/KeyholderRelationshipService";
import { queryKeys } from "@/services/queryKeys";
import { cacheConfig } from "@/services/cache-config";
import { serviceLogger } from "@/utils/logging";

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
 * Query for checking permissions - with caching to reduce DB calls
 */
export function useHasPermission(
  keyholderUserId: string | undefined,
  submissiveUserId: string | undefined,
  permission: string,
) {
  return useQuery({
    queryKey: queryKeys.keyholderRelationships.permissions(
      keyholderUserId || "",
      submissiveUserId || "",
    ),
    queryFn: async () => {
      if (!keyholderUserId || !submissiveUserId) return null;
      // Type assertion is necessary here as permission parameter is string but needs to be typed key
      return KeyholderRelationshipService.hasPermission(
        keyholderUserId,
        submissiveUserId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        permission as any,
      );
    },
    enabled: !!keyholderUserId && !!submissiveUserId,
    staleTime: cacheConfig.permissions.staleTime,
    gcTime: cacheConfig.permissions.gcTime,
    refetchOnWindowFocus: cacheConfig.permissions.refetchOnWindowFocus,
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
    onSuccess: (_, variables) => {
      // Invalidate invite codes query to refetch
      queryClient.invalidateQueries({
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
    onSuccess: (_, variables) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.keyholderRelationships.list(
          variables.keyholderUserId,
        ),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.keyholderRelationships.activeKeyholder(
          variables.keyholderUserId,
        ),
      });
      queryClient.invalidateQueries({
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
    onSuccess: (_, variables) => {
      // Invalidate invite codes query
      queryClient.invalidateQueries({
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
      permissions: unknown; // Use unknown instead of any for better type safety
      userId: string;
    }) =>
      KeyholderRelationshipService.updatePermissions(
        relationshipId,
        permissions,
        userId,
      ),
    onSuccess: (_, variables) => {
      // Invalidate relationships and permissions queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.keyholderRelationships.list(variables.userId),
      });
      queryClient.invalidateQueries({
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
    onSuccess: (_, variables) => {
      // Invalidate all relationship queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.keyholderRelationships.list(variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.keyholderRelationships.activeKeyholder(
          variables.userId,
        ),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.keyholderRelationships.summary(variables.userId),
      });
      logger.info("Relationship ended, cache invalidated");
    },
  });
}
