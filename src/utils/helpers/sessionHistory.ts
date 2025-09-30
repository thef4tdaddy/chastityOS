/**
 * Session History Helper Functions
 * Extracted from useSessionHistory hook for better code organization
 */
import type {
  HistoricalSession,
  TrendData,
} from "../../hooks/session/types/sessionHistory";

// ==================== HELPER FUNCTIONS ====================

export function createEmptyTrendData(): TrendData {
  return {
    direction: "stable",
    changePercentage: 0,
    confidence: 0,
    timeframe: "week",
    dataPoints: [],
  };
}

export function calculateOverallCompletionRate(
  sessions: HistoricalSession[],
): number {
  if (sessions.length === 0) return 0;

  const totalGoals = sessions.reduce(
    (sum, session) => sum + session.goals.length,
    0,
  );
  const completedGoals = sessions.reduce(
    (sum, session) =>
      sum + session.goals.filter((goal) => goal.completed).length,
    0,
  );

  return totalGoals > 0 ? Math.floor((completedGoals / totalGoals) * 100) : 0;
}

export function calculateLongestStreak(sessions: HistoricalSession[]): number {
  if (sessions.length === 0) return 0;

  // Sort sessions by date
  const sortedSessions = [...sessions].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  );

  let currentStreak = 1;
  let longestStreak = 1;

  for (let i = 1; i < sortedSessions.length; i++) {
    const prevDate = new Date(sortedSessions[i - 1].startTime);
    const currentDate = new Date(sortedSessions[i].startTime);

    // Check if sessions are on consecutive days
    const dayDiff = Math.floor(
      (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (dayDiff === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else if (dayDiff > 1) {
      currentStreak = 1;
    }
  }

  return longestStreak;
}

export function calculatePauseFrequency(sessions: HistoricalSession[]): number {
  if (sessions.length === 0) return 0;

  const totalPauses = sessions.reduce(
    (sum, session) => sum + session.pauseEvents.length,
    0,
  );

  return totalPauses / sessions.length;
}

export function calculateImprovementTrend(
  sessions: HistoricalSession[],
): "improving" | "stable" | "declining" {
  if (sessions.length < 2) return "stable";

  // Compare recent sessions with older ones
  const halfPoint = Math.floor(sessions.length / 2);
  const recentSessions = sessions.slice(0, halfPoint);
  const olderSessions = sessions.slice(halfPoint);

  const recentAvg =
    recentSessions.reduce(
      (sum, session) => sum + session.effectiveDuration,
      0,
    ) / recentSessions.length;
  const olderAvg =
    olderSessions.reduce((sum, session) => sum + session.effectiveDuration, 0) /
    olderSessions.length;

  const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;

  if (changePercent > 10) return "improving";
  if (changePercent < -10) return "declining";
  return "stable";
}

export function calculateConsistencyScore(
  sessions: HistoricalSession[],
): number {
  if (sessions.length === 0) return 0;

  // Calculate based on regularity of sessions and completion rates
  const avgCompletionRate = calculateOverallCompletionRate(sessions);
  const streak = calculateLongestStreak(sessions);

  // Weight completion rate (60%) and streak (40%)
  const completionScore = avgCompletionRate * 0.6;
  const streakScore = Math.min(streak * 10, 100) * 0.4;

  return Math.floor(completionScore + streakScore);
}

export function calculateSessionLengthTrend(
  sessions: HistoricalSession[],
): TrendData {
  // Implementation would analyze session length over time
  return createEmptyTrendData();
}

export function calculateGoalCompletionTrend(
  sessions: HistoricalSession[],
): TrendData {
  return createEmptyTrendData();
}

export function calculateConsistencyTrend(
  sessions: HistoricalSession[],
): TrendData {
  // Implementation would analyze consistency metrics over time
  return createEmptyTrendData();
}

export function calculatePauseFrequencyTrend(
  sessions: HistoricalSession[],
): TrendData {
  return createEmptyTrendData();
}

export function calculateOverallProgressTrend(
  sessions: HistoricalSession[],
): TrendData {
  // Implementation would analyze overall progress metrics over time
  return createEmptyTrendData();
}
