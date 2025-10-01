/**
 * Keyholder Statistics Utilities
 * Functions for keyholder dashboard and relationship stats
 */

import type {
  KeyholderDashboardStats,
  RelationshipComparisonStats,
  SessionStatistics,
  GoalStatistics,
} from "./types/statistics";

/**
 * Generate keyholder dashboard data
 */
export function generateKeyholderDashboard(
  consistencyRating: number,
  sessionStats: SessionStatistics,
  goalStats: GoalStatistics,
): KeyholderDashboardStats {
  return {
    submissiveOverview: {
      name: "Submissive",
      consistencyScore: consistencyRating,
      improvementTrend: "improving",
      lastActiveDate: new Date(),
    },
    sessionSummary: {
      thisWeek: sessionStats.sessionsThisWeek,
      thisMonth: sessionStats.sessionsThisMonth,
      averageDuration: sessionStats.averageSessionLength,
      completionRate: sessionStats.completionRate,
    },
    goalTracking: {
      activeGoals: [],
      completionRate: goalStats.completionRate,
      upcomingDeadlines: [],
    },
    behaviorInsights: {
      strengths: [],
      areasForImprovement: [],
      recommendations: [],
    },
  };
}

/**
 * Generate relationship comparison statistics
 */
export function generateRelationshipComparison(
  sessionStats: SessionStatistics,
): RelationshipComparisonStats {
  return {
    relationshipDuration: 90, // days
    sharedSessions: sessionStats.sessionsThisMonth,
    collaborationScore: 85,
    satisfactionTrend: "improving",
    milestones: [],
  };
}
