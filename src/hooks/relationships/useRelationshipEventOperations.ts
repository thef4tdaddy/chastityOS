/**
 * Hook for relationship event operations
 */
import { useCallback } from "react";
import { RelationshipEvent } from "@/types/relationships";
import { withErrorHandling } from "./utils";
import { loadEventsFromService, logEventInService } from "./task-operations";

interface EventState {
  events: RelationshipEvent[];
  isLoading: boolean;
  error: string | null;
}

interface EventOperationsParams {
  userId: string | undefined;
  setState: (fn: (prev: EventState) => EventState) => void;
}

export function useRelationshipEventOperations({
  userId,
  setState,
}: EventOperationsParams) {
  const loadEvents = useCallback(
    async (relationshipId: string) => {
      return withErrorHandling(
        async () => {
          const events = await loadEventsFromService(relationshipId);
          setState((prev) => ({ ...prev, events }));
        },
        "load events",
        setState,
      );
    },
    [setState],
  );

  const logEvent = useCallback(
    async (
      relationshipId: string,
      eventData: {
        type: RelationshipEvent["type"];
        details: RelationshipEvent["details"];
        isPrivate?: boolean;
        tags?: string[];
      },
    ) => {
      if (!userId) throw new Error("User not authenticated");

      return withErrorHandling(
        async () => {
          await logEventInService(relationshipId, eventData, userId);
          await loadEvents(relationshipId);
        },
        "log event",
        setState,
      );
    },
    [userId, loadEvents, setState],
  );

  return { loadEvents, logEvent };
}
