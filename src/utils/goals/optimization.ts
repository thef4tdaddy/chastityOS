/**
 * Goal optimization helper functions
 */

import { EnhancedGoal, GoalDifficulty } from "../../types/goals";

export function calculateEstimatedCompletion(
  difficulty: GoalDifficulty,
  target: { value?: number; unit?: string },
): Date {
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
}

export function generateTimeline(goals: EnhancedGoal[]) {
  return goals.map((goal) => ({
    date: goal.estimatedCompletion,
    goals: [goal.id],
    milestones: goal.milestones.map((m) => m.id),
    estimatedEffort: 4,
  }));
}

export function detectConflicts(_goals: EnhancedGoal[]) {
  return [];
}

export function generatePlanRecommendations(_goals: EnhancedGoal[]) {
  return [
    {
      type: "reorder" as const,
      description: "Consider starting easier goals first to build momentum",
      impact: "Improved success rate",
      effort: "Low",
    },
  ];
}
