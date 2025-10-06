/**
 * Core type definitions for ChastityOS
 */
import { Timestamp } from "firebase/firestore";
import { SessionEvent, EventType, RemovalReason, PauseReason } from "./events";

// ==================== USER TYPES ====================

export enum UserRole {
  SUBMISSIVE = "submissive",
  KEYHOLDER = "keyholder",
  BOTH = "both",
}

export interface UserProfile {
  submissiveName?: string;
  keyholderName?: string;
  bio?: string;
  location?: string;
  age?: number;
  isPublicProfileEnabled: boolean;
  profileToken?: string;
}

export interface UserVerification {
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  backupCodes?: string[];
}

export interface UserSettings {
  theme: "light" | "dark" | "auto";
  notifications: boolean;
  vanillaMode: boolean;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: "12h" | "24h";
}

export interface User {
  uid: string;
  email?: string;
  displayName?: string;
  role: UserRole;
  profile: UserProfile;
  verification: UserVerification;
  settings: UserSettings;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  isPremium: boolean;
  subscriptionStatus?: "active" | "cancelled" | "expired";
  isAnonymous?: boolean; // True for anonymous Firebase Auth users
}

// ==================== SESSION TYPES ====================

export enum SessionStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  ENDED = "ended",
  LOCKED = "locked", // Locked by keyholder
}

export interface ChastitySession {
  id: string;
  userId: string;
  status: SessionStatus;
  startTime: Timestamp;
  endTime?: Timestamp;

  // Pause tracking
  isPaused: boolean;
  pauseStartTime?: Timestamp;
  pauseReason?: PauseReason;
  accumulatedPauseTime: number; // in seconds

  // Time tracking
  goalDuration?: number; // in seconds
  actualDuration?: number; // in seconds (calculated)

  // Session modes
  isHardcoreMode: boolean;
  isKeyholderLocked: boolean;
  keyholderUserId?: string;

  // Session data
  events: SessionEvent[];
  notes?: string;
  removalReason?: RemovalReason;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==================== TASK TYPES ====================

export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  SUBMITTED = "submitted",
  APPROVED = "approved",
  REJECTED = "rejected",
  COMPLETED = "completed",
  OVERDUE = "overdue",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export interface TaskConsequence {
  type: "reward" | "punishment";
  description: string;
  points?: number;
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

export interface Task {
  id: string;
  userId: string;
  keyholderUserId?: string;

  // Task content
  title: string;
  description?: string;
  category?: string;

  // Status and assignment
  status: TaskStatus;
  priority: TaskPriority;
  assignedBy: "submissive" | "keyholder";

  // Timing
  createdAt: Timestamp;
  dueDate?: Timestamp;
  submittedAt?: Timestamp;
  approvedAt?: Timestamp;
  completedAt?: Timestamp;

  // Feedback
  submissiveNote?: string;
  keyholderFeedback?: string;

  // Consequences
  consequence?: TaskConsequence;
  pointsAwarded?: number;

  // Metadata
  isRecurring: boolean;
  recurringPattern?: string;
  attachments?: string[];

  // Recurring configuration
  recurringConfig?: RecurringConfig;
  recurringSeriesId?: string; // Same ID for all instances in series
}

// ==================== GOAL TYPES ====================

export enum SpecialChallengeType {
  LOCKTOBER = "locktober",
  NO_NUT_NOVEMBER = "no_nut_november",
}

export interface PersonalGoal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetDuration: number; // in seconds
  currentProgress: number; // in seconds
  isCompleted: boolean;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  reward?: string;
  // Special challenge properties
  isSpecialChallenge?: boolean;
  challengeType?: SpecialChallengeType;
  challengeYear?: number;
}

// ==================== KEYHOLDER TYPES ====================

export interface KeyholderRelationship {
  id: string;
  submissiveUserId: string;
  keyholderUserId: string;
  status: "pending" | "active" | "suspended" | "ended";
  permissions: KeyholderPermissions;
  createdAt: Date;
  acceptedAt?: Date;
  endedAt?: Date;
}

export interface KeyholderPermissions {
  canLockSessions: boolean;
  canUnlockSessions: boolean;
  canCreateTasks: boolean;
  canApproveTasks: boolean;
  canViewFullHistory: boolean;
  canEditGoals: boolean;
  canSetRules: boolean;
}

export interface KeyholderRule {
  id: string;
  keyholderUserId: string;
  submissiveUserId: string;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: Timestamp;
  consequences?: TaskConsequence[];
  syncStatus: "pending" | "synced" | "error";
  lastModified: Date;
}

// ==================== ANALYTICS TYPES ====================

export interface SessionStats {
  totalSessions: number;
  totalChastityTime: number; // in seconds
  totalPauseTime: number; // in seconds
  averageSessionDuration: number; // in seconds
  longestSession: number; // in seconds
  shortestSession: number; // in seconds
  currentStreak: number; // in days
  bestStreak: number; // in days
}

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  approvedTasks: number;
  rejectedTasks: number;
  overdueTasks: number;
  completionRate: number; // percentage
  averageCompletionTime: number; // in hours
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  error?: string;
}

// ==================== UI STATE TYPES ====================

export interface AppSettings {
  id?: number;
  theme: "light" | "dark" | "auto";
  notifications: boolean;
  language: string;
  colorScheme: "production" | "nightly";
}

// ==================== FORM TYPES ====================

export interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  role: UserRole;
  agreeToTerms: boolean;
}

export interface SessionForm {
  goalDuration?: number;
  isHardcoreMode: boolean;
  notes?: string;
  startImmediately: boolean;
}

export interface TaskForm {
  title: string;
  description?: string;
  category?: string;
  priority: TaskPriority;
  dueDate?: Date;
  consequence?: TaskConsequence;
}

export interface EventLogForm {
  type: EventType;
  notes?: string;
  timestamp?: Date;
}
