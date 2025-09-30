/**
 * Session History Type Definitions
 * Extracted from useSessionHistory hook for better code organization
 */

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
