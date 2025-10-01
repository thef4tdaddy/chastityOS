/**
 * useGoalCRUD - Basic CRUD operations for goals
 * Create, update, and delete operations
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  EnhancedGoal,
  CreateGoalRequest,
  GoalUpdate,
  GoalStatus,
} from "../../../types/goals";
import { logger } from "../../../utils/logging";
import { GoalStorageService } from "../../../services/goalStorage";
import { calculateEstimatedCompletion } from "../../../utils/goals/goalsHelpers";

interface UseGoalCRUDOptions {
  userId?: string;
  personalGoals: EnhancedGoal[];
}

export const useGoalCRUD = (options: UseGoalCRUDOptions) => {
  const { userId, personalGoals } = options;
  const queryClient = useQueryClient();

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (request: CreateGoalRequest) => {
      const newGoal: EnhancedGoal = {
        id: `goal-${Date.now()}`,
        type: request.type,
        category: request.category,
        title: request.title,
        description: request.description,
        target: request.target,
        progress: {
          current: 0,
          target: request.target.value,
          percentage: 0,
          status: GoalStatus.ACTIVE,
          milestones:
            request.milestones?.map((m) => ({
              ...m,
              id: `milestone-${Date.now()}-${Math.random()}`,
              achieved: false,
            })) || [],
          lastUpdated: new Date(),
        },
        milestones:
          request.milestones?.map((m) => ({
            ...m,
            id: `milestone-${Date.now()}-${Math.random()}`,
            achieved: false,
          })) || [],
        aiGenerated: false,
        difficulty: request.difficulty,
        estimatedCompletion: calculateEstimatedCompletion(
          request.difficulty,
          request.target,
        ),
        createdAt: new Date(),
        tags: request.tags || [],
        isPublic: request.isPublic || false,
      };

      const updated = [...personalGoals, newGoal];
      GoalStorageService.setPersonalGoals(updated);
      queryClient.setQueryData(["goals", "personal", userId], updated);

      logger.info("Goal created", { goalId: newGoal.id, title: newGoal.title });
      return newGoal;
    },
  });

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: async ({
      goalId,
      updates,
    }: {
      goalId: string;
      updates: GoalUpdate;
    }) => {
      const goalIndex = personalGoals.findIndex((g) => g.id === goalId);
      if (goalIndex === -1) throw new Error("Goal not found");

      const updatedGoal: EnhancedGoal = {
        ...personalGoals[goalIndex],
        ...updates,
      };
      const updated = [...personalGoals];
      updated[goalIndex] = updatedGoal;

      GoalStorageService.setPersonalGoals(updated);
      queryClient.setQueryData(["goals", "personal", userId], updated);

      logger.info("Goal updated", { goalId, updates });
      return updatedGoal;
    },
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const updated = personalGoals.filter((g) => g.id !== goalId);
      GoalStorageService.setPersonalGoals(updated);
      queryClient.setQueryData(["goals", "personal", userId], updated);

      logger.info("Goal deleted", { goalId });
    },
  });

  return {
    createGoalMutation,
    updateGoalMutation,
    deleteGoalMutation,
  };
};
