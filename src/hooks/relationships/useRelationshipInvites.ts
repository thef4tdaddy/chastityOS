/**
 * React Hook for Relationship Invitation Management
 * Handles sending and managing relationship invitations
 */
import { useState, useEffect, useCallback } from "react";
import { useAuthState } from "@/contexts/AuthContext";
import { relationshipService } from "@/services/database/relationships/RelationshipService";
import { RelationshipRequest } from "@/types/relationships";
import { BaseHookState, BaseHookActions } from "./types";
import { withErrorHandling, createBaseActions } from "./relationship-utils";

interface RelationshipInvitesState extends BaseHookState {
  pendingRequests: RelationshipRequest[];
}

interface RelationshipInvitesActions extends BaseHookActions {
  sendRelationshipRequest: (
    targetUserId: string,
    role: "submissive" | "keyholder",
    message?: string,
  ) => Promise<void>;
  refreshPendingRequests: () => Promise<void>;
}

export function useRelationshipInvites(): RelationshipInvitesState &
  RelationshipInvitesActions {
  const { user } = useAuthState();
  const userId = user?.uid;

  const [state, setState] = useState<RelationshipInvitesState>({
    pendingRequests: [],
    isLoading: false,
    error: null,
  });

  const { clearError: clearErrorFn } = createBaseActions();

  const loadPendingRequests = useCallback(async () => {
    if (!userId) return;

    return withErrorHandling(
      async () => {
        const pendingRequests =
          await relationshipService.getPendingRequests(userId);
        setState((prev) => ({ ...prev, pendingRequests }));
      },
      "load pending requests",
      setState,
    );
  }, [userId]);

  const sendRelationshipRequest = useCallback(
    async (
      targetUserId: string,
      role: "submissive" | "keyholder",
      message?: string,
    ) => {
      if (!userId) throw new Error("User not authenticated");

      return withErrorHandling(
        async () => {
          await relationshipService.sendRelationshipRequest(
            userId,
            targetUserId,
            role,
            message,
          );
          await loadPendingRequests();
        },
        "send relationship request",
        setState,
      );
    },
    [userId, loadPendingRequests],
  );

  const refreshPendingRequests = useCallback(async () => {
    await loadPendingRequests();
  }, [loadPendingRequests]);

  const clearError = useCallback(() => {
    clearErrorFn(setState);
  }, [clearErrorFn]);

  // Initial load
  useEffect(() => {
    if (userId) {
      loadPendingRequests();
    }
    // eslint-disable-next-line zustand-safe-patterns/zustand-no-store-actions-in-deps
  }, [userId, loadPendingRequests]);

  return {
    ...state,
    sendRelationshipRequest,
    refreshPendingRequests,
    clearError,
  };
}
