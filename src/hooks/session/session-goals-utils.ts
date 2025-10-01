/**
 * Session Goals Utility Functions
 * Helper functions extracted from useSessionGoals
 */

import type {
  SessionGoal,
  GoalProgress,
  GoalDifficulty,
} from "./types/SessionGoals";

/**
 * Calculate completion rate based on goal progress
 */
export function calculateCompletionRate(progress: GoalProgress[]): number {
  if (progress.length === 0) return 0;

  const completedGoals = progress.filter(
    (p) => p.progressPercentage >= 100,
  ).length;
  return Math.floor((completedGoals / progress.length) * 100);
}

/**
 * Calculate overall difficulty based on active goals
 */
export function calculateOverallDifficulty(
  goals: SessionGoal[],
): GoalDifficulty {
  if (goals.length === 0) return "beginner";

  // Simple difficulty calculation based on goal types and targets
  const highPriorityGoals = goals.filter(
    (g) => g.priority === "high" || g.priority === "critical",
  ).length;
  const complexGoals = goals.filter(
    (g) => g.type === "behavioral" || g.type === "performance",
  ).length;

  if (highPriorityGoals > 2 || complexGoals > 1) return "expert";
  if (highPriorityGoals > 1 || complexGoals > 0) return "advanced";
  if (goals.length > 3) return "intermediate";

  return "beginner";
}

/**
 * Predict completion time based on current progress velocity
 */
export function predictCompletionTime(
  goals: SessionGoal[],
  progress: GoalProgress[],
): number {
  if (goals.length === 0 || progress.length === 0) return 0;

  // Calculate estimated completion time based on current progress velocity
  let totalEstimatedTime = 0;

  for (const goalProgress of progress) {
    if (goalProgress.progressPercentage >= 100) continue;

    const remainingProgress = 100 - goalProgress.progressPercentage;
    const velocity = goalProgress.velocity || 1; // Progress per hour
    const estimatedHours = remainingProgress / velocity;

    totalEstimatedTime = Math.max(totalEstimatedTime, estimatedHours);
  }

  return Math.floor(totalEstimatedTime * 60); // Return in minutes
}

/**
 * Calculate goal progress from a session goal
 */
export function calculateGoalProgress(goal: SessionGoal): GoalProgress {
  return {
    goalId: goal.id,
    currentValue: goal.current,
    targetValue: goal.target.value,
    progressPercentage: goal.progress,
    milestones: [], // Would be populated with actual milestones
    lastUpdated: new Date(),
    velocity: 1, // Would be calculated from historical data
    estimatedCompletion: goal.deadline,
  };
}

/**
 * Check if a goal is completed based on its target comparison type
 */
export function checkIfGoalCompleted(
  goal: SessionGoal,
  progress: GoalProgress,
): boolean {
  switch (goal.target.comparison) {
    case "minimum":
      return progress.currentValue >= goal.target.value;
    case "exact":
      return progress.currentValue === goal.target.value;
    case "maximum":
      return progress.currentValue <= goal.target.value;
    case "range":
      return (
        progress.currentValue >= goal.target.value &&
        progress.currentValue <= (goal.target.rangeMax || goal.target.value)
      );
    default:
      return false;
  }
}
