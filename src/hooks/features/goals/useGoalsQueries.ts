/**
 * useGoals Query Operations
 * Query hooks for fetching goals, templates, recommendations, and analytics
 */

import { useQuery } from "@tanstack/react-query";
import {
  EnhancedGoal,
  CollaborativeGoal,
  GoalRecommendation,
  GoalAnalytics,
  GoalTemplate,
} from "../../../types/goals";
import { GoalStorageService } from "../../../services/goalStorage";
import { DEFAULT_TEMPLATES } from "../goals-utils";
import {
  generateSmartRecommendations,
  calculateGoalAnalytics,
} from "../../../utils/goals/goalsHelpers";

interface UseGoalsQueriesOptions {
  userId?: string;
  relationshipId?: string;
}

export const useGoalsQueries = (options: UseGoalsQueriesOptions) => {
  const { userId, relationshipId } = options;

  // Get personal goals
  const personalGoalsQuery = useQuery<EnhancedGoal[]>({
    queryKey: ["goals", "personal", userId],
    queryFn: () => {
      return GoalStorageService.getPersonalGoals<EnhancedGoal>();
    },
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
  });

  const personalGoals = personalGoalsQuery.data || [];

  // Get collaborative goals
  const collaborativeGoalsQuery = useQuery<CollaborativeGoal[]>({
    queryKey: ["goals", "collaborative", userId, relationshipId],
    queryFn: () => {
      return GoalStorageService.getCollaborativeGoals<CollaborativeGoal>();
    },
    enabled: Boolean(userId) && Boolean(relationshipId),
    staleTime: 30 * 1000,
  });

  const collaborativeGoals = collaborativeGoalsQuery.data || [];

  // Get goal templates
  const goalTemplatesQuery = useQuery<GoalTemplate[]>({
    queryKey: ["goals", "templates"],
    queryFn: () => {
      const stored = GoalStorageService.getGoalTemplates<GoalTemplate>();
      return stored.length > 0
        ? [...DEFAULT_TEMPLATES, ...stored]
        : DEFAULT_TEMPLATES;
    },
    staleTime: 5 * 60 * 1000,
  });

  const goalTemplates = goalTemplatesQuery.data || DEFAULT_TEMPLATES;

  // Get AI recommendations
  const recommendationsQuery = useQuery<GoalRecommendation[]>({
    queryKey: ["goals", "recommendations", userId],
    queryFn: async () => {
      // Simulate AI recommendation generation
      await new Promise((resolve) => setTimeout(resolve, 800));

      return generateSmartRecommendations(personalGoals, collaborativeGoals);
    },
    enabled:
      Boolean(userId) &&
      (personalGoals.length > 0 || collaborativeGoals.length > 0),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 30 * 60 * 1000, // 30 minutes
  });

  const recommendedGoals = recommendationsQuery.data || [];

  // Get goal analytics
  const analyticsQuery = useQuery<GoalAnalytics>({
    queryKey: ["goals", "analytics", userId],
    queryFn: () => calculateGoalAnalytics(personalGoals, collaborativeGoals),
    enabled:
      Boolean(userId) &&
      (personalGoals.length > 0 || collaborativeGoals.length > 0),
    staleTime: 5 * 60 * 1000,
  });

  const goalAnalytics = analyticsQuery.data;

  return {
    personalGoals,
    collaborativeGoals,
    recommendedGoals,
    goalAnalytics,
    goalTemplates,
  };
};
