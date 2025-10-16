/**
 * useGoals Hook - Enhanced Goal System
 *
 * Advanced goal system with AI recommendations, collaborative goals, and
 * comprehensive progress analytics.
 */

import { useGoalData } from "./useGoalData";
import { useGoalMutations } from "./useGoalMutations";
import { useGoalAI } from "./useGoalAI";
import { useGoalCollaboration } from "./useGoalCollaboration";
import { useGoalAnalytics } from "./useGoalAnalytics";
import { calculateGoalAnalytics } from "../../utils/goals/analytics";
import { generateSmartRecommendations } from "../../utils/goals/recommendations";
import {
  calculateEstimatedCompletion,
  generateTimeline,
  detectConflicts,
  generatePlanRecommendations,
} from "../../utils/goals/optimization";

import type * as _Types from "./types/Goals";
export type * from "./types/Goals";

// Complex goal management hook with multiple goal types and collaborative features
export const useGoals = (userId?: string, relationshipId?: string) => {
  // Fetch all goal data
  const {
    personalGoals,
    collaborativeGoals,
    goalTemplates,
    recommendedGoals,
    goalAnalytics,
  } = useGoalData({
    userId,
    relationshipId,
    generateRecommendations: generateSmartRecommendations,
    calculateAnalytics: calculateGoalAnalytics,
  });

  // CRUD mutations
  const { createGoalMutation, updateGoalMutation, deleteGoalMutation } =
    useGoalMutations(userId, personalGoals, calculateEstimatedCompletion);

  // AI features
  const { generateGoalFromPromptMutation, optimizeGoalPlanMutation } =
    useGoalAI(
      personalGoals,
      generateTimeline,
      detectConflicts,
      generatePlanRecommendations,
    );

  // Collaboration features
  const {
    shareGoalMutation,
    inviteCollaboratorMutation,
    acceptCollaboration,
    hasCollaborativeGoals,
  } = useGoalCollaboration(userId, collaborativeGoals);

  // Analytics
  const {
    getGoalInsights,
    getPredictiveAnalytics,
    getCompletionTrends,
    activeGoalsCount,
    needsAttention,
  } = useGoalAnalytics(personalGoals);

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
    acceptCollaboration,

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
    activeGoalsCount,
    completionRate: goalAnalytics ? goalAnalytics.completionRate : 0,
    averageCompletionTime: goalAnalytics
      ? goalAnalytics.averageCompletionTime
      : 0,
    hasCollaborativeGoals,
    needsAttention,

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
