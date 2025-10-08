/**
 * Helper functions for goal analytics and insights
 */
import type {
  GoalInsights,
  GoalPredictions,
  CompletionTrends,
  GoalStatus,
  EnhancedGoal,
} from "../types/goals";
import { GoalDifficulty, GoalCategory } from "../types/goals";

export function getGoalInsights(): GoalInsights {
  return {
    motivationFactors: [
      "Progress tracking",
      "Milestone rewards",
      "Social support",
    ],
    successPatterns: [
      "Regular check-ins",
      "Realistic targets",
      "Clear milestones",
    ],
    failureReasons: [
      "Unrealistic expectations",
      "Lack of support",
      "Poor planning",
    ],
    optimalDifficulty: "medium" as GoalDifficulty,
    bestCategories: ["chastity" as GoalCategory, "behavior" as GoalCategory],
    timeToComplete: {
      easy: 14,
      medium: 30,
      hard: 60,
      extreme: 120,
    },
  };
}

export function getPredictiveAnalytics(
  personalGoals: EnhancedGoal[],
): GoalPredictions {
  const activeGoals = personalGoals.filter(
    (g) => g.progress.status === ("active" as GoalStatus),
  );

  return {
    likelyToComplete: activeGoals.filter((g) => g.progress.percentage > 70),
    atRisk: activeGoals.filter((g) => g.progress.percentage < 30),
    completionProbabilities: activeGoals.reduce(
      (acc, goal) => {
        acc[goal.id] = Math.random() * 0.5 + 0.5; // 50-100% probability
        return acc;
      },
      {} as Record<string, number>,
    ),
    suggestedAdjustments: [],
  };
}

export function getCompletionTrends(): CompletionTrends {
  return {
    weeklyCompletion: Array.from({ length: 12 }, () =>
      Math.floor(Math.random() * 10),
    ),
    monthlyCompletion: Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 15),
    ),
    categoryTrends: Object.values(GoalCategory).reduce(
      (acc, cat) => {
        acc[cat] = Array.from({ length: 6 }, () =>
          Math.floor(Math.random() * 5),
        );
        return acc;
      },
      {} as Record<GoalCategory, number[]>,
    ),
    difficultyTrends: Object.values(GoalDifficulty).reduce(
      (acc, diff) => {
        acc[diff] = Array.from({ length: 6 }, () =>
          Math.floor(Math.random() * 3),
        );
        return acc;
      },
      {} as Record<GoalDifficulty, number[]>,
    ),
    peakPerformancePeriods: ["Monday mornings", "Weekend evenings"],
  };
}
