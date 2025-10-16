/**
 * Hook for managing keyholder relationships
 * Provides UI state and actions for account linking
 * Optimized with TanStack Query for better performance and caching
 */
import { useState, useCallback, useMemo } from "react";
import { useAuthState } from "../contexts";
import { KeyholderRelationshipService } from "../services/KeyholderRelationshipService";
import { KeyholderRelationship, KeyholderPermissions } from "../types/core";
import { InviteCode } from "../services/database/KeyholderRelationshipDBService";
import { serviceLogger } from "../utils/logging";
import {
  useKeyholderRelationships as useKeyholderRelationshipsQuery,
  useActiveKeyholder as useActiveKeyholderQuery,
  useActiveInviteCodes as useActiveInviteCodesQuery,
  useRelationshipSummary as useRelationshipSummaryQuery,
  useCreateInviteCode as useCreateInviteCodeMutation,
  useAcceptInviteCode as useAcceptInviteCodeMutation,
  useRevokeInviteCode as useRevokeInviteCodeMutation,
  useUpdatePermissions as useUpdatePermissionsMutation,
  useEndRelationship as useEndRelationshipMutation,
} from "./api/useKeyholderRelationshipQueries";

const logger = serviceLogger("useKeyholderRelationships");

export interface KeyholderRelationshipState {
  // Relationships
  relationships: {
    asSubmissive: KeyholderRelationship[];
    asKeyholder: KeyholderRelationship[];
  };
  activeKeyholder: KeyholderRelationship | null;

  // Invite codes
  activeInviteCodes: InviteCode[];

  // Loading states
  isLoading: boolean;
  isCreatingInvite: boolean;
  isAcceptingInvite: boolean;
  isUpdatingPermissions: boolean;

  // Form states
  inviteCodeInput: string;
  keyholderNameInput: string;

  // Messages
  message: string;
  messageType: "success" | "error" | "info";

  // Summary
  relationshipSummary: {
    hasActiveKeyholder: boolean;
    hasSubmissives: boolean;
    activeKeyholderCount: number;
    submissiveCount: number;
  } | null;
}

export interface KeyholderRelationshipActions {
  // Data loading
  loadRelationships: () => Promise<void>;
  loadInviteCodes: () => Promise<void>;
  loadRelationshipSummary: () => Promise<void>;

  // Invite code management
  createInviteCode: (expirationHours?: number) => Promise<InviteCode | null>;
  acceptInviteCode: (code: string, keyholderName?: string) => Promise<boolean>;
  revokeInviteCode: (codeId: string) => Promise<void>;

  // Relationship management
  updatePermissions: (
    relationshipId: string,
    permissions: KeyholderPermissions,
  ) => Promise<void>;
  endRelationship: (relationshipId: string) => Promise<void>;

  // Form actions
  setInviteCodeInput: (code: string) => void;
  setKeyholderNameInput: (name: string) => void;
  clearMessage: () => void;
  clearForm: () => void;

  // Utilities
  validateInviteCode: (code: string) => boolean;
  canCreateInviteCode: () => Promise<boolean>;
  hasPermission: (
    submissiveUserId: string,
    permission: keyof KeyholderPermissions,
  ) => Promise<boolean>;
}

// Initial state removed - now using TanStack Query for data management

// Disable complexity warnings - this hook coordinates multiple related operations
/* eslint-disable max-lines-per-function, max-statements */
export function useKeyholderRelationships(): KeyholderRelationshipState &
  KeyholderRelationshipActions {
  const [formState, setFormState] = useState({
    inviteCodeInput: "",
    keyholderNameInput: "",
    message: "",
    messageType: "info" as "success" | "error" | "info",
  });

  const { user } = useAuthState();
  const userId = user?.uid;

  // Use TanStack Query hooks for data fetching with automatic caching
  const relationshipsQuery = useKeyholderRelationshipsQuery(userId);
  const activeKeyholderQuery = useActiveKeyholderQuery(userId);
  const inviteCodesQuery = useActiveInviteCodesQuery(userId);
  const summaryQuery = useRelationshipSummaryQuery(userId);

  // Use mutations for data modifications with automatic cache invalidation
  const createInviteMutation = useCreateInviteCodeMutation();
  const acceptInviteMutation = useAcceptInviteCodeMutation();
  const revokeInviteMutation = useRevokeInviteCodeMutation();
  const updatePermissionsMutation = useUpdatePermissionsMutation();
  const endRelationshipMutation = useEndRelationshipMutation();

  // Combine loading states
  const isLoading = useMemo(
    () =>
      relationshipsQuery.isLoading ||
      activeKeyholderQuery.isLoading ||
      inviteCodesQuery.isLoading ||
      summaryQuery.isLoading,
    [
      relationshipsQuery.isLoading,
      activeKeyholderQuery.isLoading,
      inviteCodesQuery.isLoading,
      summaryQuery.isLoading,
    ],
  );

  // Data loading functions (now just trigger refetch)
  const loadRelationships = useCallback(async () => {
    await relationshipsQuery.refetch();
    await activeKeyholderQuery.refetch();
  }, [relationshipsQuery, activeKeyholderQuery]);

  const loadInviteCodes = useCallback(async () => {
    await inviteCodesQuery.refetch();
  }, [inviteCodesQuery]);

  const loadRelationshipSummary = useCallback(async () => {
    await summaryQuery.refetch();
  }, [summaryQuery]);

  // Create invite code with optimistic updates
  const createInviteCode = useCallback(
    async (expirationHours = 24): Promise<InviteCode | null> => {
      if (!userId || !user?.displayName) return null;

      setFormState((prev) => ({
        ...prev,
        message: "",
      }));

      try {
        const canCreate =
          await KeyholderRelationshipService.canCreateInviteCode(userId);
        if (!canCreate) {
          setFormState((prev) => ({
            ...prev,
            message: "You already have an active keyholder relationship",
            messageType: "error",
          }));
          return null;
        }

        const inviteCode = await createInviteMutation.mutateAsync({
          userId,
          displayName: user.displayName,
          expirationHours,
        });

        setFormState((prev) => ({
          ...prev,
          message: `Invite code created: ${inviteCode.code}`,
          messageType: "success",
        }));

        logger.info("Invite code created successfully", {
          code: inviteCode.code,
        });

        return inviteCode;
      } catch (error) {
        const errorMessage =
          (error as Error).message || "Failed to create invite code";
        setFormState((prev) => ({
          ...prev,
          message: errorMessage,
          messageType: "error",
        }));
        logger.error("Failed to create invite code", { error: error as Error });
        return null;
      }
    },
    [userId, user?.displayName, createInviteMutation],
  );

  // Accept invite code with optimistic updates
  const acceptInviteCode = useCallback(
    async (code: string, keyholderName?: string): Promise<boolean> => {
      if (!userId) return false;

      setFormState((prev) => ({
        ...prev,
        message: "",
      }));

      try {
        await acceptInviteMutation.mutateAsync({
          code,
          keyholderUserId: userId,
          keyholderName: keyholderName || user?.displayName,
        });

        setFormState((prev) => ({
          ...prev,
          message: "Successfully linked with submissive!",
          messageType: "success",
          inviteCodeInput: "",
          keyholderNameInput: "",
        }));

        logger.info("Invite code accepted successfully");
        return true;
      } catch (error) {
        const errorMessage =
          (error as Error).message || "Failed to accept invite code";
        setFormState((prev) => ({
          ...prev,
          message: errorMessage,
          messageType: "error",
        }));
        logger.error("Failed to accept invite code", { error: error as Error });
        return false;
      }
    },
    [userId, user?.displayName, acceptInviteMutation],
  );

  // Revoke invite code
  const revokeInviteCode = useCallback(
    async (codeId: string) => {
      if (!userId) return;

      try {
        await revokeInviteMutation.mutateAsync({ codeId, userId });
        logger.info("Invite code revoked successfully", { codeId });
      } catch (error) {
        logger.error("Failed to revoke invite code", { error: error as Error });
      }
    },
    [userId, revokeInviteMutation],
  );

  // Update permissions
  const updatePermissions = useCallback(
    async (relationshipId: string, permissions: KeyholderPermissions) => {
      if (!userId) return;

      try {
        await updatePermissionsMutation.mutateAsync({
          relationshipId,
          permissions,
          userId,
        });
        setFormState((prev) => ({
          ...prev,
          message: "Permissions updated successfully",
          messageType: "success",
        }));
        logger.info("Permissions updated successfully");
      } catch (error) {
        const errorMessage =
          (error as Error).message || "Failed to update permissions";
        setFormState((prev) => ({
          ...prev,
          message: errorMessage,
          messageType: "error",
        }));
        logger.error("Failed to update permissions", { error: error as Error });
      }
    },
    [userId, updatePermissionsMutation],
  );

  // End relationship
  const endRelationship = useCallback(
    async (relationshipId: string) => {
      if (!userId) return;

      try {
        await endRelationshipMutation.mutateAsync({ relationshipId, userId });
        logger.info("Relationship ended successfully");
      } catch (error) {
        logger.error("Failed to end relationship", { error: error as Error });
      }
    },
    [userId, endRelationshipMutation],
  );

  // Form actions
  const setInviteCodeInput = useCallback((code: string) => {
    setFormState((prev) => ({ ...prev, inviteCodeInput: code.toUpperCase() }));
  }, []);

  const setKeyholderNameInput = useCallback((name: string) => {
    setFormState((prev) => ({ ...prev, keyholderNameInput: name }));
  }, []);

  const clearMessage = useCallback(() => {
    setFormState((prev) => ({ ...prev, message: "", messageType: "info" }));
  }, []);

  const clearForm = useCallback(() => {
    setFormState({
      inviteCodeInput: "",
      keyholderNameInput: "",
      message: "",
      messageType: "info",
    });
  }, []);

  // Utility functions
  const validateInviteCode = useCallback((code: string): boolean => {
    return KeyholderRelationshipService.validateInviteCodeFormat(code);
  }, []);

  const canCreateInviteCode = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    return await KeyholderRelationshipService.canCreateInviteCode(userId);
  }, [userId]);

  const hasPermission = useCallback(
    async (
      submissiveUserId: string,
      permission: keyof KeyholderPermissions,
    ): Promise<boolean> => {
      if (!userId) return false;
      return await KeyholderRelationshipService.hasPermission(
        userId,
        submissiveUserId,
        permission,
      );
    },
    [userId],
  );

  return {
    // State from queries
    relationships: relationshipsQuery.data || {
      asSubmissive: [],
      asKeyholder: [],
    },
    activeKeyholder: activeKeyholderQuery.data || null,
    activeInviteCodes: inviteCodesQuery.data || [],
    relationshipSummary: summaryQuery.data || null,

    // Loading states
    isLoading,
    isCreatingInvite: createInviteMutation.isPending,
    isAcceptingInvite: acceptInviteMutation.isPending,
    isUpdatingPermissions: updatePermissionsMutation.isPending,

    // Form state
    ...formState,

    // Actions
    loadRelationships,
    loadInviteCodes,
    loadRelationshipSummary,
    createInviteCode,
    acceptInviteCode,
    revokeInviteCode,
    updatePermissions,
    endRelationship,
    setInviteCodeInput,
    setKeyholderNameInput,
    clearMessage,
    clearForm,
    validateInviteCode,
    canCreateInviteCode,
    hasPermission,
  };
}
/* eslint-enable max-lines-per-function, max-statements */
