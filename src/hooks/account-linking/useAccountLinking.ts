/**
 * Account Linking Hook
 * React hook for managing keyholder-wearer account linking
 */
import { useCallback, useEffect } from "react";
import { useAuthState } from "../../contexts";
import {
  GenerateLinkCodeRequest,
  UseLinkCodeRequest,
  UpdateRelationshipRequest,
} from "../../types/account-linking";
import { useAccountLinkingState } from "./useAccountLinkingState";
import {
  useGenerateLinkCode,
  useRedeemLinkCode,
  useUpdateRelationship,
  useStartAdminSession,
} from "./useAccountLinkingMutations";
import { useAdminRelationshipsQuery } from "./useAccountLinkingQueries";
import { useAccountLinkingDerived } from "./useAccountLinkingDerived";
import { useAccountLinkingEffects } from "./useAccountLinkingEffects";

export const useAccountLinking = () => {
  const { user } = useAuthState();

  // Local UI state management
  const {
    state,
    setState,
    setSelectedWearer,
    toggleQRCode,
    toggleDisconnectionDialog,
    togglePermissionEditor,
    clearLinkCode,
    clearAllErrors,
  } = useAccountLinkingState();

  // Queries
  const {
    data: relationships = [],
    isLoading: isLoadingRelationships,
    error: relationshipsError,
  } = useAdminRelationshipsQuery(user?.uid);

  // Update local state when relationships change
  useEffect(() => {
    setState((prev) => ({ ...prev, adminRelationships: relationships }));
  }, [relationships]);

  // Mutations
  const generateLinkCodeMutation = useGenerateLinkCode(user?.uid);
  const useLinkCodeMutation = useRedeemLinkCode(user?.uid);
  const updateRelationshipMutation = useUpdateRelationship(user?.uid);
  const startAdminSessionMutation = useStartAdminSession();

  // Handle mutation state updates
  useAccountLinkingEffects(
    generateLinkCodeMutation,
    useLinkCodeMutation,
    startAdminSessionMutation,
    setState,
  );

  // ==================== CALLBACK FUNCTIONS ====================

  const generateLinkCode = useCallback(
    (request: GenerateLinkCodeRequest = {}) => {
      if (!user) {
        setState((prev) => ({
          ...prev,
          linkCodeError: "Authentication required",
        }));
        return;
      }
      generateLinkCodeMutation.mutate(request);
    },
    [user, generateLinkCodeMutation, setState],
  );

  const redeemLinkCode = useCallback(
    (request: UseLinkCodeRequest) => {
      if (!user) {
        setState((prev) => ({
          ...prev,
          codeUsageError: "Authentication required",
        }));
        return;
      }
      useLinkCodeMutation.mutate(request);
    },
    [user, useLinkCodeMutation, setState],
  );

  const updateRelationship = useCallback(
    (request: UpdateRelationshipRequest) => {
      updateRelationshipMutation.mutate(request);
    },
    [updateRelationshipMutation],
  );

  const startAdminSession = useCallback(
    (relationshipId: string) => {
      startAdminSessionMutation.mutate(relationshipId);
    },
    [startAdminSessionMutation],
  );

  const disconnectKeyholder = useCallback(
    (relationshipId: string, reason?: string) => {
      updateRelationship({
        relationshipId,
        status: "terminated",
        terminationReason: reason,
      });
    },
    [updateRelationship],
  );

  // ==================== DERIVED STATE ====================

  const derivedState = useAccountLinkingDerived(
    relationships,
    user?.uid,
    state.selectedWearerId,
  );

  // ==================== RETURN OBJECT ====================

  return {
    // State
    ...state,
    relationships,
    isLoadingRelationships,
    relationshipsError,

    // Derived state
    ...derivedState,

    // Actions
    generateLinkCode,
    redeemLinkCode,
    updateRelationship,
    startAdminSession,
    disconnectKeyholder,
    clearLinkCode,
    clearAllErrors,
    setSelectedWearer,
    toggleQRCode,
    toggleDisconnectionDialog,
    togglePermissionEditor,

    // Loading states
    isGeneratingCode: generateLinkCodeMutation.isPending,
    isUsingCode: useLinkCodeMutation.isPending,
    isUpdatingRelationship: updateRelationshipMutation.isPending,
    isStartingSession: startAdminSessionMutation.isPending,
  };
};

// Re-export useLinkCodeValidation from queries file
export { useLinkCodeValidation } from "./useAccountLinkingQueries";

/**
 * Hook for admin access validation
 */
export const useAdminAccess = (wearerId: string) => {
  const { user } = useAuthState();
  const { relationships } = useAccountLinking();

  const adminRelationship = relationships.find(
    (r) =>
      r.keyholderId === user?.uid &&
      r.wearerId === wearerId &&
      r.status === "active",
  );

  const hasAccess = !!adminRelationship;
  const permissions = adminRelationship?.permissions || null;
  const security = adminRelationship?.security || null;

  const canPerformAction = useCallback(
    (action: keyof typeof permissions) => {
      return hasAccess && permissions?.[action] === true;
    },
    [hasAccess, permissions],
  );

  return {
    hasAccess,
    adminRelationship,
    permissions,
    security,
    canPerformAction,
  };
};
