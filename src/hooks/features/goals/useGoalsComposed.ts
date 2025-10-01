/**
 * useGoals Hook - Enhanced Goal System (Composed)
 *
 * Advanced goal system with AI recommendations, collaborative goals, and
 * comprehensive progress analytics.
 */

import { GoalStatus } from "../../../types/goals";
import { logger } from "../../../utils/logging";
import { useGoalsQueries } from "./useGoalsQueries";
import { useGoalsMutations } from "./useGoalsMutations";
import { useGoalsAnalytics } from "./useGoalsAnalytics";

export const useGoals = (userId?: string, relationshipId?: string) => {
  // Query operations
  const {
    personalGoals,
    collaborativeGoals,
    recommendedGoals,
    goalAnalytics,
    goalTemplates,
  } = useGoalsQueries({ userId, relationshipId });

  // Mutation operations
  const {
    createGoalMutation,
    updateGoalMutation,
    deleteGoalMutation,
    generateGoalFromPromptMutation,
    optimizeGoalPlanMutation,
    shareGoalMutation,
    inviteCollaboratorMutation,
  } = useGoalsMutations({ userId, personalGoals });

  // Analytics operations
  const { getGoalInsights, getPredictiveAnalytics, getCompletionTrends } =
    useGoalsAnalytics({ personalGoals });

  return {
    // Goal state
    personalGoals,
    collaborativeGoals,
    recommendedGoals,
    goalAnalytics,
    goalTemplates,

    // Goal management
    createGoal: createGoalMutation.mutate,
    updateGoal: updateGoalMutation.mutate,
    deleteGoal: deleteGoalMutation.mutate,

    // AI features
    getSmartRecommendations: () => recommendedGoals,
    generateGoalFromPrompt: generateGoalFromPromptMutation.mutate,
    optimizeGoalPlan: optimizeGoalPlanMutation.mutate,

    // Collaboration
    shareGoal: shareGoalMutation.mutate,
    inviteCollaborator: inviteCollaboratorMutation.mutate,
    acceptCollaboration: async (inviteId: string) => {
      logger.info("Collaboration accepted", { inviteId });
    },

    // Analytics
    getGoalInsights,
    getPredictiveAnalytics,
    getCompletionTrends,

    // Loading states
    isCreating: createGoalMutation.isPending,
    isUpdating: updateGoalMutation.isPending,
    isDeleting: deleteGoalMutation.isPending,
    isGenerating: generateGoalFromPromptMutation.isPending,
    isOptimizing: optimizeGoalPlanMutation.isPending,

    // Computed properties
    activeGoalsCount: personalGoals.filter(
      (g) => g.progress.status === GoalStatus.ACTIVE,
    ).length,
    completionRate: goalAnalytics ? goalAnalytics.completionRate : 0,
    averageCompletionTime: goalAnalytics
      ? goalAnalytics.averageCompletionTime
      : 0,
    hasCollaborativeGoals: collaborativeGoals.length > 0,
    needsAttention: personalGoals.filter(
      (g) => g.progress.status === GoalStatus.BEHIND,
    ).length,

    // Results
    lastOptimization: optimizeGoalPlanMutation.data,
    lastGeneratedGoal: generateGoalFromPromptMutation.data,

    // Errors
    error:
      createGoalMutation.error ||
      updateGoalMutation.error ||
      deleteGoalMutation.error,
  };
};
