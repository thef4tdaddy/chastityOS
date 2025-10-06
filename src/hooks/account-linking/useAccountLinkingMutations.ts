/**
 * Account Linking Mutation Hooks
 * Individual mutation hooks for account linking operations
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AccountLinkingService } from "../../services/auth/account-linking";
import {
  LinkCodeResponse,
  AdminRelationship,
  AdminSession,
  GenerateLinkCodeRequest,
  UseLinkCodeRequest,
  UpdateRelationshipRequest,
} from "../../types/account-linking";
import { ApiResponse } from "../../types";
import { serviceLogger } from "../../utils/logging";

const logger = serviceLogger("useAccountLinkingMutations");

/**
 * Hook for generating link codes
 */
export function useGenerateLinkCode(_userId: string | undefined) {
  return useMutation({
    mutationFn: (request: GenerateLinkCodeRequest) =>
      AccountLinkingService.generateLinkCode(request),
    onSuccess: (response: ApiResponse<LinkCodeResponse>) => {
      if (response.success && response.data) {
        logger.info("Link code generated successfully");
      }
    },
    onError: (error: Error) => {
      logger.error("Failed to generate link code", { error });
    },
  });
}

/**
 * Hook for using/redeeming link codes
 */
export function useRedeemLinkCode(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UseLinkCodeRequest) =>
      AccountLinkingService.redeemLinkCode(request),
    onSuccess: (response: ApiResponse<AdminRelationship>) => {
      if (response.success && response.data) {
        // Refresh relationships
        queryClient.invalidateQueries({
          queryKey: ["adminRelationships", userId],
        });
        logger.info("Link code used successfully");
      }
    },
    onError: (error: Error) => {
      logger.error("Failed to use link code", { error });
    },
  });
}

/**
 * Hook for updating relationships
 */
export function useUpdateRelationship(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateRelationshipRequest) =>
      AccountLinkingService.updateRelationship(request),
    onSuccess: (response: ApiResponse<AdminRelationship>) => {
      if (response.success) {
        // Refresh relationships
        queryClient.invalidateQueries({
          queryKey: ["adminRelationships", userId],
        });
        logger.info("Relationship updated successfully");
      }
    },
    onError: (error: Error) => {
      logger.error("Failed to update relationship", { error });
    },
  });
}

/**
 * Hook for starting admin sessions
 */
export function useStartAdminSession() {
  return useMutation({
    mutationFn: (relationshipId: string) =>
      AccountLinkingService.startAdminSession(relationshipId),
    onSuccess: (response: ApiResponse<AdminSession>) => {
      if (response.success && response.data) {
        logger.info("Admin session started successfully");
      }
    },
    onError: (error: Error) => {
      logger.error("Failed to start admin session", { error });
    },
  });
}
