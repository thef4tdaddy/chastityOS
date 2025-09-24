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
  };
  privacy: {
    publicProfile: boolean;
    shareStatistics: boolean;
    allowDataExport: boolean;
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
