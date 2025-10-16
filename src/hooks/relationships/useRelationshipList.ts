/**
 * React Hook for Relationship List Management
 * Handles loading, filtering, and selecting relationships
 */
import { useState, useEffect, useCallback } from "react";
import { useAuthState } from "@/contexts/AuthContext";
import { relationshipService } from "@/services/database/relationships/RelationshipService";
import { Relationship } from "@/types/relationships";
import { BaseHookState, BaseHookActions } from "./types";
import {
  withErrorHandling,
  createBaseActions,
} from "@/utils/error-handling/handlers";

interface RelationshipListState extends BaseHookState {
  relationships: Relationship[];
  activeRelationship: Relationship | null;
}

interface RelationshipListActions extends BaseHookActions {
  setActiveRelationship: (relationship: Relationship | null) => void;
  refreshRelationships: () => Promise<void>;
}

export function useRelationshipList(): RelationshipListState &
  RelationshipListActions {
  const { user } = useAuthState();
  const userId = user?.uid;

  const [state, setState] = useState<RelationshipListState>({
    relationships: [],
    activeRelationship: null,
    isLoading: false,
    error: null,
  });

  const { clearError: clearErrorFn } = createBaseActions();

  const loadRelationships = useCallback(async () => {
    if (!userId) return;

    return withErrorHandling(
      async () => {
        const relationships =
          await relationshipService.getUserRelationships(userId);
        setState((prev: RelationshipListState) => ({ ...prev, relationships }));

        // Set active relationship if there's only one and none is set
        if (relationships.length === 1 && !state.activeRelationship) {
          setState((prev: RelationshipListState) => ({
            ...prev,
            activeRelationship: relationships[0] || null,
          }));
        }
      },
      "load relationships",
      setState,
    );
  }, [userId, state.activeRelationship]);

  const setActiveRelationship = useCallback(
    (relationship: Relationship | null) => {
      setState((prev: RelationshipListState) => ({
        ...prev,
        activeRelationship: relationship,
      }));
    },
    [],
  );

  const refreshRelationships = useCallback(async () => {
    await loadRelationships();
  }, [loadRelationships]);

  const clearError = useCallback(() => {
    clearErrorFn(setState);
  }, [clearErrorFn]);

  // Initial load
  useEffect(() => {
    if (userId) {
      loadRelationships();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // loadRelationships intentionally omitted - depends on state.activeRelationship and would cause infinite loops

  // Set up real-time listeners
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = relationshipService.subscribeToUserRelationships(
      userId,
      (relationships: Relationship[]) => {
        setState((prev: RelationshipListState) => ({ ...prev, relationships }));
      },
    );

    return unsubscribe;
  }, [userId]);

  return {
    ...state,
    setActiveRelationship,
    refreshRelationships,
    clearError,
  };
}
