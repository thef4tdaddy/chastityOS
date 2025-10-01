/**
 * useGoals Hook - Enhanced Goal System
 *
 * Advanced goal system with AI recommendations, collaborative goals, and
 * comprehensive progress analytics.
 */

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  EnhancedGoal,
  CollaborativeGoal,
  GoalRecommendation,
  GoalAnalytics,
  GoalTemplate,
  CreateGoalRequest,
  GoalUpdate,
  OptimizedGoalPlan,
  CollaborationInvite,
  GoalInsights,
  GoalPredictions,
  CompletionTrends,
  GoalType,
  GoalCategory,
  GoalDifficulty,
  GoalStatus,
} from "../../types/goals";
import { logger } from "../../utils/logging";
import {
  getGoalInsights,
  getPredictiveAnalytics as getPredictiveAnalyticsHelper,
  getCompletionTrends as getCompletionTrendsHelper,
} from "../../utils/goalsHelpers";
import { GoalStorageService } from "../../services/goalStorage";

// Enhanced goal state

import type * as _Types from "./types/Goals";
export type * from "./types/Goals";
import { DEFAULT_TEMPLATES } from "./types/Goals";

// Complex goal management hook with multiple goal types and collaborative features
// eslint-disable-next-line max-statements
export const useGoals = (userId?: string, relationshipId?: string) => {
  const queryClient = useQueryClient();

  // Get personal goals
  const { data: personalGoals = [] } = useQuery<EnhancedGoal[]>({
    queryKey: ["goals", "personal", userId],
    queryFn: () => {
      return GoalStorageService.getPersonalGoals<EnhancedGoal>();
    },
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
  });

  // Get collaborative goals
  const { data: collaborativeGoals = [] } = useQuery<CollaborativeGoal[]>({
    queryKey: ["goals", "collaborative", userId, relationshipId],
    queryFn: () => {
      return GoalStorageService.getCollaborativeGoals<CollaborativeGoal>();
    },
    enabled: Boolean(userId) && Boolean(relationshipId),
    staleTime: 30 * 1000,
  });

  // Get goal templates
  const { data: goalTemplates = DEFAULT_TEMPLATES } = useQuery<GoalTemplate[]>({
    queryKey: ["goals", "templates"],
    queryFn: () => {
      const stored = GoalStorageService.getGoalTemplates<GoalTemplate>();
      return stored.length > 0
        ? [...DEFAULT_TEMPLATES, ...stored]
        : DEFAULT_TEMPLATES;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Get AI recommendations
  const { data: recommendedGoals = [] } = useQuery<GoalRecommendation[]>({
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

  // Get goal analytics
  const { data: goalAnalytics } = useQuery<GoalAnalytics>({
    queryKey: ["goals", "analytics", userId],
    queryFn: () => calculateGoalAnalytics(personalGoals, collaborativeGoals),
    enabled:
      Boolean(userId) &&
      (personalGoals.length > 0 || collaborativeGoals.length > 0),
    staleTime: 5 * 60 * 1000,
  });

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

  // Generate goal from prompt mutation
  const generateGoalFromPromptMutation = useMutation({
    mutationFn: async (prompt: string) => {
      logger.info("Generating goal from prompt", { prompt });

      // Simulate AI processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const aiGoal: EnhancedGoal = {
        id: `ai-goal-${Date.now()}`,
        type: GoalType.DURATION,
        category: GoalCategory.CHASTITY,
        title: "AI-Generated Chastity Goal",
        description: `Generated from: "${prompt}"`,
        target: {
          type: "duration",
          value: 14,
          unit: "days",
          description: "14 days of commitment",
        },
        progress: {
          current: 0,
          target: 14,
          percentage: 0,
          status: GoalStatus.ACTIVE,
          milestones: [],
          lastUpdated: new Date(),
        },
        milestones: [
          {
            id: "ai-milestone-1",
            name: "First Week",
            description: "Complete 7 days",
            target: 7,
            achieved: false,
          },
          {
            id: "ai-milestone-2",
            name: "Final Goal",
            description: "Complete 14 days",
            target: 14,
            achieved: false,
          },
        ],
        aiGenerated: true,
        difficulty: GoalDifficulty.MEDIUM,
        estimatedCompletion: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        tags: ["ai-generated"],
        isPublic: false,
      };

      return aiGoal;
    },
  });

  // Optimize goal plan mutation
  const optimizeGoalPlanMutation = useMutation({
    mutationFn: async (goalIds: string[]) => {
      const goalsToOptimize = personalGoals.filter((g) =>
        goalIds.includes(g.id),
      );

      // Simulate optimization processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const optimizedPlan: OptimizedGoalPlan = {
        goals: goalsToOptimize,
        timeline: generateTimeline(goalsToOptimize),
        conflicts: detectConflicts(goalsToOptimize),
        recommendations: generatePlanRecommendations(goalsToOptimize),
        estimatedCompletion: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      };

      return optimizedPlan;
    },
  });

  // Share goal mutation
  const shareGoalMutation = useMutation({
    mutationFn: async ({
      goalId,
      targetUserId,
    }: {
      goalId: string;
      targetUserId: string;
    }) => {
      logger.info("Sharing goal", { goalId, targetUserId });
      // In a real implementation, this would create a sharing record
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
  });

  // Invite collaborator mutation
  const inviteCollaboratorMutation = useMutation({
    mutationFn: async ({
      goalId,
      targetUserId,
    }: {
      goalId: string;
      targetUserId: string;
    }) => {
      const invite: CollaborationInvite = {
        id: `invite-${Date.now()}`,
        goalId,
        inviterId: userId!,
        inviteeId: targetUserId,
        permissions: {
          canEdit: false,
          canDelete: false,
          canInviteOthers: false,
          canViewProgress: true,
          canAddMilestones: false,
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: "pending",
      };

      logger.info("Collaboration invite sent", {
        inviteId: invite.id,
        goalId,
        targetUserId,
      });
      return invite;
    },
  });

  // Helper functions
  const generateSmartRecommendations = (
    personal: EnhancedGoal[],
    _collaborative: CollaborativeGoal[],
  ): GoalRecommendation[] => {
    const recommendations: GoalRecommendation[] = [];

    // Analyze completed goals to suggest similar ones
    const completedGoals = personal.filter(
      (g) => g.progress.status === GoalStatus.COMPLETED,
    );
    const activeCategories = new Set(personal.map((g) => g.category));

    // Suggest goals in successful categories
    completedGoals.forEach((goal) => {
      if (Math.random() > 0.7) {
        // 30% chance to recommend
        recommendations.push({
          id: `rec-${Date.now()}-${Math.random()}`,
          type: goal.type,
          category: goal.category,
          title: `Advanced ${goal.category} Challenge`,
          description: `Based on your success with "${goal.title}"`,
          difficulty:
            goal.difficulty === GoalDifficulty.EASY
              ? GoalDifficulty.MEDIUM
              : GoalDifficulty.HARD,
          estimatedDuration: 30,
          reasoning: `You successfully completed similar goals in the ${goal.category} category`,
          confidence: 0.8,
          similarGoals: [goal.id],
          successRate: 0.75,
        });
      }
    });

    // Suggest unexplored categories
    const allCategories = Object.values(GoalCategory);
    const unexploredCategories = allCategories.filter(
      (cat) => !activeCategories.has(cat),
    );

    unexploredCategories.forEach((category) => {
      if (Math.random() > 0.8) {
        // 20% chance
        recommendations.push({
          id: `exp-${Date.now()}-${Math.random()}`,
          type: GoalType.MILESTONE,
          category,
          title: `Explore ${category}`,
          description: `Try something new in the ${category} category`,
          difficulty: GoalDifficulty.EASY,
          estimatedDuration: 14,
          reasoning: `Diversifying goal categories can improve overall success`,
          confidence: 0.6,
          similarGoals: [],
          successRate: 0.65,
        });
      }
    });

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  };

  const calculateGoalAnalytics = (
    personal: EnhancedGoal[],
    collaborative: CollaborativeGoal[],
  ): GoalAnalytics => {
    const allGoals = [...personal, ...collaborative];
    const completed = allGoals.filter(
      (g) => g.progress.status === GoalStatus.COMPLETED,
    );
    const active = allGoals.filter(
      (g) => g.progress.status === GoalStatus.ACTIVE,
    );

    const categoryDistribution = Object.values(GoalCategory).reduce(
      (acc, cat) => {
        acc[cat] = allGoals.filter((g) => g.category === cat).length;
        return acc;
      },
      {} as Record<GoalCategory, number>,
    );

    const difficultyDistribution = Object.values(GoalDifficulty).reduce(
      (acc, diff) => {
        acc[diff] = allGoals.filter((g) => g.difficulty === diff).length;
        return acc;
      },
      {} as Record<GoalDifficulty, number>,
    );

    return {
      totalGoals: allGoals.length,
      completedGoals: completed.length,
      activeGoals: active.length,
      completionRate:
        allGoals.length > 0 ? (completed.length / allGoals.length) * 100 : 0,
      averageCompletionTime: calculateAverageCompletionTime(completed),
      categoryDistribution,
      difficultyDistribution,
      monthlyProgress: generateMonthlyProgress(allGoals),
      streaks: calculateStreaks(completed),
    };
  };

  const calculateEstimatedCompletion = (
    difficulty: GoalDifficulty,
    target: { value?: number; unit?: string },
  ): Date => {
    const baseDays = target.value || 30;
    const multiplier = {
      [GoalDifficulty.EASY]: 1,
      [GoalDifficulty.MEDIUM]: 1.5,
      [GoalDifficulty.HARD]: 2,
      [GoalDifficulty.EXTREME]: 3,
    };

    return new Date(
      Date.now() + baseDays * multiplier[difficulty] * 24 * 60 * 60 * 1000,
    );
  };

  const calculateAverageCompletionTime = (
    completed: EnhancedGoal[],
  ): number => {
    if (completed.length === 0) return 0;

    const totalDays = completed.reduce((acc, goal) => {
      if (goal.completedAt && goal.startedAt) {
        return (
          acc +
          (goal.completedAt.getTime() - goal.startedAt.getTime()) /
            (24 * 60 * 60 * 1000)
        );
      }
      return acc;
    }, 0);

    return totalDays / completed.length;
  };

  const generateMonthlyProgress = (_goals: EnhancedGoal[]) => {
    // Simplified monthly progress calculation
    return Array.from({ length: 6 }, (_, i) => ({
      month: new Date(
        Date.now() - i * 30 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString("en-US", { month: "short" }),
      goalsStarted: Math.floor(Math.random() * 5),
      goalsCompleted: Math.floor(Math.random() * 3),
      totalProgress: Math.floor(Math.random() * 100),
    }));
  };

  const calculateStreaks = (_completed: EnhancedGoal[]) => {
    return Object.values(GoalCategory).map((category) => ({
      category,
      currentStreak: Math.floor(Math.random() * 10),
      longestStreak: Math.floor(Math.random() * 20),
      lastGoalCompleted: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      ),
    }));
  };

  const generateTimeline = (goals: EnhancedGoal[]) => {
    return goals.map((goal) => ({
      date: goal.estimatedCompletion,
      goals: [goal.id],
      milestones: goal.milestones.map((m) => m.id),
      estimatedEffort: 4, // hours
    }));
  };

  const detectConflicts = (_goals: EnhancedGoal[]) => {
    // Simplified conflict detection
    return [];
  };

  const generatePlanRecommendations = (_goals: EnhancedGoal[]) => {
    return [
      {
        type: "reorder" as const,
        description: "Consider starting easier goals first to build momentum",
        impact: "Improved success rate",
        effort: "Low",
      },
    ];
  };

  // Analytics functions using helpers
  const getGoalInsightsCallback = useCallback(
    (): GoalInsights => getGoalInsights(),
    [],
  );

  const getPredictiveAnalyticsCallback = useCallback(
    (): GoalPredictions => getPredictiveAnalyticsHelper(personalGoals),
    [personalGoals],
  );

  const getCompletionTrendsCallback = useCallback(
    (): CompletionTrends => getCompletionTrendsHelper(),
    [],
  );

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
    getGoalInsights: getGoalInsightsCallback,
    getPredictiveAnalytics: getPredictiveAnalyticsCallback,
    getCompletionTrends: getCompletionTrendsCallback,

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
