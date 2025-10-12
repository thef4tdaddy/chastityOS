/**
 * Database Types for Dexie Local Storage
 * These types are optimized for local storage and sync operations
 */

import type {
  AchievementCategory,
  AchievementDifficulty,
} from "./achievements";

export type SyncStatus = "synced" | "pending" | "conflict";
export type EventType = string;
export type TaskStatus =
  | "pending"
  | "submitted"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled";

// Re-export achievement types for consistency
export type { AchievementCategory, AchievementDifficulty };

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
  isEmergencyUnlock?: boolean; // Flag for emergency unlock sessions
  emergencyReason?: string; // Reason for emergency unlock
  emergencyNotes?: string; // Additional notes for emergency unlock
  hasLockCombination?: boolean; // True if lock combination was saved for this session
  emergencyPinUsed?: boolean; // True if emergency PIN was used to unlock this session
}

export interface DBEvent extends DBBase {
  sessionId?: string;
  type: EventType;
  timestamp: Date;
  details: {
    // Generic event properties
    action?: string;
    title?: string;
    description?: string;
    metadata?: Record<string, unknown>;
    // Session/activity properties
    duration?: number;
    participants?: ("submissive" | "keyholder" | "other")[];
    notes?: string;
    mood?: string;
    intensity?: number;
    location?: string;
    tags?: string[];
    // Additional properties for emergency/session events
    endReason?: string;
    emergencyReason?: string;
    emergencyNotes?: string;
    pauseReason?: string;
    pauseDuration?: number;
    sessionDuration?: number;
    wasHardcoreMode?: boolean;
    wasKeyholderControlled?: boolean;
    accumulatedPauseTime?: number;
  };
  isPrivate: boolean;
  [key: string]: unknown;
}

export interface RecurringConfig {
  frequency: "daily" | "weekly" | "monthly" | "custom";
  interval?: number; // For custom: every N days/weeks/months
  daysOfWeek?: number[]; // For weekly: [0=Sun, 1=Mon, ..., 6=Sat]
  dayOfMonth?: number; // For monthly: day of month (1-31)
  nextDueDate?: Date; // Calculated next due date
  parentTaskId?: string; // Link to original recurring task
  instanceNumber?: number; // Which instance in the series
}

export interface DBTask extends DBBase {
  text: string;
  title?: string; // Optional title field for tasks
  description?: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high" | "critical";
  assignedBy: "submissive" | "keyholder";
  category?: string; // Optional category for task organization
  createdAt: Date;
  updatedAt?: Date;
  dueDate?: Date;
  deadline?: Date; // Alternative deadline field name
  submittedAt?: Date;
  approvedAt?: Date;
  completedAt?: Date;
  submissiveNote?: string;
  keyholderFeedback?: string;
  attachments?: string[]; // Photo/file evidence URLs
  consequence?: {
    type: "reward" | "punishment";
    duration?: number; // Additional/reduced chastity time in seconds
    description?: string;
  };
  isRecurring?: boolean;
  recurringConfig?: RecurringConfig;
  recurringSeriesId?: string; // Same ID for all instances in series
  // Points system fields
  pointValue?: number; // Points awarded for completion
  pointsAwarded?: boolean; // Flag to prevent duplicate awards
  pointsAwardedAt?: Date; // When points were awarded
}

export interface DBGoal extends DBBase {
  type:
    | "duration"
    | "task_completion"
    | "behavioral"
    | "milestone"
    | "special_challenge";
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  progress?: number; // Progress as percentage (0-100)
  unit: string; // 'seconds', 'tasks', 'days', 'count'
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  dueDate?: Date;
  createdBy: "submissive" | "keyholder";
  isPublic: boolean;
  // Special challenge fields
  challengeType?: "locktober" | "no_nut_november";
  challengeYear?: number;
  isSpecialChallenge?: boolean;
  // Hardcore mode fields
  isHardcoreMode?: boolean; // True if this is a hardcore mode goal
  requiresEmergencyPin?: boolean; // True if emergency PIN is required for this goal
}

export interface DBSettings extends DBBase {
  theme: "light" | "dark" | "auto" | "system";
  eventDisplayMode?: string;
  twoFactorEnabled?: boolean;
  updatedAt?: Date;
  notifications:
    | {
        enabled: boolean;
        sessionReminders: boolean;
        taskDeadlines: boolean;
        keyholderMessages: boolean;
        goalProgress: boolean;
        achievements: boolean; // Achievement notifications
        // Task notification settings
        tasks?: {
          assigned: boolean;
          submitted: boolean;
          approved: boolean;
          rejected: boolean;
          deadlineApproaching: boolean;
          overdue: boolean;
        };
        pushEnabled?: boolean; // Future: Enable push notifications
      }
    | boolean; // Allow both nested object and simple boolean for backwards compatibility
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

  // Flat properties for compatibility with useSettings.ts
  // User Profile / Account
  displayName?: string;
  email?: string;
  submissiveName?: string; // Submissive's display name
  timezone?: string;
  language?: string;

  // UI Preferences
  fontSize?: string | number;
  animations?: boolean;

  // Privacy Settings (flat versions)
  publicProfile?: boolean;
  profileVisibility?: string;
  showStats?: boolean;
  showAchievements?: boolean;
  accountDiscoverable?: boolean; // Can other users find this account
  showActivityStatus?: boolean; // Show online/active status

  // Profile settings
  bio?: string; // User bio/description
  profileImageUrl?: string; // User profile image URL
  shareStatistics?: boolean; // Share statistics publicly

  // Goal Settings
  defaultGoalDuration?: number;
  allowKeyholderOverride?: boolean;
  goalReminders?: boolean;
  progressSharing?: string | boolean;

  // Data & Privacy (flat versions)
  dataCollection?: boolean;
  analytics?: boolean;
  crashReporting?: boolean;
  locationTracking?: boolean;

  // Backup Settings
  autoBackup?: boolean;
  backupFrequency?: string;
  dataRetention?: number;
  exportFormat?: string;

  // Security
  sessionTimeout?: number;
  requirePasswordForSensitive?: boolean;
  emergencyContacts?: string[];

  // Additional settings from useSettings.ts
  advancedLogging?: boolean;
  betaFeatures?: boolean;
  developmentMode?: boolean;
  keyholderLinked?: boolean;
  keyholderPermissions?: {
    viewTasks: boolean;
    assignTasks: boolean;
    viewSessions: boolean;
    controlSessions: boolean;
    viewEvents: boolean;
    viewSettings: boolean;
    modifySettings: boolean;
  };

  // Additional timestamp properties used in useSettings.ts
  createdAt?: Date;
}

// Alias for compatibility
export type UserSettings = DBSettings;

// Alias for Task compatibility
export type Task = DBTask;

/**
 * Release Request Type
 * For "Beg for Release" workflow between submissives and keyholders
 */
export interface DBReleaseRequest {
  id: string;
  submissiveUserId: string;
  keyholderUserId: string;
  sessionId: string;
  requestedAt: Date;
  status: "pending" | "approved" | "denied";
  approvedAt?: Date;
  deniedAt?: Date;
  reason?: string; // Submissive's reason for request
  keyholderResponse?: string; // Keyholder's response message
  syncStatus: SyncStatus;
  lastModified: Date;
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

// User Stats type for tracking points and task completion
export interface DBUserStats extends DBBase {
  totalPoints: number;
  tasksCompleted: number;
  tasksApproved: number;
  tasksRejected: number;
  currentStreak: number; // Days of consecutive task completion
  longestStreak: number; // Longest streak achieved
  lastTaskCompletedAt?: Date;
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
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  isPrivate?: boolean;
}

export interface TaskFilters {
  userId?: string;
  status?: TaskStatus;
  priority?: "low" | "medium" | "high" | "critical";
  assignedBy?: "submissive" | "keyholder";
  category?: string;
  dueDate?: {
    start?: Date;
    end?: Date;
  };
  isOverdue?: boolean;
  hasConsequence?: boolean;
}

export interface QueuedOperation<T extends DBBase> {
  id?: number;
  type: "create" | "update" | "delete";
  collectionName: string;
  payload: T;
  userId: string;
  createdAt: Date;
  retryCount?: number;
  lastRetryAt?: Date;
}

// Sync operation types and interfaces
export interface SyncOptions {
  force?: boolean;
  collections?: string[];
  conflictResolution?: "auto" | "manual";
}

export interface SyncResult {
  success: boolean;
  operations: {
    uploaded: number;
    downloaded: number;
    conflicts: number;
  };
  conflicts: ConflictInfo[];
  error?: Error;
  timestamp: Date;
}

export interface ConflictInfo {
  type: "upload_conflict" | "download_conflict" | "settings_conflict";
  collection: string;
  documentId: string;
  localData: Record<string, unknown>;
  remoteData: Record<string, unknown>;
  detectedAt: Date;
  resolution?: "local" | "remote" | "merge" | "pending";
}

export interface SettingsConflict {
  field: string;
  localValue: unknown;
  remoteValue: unknown;
  localTimestamp: Date;
  remoteTimestamp: Date;
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
  displayNameType: "real" | "username" | "anonymous";
  isAnonymous: boolean;
}
