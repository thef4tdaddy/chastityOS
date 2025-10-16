/**
 * React Hook for Relationship Status Management
 * Handles session management and status updates
 */
import { useState, useEffect, useCallback } from "react";
import { useAuthState } from "@/contexts/AuthContext";
import { relationshipChastityService } from "@/services/database/RelationshipChastityService";
import {
  RelationshipChastityData,
  RelationshipSession,
} from "@/types/relationships";
import { BaseHookState, BaseHookActions } from "./types";
import {
  withErrorHandling,
  createBaseActions,
} from "@/utils/error-handling/handlers";

interface RelationshipStatusState extends BaseHookState {
  chastityData: RelationshipChastityData | null;
  sessions: RelationshipSession[];
}

interface RelationshipStatusActions extends BaseHookActions {
  startSession: (
    relationshipId: string,
    options?: {
      goalDuration?: number;
      isHardcoreMode?: boolean;
      notes?: string;
    },
  ) => Promise<void>;
  endSession: (
    relationshipId: string,
    sessionId: string,
    reason?: string,
  ) => Promise<void>;
  pauseSession: (
    relationshipId: string,
    sessionId: string,
    reason?: string,
  ) => Promise<void>;
  resumeSession: (relationshipId: string, sessionId: string) => Promise<void>;
  loadRelationshipData: (relationshipId: string) => Promise<void>;
}

export function useRelationshipStatus(): RelationshipStatusState &
  RelationshipStatusActions {
  const { user } = useAuthState();
  const userId = user?.uid;

  const [state, setState] = useState<RelationshipStatusState>({
    chastityData: null,
    sessions: [],
    isLoading: false,
    error: null,
  });

  const { clearError: clearErrorFn } = createBaseActions();

  const { loadRelationshipData } = useDataLoading(setState);

  const { startSession, endSession, pauseSession, resumeSession } =
    useSessionOperations(userId, loadRelationshipData, setState);

  const clearError = useCallback(() => {
    clearErrorFn(setState);
  }, [clearErrorFn]);

  // Set up real-time listeners for active relationship data
  useEffect(() => {
    // This would be called externally when activeRelationship changes
    // The parent hook will need to manage this subscription
  }, []);

  return {
    ...state,
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    loadRelationshipData,
    clearError,
  };
}

// Hook for data loading operations
function useDataLoading(
  setState: (
    value:
      | RelationshipStatusState
      | ((prev: RelationshipStatusState) => RelationshipStatusState),
  ) => void,
) {
  const loadChastityData = useCallback(
    async (relationshipId: string) => {
      return withErrorHandling(
        async () => {
          const chastityData =
            await relationshipChastityService.getChastityData(relationshipId);
          setState((prev) => ({ ...prev, chastityData }));
        },
        "load chastity data",
        setState,
      );
    },
    [setState],
  );

  const loadSessions = useCallback(
    async (relationshipId: string) => {
      return withErrorHandling(
        async () => {
          const sessions =
            await relationshipChastityService.getSessionHistory(relationshipId);
          setState((prev) => ({ ...prev, sessions }));
        },
        "load sessions",
        setState,
      );
    },
    [setState],
  );

  const loadRelationshipData = useCallback(
    async (relationshipId: string) => {
      await Promise.all([
        loadChastityData(relationshipId),
        loadSessions(relationshipId),
      ]);
    },
    [loadChastityData, loadSessions],
  );

  return { loadChastityData, loadSessions, loadRelationshipData };
}

// Hook for session operations
function useSessionOperations(
  userId: string | undefined,
  loadRelationshipData: (relationshipId: string) => Promise<void>,
  setState: (
    value:
      | RelationshipStatusState
      | ((prev: RelationshipStatusState) => RelationshipStatusState),
  ) => void,
) {
  const { startSession, endSession } = useStartEndSession(
    userId,
    loadRelationshipData,
    setState,
  );

  const { pauseSession, resumeSession } = usePauseResumeSession(
    userId,
    loadRelationshipData,
    setState,
  );

  return { startSession, endSession, pauseSession, resumeSession };
}

// Hook for start and end session operations
function useStartEndSession(
  userId: string | undefined,
  loadRelationshipData: (relationshipId: string) => Promise<void>,
  setState: (
    value:
      | RelationshipStatusState
      | ((prev: RelationshipStatusState) => RelationshipStatusState),
  ) => void,
) {
  const startSession = useCallback(
    async (
      relationshipId: string,
      options?: {
        goalDuration?: number;
        isHardcoreMode?: boolean;
        notes?: string;
      },
    ) => {
      if (!userId) throw new Error("User not authenticated");

      return withErrorHandling(
        async () => {
          await relationshipChastityService.startSession(
            relationshipId,
            userId,
            options || {},
          );
          await loadRelationshipData(relationshipId);
        },
        "start session",
        setState,
      );
    },
    [userId, loadRelationshipData, setState],
  );

  const endSession = useCallback(
    async (relationshipId: string, sessionId: string, reason?: string) => {
      if (!userId) throw new Error("User not authenticated");

      return withErrorHandling(
        async () => {
          await relationshipChastityService.endSession(
            relationshipId,
            sessionId,
            userId,
            reason,
          );
          await loadRelationshipData(relationshipId);
        },
        "end session",
        setState,
      );
    },
    [userId, loadRelationshipData, setState],
  );

  return { startSession, endSession };
}

// Hook for pause and resume session operations
function usePauseResumeSession(
  userId: string | undefined,
  loadRelationshipData: (relationshipId: string) => Promise<void>,
  setState: (
    value:
      | RelationshipStatusState
      | ((prev: RelationshipStatusState) => RelationshipStatusState),
  ) => void,
) {
  const pauseSession = useCallback(
    async (relationshipId: string, sessionId: string, reason?: string) => {
      if (!userId) throw new Error("User not authenticated");

      return withErrorHandling(
        async () => {
          await relationshipChastityService.pauseSession(
            relationshipId,
            sessionId,
            userId,
            reason,
          );
          await loadRelationshipData(relationshipId);
        },
        "pause session",
        setState,
      );
    },
    [userId, loadRelationshipData, setState],
  );

  const resumeSession = useCallback(
    async (relationshipId: string, sessionId: string) => {
      if (!userId) throw new Error("User not authenticated");

      return withErrorHandling(
        async () => {
          await relationshipChastityService.resumeSession(
            relationshipId,
            sessionId,
            userId,
          );
          await loadRelationshipData(relationshipId);
        },
        "resume session",
        setState,
      );
    },
    [userId, loadRelationshipData, setState],
  );

  return { pauseSession, resumeSession };
}
