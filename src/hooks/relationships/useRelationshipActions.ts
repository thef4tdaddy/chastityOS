/**
 * React Hook for Relationship Actions
 * Handles accepting, rejecting, and ending relationships
 */
import { useState, useCallback } from "react";
import { useAuthState } from "@/contexts/AuthContext";
import { relationshipService } from "@/services/database/relationships/RelationshipService";
import { BaseHookState, BaseHookActions } from "./types";
import { withErrorHandling, createBaseActions } from "./utils";

type RelationshipActionsState = BaseHookState;

interface RelationshipActionsActions extends BaseHookActions {
  acceptRelationshipRequest: (requestId: string) => Promise<void>;
  rejectRelationshipRequest: (requestId: string) => Promise<void>;
  endRelationship: (relationshipId: string) => Promise<void>;
}

export function useRelationshipActions(): RelationshipActionsState &
  RelationshipActionsActions {
  const { user } = useAuthState();
  const userId = user?.uid;

  const [state, setState] = useState<RelationshipActionsState>({
    isLoading: false,
    error: null,
  });

  const { clearError: clearErrorFn } = createBaseActions();

  const acceptRelationshipRequest = useCallback(
    async (requestId: string) => {
      if (!userId) throw new Error("User not authenticated");

      return withErrorHandling(
        async () => {
          await relationshipService.acceptRelationshipRequest(
            requestId,
            userId,
          );
        },
        "accept relationship request",
        setState,
      );
    },
    [userId],
  );

  const rejectRelationshipRequest = useCallback(
    async (requestId: string) => {
      if (!userId) throw new Error("User not authenticated");

      return withErrorHandling(
        async () => {
          await relationshipService.rejectRelationshipRequest(
            requestId,
            userId,
          );
        },
        "reject relationship request",
        setState,
      );
    },
    [userId],
  );

  const endRelationship = useCallback(
    async (relationshipId: string) => {
      if (!userId) throw new Error("User not authenticated");

      return withErrorHandling(
        async () => {
          await relationshipService.endRelationship(relationshipId, userId);
        },
        "end relationship",
        setState,
      );
    },
    [userId],
  );

  const clearError = useCallback(() => {
    clearErrorFn(setState);
  }, [clearErrorFn]);

  return {
    ...state,
    acceptRelationshipRequest,
    rejectRelationshipRequest,
    endRelationship,
    clearError,
  };
}
