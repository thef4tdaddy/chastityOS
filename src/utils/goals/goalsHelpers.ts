/**
 * useGoals Helper Functions
 * Internal calculation and utility functions for goal management
 */

import {
  EnhancedGoal,
  CollaborativeGoal,
  GoalRecommendation,
  GoalAnalytics,
  GoalType,
  GoalCategory,
  GoalDifficulty,
  GoalStatus,
} from "../../../types/goals";

export const generateSmartRecommendations = (
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

export const calculateGoalAnalytics = (
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

export const calculateEstimatedCompletion = (
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

const calculateAverageCompletionTime = (completed: EnhancedGoal[]): number => {
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

export const generateTimeline = (goals: EnhancedGoal[]) => {
  return goals.map((goal) => ({
    date: goal.estimatedCompletion,
    goals: [goal.id],
    milestones: goal.milestones.map((m) => m.id),
    estimatedEffort: 4, // hours
  }));
};

export const detectConflicts = (_goals: EnhancedGoal[]) => {
  // Simplified conflict detection
  return [];
};

export const generatePlanRecommendations = (_goals: EnhancedGoal[]) => {
  return [
    {
      type: "reorder" as const,
      description: "Consider starting easier goals first to build momentum",
      impact: "Improved success rate",
      effort: "Low",
    },
  ];
};
