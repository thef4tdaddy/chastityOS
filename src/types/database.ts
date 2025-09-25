/**
 * Database Types for Dexie Local Storage
 * These types are optimized for local storage and sync operations
 */

export type SyncStatus = "synced" | "pending" | "conflict";
export type EventType =
  | "orgasm"
  | "sexual_activity"
  | "milestone"
  | "note"
  | "session_start"
  | "session_end"
  | "session_pause"
  | "session_resume";
export type TaskStatus =
  | "pending"
  | "submitted"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled";

// Achievement-related enums
export type AchievementCategory =
  | "session_milestones"
  | "consistency_badges"
  | "streak_achievements"
  | "goal_based"
  | "task_completion"
  | "special_achievements";

export type AchievementDifficulty =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary";

export interface DBBase {
  id: string;
  userId: string;
  syncStatus: SyncStatus;
  lastModified: Date;
}

export interface DBUser extends DBBase {
  email?: string;
  displayName?: string;
  role: "submissive" | "keyholder" | "both";
  profile: {
    submissiveName?: string;
    keyholderName?: string;
    timezone: string;
    preferences: {
      notifications: boolean;
      publicProfile: boolean;
      allowLinking: boolean;
    };
  };
  verification: {
    emailVerified: boolean;
    phoneVerified?: boolean;
    identityVerified?: boolean;
  };
  lastSync: Date;
  createdAt: Date;
}

export interface DBSession extends DBBase {
  startTime: Date;
  endTime?: Date;
  isPaused: boolean;
  pauseStartTime?: Date;
  accumulatedPauseTime: number; // in seconds
  goalDuration?: number; // in seconds
  isHardcoreMode: boolean;
  keyholderApprovalRequired: boolean;
  endReason?: string;
  notes?: string;
}

export interface DBEvent extends DBBase {
  sessionId?: string;
  type: EventType;
  timestamp: Date;
  details: {
    duration?: number;
    participants?: ("submissive" | "keyholder" | "other")[];
    notes?: string;
    mood?: string;
    intensity?: number;
    location?: string;
    tags?: string[];
  };
  isPrivate: boolean;
}

export interface DBTask extends DBBase {
  text: string;
  description?: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high" | "critical";
  assignedBy: "submissive" | "keyholder";
  createdAt: Date;
  dueDate?: Date;
  submittedAt?: Date;
  approvedAt?: Date;
  completedAt?: Date;
  submissiveNote?: string;
  keyholderFeedback?: string;
  consequence?: {
    type: "reward" | "punishment";
    duration?: number; // Additional/reduced chastity time in seconds
    description?: string;
  };
}

export interface DBGoal extends DBBase {
  type: "duration" | "task_completion" | "behavioral" | "milestone";
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string; // 'seconds', 'tasks', 'days', 'count'
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  dueDate?: Date;
  createdBy: "submissive" | "keyholder";
  isPublic: boolean;
}

export interface DBSettings extends DBBase {
  theme: "light" | "dark" | "auto";
  notifications: {
    enabled: boolean;
    sessionReminders: boolean;
    taskDeadlines: boolean;
    keyholderMessages: boolean;
    goalProgress: boolean;
    achievements: boolean; // New: Achievement notifications
  };
  privacy: {
    publicProfile: boolean;
    shareStatistics: boolean;
    allowDataExport: boolean;
    shareAchievements: boolean; // New: Achievement sharing
  };
  chastity: {
    allowEmergencyUnlock: boolean;
    emergencyUnlockCooldown: number; // hours
    requireKeyholderApproval: boolean;
    defaultSessionGoal: number; // seconds
    hardcoreModeEnabled: boolean;
  };
  display: {
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: "12h" | "24h";
    startOfWeek: "monday" | "sunday";
  };
  // New: Achievement settings
  achievements: {
    enableTracking: boolean;
    showProgress: boolean;
    enableNotifications: boolean;
  };
}

export interface SyncOperation {
  id: string;
  collection: string;
  operation: "create" | "update" | "delete";
  documentId: string;
  data?: Record<string, unknown>;
  timestamp: Date;
  retryCount: number;
  lastError?: string;
}

export interface ConflictRecord {
  id: string;
  collection: string;
  documentId: string;
  localData: Record<string, unknown>;
  remoteData: Record<string, unknown>;
  timestamp: Date;
  resolution?: "local" | "remote" | "merge";
}

export interface DBSyncMeta {
  collection: string;
  lastSync: Date;
  pendingOperations: SyncOperation[];
  conflicts: ConflictRecord[];
  totalDocuments: number;
  lastFullSync?: Date;
}

// Helper types for common query patterns
export interface SessionWithDuration extends DBSession {
  totalDuration: number; // calculated field
  effectiveDuration: number; // totalDuration - accumulatedPauseTime
}

export interface TaskWithStatus extends DBTask {
  isOverdue: boolean; // calculated field
  timeRemaining?: number; // calculated field in seconds
}

export interface GoalWithProgress extends DBGoal {
  progressPercentage: number; // calculated field
  isOverdue: boolean; // calculated field
}

// Query filter types
export interface SessionFilters {
  userId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  isActive?: boolean;
  minDuration?: number;
  maxDuration?: number;
}

export interface EventFilters {
  userId?: string;
  sessionId?: string;
  type?: EventType;
  dateRange?: {
    start: Date;
    end: Date;
  };
  isPrivate?: boolean;
}

export interface TaskFilters {
  userId?: string;
  status?: TaskStatus;
  priority?: "low" | "medium" | "high" | "critical";
  assignedBy?: "submissive" | "keyholder";
  isOverdue?: boolean;
  hasConsequence?: boolean;
}

export interface QueuedOperation<T extends DBBase> {
  id?: number;
  type: "create" | "update" | "delete";
  collectionName: string;
  payload: T;
  createdAt: Date;
}

// ==================== ACHIEVEMENT DATABASE TYPES ====================

export interface DBAchievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  difficulty: AchievementDifficulty;
  points: number;
  requirements: Array<{
    type:
      | "session_duration"
      | "session_count"
      | "streak_days"
      | "goal_completion"
      | "task_completion"
      | "special_condition";
    value: number;
    unit?: "seconds" | "days" | "count";
    condition?: string;
  }>;
  isHidden: boolean;
  rarity?: number;
  isActive: boolean; // Can be disabled/enabled
  syncStatus: SyncStatus;
  lastModified: Date;
}

export interface DBUserAchievement extends DBBase {
  achievementId: string;
  earnedAt: Date;
  progress: number;
  metadata?: Record<string, unknown>;
  isVisible: boolean;
}

export interface DBAchievementProgress extends DBBase {
  achievementId: string;
  currentValue: number;
  targetValue: number;
  isCompleted: boolean;
}

export interface DBAchievementNotification extends DBBase {
  achievementId: string;
  type: "earned" | "progress" | "milestone";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface DBLeaderboardEntry extends DBBase {
  category:
    | "total_chastity_time"
    | "longest_single_session"
    | "current_streak"
    | "achievement_points"
    | "session_count"
    | "goal_achievements";
  period: "this_week" | "this_month" | "this_year" | "all_time";
  value: number;
  rank: number;
  displayName: string;
  isAnonymous: boolean;
}
