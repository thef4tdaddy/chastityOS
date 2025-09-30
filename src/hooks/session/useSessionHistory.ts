/**
 * Session History Management Hook
 * Provides comprehensive session history with privacy controls,
 * data visualization support, and keyholder access management
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import type { KeyholderRelationship } from "../../types/core";
import { serviceLogger } from "../../utils/logging";

const logger = serviceLogger("useSessionHistory");

// ==================== INTERFACES ====================

export interface HistoricalSession {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // Total duration in seconds
  effectiveDuration: number; // Duration minus pauses
  goals: SessionGoal[];
  goalCompletion: GoalCompletionRecord[];
  pauseEvents: PauseEvent[];
  keyholderInteractions: KeyholderInteraction[];
  tags: string[];
  notes: string;
  rating?: SessionRating;
  isHardcoreMode: boolean;
  wasKeyholderControlled: boolean;
  endReason?: string;
  emergencyEnd?: boolean;
}

export interface SessionGoal {
  id: string;
  type: string;
  target: number;
  unit: string;
  completed: boolean;
  progress: number;
}

export interface GoalCompletionRecord {
  goalId: string;
  goalName: string;
  targetValue: number;
  achievedValue: number;
  completionPercentage: number;
  completed: boolean;
  completedAt?: Date;
}

export interface PauseEvent {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  reason: string;
  initiatedBy: "submissive" | "keyholder" | "emergency";
}

export interface KeyholderInteraction {
  id: string;
  type: "message" | "control_action" | "approval" | "modification";
  timestamp: Date;
  description: string;
  keyholderName: string;
}

export interface SessionRating {
  overall: number; // 1-5 stars
  difficulty: number; // 1-5
  satisfaction: number; // 1-5
  wouldRepeat: boolean;
  notes?: string;
}

export interface HistoryPrivacySettings {
  shareWithKeyholder: boolean;
  shareDuration: boolean;
  shareGoals: boolean;
  sharePauses: boolean;
  shareNotes: boolean;
  shareRatings: boolean;
  retentionPeriod: number; // Days to keep history
  allowExport: boolean;
  anonymizeOldData: boolean;
}

export interface KeyholderHistoryAccess {
  hasAccess: boolean;
  accessLevel: "summary" | "detailed" | "full";
  canViewRatings: boolean;
  canViewNotes: boolean;
  canViewPauses: boolean;
  lastAccessedAt?: Date;
}

export interface HistoryInsights {
  totalSessions: number;
  totalEffectiveTime: number;
  averageSessionLength: number;
  longestSession: HistoricalSession;
  shortestSession: HistoricalSession;
  mostRecentSession: HistoricalSession;
  goalCompletionRate: number;
  pauseFrequency: number;
  improvementTrend: "improving" | "stable" | "declining";
  consistencyScore: number; // 0-100
  keyholderSatisfactionScore?: number;
}

export interface HistoryTrends {
  sessionLength: TrendData;
  goalCompletion: TrendData;
  consistency: TrendData;
  pauseFrequency: TrendData;
  overallProgress: TrendData;
}

export interface TrendData {
  direction: "improving" | "stable" | "declining";
  changePercentage: number;
  confidence: number; // 0-100
  timeframe: "week" | "month" | "quarter" | "year";
  dataPoints: TrendPoint[];
}

export interface TrendPoint {
  date: Date;
  value: number;
  label?: string;
}

export interface SessionHistoryState {
  sessions: HistoricalSession[];
  privacySettings: HistoryPrivacySettings;
  keyholderAccess: KeyholderHistoryAccess;
  insights: HistoryInsights;
  trends: HistoryTrends;
}

export interface HistorySearchQuery {
  dateRange?: {
    start: Date;
    end: Date;
  };
  minDuration?: number;
  maxDuration?: number;
  goalTypes?: string[];
  hasKeyholderControl?: boolean;
  completedGoals?: boolean;
  tags?: string[];
  rating?: {
    min: number;
    max: number;
  };
  textSearch?: string;
}

export interface PersonalDataExport {
  exportId: string;
  generatedAt: Date;
  format: "json" | "csv" | "pdf";
  data: {
    sessions: HistoricalSession[];
    goals: SessionGoal[];
    settings: HistoryPrivacySettings;
    analytics: HistoryInsights;
  };
  fileSize: number;
  downloadUrl: string;
  expiresAt: Date;
}

export interface KeyholderHistoryView {
  allowedSessions: Partial<HistoricalSession>[];
  summaryStats: {
    totalSessions: number;
    averageDuration: number;
    goalCompletionRate: number;
    lastSessionDate: Date;
  };
  accessLevel: "summary" | "detailed" | "full";
  restrictions: string[];
}

export interface PerformanceTrends {
  sessionDuration: {
    average: number;
    trend: "improving" | "stable" | "declining";
    weeklyChange: number;
  };
  goalAchievement: {
    rate: number;
    trend: "improving" | "stable" | "declining";
    weeklyChange: number;
  };
  consistency: {
    score: number;
    streak: number;
    trend: "improving" | "stable" | "declining";
  };
}

export interface GoalProgressHistory {
  goalId: string;
  goalName: string;
  progressOverTime: {
    date: Date;
    progress: number;
  }[];
  milestones: {
    date: Date;
    description: string;
    achieved: boolean;
  }[];
}

export interface ComparisonMetrics {
  thisWeek: {
    sessions: number;
    totalTime: number;
    goalCompletion: number;
  };
  lastWeek: {
    sessions: number;
    totalTime: number;
    goalCompletion: number;
  };
  thisMonth: {
    sessions: number;
    totalTime: number;
    goalCompletion: number;
  };
  lastMonth: {
    sessions: number;
    totalTime: number;
    goalCompletion: number;
  };
}

// ==================== HOOK IMPLEMENTATION ====================

export const useSessionHistory = (userId: string, relationshipId?: string) => {
  // ==================== STATE ====================

  const [sessions, setSessions] = useState<HistoricalSession[]>([]);
  const [privacySettings, setPrivacySettings] =
    useState<HistoryPrivacySettings>({
      shareWithKeyholder: false,
      shareDuration: true,
      shareGoals: true,
      sharePauses: false,
      shareNotes: false,
      shareRatings: false,
      retentionPeriod: 365, // 1 year
      allowExport: true,
      anonymizeOldData: false,
    });
  const [keyholderAccess, setKeyholderAccess] =
    useState<KeyholderHistoryAccess>({
      hasAccess: false,
      accessLevel: "summary",
      canViewRatings: false,
      canViewNotes: false,
      canViewPauses: false,
    });
  const [insights, setInsights] = useState<HistoryInsights>({
    totalSessions: 0,
    totalEffectiveTime: 0,
    averageSessionLength: 0,
    longestSession: {} as HistoricalSession,
    shortestSession: {} as HistoricalSession,
    mostRecentSession: {} as HistoricalSession,
    goalCompletionRate: 0,
    pauseFrequency: 0,
    improvementTrend: "stable",
    consistencyScore: 0,
  });
  const [trends, setTrends] = useState<HistoryTrends>({
    sessionLength: createEmptyTrendData(),
    goalCompletion: createEmptyTrendData(),
    consistency: createEmptyTrendData(),
    pauseFrequency: createEmptyTrendData(),
    overallProgress: createEmptyTrendData(),
  });
  const [_relationship, _setRelationship] =
    useState<KeyholderRelationship | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==================== COMPUTED VALUES ====================

  const totalSessions = useMemo(() => sessions.length, [sessions]);

  const averageSessionLength = useMemo(
    () =>
      sessions.length > 0
        ? sessions.reduce(
            (sum, session) => sum + session.effectiveDuration,
            0,
          ) / sessions.length
        : 0,
    [sessions],
  );

  const goalCompletionRate = useMemo(
    () => calculateOverallCompletionRate(sessions),
    [sessions],
  );

  const longestStreak = useMemo(
    () => calculateLongestStreak(sessions),
    [sessions],
  );

  const hasPrivacyRestrictions = useMemo(
    () => !privacySettings.shareWithKeyholder,
    [privacySettings.shareWithKeyholder],
  );

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    const initializeHistory = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Load relationship data if available
        if (relationshipId) {
          // Set keyholder access based on relationship permissions
          setKeyholderAccess({
            hasAccess: privacySettings.shareWithKeyholder,
            accessLevel: privacySettings.shareWithKeyholder
              ? "detailed"
              : "summary",
            canViewRatings: privacySettings.shareRatings,
            canViewNotes: privacySettings.shareNotes,
            canViewPauses: privacySettings.sharePauses,
          });
        }

        // Load historical data
        await Promise.all([
          loadSessions(),
          loadPrivacySettings(),
          calculateInsights(),
          calculateTrends(),
        ]);
      } catch (err) {
        logger.error("Failed to initialize session history", { error: err });
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize session history",
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeHistory();
  }, [
    userId,
    relationshipId,
    privacySettings.shareWithKeyholder,
    privacySettings.shareRatings,
    privacySettings.shareNotes,
    privacySettings.sharePauses,
    loadSessions,
    loadPrivacySettings,
    calculateTrends,
    calculateInsights,
  ]);

  // ==================== DATA LOADING FUNCTIONS ====================

  const loadSessions = useCallback(async () => {
    try {
      // This would integrate with your session database service
      // Load sessions with privacy filtering applied
      const allSessions: HistoricalSession[] = [];

      // Apply retention policy
      const retentionDate = new Date();
      retentionDate.setDate(
        retentionDate.getDate() - privacySettings.retentionPeriod,
      );

      const filteredSessions = allSessions.filter(
        (session) => session.startTime >= retentionDate,
      );

      setSessions(filteredSessions);
    } catch (error) {
      logger.error("Failed to load sessions", { error });
    }
  }, [privacySettings.retentionPeriod]);

  const loadPrivacySettings = useCallback(async () => {
    try {
      // Load user's privacy preferences from database
      // For now, use defaults
    } catch (error) {
      logger.error("Failed to load privacy settings", { error });
    }
  }, []);

  const calculateInsights = useCallback(async () => {
    try {
      if (sessions.length === 0) return;

      const totalEffectiveTime = sessions.reduce(
        (sum, s) => sum + s.effectiveDuration,
        0,
      );
      const sortedByDuration = [...sessions].sort(
        (a, b) => b.effectiveDuration - a.effectiveDuration,
      );
      const sortedByDate = [...sessions].sort(
        (a, b) => b.startTime.getTime() - a.startTime.getTime(),
      );

      const newInsights: HistoryInsights = {
        totalSessions: sessions.length,
        totalEffectiveTime,
        averageSessionLength: totalEffectiveTime / sessions.length,
        longestSession: sortedByDuration[0],
        shortestSession: sortedByDuration[sortedByDuration.length - 1],
        mostRecentSession: sortedByDate[0],
        goalCompletionRate: calculateOverallCompletionRate(sessions),
        pauseFrequency: calculatePauseFrequency(sessions),
        improvementTrend: calculateImprovementTrend(sessions),
        consistencyScore: calculateConsistencyScore(sessions),
      };

      setInsights(newInsights);
    } catch (error) {
      logger.error("Failed to calculate insights", { error });
    }
  }, [sessions]);

  const calculateTrends = useCallback(async () => {
    try {
      const newTrends: HistoryTrends = {
        sessionLength: calculateSessionLengthTrend(sessions),
        goalCompletion: calculateGoalCompletionTrend(sessions),
        consistency: calculateConsistencyTrend(sessions),
        pauseFrequency: calculatePauseFrequencyTrend(sessions),
        overallProgress: calculateOverallProgressTrend(sessions),
      };

      setTrends(newTrends);
    } catch (error) {
      logger.error("Failed to calculate trends", { error });
    }
  }, [sessions]);

  // ==================== DATA RETRIEVAL ====================

  const getSessionsByDateRange = useCallback(
    (start: Date, end: Date): HistoricalSession[] => {
      return sessions.filter(
        (session) => session.startTime >= start && session.startTime <= end,
      );
    },
    [sessions],
  );

  const getSessionsByGoal = useCallback(
    (goalType: string): HistoricalSession[] => {
      return sessions.filter((session) =>
        session.goals.some((goal) => goal.type === goalType),
      );
    },
    [sessions],
  );

  const searchSessions = useCallback(
    (query: HistorySearchQuery): HistoricalSession[] => {
      let filteredSessions = [...sessions];

      // Date range filter
      if (query.dateRange) {
        filteredSessions = filteredSessions.filter(
          (session) =>
            session.startTime >= query.dateRange!.start &&
            session.startTime <= query.dateRange!.end,
        );
      }

      // Duration filters
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

      // Goal type filter
      if (query.goalTypes && query.goalTypes.length > 0) {
        filteredSessions = filteredSessions.filter((session) =>
          session.goals.some((goal) => query.goalTypes!.includes(goal.type)),
        );
      }

      // Keyholder control filter
      if (query.hasKeyholderControl !== undefined) {
        filteredSessions = filteredSessions.filter(
          (session) =>
            session.wasKeyholderControlled === query.hasKeyholderControl,
        );
      }

      // Completed goals filter
      if (query.completedGoals !== undefined) {
        filteredSessions = filteredSessions.filter((session) => {
          const hasCompletedGoals = session.goals.some(
            (goal) => goal.completed,
          );
          return hasCompletedGoals === query.completedGoals;
        });
      }

      // Tags filter
      if (query.tags && query.tags.length > 0) {
        filteredSessions = filteredSessions.filter((session) =>
          query.tags!.some((tag) => session.tags.includes(tag)),
        );
      }

      // Rating filter
      if (query.rating && query.rating.min && query.rating.max) {
        filteredSessions = filteredSessions.filter(
          (session) =>
            session.rating &&
            session.rating.overall >= query.rating!.min &&
            session.rating.overall <= query.rating!.max,
        );
      }

      // Text search
      if (query.textSearch) {
        const searchTerm = query.textSearch.toLowerCase();
        filteredSessions = filteredSessions.filter(
          (session) =>
            session.notes.toLowerCase().includes(searchTerm) ||
            session.tags.some((tag) =>
              tag.toLowerCase().includes(searchTerm),
            ) ||
            session.endReason?.toLowerCase().includes(searchTerm),
        );
      }

      return filteredSessions;
    },
    [sessions],
  );

  // ==================== PRIVACY MANAGEMENT ====================

  const updatePrivacySettings = useCallback(
    async (settings: Partial<HistoryPrivacySettings>): Promise<void> => {
      try {
        logger.debug("Updating privacy settings", { settings });

        const updatedSettings = { ...privacySettings, ...settings };
        setPrivacySettings(updatedSettings);

        // Update keyholder access based on new settings
        if (relationshipId) {
          setKeyholderAccess((prev) => ({
            ...prev,
            hasAccess: updatedSettings.shareWithKeyholder,
            accessLevel: updatedSettings.shareWithKeyholder
              ? "detailed"
              : "summary",
            canViewRatings: updatedSettings.shareRatings,
            canViewNotes: updatedSettings.shareNotes,
            canViewPauses: updatedSettings.sharePauses,
          }));
        }

        // Reload sessions if retention period changed
        if (
          settings.retentionPeriod &&
          settings.retentionPeriod !== privacySettings.retentionPeriod
        ) {
          await loadSessions();
        }

        logger.info("Privacy settings updated successfully");
      } catch (error) {
        logger.error("Failed to update privacy settings", { error });
        throw error;
      }
    },
    [privacySettings, relationshipId, loadSessions],
  );

  const exportPersonalData =
    useCallback(async (): Promise<PersonalDataExport> => {
      try {
        logger.debug("Exporting personal data", { userId });

        const exportData: PersonalDataExport = {
          exportId: `export_${Date.now()}`,
          generatedAt: new Date(),
          format: "json",
          data: {
            sessions,
            goals: sessions.flatMap((s) => s.goals),
            settings: privacySettings,
            analytics: insights,
          },
          fileSize: 0, // Would be calculated
          downloadUrl: "", // Would be generated
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        };

        logger.info("Personal data export created", {
          exportId: exportData.exportId,
        });
        return exportData;
      } catch (error) {
        logger.error("Failed to export personal data", { error });
        throw error;
      }
    }, [sessions, privacySettings, insights, userId]);

  const deleteHistoricalData = useCallback(
    async (before: Date): Promise<void> => {
      try {
        logger.debug("Deleting historical data", { before, userId });

        const sessionsToKeep = sessions.filter(
          (session) => session.startTime >= before,
        );
        const deletedCount = sessions.length - sessionsToKeep.length;

        setSessions(sessionsToKeep);

        // Recalculate insights and trends
        await Promise.all([calculateInsights(), calculateTrends()]);

        logger.info("Historical data deleted", { deletedCount });
      } catch (error) {
        logger.error("Failed to delete historical data", { error });
        throw error;
      }
    },
    [sessions, calculateInsights, calculateTrends, userId],
  );

  // ==================== KEYHOLDER ACCESS ====================

  const getKeyholderView = useCallback((): KeyholderHistoryView => {
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
        lastSessionDate:
          sessions.length > 0 ? sessions[0].startTime : new Date(),
      },
      accessLevel: keyholderAccess.accessLevel,
      restrictions: [],
    };
  }, [
    keyholderAccess,
    sessions,
    privacySettings,
    averageSessionLength,
    goalCompletionRate,
  ]);

  const shareHistoryWithKeyholder = useCallback(
    async (sessionIds: string[]): Promise<void> => {
      try {
        logger.debug("Sharing specific sessions with keyholder", {
          sessionIds,
        });

        // This would create a special sharing link or send specific data
        // For now, just log the action
        logger.info("History shared with keyholder", {
          sessionCount: sessionIds.length,
        });
      } catch (error) {
        logger.error("Failed to share history with keyholder", { error });
        throw error;
      }
    },
    [],
  );

  // ==================== ANALYTICS ====================

  const getPerformanceTrends = useCallback((): PerformanceTrends => {
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
        score: insights.consistencyScore,
        streak: longestStreak,
        trend: trends.consistency.direction,
      },
    };
  }, [
    averageSessionLength,
    trends,
    goalCompletionRate,
    insights.consistencyScore,
    longestStreak,
  ]);

  const getGoalProgressHistory = useCallback((): GoalProgressHistory[] => {
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
  }, [sessions]);

  const getComparisonMetrics = useCallback((): ComparisonMetrics => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const thisWeekSessions = getSessionsByDateRange(weekAgo, now);
    const lastWeekSessions = getSessionsByDateRange(twoWeeksAgo, weekAgo);
    const thisMonthSessions = getSessionsByDateRange(monthAgo, now);
    const lastMonthSessions = getSessionsByDateRange(twoMonthsAgo, monthAgo);

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
  }, [getSessionsByDateRange]);

  // ==================== RETURN HOOK INTERFACE ====================

  return {
    // History data
    sessions,
    insights,
    trends,
    privacySettings,

    // Data retrieval
    getSessionsByDateRange,
    getSessionsByGoal,
    searchSessions,

    // Privacy management
    updatePrivacySettings,
    exportPersonalData,
    deleteHistoricalData,

    // Keyholder access
    getKeyholderView,
    shareHistoryWithKeyholder,

    // Analytics
    getPerformanceTrends,
    getGoalProgressHistory,
    getComparisonMetrics,

    // Computed values
    totalSessions,
    averageSessionLength,
    goalCompletionRate,
    longestStreak,
    hasPrivacyRestrictions,

    // Loading states
    isLoading,
    error,
  };
};

// ==================== HELPER FUNCTIONS ====================

function createEmptyTrendData(): TrendData {
  return {
    direction: "stable",
    changePercentage: 0,
    confidence: 0,
    timeframe: "week",
    dataPoints: [],
  };
}

function calculateOverallCompletionRate(sessions: HistoricalSession[]): number {
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

function calculateLongestStreak(sessions: HistoricalSession[]): number {
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
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
}

function calculatePauseFrequency(sessions: HistoricalSession[]): number {
  if (sessions.length === 0) return 0;

  const totalPauses = sessions.reduce(
    (sum, session) => sum + session.pauseEvents.length,
    0,
  );
  return totalPauses / sessions.length;
}

function calculateImprovementTrend(
  sessions: HistoricalSession[],
): "improving" | "stable" | "declining" {
  if (sessions.length < 2) return "stable";

  // Compare recent sessions with older ones
  const halfPoint = Math.floor(sessions.length / 2);
  const recentSessions = sessions.slice(0, halfPoint);
  const olderSessions = sessions.slice(halfPoint);

  const recentAvg =
    recentSessions.reduce((sum, s) => sum + s.effectiveDuration, 0) /
    recentSessions.length;
  const olderAvg =
    olderSessions.reduce((sum, s) => sum + s.effectiveDuration, 0) /
    olderSessions.length;

  const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;

  if (changePercent > 10) return "improving";
  if (changePercent < -10) return "declining";
  return "stable";
}

function calculateConsistencyScore(sessions: HistoricalSession[]): number {
  if (sessions.length === 0) return 0;

  // Calculate based on regularity of sessions and completion rates
  const avgDuration =
    sessions.reduce((sum, s) => sum + s.effectiveDuration, 0) / sessions.length;
  const variance =
    sessions.reduce(
      (sum, s) => sum + Math.pow(s.effectiveDuration - avgDuration, 2),
      0,
    ) / sessions.length;
  const standardDeviation = Math.sqrt(variance);

  // Lower standard deviation = higher consistency
  const consistencyScore = Math.max(
    0,
    100 - (standardDeviation / avgDuration) * 100,
  );

  return Math.floor(consistencyScore);
}

function calculateSessionLengthTrend(
  _sessions: HistoricalSession[],
): TrendData {
  // Implementation would analyze session lengths over time
  return createEmptyTrendData();
}

function calculateGoalCompletionTrend(
  _sessions: HistoricalSession[],
): TrendData {
  // Implementation would analyze goal completion rates over time
  return createEmptyTrendData();
}

function calculateConsistencyTrend(_sessions: HistoricalSession[]): TrendData {
  // Implementation would analyze consistency patterns over time
  return createEmptyTrendData();
}

function calculatePauseFrequencyTrend(
  _sessions: HistoricalSession[],
): TrendData {
  // Implementation would analyze pause frequency changes over time
  return createEmptyTrendData();
}

function calculateOverallProgressTrend(
  _sessions: HistoricalSession[],
): TrendData {
  // Implementation would analyze overall progress metrics over time
  return createEmptyTrendData();
}

export default useSessionHistory;
