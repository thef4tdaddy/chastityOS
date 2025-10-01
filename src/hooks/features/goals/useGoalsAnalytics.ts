/**
 * useGoals Analytics Operations
 * Analytics and insights for goal tracking
 */

import { useCallback } from "react";
import {
  EnhancedGoal,
  GoalInsights,
  GoalPredictions,
  CompletionTrends,
} from "../../../types/goals";
import {
  getGoalInsights,
  getPredictiveAnalytics as getPredictiveAnalyticsHelper,
  getCompletionTrends as getCompletionTrendsHelper,
} from "../../../utils/goalsHelpers";

interface UseGoalsAnalyticsOptions {
  personalGoals: EnhancedGoal[];
}

export const useGoalsAnalytics = (options: UseGoalsAnalyticsOptions) => {
  const { personalGoals } = options;

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
    getGoalInsights: getGoalInsightsCallback,
    getPredictiveAnalytics: getPredictiveAnalyticsCallback,
    getCompletionTrends: getCompletionTrendsCallback,
  };
};
