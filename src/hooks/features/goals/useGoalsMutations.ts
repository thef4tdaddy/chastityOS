/**
 * useGoals Mutation Operations (Composed)
 * Combines CRUD, AI, and collaboration mutations
 */

import { EnhancedGoal } from "../../../types/goals";
import { useGoalCRUD } from "./useGoalCRUD";
import { useGoalAI } from "./useGoalAI";
import { useGoalCollaboration } from "./useGoalCollaboration";

interface UseGoalsMutationsOptions {
  userId?: string;
  personalGoals: EnhancedGoal[];
}

export const useGoalsMutations = (options: UseGoalsMutationsOptions) => {
  const { userId, personalGoals } = options;

  // CRUD operations
  const { createGoalMutation, updateGoalMutation, deleteGoalMutation } =
    useGoalCRUD({ userId, personalGoals });

  // AI features
  const { generateGoalFromPromptMutation, optimizeGoalPlanMutation } =
    useGoalAI({ personalGoals });

  // Collaboration features
  const { shareGoalMutation, inviteCollaboratorMutation } =
    useGoalCollaboration({ userId });

  return {
    createGoalMutation,
    updateGoalMutation,
    deleteGoalMutation,
    generateGoalFromPromptMutation,
    optimizeGoalPlanMutation,
    shareGoalMutation,
    inviteCollaboratorMutation,
  };
};
