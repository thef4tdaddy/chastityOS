/**
 * Goal Computed Values Hook
 * Provides computed/derived values for goal management
 */
import { useMemo } from "react";
import {
  calculateCompletionRate,
  calculateOverallDifficulty,
  predictCompletionTime,
} from "@/utils/goals/session";
import type { SessionGoal, GoalProgress } from "./types/SessionGoals";

interface UseGoalComputedValuesProps {
  activeGoals: SessionGoal[];
  progress: GoalProgress[];
}

export const useGoalComputedValues = ({
  activeGoals,
  progress,
}: UseGoalComputedValuesProps) => {
  const totalActiveGoals = useMemo(() => activeGoals.length, [activeGoals]);

  const completionRate = useMemo(
    () => calculateCompletionRate(progress),
    [progress],
  );

  const hasRequiredGoals = useMemo(
    () => activeGoals.some((goal) => goal.isRequired),
    [activeGoals],
  );

  const goalDifficulty = useMemo(
    () => calculateOverallDifficulty(activeGoals),
    [activeGoals],
  );

  const estimatedCompletionTime = useMemo(
    () => predictCompletionTime(activeGoals, progress),
    [activeGoals, progress],
  );

  return {
    totalActiveGoals,
    completionRate,
    hasRequiredGoals,
    goalDifficulty,
    estimatedCompletionTime,
  };
};
