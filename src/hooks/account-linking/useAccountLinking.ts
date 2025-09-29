/**
 * Account Linking Hook
 * React hook for managing keyholder-wearer account linking
 */
import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AccountLinkingService } from "../../services/auth/account-linking";
import { useAuthState } from "../../contexts";
import {
  LinkCodeResponse,
  AdminRelationship,
  AdminSession,
  GenerateLinkCodeRequest,
  UseLinkCodeRequest,
  UpdateRelationshipRequest,
  AccountLinkingState,
} from "../../types/account-linking";
import { ApiResponse } from "../../types";
import { serviceLogger } from "../../utils/logging";

const logger = serviceLogger("useAccountLinking");

// Query keys
const QUERY_KEYS = {
  relationships: (userId: string) => ["adminRelationships", userId],
  validation: (code: string) => ["linkCodeValidation", code],
  adminSession: (relationshipId: string) => ["adminSession", relationshipId],
} as const;

export const useAccountLinking = () => {
  const { user } = useAuthState();
  const queryClient = useQueryClient();

  // Local state
  const [state, setState] = useState<AccountLinkingState>({
    isGeneratingCode: false,
    currentLinkCode: null,
    linkCodeError: null,
    isUsingCode: false,
    codeUsageError: null,
    adminRelationships: [],
    selectedWearerId: null,
    currentAdminSession: null,
    isAdminSessionActive: false,
    showQRCode: false,
    showDisconnectionDialog: false,
    showPermissionEditor: false,
  });

  // ==================== QUERIES ====================

  // Get admin relationships for current user
  const {
    data: relationships = [],
    isLoading: isLoadingRelationships,
    error: relationshipsError,
  } = useQuery({
    queryKey: QUERY_KEYS.relationships(user?.uid || ""),
    queryFn: () => AccountLinkingService.getAdminRelationships(user!.uid),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update local state when relationships change
  useEffect(() => {
    setState((prev) => ({ ...prev, adminRelationships: relationships }));
  }, [relationships]);

  // ==================== MUTATIONS ====================

  // Generate link code
  const generateLinkCodeMutation = useMutation({
    mutationFn: (request: GenerateLinkCodeRequest) =>
      AccountLinkingService.generateLinkCode(request),
    onMutate: () => {
      setState((prev) => ({
        ...prev,
        isGeneratingCode: true,
        linkCodeError: null,
      }));
    },
    onSuccess: (response: ApiResponse<LinkCodeResponse>) => {
      if (response.success && response.data) {
        setState((prev) => ({
          ...prev,
          currentLinkCode: response.data!,
          isGeneratingCode: false,
        }));
        logger.info("Link code generated successfully");
      } else {
        setState((prev) => ({
          ...prev,
          linkCodeError: response.error || "Failed to generate link code",
          isGeneratingCode: false,
        }));
      }
    },
    onError: (error: Error) => {
      setState((prev) => ({
        ...prev,
        linkCodeError: error.message,
        isGeneratingCode: false,
      }));
      logger.error("Failed to generate link code", { error });
    },
  });

  // Use link code
  const useLinkCodeMutation = useMutation({
    mutationFn: (request: UseLinkCodeRequest) =>
      AccountLinkingService.redeemLinkCode(request),
    onMutate: () => {
      setState((prev) => ({
        ...prev,
        isUsingCode: true,
        codeUsageError: null,
      }));
    },
    onSuccess: (response: ApiResponse<AdminRelationship>) => {
      if (response.success && response.data) {
        setState((prev) => ({
          ...prev,
          isUsingCode: false,
        }));
        // Refresh relationships
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.relationships(user?.uid || ""),
        });
        logger.info("Link code used successfully");
      } else {
        setState((prev) => ({
          ...prev,
          codeUsageError: response.error || "Failed to use link code",
          isUsingCode: false,
        }));
      }
    },
    onError: (error: Error) => {
      setState((prev) => ({
        ...prev,
        codeUsageError: error.message,
        isUsingCode: false,
      }));
      logger.error("Failed to use link code", { error });
    },
  });

  // Update relationship
  const updateRelationshipMutation = useMutation({
    mutationFn: (request: UpdateRelationshipRequest) =>
      AccountLinkingService.updateRelationship(request),
    onSuccess: (response: ApiResponse<AdminRelationship>) => {
      if (response.success) {
        // Refresh relationships
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.relationships(user?.uid || ""),
        });
        logger.info("Relationship updated successfully");
      }
    },
    onError: (error: Error) => {
      logger.error("Failed to update relationship", { error });
    },
  });

  // Start admin session
  const startAdminSessionMutation = useMutation({
    mutationFn: (relationshipId: string) =>
      AccountLinkingService.startAdminSession(relationshipId),
    onSuccess: (response: ApiResponse<AdminSession>) => {
      if (response.success && response.data) {
        setState((prev) => ({
          ...prev,
          currentAdminSession: response.data!,
          isAdminSessionActive: true,
        }));
        logger.info("Admin session started successfully");
      }
    },
    onError: (error: Error) => {
      logger.error("Failed to start admin session", { error });
    },
  });

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
    [user, generateLinkCodeMutation],
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
    [user, useLinkCodeMutation],
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

  const clearLinkCode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentLinkCode: null,
      linkCodeError: null,
    }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentLinkCode: null,
      linkCodeError: null,
      codeUsageError: null,
    }));
  }, []);

  const setSelectedWearer = useCallback((wearerId: string | null) => {
    setState((prev) => ({ ...prev, selectedWearerId: wearerId }));
  }, []);

  // Combined toggle function for boolean state properties
  const toggleStateProperty = useCallback(
    (
      property: keyof Pick<
        AccountLinkingState,
        "showQRCode" | "showDisconnectionDialog" | "showPermissionEditor"
      >,
    ) => {
      setState((prev) => ({ ...prev, [property]: !prev[property] }));
    },
    [],
  );

  const toggleQRCode = useCallback(
    () => toggleStateProperty("showQRCode"),
    [toggleStateProperty],
  );
  const toggleDisconnectionDialog = useCallback(
    () => toggleStateProperty("showDisconnectionDialog"),
    [toggleStateProperty],
  );
  const togglePermissionEditor = useCallback(
    () => toggleStateProperty("showPermissionEditor"),
    [toggleStateProperty],
  );

  // ==================== DERIVED STATE ====================

  // User role calculations
  const userRoles = useMemo(
    () => ({
      isKeyholder: relationships.some((r) => r.keyholderId === user?.uid),
      isWearer: relationships.some((r) => r.wearerId === user?.uid),
      hasActiveRelationships: relationships.some((r) => r.status === "active"),
    }),
    [relationships, user?.uid],
  );

  // Relationship filtering
  const relationshipsByRole = useMemo(
    () => ({
      keyholderRelationships: relationships.filter(
        (r) => r.keyholderId === user?.uid,
      ),
      wearerRelationships: relationships.filter(
        (r) => r.wearerId === user?.uid,
      ),
    }),
    [relationships, user?.uid],
  );

  const selectedRelationship = state.selectedWearerId
    ? relationships.find((r) => r.wearerId === state.selectedWearerId)
    : null;

  // ==================== RETURN OBJECT ====================

  return {
    // State
    ...state,
    relationships,
    isLoadingRelationships,
    relationshipsError,

    // Derived state
    ...userRoles,
    selectedRelationship,
    ...relationshipsByRole,

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

// ==================== ADDITIONAL HOOKS ====================

/**
 * Hook for validating link codes
 */
export const useLinkCodeValidation = (code: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.validation(code),
    queryFn: () => AccountLinkingService.validateLinkCode(code),
    enabled: code.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
};

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
