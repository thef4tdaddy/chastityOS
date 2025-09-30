/**
 * Statistics Type Definitions
 * Extracted from useStatistics hook for better code organization
 */

// ==================== INTERFACES ====================

export interface SessionStatistics {
  // Time-based stats
  totalSessionTime: number; // Total time across all sessions in seconds
  averageSessionLength: number; // Average session duration in seconds
  longestSession: number; // Longest session duration in seconds
  shortestSession: number; // Shortest session duration in seconds

  // Frequency stats
  sessionsThisWeek: number;
  sessionsThisMonth: number;
  sessionFrequency: FrequencyMetrics;

  // Quality metrics
  completionRate: number; // Percentage of sessions completed vs abandoned
  goalAchievementRate: number; // Percentage of goals achieved
  satisfactionRating: number; // Average satisfaction rating (1-5)

  // Trend data
  trends: TrendData[];
  streaks: StreakData;
}

export interface GoalStatistics {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  completionRate: number;
  averageCompletionTime: number; // Hours
  mostCommonGoalTypes: GoalTypeStats[];
  hardestGoalTypes: GoalTypeStats[];
  goalStreaks: StreakData;
}

export interface AchievementStatistics {
  totalAchievements: number;
  recentAchievements: Achievement[];
  achievementsByCategory: CategoryStats[];
  rareAchievements: Achievement[];
  achievementPoints: number;
  percentileRank: number; // Where user ranks compared to others
}

export interface ComparativeStatistics {
  userPercentile: number; // 0-100, where user ranks compared to others
  averageUserStats: SessionStatistics;
  personalBest: PersonalBestStats;
  improvements: ImprovementMetrics;
}

export interface SharedStatistics {
  allowedMetrics: StatisticType[];
  keyholderView: KeyholderStatisticsView;
  lastSharedAt: Date;
  sharingLevel: "basic" | "detailed" | "full";
}

export interface PredictiveAnalytics {
  nextSessionPrediction: {
    suggestedDuration: number;
    successProbability: number;
    optimalStartTime: Date;
    riskFactors: string[];
  };
  goalRecommendations: GoalRecommendation[];
  improvementOpportunities: ImprovementOpportunity[];
  trendPredictions: TrendPrediction[];
}

export interface RecommendationEngine {
  sessionRecommendations: SessionRecommendation[];
  goalRecommendations: GoalRecommendation[];
  behaviorInsights: BehaviorInsight[];
  personalizedTips: PersonalizedTip[];
}

export interface StatisticsState {
  sessionStats: SessionStatistics;
  goalStats: GoalStatistics;
  achievementStats: AchievementStatistics;
  comparativeStats: ComparativeStatistics;
  sharedStats: SharedStatistics;
  predictiveAnalytics: PredictiveAnalytics;
  recommendations: RecommendationEngine;
}

export interface FrequencyMetrics {
  daily: number;
  weekly: number;
  monthly: number;
  trend: "increasing" | "stable" | "decreasing";
}

export interface TrendData {
  metric: string;
  direction: "improving" | "stable" | "declining";
  changePercentage: number;
  timeframe: string;
  dataPoints: { date: Date; value: number }[];
}

export interface StreakData {
  current: number;
  longest: number;
  type: "session_consistency" | "goal_completion" | "no_pauses";
  startDate?: Date;
  endDate?: Date;
}

export interface GoalTypeStats {
  type: string;
  count: number;
  completionRate: number;
  averageDuration: number;
}

export interface CategoryStats {
  category: string;
  count: number;
  percentage: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  earnedAt: Date;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  points: number;
}

export interface PersonalBestStats {
  longestSession: number;
  mostGoalsInSession: number;
  longestStreak: number;
  highestSatisfactionRating: number;
  bestMonth: {
    month: string;
    year: number;
    totalTime: number;
    sessionCount: number;
  };
}

export interface ImprovementMetrics {
  sessionLength: {
    improvement: number; // percentage
    timeframe: string;
  };
  consistency: {
    improvement: number;
    timeframe: string;
  };
  goalCompletion: {
    improvement: number;
    timeframe: string;
  };
}

export interface GoalRecommendation {
  type: string;
  suggestedTarget: number;
  reasoning: string;
  confidence: number;
  estimatedDifficulty: "easy" | "medium" | "hard";
}

export interface ImprovementOpportunity {
  area: string;
  description: string;
  impact: "low" | "medium" | "high";
  effort: "low" | "medium" | "high";
  actionItems: string[];
}

export interface TrendPrediction {
  metric: string;
  predictedDirection: "improving" | "stable" | "declining";
  confidence: number;
  timeframe: string;
  reasoning: string;
}

export interface SessionRecommendation {
  type: "duration" | "timing" | "goals" | "preparation";
  suggestion: string;
  reasoning: string;
  expectedBenefit: string;
}

export interface BehaviorInsight {
  pattern: string;
  description: string;
  frequency: number;
  impact: "positive" | "neutral" | "negative";
  suggestions: string[];
}

export interface PersonalizedTip {
  id: string;
  category: string;
  tip: string;
  relevanceScore: number;
  isActionable: boolean;
}

export interface KeyholderStatisticsView {
  sessionOverview: {
    totalSessions: number;
    averageDuration: number;
    lastSessionDate: Date;
  };
  goalProgress: {
    activeGoals: number;
    completionRate: number;
  };
  behaviorPatterns: {
    consistency: number;
    pauseFrequency: number;
    improvementTrend: string;
  };
  allowedInsights: string[];
}

export interface TimePeriod {
  start: Date;
  end: Date;
  label: string;
}

export interface PeriodStatistics {
  period: TimePeriod;
  sessionCount: number;
  totalTime: number;
  goalCompletionRate: number;
  averageSatisfaction: number;
}

export interface MonthlyTrends {
  months: {
    month: string;
    year: number;
    sessionCount: number;
    totalTime: number;
    completionRate: number;
  }[];
  overallTrend: "improving" | "stable" | "declining";
}

export interface WeeklyBreakdown {
  weekdays: {
    day: string;
    sessionCount: number;
    averageDuration: number;
    completionRate: number;
  }[];
  weekendVsWeekday: {
    weekday: PeriodStatistics;
    weekend: PeriodStatistics;
  };
}

export interface ComparisonResult {
  metric: string;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercentage: number;
  trend: "improving" | "stable" | "declining";
}

export interface BenchmarkData {
  userValue: number;
  averageValue: number;
  percentile: number;
  category: string;
}

export interface KeyholderDashboardStats {
  submissiveOverview: {
    name: string;
    consistencyScore: number;
    improvementTrend: string;
    lastActiveDate: Date;
  };
  sessionSummary: {
    thisWeek: number;
    thisMonth: number;
    averageDuration: number;
    completionRate: number;
  };
  goalTracking: {
    activeGoals: string[];
    completionRate: number;
    upcomingDeadlines: Date[];
  };
  behaviorInsights: {
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
  };
}

export interface RelationshipComparisonStats {
  relationshipDuration: number; // days
  sharedSessions: number;
  collaborationScore: number;
  satisfactionTrend: string;
  milestones: {
    name: string;
    date: Date;
    achieved: boolean;
  }[];
}

export interface PredictiveInsights {
  nextSessionSuccess: {
    probability: number;
    factors: string[];
  };
  goalAchievementLikelihood: {
    goalId: string;
    probability: number;
    timeToCompletion: number;
  }[];
  riskAssessment: {
    burnoutRisk: "low" | "medium" | "high";
    consistencyRisk: "low" | "medium" | "high";
    factors: string[];
  };
}

export interface Recommendation {
  id: string;
  type: "session" | "goal" | "behavior" | "timing";
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  expectedImpact: string;
  actionRequired: string;
}

export interface StatisticsExport {
  format: ExportFormat;
  data: Record<string, unknown>;
  generatedAt: Date;
  fileSize: number;
  downloadUrl: string;
}

export type StatisticType =
  | "session_duration"
  | "goal_completion"
  | "consistency"
  | "satisfaction"
  | "achievements"
  | "streaks"
  | "trends";

export type ExportFormat = "json" | "csv" | "pdf" | "xlsx";

// ==================== HOOK IMPLEMENTATION ====================
