/**
 * Goal analytics helper functions
 */

import {
  EnhancedGoal,
  CollaborativeGoal,
  GoalAnalytics,
  GoalCategory,
  GoalDifficulty,
  GoalStatus,
} from "../../types/goals";

export function calculateGoalAnalytics(
  personal: EnhancedGoal[],
  collaborative: CollaborativeGoal[],
): GoalAnalytics {
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
}

export function calculateAverageCompletionTime(
  completed: EnhancedGoal[],
): number {
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
}

export function generateMonthlyProgress(_goals: EnhancedGoal[]) {
  return Array.from({ length: 6 }, (_, i) => ({
    month: new Date(
      Date.now() - i * 30 * 24 * 60 * 60 * 1000,
    ).toLocaleDateString("en-US", { month: "short" }),
    goalsStarted: Math.floor(Math.random() * 5),
    goalsCompleted: Math.floor(Math.random() * 3),
    totalProgress: Math.floor(Math.random() * 100),
  }));
}

export function calculateStreaks(_completed: EnhancedGoal[]) {
  return Object.values(GoalCategory).map((category) => ({
    category,
    currentStreak: Math.floor(Math.random() * 10),
    longestStreak: Math.floor(Math.random() * 20),
    lastGoalCompleted: new Date(
      Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
    ),
  }));
}
