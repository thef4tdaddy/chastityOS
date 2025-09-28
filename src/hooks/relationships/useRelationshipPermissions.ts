/**
 * React Hook for Relationship Permission Management
 * Handles updating and managing relationship permissions
 */
import { useState, useCallback } from "react";
import { useAuthState } from "@/contexts/AuthContext";
import { relationshipService } from "@/services/database/relationships/RelationshipService";
import { RelationshipPermissions } from "@/types/relationships";
import { BaseHookState, BaseHookActions } from "./types";
import { withErrorHandling, createBaseActions } from "./utils";

type RelationshipPermissionsState = BaseHookState;

interface RelationshipPermissionsActions extends BaseHookActions {
  updatePermissions: (
    relationshipId: string,
    permissions: RelationshipPermissions,
  ) => Promise<void>;
}

export function useRelationshipPermissions(): RelationshipPermissionsState &
  RelationshipPermissionsActions {
  const { user } = useAuthState();
  const userId = user?.uid;

  const [state, setState] = useState<RelationshipPermissionsState>({
    isLoading: false,
    error: null,
  });

  const { clearError: clearErrorFn } = createBaseActions();

  const updatePermissions = useCallback(
    async (relationshipId: string, permissions: RelationshipPermissions) => {
      if (!userId) throw new Error("User not authenticated");

      return withErrorHandling(
        async () => {
          await relationshipService.updateRelationshipPermissions(
            relationshipId,
            permissions,
            userId,
          );
        },
        "update permissions",
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
    updatePermissions,
    clearError,
  };
}
