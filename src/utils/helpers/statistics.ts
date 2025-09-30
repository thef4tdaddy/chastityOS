/**
 * Statistics Helper Functions
 * Extracted from useStatistics hook for better code organization
 */
import type {
  SessionStatistics,
  GoalStatistics,
  SharedStatistics,
  TrendData,
} from "../../hooks/data/types/statistics";

// ==================== HELPER FUNCTIONS ====================

export function calculateImprovementScore(trends: TrendData[]): number {
  if (trends.length === 0) return 0;

  const improvingTrends = trends.filter(
    (t) => t.direction === "improving",
  ).length;
  return Math.floor((improvingTrends / trends.length) * 100);
}

export function calculateConsistencyRating(
  sessionStats: SessionStatistics,
): number {
  // Calculate consistency based on session frequency and completion rate
  const frequencyScore = Math.min(
    100,
    sessionStats.sessionFrequency.weekly * 20,
  );
  const completionScore = sessionStats.completionRate;

  return Math.floor((frequencyScore + completionScore) / 2);
}

export function calculateOverallProgress(goalStats: GoalStatistics): number {
  if (goalStats.totalGoals === 0) return 0;

  return Math.floor((goalStats.completedGoals / goalStats.totalGoals) * 100);
}

export function calculateKeyholderSatisfaction(
  sharedStats: SharedStatistics,
): number {
  // This would be calculated based on keyholder feedback and interaction patterns
  return 85; // Placeholder value
}
