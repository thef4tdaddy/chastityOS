/**
 * Enhanced Goals System Types
 */

// Goal types
export enum GoalType {
  DURATION = "duration",
  FREQUENCY = "frequency",
  BEHAVIORAL = "behavioral",
  MILESTONE = "milestone",
  COLLABORATIVE = "collaborative",
}

// Goal categories
export enum GoalCategory {
  CHASTITY = "chastity",
  BEHAVIOR = "behavior",
  FITNESS = "fitness",
  EDUCATION = "education",
  RELATIONSHIP = "relationship",
  PERSONAL = "personal",
}

// Goal difficulty
export enum GoalDifficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
  EXTREME = "extreme",
}

// Goal status
export enum GoalStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  PAUSED = "paused",
  FAILED = "failed",
  CANCELLED = "cancelled",
  BEHIND = "behind",
}

// Goal target
export interface GoalTarget {
  type: "duration" | "count" | "percentage" | "custom";
  value: number;
  unit: string;
  description: string;
}

// Goal progress
export interface GoalProgress {
  current: number;
  target: number;
  percentage: number;
  status: GoalStatus;
  milestones: Milestone[];
  lastUpdated: Date;
}

// Milestone
export interface Milestone {
  id: string;
  name: string;
  description: string;
  target: number;
  achieved: boolean;
  achievedAt?: Date;
  reward?: string;
}

// Enhanced goal
export interface EnhancedGoal {
  id: string;
  type: GoalType;
  category: GoalCategory;
  title: string;
  description: string;
  target: GoalTarget;
  progress: GoalProgress;
  milestones: Milestone[];
  collaborators?: string[];
  aiGenerated: boolean;
  difficulty: GoalDifficulty;
  estimatedCompletion: Date;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  tags: string[];
  isPublic: boolean;
}

// Collaborative goal
export interface CollaborativeGoal extends EnhancedGoal {
  ownerId: string;
  collaborators: string[];
  permissions: CollaborativePermissions;
  synchronization: SynchronizationSettings;
}

// Collaborative permissions
export interface CollaborativePermissions {
  canEdit: boolean;
  canDelete: boolean;
  canInviteOthers: boolean;
  canViewProgress: boolean;
  canAddMilestones: boolean;
}

// Synchronization settings
export interface SynchronizationSettings {
  shareProgress: boolean;
  sharePrivateNotes: boolean;
  allowProgressUpdates: boolean;
  notifyOnMilestones: boolean;
}

// Goal recommendation
export interface GoalRecommendation {
  id: string;
  type: GoalType;
  category: GoalCategory;
  title: string;
  description: string;
  difficulty: GoalDifficulty;
  estimatedDuration: number;
  reasoning: string;
  confidence: number;
  similarGoals: string[];
  successRate: number;
}

// Goal analytics
export interface GoalAnalytics {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  completionRate: number;
  averageCompletionTime: number;
  categoryDistribution: Record<GoalCategory, number>;
  difficultyDistribution: Record<GoalDifficulty, number>;
  monthlyProgress: MonthlyProgress[];
  streaks: GoalStreak[];
}

// Monthly progress
export interface MonthlyProgress {
  month: string;
  goalsStarted: number;
  goalsCompleted: number;
  totalProgress: number;
}

// Goal streak
export interface GoalStreak {
  category: GoalCategory;
  currentStreak: number;
  longestStreak: number;
  lastGoalCompleted: Date;
}

// Goal template
export interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  category: GoalCategory;
  difficulty: GoalDifficulty;
  template: Partial<EnhancedGoal>;
  popularity: number;
  successRate: number;
}

// Create goal request
export interface CreateGoalRequest {
  title: string;
  description: string;
  type: GoalType;
  category: GoalCategory;
  target: GoalTarget;
  difficulty: GoalDifficulty;
  milestones?: Omit<Milestone, "id" | "achieved" | "achievedAt">[];
  isPublic?: boolean;
  tags?: string[];
}

// Goal update
export interface GoalUpdate {
  title?: string;
  description?: string;
  target?: GoalTarget;
  milestones?: Milestone[];
  tags?: string[];
  isPublic?: boolean;
  progress?: Partial<GoalProgress>;
}

// Optimized goal plan
export interface OptimizedGoalPlan {
  goals: EnhancedGoal[];
  timeline: PlanTimeline[];
  conflicts: PlanConflict[];
  recommendations: PlanRecommendation[];
  estimatedCompletion: Date;
}

// Plan timeline
export interface PlanTimeline {
  date: Date;
  goals: string[];
  milestones: string[];
  estimatedEffort: number;
}

// Plan conflict
export interface PlanConflict {
  goalIds: string[];
  type: "resource" | "time" | "dependency";
  description: string;
  severity: "low" | "medium" | "high";
  suggestions: string[];
}

// Plan recommendation
export interface PlanRecommendation {
  type: "reorder" | "adjust" | "combine" | "split";
  description: string;
  impact: string;
  effort: string;
}

// Collaboration invite
export interface CollaborationInvite {
  id: string;
  goalId: string;
  inviterId: string;
  inviteeId: string;
  permissions: CollaborativePermissions;
  message?: string;
  createdAt: Date;
  expiresAt: Date;
  status: "pending" | "accepted" | "declined" | "expired";
}

// Goal insights
export interface GoalInsights {
  motivationFactors: string[];
  successPatterns: string[];
  failureReasons: string[];
  optimalDifficulty: GoalDifficulty;
  bestCategories: GoalCategory[];
  timeToComplete: Record<GoalDifficulty, number>;
}

// Goal predictions
export interface GoalPredictions {
  likelyToComplete: EnhancedGoal[];
  atRisk: EnhancedGoal[];
  completionProbabilities: Record<string, number>;
  suggestedAdjustments: GoalAdjustment[];
}

// Goal adjustment
export interface GoalAdjustment {
  goalId: string;
  type: "extend" | "reduce" | "modify" | "pause";
  description: string;
  reasoning: string;
  impact: string;
}

// Completion trends
export interface CompletionTrends {
  weeklyCompletion: number[];
  monthlyCompletion: number[];
  categoryTrends: Record<GoalCategory, number[]>;
  difficultyTrends: Record<GoalDifficulty, number[]>;
  peakPerformancePeriods: string[];
}
