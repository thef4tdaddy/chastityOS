/**
 * Keyholder Goal Management Hook
 * Handles keyholder-specific goal operations
 */
import { useCallback } from "react";
import { serviceLogger } from "../../utils/logging";
import type {
  KeyholderAssignedGoal,
  SessionGoal,
  ModificationRequest,
} from "./types/SessionGoals";

const logger = serviceLogger("useKeyholderGoalManagement");

interface UseKeyholderGoalManagementProps {
  keyholderGoals: KeyholderAssignedGoal[];
  setActiveGoals: React.Dispatch<React.SetStateAction<SessionGoal[]>>;
  setKeyholderGoals: React.Dispatch<
    React.SetStateAction<KeyholderAssignedGoal[]>
  >;
  relationshipId?: string;
}

export const useKeyholderGoalManagement = ({
  keyholderGoals,
  setActiveGoals,
  setKeyholderGoals,
  relationshipId,
}: UseKeyholderGoalManagementProps) => {
  const acceptKeyholderGoal = useCallback(
    async (goalId: string): Promise<void> => {
      try {
        logger.debug("Accepting keyholder goal", { goalId });

        const keyholderGoal = keyholderGoals.find((g) => g.id === goalId);
        if (!keyholderGoal) {
          throw new Error("Keyholder goal not found");
        }

        setActiveGoals((prev) => [
          ...prev,
          { ...keyholderGoal, assignedBy: "keyholder" },
        ]);
        setKeyholderGoals((prev) => prev.filter((g) => g.id !== goalId));

        logger.info("Keyholder goal accepted", { goalId });
      } catch (error) {
        logger.error("Failed to accept keyholder goal", { error });
        throw error;
      }
    },
    [keyholderGoals, setActiveGoals, setKeyholderGoals],
  );

  const requestGoalModification = useCallback(
    async (goalId: string, reason: string): Promise<ModificationRequest> => {
      if (!relationshipId) {
        throw new Error(
          "Goal modification requests require keyholder relationship",
        );
      }

      try {
        logger.debug("Requesting goal modification", { goalId, reason });

        const request: ModificationRequest = {
          id: `mod_req_${Date.now()}`,
          goalId,
          requestedChanges: {},
          reason,
          status: "pending",
          createdAt: new Date(),
        };

        logger.info("Goal modification request created", {
          requestId: request.id,
        });
        return request;
      } catch (error) {
        logger.error("Failed to request goal modification", { error });
        throw error;
      }
    },
    [relationshipId],
  );

  return {
    acceptKeyholderGoal,
    requestGoalModification,
  };
};
