/**
 * Goal Mutations Hook
 * Handles CRUD operations for goals
 */
import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { serviceLogger } from "../../utils/logging";
import type {
  SessionGoal,
  CreateGoalRequest,
  GoalHistoryEntry,
  GoalProgress,
} from "./types/SessionGoals";

const logger = serviceLogger("useGoalMutations");

interface UseGoalMutationsProps {
  setActiveGoals: Dispatch<SetStateAction<SessionGoal[]>>;
  setProgress: Dispatch<SetStateAction<GoalProgress[]>>;
  setGoalHistory: Dispatch<SetStateAction<GoalHistoryEntry[]>>;
  userId: string;
}

export const useGoalMutations = ({
  setActiveGoals,
  setProgress,
  setGoalHistory,
  userId,
}: UseGoalMutationsProps) => {
  const setGoal = useCallback(
    async (goalRequest: CreateGoalRequest): Promise<SessionGoal> => {
      try {
        logger.debug("Creating new goal", { userId, goalRequest });

        const newGoal: SessionGoal = {
          id: `goal_${Date.now()}`,
          type: goalRequest.type,
          category: goalRequest.category,
          target: goalRequest.target,
          current: 0,
          progress: 0,
          assignedBy: "self",
          isRequired: goalRequest.isRequired || false,
          deadline: goalRequest.deadline,
          priority: goalRequest.priority,
          status: "active",
          createdAt: new Date(),
          description: goalRequest.description,
          tags: goalRequest.tags,
        };

        setActiveGoals((prev) => [...prev, newGoal]);

        const historyEntry: GoalHistoryEntry = {
          id: `history_${Date.now()}`,
          goalId: newGoal.id,
          action: "created",
          timestamp: new Date(),
          details: { goalRequest },
          performedBy: "submissive",
        };

        setGoalHistory((prev) => [...prev, historyEntry]);
        logger.info("Goal created successfully", { goalId: newGoal.id });
        return newGoal;
      } catch (error) {
        logger.error("Failed to create goal", { error });
        throw error;
      }
    },
    [userId, setActiveGoals, setGoalHistory],
  );

  const updateGoal = useCallback(
    async (goalId: string, updates: Partial<SessionGoal>): Promise<void> => {
      try {
        logger.debug("Updating goal", { goalId, updates });

        setActiveGoals((prev) =>
          prev.map((goal) =>
            goal.id === goalId
              ? { ...goal, ...updates, updatedAt: new Date() }
              : goal,
          ),
        );

        const historyEntry: GoalHistoryEntry = {
          id: `history_${Date.now()}`,
          goalId,
          action: "updated",
          timestamp: new Date(),
          details: { updates },
          performedBy: "submissive",
        };

        setGoalHistory((prev) => [...prev, historyEntry]);
        logger.info("Goal updated successfully", { goalId });
      } catch (error) {
        logger.error("Failed to update goal", { error });
        throw error;
      }
    },
    [setActiveGoals, setGoalHistory],
  );

  const removeGoal = useCallback(
    async (goalId: string): Promise<void> => {
      try {
        logger.debug("Removing goal", { goalId });

        setActiveGoals((prev) => prev.filter((goal) => goal.id !== goalId));
        setProgress((prev) => prev.filter((p) => p.goalId !== goalId));

        const historyEntry: GoalHistoryEntry = {
          id: `history_${Date.now()}`,
          goalId,
          action: "abandoned",
          timestamp: new Date(),
          details: {},
          performedBy: "submissive",
        };

        setGoalHistory((prev) => [...prev, historyEntry]);
        logger.info("Goal removed successfully", { goalId });
      } catch (error) {
        logger.error("Failed to remove goal", { error });
        throw error;
      }
    },
    [setActiveGoals, setProgress, setGoalHistory],
  );

  return {
    setGoal,
    updateGoal,
    removeGoal,
  };
};
