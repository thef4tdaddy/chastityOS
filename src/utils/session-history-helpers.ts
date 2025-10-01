/**
 * Session History Helper Functions
 * Extracted helper functions for session history management
 */
import type {
  HistoricalSession,
  HistorySearchQuery,
  KeyholderHistoryView,
  KeyholderHistoryAccess,
  HistoryPrivacySettings,
  PerformanceTrends,
  HistoryTrends,
  GoalProgressHistory,
  ComparisonMetrics,
} from "./types/SessionHistory";
import { calculateOverallCompletionRate } from "../../utils/sessionHistoryHelpers";

export function getSessionsByDateRange(
  sessions: HistoricalSession[],
  start: Date,
  end: Date,
): HistoricalSession[] {
  return sessions.filter(
    (session) => session.startTime >= start && session.startTime <= end,
  );
}

export function getSessionsByGoal(
  sessions: HistoricalSession[],
  goalType: string,
): HistoricalSession[] {
  return sessions.filter((session) =>
    session.goals.some((goal) => goal.type === goalType),
  );
}

export function searchSessions(
  sessions: HistoricalSession[],
  query: HistorySearchQuery,
): HistoricalSession[] {
  let filteredSessions = [...sessions];

  if (query.dateRange) {
    filteredSessions = filteredSessions.filter(
      (session) =>
        session.startTime >= query.dateRange!.start &&
        session.startTime <= query.dateRange!.end,
    );
  }

  if (query.minDuration) {
    filteredSessions = filteredSessions.filter(
      (session) => session.effectiveDuration >= query.minDuration!,
    );
  }

  if (query.maxDuration) {
    filteredSessions = filteredSessions.filter(
      (session) => session.effectiveDuration <= query.maxDuration!,
    );
  }

  if (query.goalTypes && query.goalTypes.length > 0) {
    filteredSessions = filteredSessions.filter((session) =>
      session.goals.some((goal) => query.goalTypes!.includes(goal.type)),
    );
  }

  if (query.hasKeyholderControl !== undefined) {
    filteredSessions = filteredSessions.filter(
      (session) => session.wasKeyholderControlled === query.hasKeyholderControl,
    );
  }

  if (query.completedGoals !== undefined) {
    filteredSessions = filteredSessions.filter((session) =>
      query.completedGoals
        ? session.goals.some((goal) => goal.completed)
        : session.goals.some((goal) => !goal.completed),
    );
  }

  if (query.tags && query.tags.length > 0) {
    filteredSessions = filteredSessions.filter((session) =>
      query.tags!.some((tag) => session.tags.includes(tag)),
    );
  }

  if (query.rating) {
    filteredSessions = filteredSessions.filter(
      (session) =>
        session.rating &&
        session.rating.overall >= query.rating!.min &&
        session.rating.overall <= query.rating!.max,
    );
  }

  if (query.textSearch) {
    const searchLower = query.textSearch.toLowerCase();
    filteredSessions = filteredSessions.filter(
      (session) =>
        session.notes.toLowerCase().includes(searchLower) ||
        session.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
    );
  }

  return filteredSessions;
}

export function getKeyholderView(
  sessions: HistoricalSession[],
  keyholderAccess: KeyholderHistoryAccess,
  privacySettings: HistoryPrivacySettings,
  averageSessionLength: number,
  goalCompletionRate: number,
): KeyholderHistoryView {
  if (!keyholderAccess.hasAccess) {
    return {
      allowedSessions: [],
      summaryStats: {
        totalSessions: 0,
        averageDuration: 0,
        goalCompletionRate: 0,
        lastSessionDate: new Date(),
      },
      accessLevel: "summary",
      restrictions: ["No access granted by submissive"],
    };
  }

  const allowedSessions = sessions.map((session) => {
    const filteredSession: Partial<HistoricalSession> = {
      id: session.id,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: privacySettings.shareDuration ? session.duration : undefined,
      effectiveDuration: privacySettings.shareDuration
        ? session.effectiveDuration
        : undefined,
      goals: privacySettings.shareGoals ? session.goals : [],
      pauseEvents: privacySettings.sharePauses ? session.pauseEvents : [],
      notes: privacySettings.shareNotes ? session.notes : "",
      rating: privacySettings.shareRatings ? session.rating : undefined,
      keyholderInteractions: session.keyholderInteractions,
    };

    return filteredSession;
  });

  return {
    allowedSessions,
    summaryStats: {
      totalSessions: sessions.length,
      averageDuration: averageSessionLength,
      goalCompletionRate,
      lastSessionDate: sessions.length > 0 ? sessions[0].startTime : new Date(),
    },
    accessLevel: keyholderAccess.accessLevel,
    restrictions: [],
  };
}

export function getPerformanceTrends(
  averageSessionLength: number,
  trends: HistoryTrends,
  goalCompletionRate: number,
  consistencyScore: number,
  longestStreak: number,
): PerformanceTrends {
  return {
    sessionDuration: {
      average: averageSessionLength,
      trend: trends.sessionLength.direction,
      weeklyChange: trends.sessionLength.changePercentage,
    },
    goalAchievement: {
      rate: goalCompletionRate,
      trend: trends.goalCompletion.direction,
      weeklyChange: trends.goalCompletion.changePercentage,
    },
    consistency: {
      score: consistencyScore,
      streak: longestStreak,
      trend: trends.consistency.direction,
    },
  };
}

export function getGoalProgressHistory(
  sessions: HistoricalSession[],
): GoalProgressHistory[] {
  const goalProgressMap = new Map<string, GoalProgressHistory>();

  sessions.forEach((session) => {
    session.goals.forEach((goal) => {
      if (!goalProgressMap.has(goal.id)) {
        goalProgressMap.set(goal.id, {
          goalId: goal.id,
          goalName: goal.type,
          progressOverTime: [],
          milestones: [],
        });
      }

      const progressHistory = goalProgressMap.get(goal.id)!;
      progressHistory.progressOverTime.push({
        date: session.startTime,
        progress: goal.progress,
      });
    });
  });

  return Array.from(goalProgressMap.values());
}

export function getComparisonMetrics(
  sessions: HistoricalSession[],
): ComparisonMetrics {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const thisWeekSessions = getSessionsByDateRange(sessions, weekAgo, now);
  const lastWeekSessions = getSessionsByDateRange(
    sessions,
    twoWeeksAgo,
    weekAgo,
  );
  const thisMonthSessions = getSessionsByDateRange(sessions, monthAgo, now);
  const lastMonthSessions = getSessionsByDateRange(
    sessions,
    twoMonthsAgo,
    monthAgo,
  );

  return {
    thisWeek: {
      sessions: thisWeekSessions.length,
      totalTime: thisWeekSessions.reduce(
        (sum, s) => sum + s.effectiveDuration,
        0,
      ),
      goalCompletion: calculateOverallCompletionRate(thisWeekSessions),
    },
    lastWeek: {
      sessions: lastWeekSessions.length,
      totalTime: lastWeekSessions.reduce(
        (sum, s) => sum + s.effectiveDuration,
        0,
      ),
      goalCompletion: calculateOverallCompletionRate(lastWeekSessions),
    },
    thisMonth: {
      sessions: thisMonthSessions.length,
      totalTime: thisMonthSessions.reduce(
        (sum, s) => sum + s.effectiveDuration,
        0,
      ),
      goalCompletion: calculateOverallCompletionRate(thisMonthSessions),
    },
    lastMonth: {
      sessions: lastMonthSessions.length,
      totalTime: lastMonthSessions.reduce(
        (sum, s) => sum + s.effectiveDuration,
        0,
      ),
      goalCompletion: calculateOverallCompletionRate(lastMonthSessions),
    },
  };
}
