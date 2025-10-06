/**
 * Goal analytics hook
 * Handles goal analytics and insights
 */

import { useCallback } from "react";
import {
  GoalInsights,
  GoalPredictions,
  CompletionTrends,
  EnhancedGoal,
  GoalStatus,
} from "../../types/goals";
import {
  getGoalInsights,
  getPredictiveAnalytics as getPredictiveAnalyticsHelper,
  getCompletionTrends as getCompletionTrendsHelper,
} from "../../utils/goalsHelpers";

export function useGoalAnalytics(personalGoals: EnhancedGoal[]) {
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

  // Computed properties
  const activeGoalsCount = personalGoals.filter(
    (g) => g.progress.status === GoalStatus.ACTIVE,
  ).length;

  const needsAttention = personalGoals.filter(
    (g) => g.progress.status === GoalStatus.BEHIND,
  ).length;

  return {
    getGoalInsights: getGoalInsightsCallback,
    getPredictiveAnalytics: getPredictiveAnalyticsCallback,
    getCompletionTrends: getCompletionTrendsCallback,
    activeGoalsCount,
    needsAttention,
  };
}
