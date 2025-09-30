/**
 * Type Definitions for useSessionGoals
 * Extracted for better code organization
 */

export interface SessionGoal {
  id: string;
  type: GoalType;
  category: GoalCategory;
  target: GoalTarget;
  current: number;
  progress: number; // 0-100%
  assignedBy: "self" | "keyholder";
  isRequired: boolean;
  deadline?: Date;
  priority: GoalPriority;
  status: GoalStatus;
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
  description?: string;
  tags?: string[];
}

export interface GoalTarget {
  value: number;
  unit: "minutes" | "hours" | "days" | "sessions" | "tasks" | "percentage";
  comparison: "minimum" | "exact" | "maximum" | "range";
  rangeMax?: number;
  threshold?: number; // For percentage-based goals
}

export interface KeyholderAssignedGoal extends SessionGoal {
  keyholderNote?: string;
  canBeModified: boolean;
  modificationRequiresApproval: boolean;
  autoComplete: boolean;
}

export interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  category: GoalCategory;
  defaultTarget: GoalTarget;
  difficulty: GoalDifficulty;
  estimatedDuration: number; // in minutes
  prerequisites?: string[];
  tags: string[];
  isPopular: boolean;
}

export interface GoalProgress {
  goalId: string;
  currentValue: number;
  targetValue: number;
  progressPercentage: number;
  milestones: GoalMilestone[];
  lastUpdated: Date;
  velocity: number; // Progress per hour/day
  estimatedCompletion?: Date;
}

export interface GoalMilestone {
  id: string;
  goalId: string;
  name: string;
  threshold: number; // Percentage at which milestone is reached
  reached: boolean;
  reachedAt?: Date;
  reward?: string;
}

export interface GoalHistoryEntry {
  id: string;
  goalId: string;
  action: "created" | "updated" | "completed" | "abandoned" | "modified";
  timestamp: Date;
  details: Record<string, unknown>;
  performedBy: "submissive" | "keyholder" | "system";
}

export interface GoalAchievement {
  id: string;
  goalId: string;
  name: string;
  description: string;
  earnedAt: Date;
  category: string;
  points: number;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

export interface SessionGoalsState {
  activeGoals: SessionGoal[];
  goalTemplates: GoalTemplate[];
  progress: GoalProgress[];
  keyholderGoals: KeyholderAssignedGoal[];
  goalHistory: GoalHistoryEntry[];
  achievements: GoalAchievement[];
}

export interface CreateGoalRequest {
  type: GoalType;
  category: GoalCategory;
  target: GoalTarget;
  priority: GoalPriority;
  deadline?: Date;
  description?: string;
  tags?: string[];
  isRequired?: boolean;
}

export interface GoalCustomization {
  target?: Partial<GoalTarget>;
  deadline?: Date;
  priority?: GoalPriority;
  description?: string;
  tags?: string[];
}

export interface GoalSuggestion {
  templateId: string;
  name: string;
  description: string;
  reasonForSuggestion: string;
  confidence: number; // 0-100%
  basedOn: "history" | "preferences" | "keyholder" | "trending";
  customizations?: GoalCustomization;
}

export interface PredictiveGoalSuggestion {
  type: GoalType;
  suggestedTarget: GoalTarget;
  confidence: number;
  reasoning: string;
  basedOnData: string[];
}

export interface GoalAnalytics {
  completionRate: number;
  averageCompletionTime: number;
  mostSuccessfulCategories: GoalCategory[];
  challengingCategories: GoalCategory[];
  streakData: {
    current: number;
    best: number;
    type: string;
  };
  improvementTrends: {
    category: GoalCategory;
    trend: "improving" | "stable" | "declining";
    change: number; // percentage change
  }[];
}

export interface GoalCompletionStatus {
  goalId: string;
  isCompleted: boolean;
  completionPercentage: number;
  timeRemaining?: number;
  canComplete: boolean;
  blockers?: string[];
}

export interface ModificationRequest {
  id: string;
  goalId: string;
  requestedChanges: Partial<SessionGoal>;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  respondedAt?: Date;
  keyholderResponse?: string;
}

export type GoalType =
  | "duration"
  | "consistency"
  | "milestone"
  | "behavioral"
  | "performance"
  | "learning"
  | "custom";

export type GoalCategory =
  | "session_length"
  | "daily_goals"
  | "weekly_challenges"
  | "behavioral_improvement"
  | "skill_development"
  | "relationship_building"
  | "personal_growth";

export type GoalPriority = "low" | "medium" | "high" | "critical";

export type GoalStatus =
  | "active"
  | "paused"
  | "completed"
  | "abandoned"
  | "expired";

export type GoalDifficulty =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert";

// ==================== HOOK IMPLEMENTATION ====================
