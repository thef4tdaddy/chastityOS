/**
 * Core Types for Enhanced Hooks System
 */

// Base user and relationship types
export interface UserInfo {
  id: string;
  email?: string;
  name?: string;
}

export interface KeyholderInfo extends UserInfo {
  permissions: KeyholderPermission[];
  relationshipStartDate: Date;
}

export interface RelationshipInfo {
  id: string;
  submissiveId: string;
  keyholderId: string;
  status: 'active' | 'pending' | 'paused' | 'ended';
  permissions: RelationshipPermission[];
  createdAt: Date;
  updatedAt: Date;
}

// Permission types
export type KeyholderPermission = 
  | 'modify_session'
  | 'override_cooldown' 
  | 'force_pause'
  | 'force_resume'
  | 'assign_goals'
  | 'view_history'
  | 'emergency_control';

export type RelationshipPermission = KeyholderPermission;

export type SessionPermission = 
  | 'self_modify'
  | 'emergency_pause'
  | 'set_goals'
  | 'view_analytics'
  | 'modify_session'
  | 'override_cooldown';

// Session types
export interface SessionState {
  id: string;
  userId: string;
  isActive: boolean;
  startTime: Date;
  endTime?: Date;
  duration: number; // seconds
  effectiveDuration: number; // duration minus pauses
  pauseTime: number; // total pause time
  goals: string[]; // goal IDs
  type: SessionType;
  status: SessionStatus;
}

export type SessionType = 'self_managed' | 'keyholder_managed' | 'collaborative';
export type SessionStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface SessionContext {
  userId: string;
  relationshipId?: string;
  sessionType: SessionType;
  permissions: SessionPermission[];
}

// Goal types
export interface SessionGoal {
  id: string;
  type: GoalType;
  category: GoalCategory;
  target: GoalTarget;
  current: number;
  progress: number; // 0-100%
  assignedBy: 'self' | 'keyholder';
  isRequired: boolean;
  deadline?: Date;
  priority: GoalPriority;
  createdAt: Date;
  updatedAt: Date;
}

export type GoalType = 'duration' | 'frequency' | 'streak' | 'milestone' | 'behavioral';
export type GoalCategory = 'endurance' | 'discipline' | 'training' | 'punishment' | 'reward';
export type GoalPriority = 'low' | 'medium' | 'high' | 'critical';

export interface GoalTarget {
  value: number;
  unit: 'minutes' | 'hours' | 'days' | 'sessions' | 'tasks';
  comparison: 'minimum' | 'exact' | 'maximum' | 'range';
  rangeMax?: number;
}

// Pause types
export interface PauseStatus {
  isPaused: boolean;
  startTime?: Date;
  reason?: string;
  requestedBy: 'user' | 'keyholder' | 'system';
  emergencyPause: boolean;
}

export interface CooldownState {
  isInCooldown: boolean;
  cooldownRemaining: number; // seconds
  nextPauseAvailable: Date | null;
  cooldownReason: CooldownReason;
  canOverride: boolean;
}

export type CooldownReason = 'frequent_use' | 'keyholder_restriction' | 'goal_enforcement' | 'system_limit';

// Analytics and history types
export interface SessionAnalytics {
  totalSessions: number;
  averageDuration: number;
  completionRate: number;
  goalAchievementRate: number;
  trends: TrendData[];
}

export interface TrendData {
  period: string;
  value: number;
  change: number;
  type: 'duration' | 'frequency' | 'completion' | 'satisfaction';
}

// Data sync types
export interface SyncStatus {
  state: 'idle' | 'syncing' | 'error' | 'conflict';
  lastSync: Date | null;
  progress?: number;
  error?: string;
}

export interface DataConflict {
  id: string;
  type: ConflictType;
  entity: DataEntity;
  localVersion: any;
  remoteVersion: any;
  keyholderVersion?: any;
  resolutionStrategy: ConflictResolutionStrategy;
  priority: ConflictPriority;
}

export type ConflictType = 'modification' | 'deletion' | 'creation' | 'permission';
export type DataEntity = 'session' | 'goal' | 'settings' | 'history';
export type ConflictResolutionStrategy = 'local_wins' | 'remote_wins' | 'keyholder_wins' | 'merge' | 'manual';
export type ConflictPriority = 'low' | 'medium' | 'high' | 'critical';

// Request types for keyholder interactions
export interface ModificationRequest {
  id: string;
  type: 'goal_change' | 'session_end' | 'cooldown_override' | 'emergency_pause';
  requesterId: string;
  targetId: string; // goal ID, session ID, etc.
  reason: string;
  requestedChanges: any;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  response?: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';