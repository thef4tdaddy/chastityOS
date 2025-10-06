import { Timestamp, FieldValue } from "firebase/firestore";

// Re-export types from core module
export type {
  User,
  UserRole,
  UserProfile,
  UserVerification,
  UserSettings,
  ChastitySession,
  SessionStatus,
  Task,
  TaskStatus,
  TaskPriority,
  TaskConsequence,
  PersonalGoal,
  SpecialChallengeType,
  KeyholderRelationship,
  KeyholderPermissions,
  KeyholderRule,
  SessionStats,
  TaskStats,
  ApiResponse,
  PaginatedResponse,
  AppSettings,
  LoginForm,
  RegisterForm,
  SessionForm,
  TaskForm,
  EventLogForm,
} from "./core";

// Re-export types from achievements module
export type {
  AchievementRequirement,
  Achievement,
  UserAchievement,
  AchievementProgress,
  LeaderboardEntry,
  LeaderboardPrivacy,
  AchievementNotification,
  AchievementStats,
  AchievementExportData,
} from "./achievements";

// Re-export enums from achievements module (these are values, not types)
export {
  AchievementCategory,
  AchievementDifficulty,
  LeaderboardCategory,
  LeaderboardPeriod,
} from "./achievements";

// Re-export types from database module
export type {
  SyncStatus,
  EventType,
  TaskStatus as DBTaskStatus,
  AchievementCategory as DBAchievementCategory,
  AchievementDifficulty as DBAchievementDifficulty,
  DBBase,
  DBUser,
  DBSession,
  DBEvent,
  DBTask,
  DBGoal,
  DBSettings,
  Task as DBTaskAlias,
  SyncOperation,
  ConflictRecord,
  DBSyncMeta,
  SessionWithDuration,
  TaskWithStatus,
  GoalWithProgress,
  SessionFilters,
  EventFilters,
  TaskFilters,
  QueuedOperation,
  SyncOptions,
  SyncResult,
  ConflictInfo,
  SettingsConflict,
  DBAchievement,
  DBUserAchievement,
  DBAchievementProgress,
  DBAchievementNotification,
  DBLeaderboardEntry,
} from "./database";

// Re-export types from relationships module
export type {
  RelationshipPermissions,
  Relationship,
  RelationshipRequest,
  EnhancedUserProfile,
  UserVerification as RelationshipUserVerification,
  EnhancedUser,
  RelationshipChastityData,
  SessionEvent,
  RelationshipSession,
  RelationshipTask,
  RelationshipEvent,
  DefaultRelationshipPermissions,
  CreateDefaultPermissions,
} from "./relationships";

// Re-export enums from relationships module (these are values, not types)
export {
  RelationshipStatus,
  RelationshipRequestStatus,
  RelationshipTaskStatus,
} from "./relationships";

// Re-export enums from core module (these are values, not types)
export {
  UserRole,
  SessionStatus,
  TaskStatus,
  TaskPriority,
  SpecialChallengeType,
} from "./core";

// User and authentication types (legacy - keeping for backwards compatibility)
export interface UserCompat {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  isAnonymous: boolean;
}

export interface UserData {
  savedSubmissivesName?: string;
  keyholderName?: string;
  isKeyholderControlsLocked?: boolean;
  requiredKeyholderDurationSeconds?: number;
  isTrackingAllowed?: boolean;
  [key: string]: unknown;
}

// Task-related types
export interface RewardPunishment {
  type: "time" | "note" | "none";
  value: number | string;
}

export interface Task {
  id: string;
  text: string;
  status: "pending" | "submitted" | "approved" | "rejected";
  deadline?: Date | null;
  reward?: RewardPunishment;
  punishment?: RewardPunishment;
  createdAt?: Date | null;
  submittedAt?: Date | null;
  note?: string;
  logType?: "reward" | "punishment";
  sourceText?: string;
  timeChangeSeconds?: number;
}

export interface TaskData {
  text: string;
  deadline?: Date | null;
  reward?: RewardPunishment;
  punishment?: RewardPunishment;
  logType?: string;
  sourceText?: string;
  note?: string;
  timeChangeSeconds?: number;
  createdAt?: Timestamp | FieldValue;
}

// Session-related types
export interface SessionData {
  cageOnTime?: Date | null;
  isCageOn?: boolean;
  timeInChastity?: number;
  timeCageOff?: number;
  totalChastityTime?: number;
  totalTimeCageOff?: number;
  hasSessionEverBeenActive?: boolean;
  isPaused?: boolean;
  pauseStartTime?: Date | null;
  accumulatedPauseTimeThisSession?: number;
  currentSessionPauseEvents?: PauseEvent[];
  requiredKeyholderDurationSeconds?: number;
  isKeyholderControlsLocked?: boolean;
  [key: string]: unknown;
}

export interface PauseEvent {
  id: string;
  startTime: Date;
  endTime?: Date;
  reason?: string;
  duration?: number;
}

// Keyholder-related types
export interface KeyholderSession {
  keyholderName?: string;
  isActive: boolean;
  startTime?: Date;
  endTime?: Date;
  permissions: KeyholderPermissions;
}

export interface KeyholderPermissions {
  canApproveTasks: boolean;
  canAddPunishments: boolean;
  canAddRewards: boolean;
  canModifyDuration: boolean;
  canLockControls: boolean;
}

export interface KeyholderReward {
  type: "time" | "note" | "other";
  timeSeconds?: number;
  note?: string;
  other?: string;
}

export interface KeyholderPunishment {
  type: "time" | "note" | "other";
  timeSeconds?: number;
  note?: string;
  other?: string;
}

export interface AdminSession {
  userId: string;
  isAdmin: boolean;
  permissions: AdminPermissions;
  sessionStart: Date;
  lastActivity: Date;
}

export interface AdminPermissions {
  canManageUsers: boolean;
  canViewAllSessions: boolean;
  canModifySettings: boolean;
  canAccessLogs: boolean;
}

// Utility types for Firebase operations
export interface FirestoreTimestamp {
  toDate(): Date;
}

// Hook return types
export interface UseTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  addTask: (taskData: TaskData) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

export interface UseSessionReturn {
  sessionData: SessionData;
  updateSession: (data: Partial<SessionData>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
