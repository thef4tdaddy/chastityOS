/**
 * Type Definitions for useGoals
 * Extracted for better code organization
 */
import type {
  EnhancedGoal,
  CollaborativeGoal,
  GoalRecommendation,
  GoalAnalytics,
  GoalTemplate,
} from "../../../types/goals";

export interface EnhancedGoalState {
  personalGoals: EnhancedGoal[];
  collaborativeGoals: CollaborativeGoal[];
  recommendedGoals: GoalRecommendation[];
  goalAnalytics: GoalAnalytics;
  goalTemplates: GoalTemplate[];
}

// Re-export types for convenience
export type {
  EnhancedGoal,
  CollaborativeGoal,
  GoalRecommendation,
  GoalAnalytics,
  GoalTemplate,
};
