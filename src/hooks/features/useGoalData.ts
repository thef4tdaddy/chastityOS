/**
 * Goal data hook
 * Handles all goal-related data fetching queries
 */

import { useQuery } from "@tanstack/react-query";
import {
  EnhancedGoal,
  CollaborativeGoal,
  GoalRecommendation,
  GoalAnalytics,
  GoalTemplate,
} from "../../types/goals";
import { GoalStorageService } from "../../services/goalStorage";
import { DEFAULT_TEMPLATES } from "@/utils/goals/common";

export interface UseGoalDataOptions {
  userId?: string;
  relationshipId?: string;
  personalGoals?: EnhancedGoal[];
  collaborativeGoals?: CollaborativeGoal[];
  generateRecommendations?: (
    personal: EnhancedGoal[],
    collaborative: CollaborativeGoal[],
  ) => GoalRecommendation[];
  calculateAnalytics?: (
    personal: EnhancedGoal[],
    collaborative: CollaborativeGoal[],
  ) => GoalAnalytics;
}

export function useGoalData(options: UseGoalDataOptions) {
  const {
    userId,
    relationshipId,
    personalGoals,
    collaborativeGoals,
    generateRecommendations,
    calculateAnalytics,
  } = options;
  // Get personal goals
  const personalGoalsQuery = useQuery<EnhancedGoal[]>({
    queryKey: ["goals", "personal", userId],
    queryFn: () => {
      return GoalStorageService.getPersonalGoals<EnhancedGoal>();
    },
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
  });

  // Get collaborative goals
  const collaborativeGoalsQuery = useQuery<CollaborativeGoal[]>({
    queryKey: ["goals", "collaborative", userId, relationshipId],
    queryFn: () => {
      return GoalStorageService.getCollaborativeGoals<CollaborativeGoal>();
    },
    enabled: Boolean(userId) && Boolean(relationshipId),
    staleTime: 30 * 1000,
  });

  // Get goal templates
  const templatesQuery = useQuery<GoalTemplate[]>({
    queryKey: ["goals", "templates"],
    queryFn: () => {
      const stored = GoalStorageService.getGoalTemplates<GoalTemplate>();
      return stored.length > 0
        ? [...DEFAULT_TEMPLATES, ...stored]
        : DEFAULT_TEMPLATES;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Use provided data or fallback to query data
  const finalPersonalGoals = personalGoals || personalGoalsQuery.data || [];
  const finalCollaborativeGoals =
    collaborativeGoals || collaborativeGoalsQuery.data || [];

  // Get AI recommendations
  const recommendationsQuery = useQuery<GoalRecommendation[]>({
    queryKey: ["goals", "recommendations", userId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return generateRecommendations
        ? generateRecommendations(finalPersonalGoals, finalCollaborativeGoals)
        : [];
    },
    enabled:
      Boolean(userId) &&
      (finalPersonalGoals.length > 0 || finalCollaborativeGoals.length > 0) &&
      Boolean(generateRecommendations),
    staleTime: 10 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
  });

  // Get goal analytics
  const analyticsQuery = useQuery<GoalAnalytics | undefined>({
    queryKey: ["goals", "analytics", userId],
    queryFn: () =>
      calculateAnalytics
        ? calculateAnalytics(finalPersonalGoals, finalCollaborativeGoals)
        : undefined,
    enabled:
      Boolean(userId) &&
      (finalPersonalGoals.length > 0 || finalCollaborativeGoals.length > 0) &&
      Boolean(calculateAnalytics),
    staleTime: 5 * 60 * 1000,
  });

  return {
    personalGoals: finalPersonalGoals,
    collaborativeGoals: finalCollaborativeGoals,
    goalTemplates: templatesQuery.data || DEFAULT_TEMPLATES,
    recommendedGoals: recommendationsQuery.data || [],
    goalAnalytics: analyticsQuery.data,
  };
}
