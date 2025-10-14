/**
 * Relationship Types for Dual-Account Keyholder System
 * These types define the core data structures for managing
 * relationships between submissives and keyholders
 */
import { Timestamp } from "firebase/firestore";
import { UserRole } from "./core";

// ==================== RELATIONSHIP TYPES ====================

export enum RelationshipStatus {
  PENDING = "pending",
  ACTIVE = "active",
  PAUSED = "paused",
  ENDED = "ended",
}

export interface RelationshipPermissions {
  keyholderCanEdit: {
    sessions: boolean;
    tasks: boolean;
    goals: boolean;
    punishments: boolean;
    settings: boolean;
  };
  submissiveCanPause: boolean;
  emergencyUnlock: boolean;
  requireApproval: {
    sessionEnd: boolean;
    taskCompletion: boolean;
    goalChanges: boolean;
  };
}

export interface Relationship {
  id: string;
  submissiveId: string;
  keyholderId: string;
  status: RelationshipStatus;

  // Relationship metadata
  establishedAt: Timestamp;
  endedAt?: Timestamp;

  // Permissions and settings
  permissions: RelationshipPermissions;

  // Security
  keyholderPasswordHash?: string;

  // Relationship notes (encrypted)
  notes?: string;
  tags?: string[];

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==================== RELATIONSHIP REQUEST TYPES ====================

export enum RelationshipRequestStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  EXPIRED = "expired",
}

export interface RelationshipRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromRole: UserRole;
  toRole: UserRole;
  status: RelationshipRequestStatus;
  message?: string;
  createdAt: Timestamp;
  respondedAt?: Timestamp;
  expiresAt: Timestamp;
}

// ==================== ENHANCED USER TYPES ====================

export interface EnhancedUserProfile {
  submissiveName?: string;
  keyholderName?: string;
  bio?: string;
  location?: string;
  timezone: string;
  preferences: {
    notifications: boolean;
    publicProfile: boolean;
    allowLinking: boolean;
  };
}

export interface UserVerification {
  emailVerified: boolean;
  phoneVerified?: boolean;
  identityVerified?: boolean;
}

export interface EnhancedUser {
  uid: string;
  email: string;
  displayName: string;
  role: "submissive" | "keyholder" | "both";

  // Enhanced profile
  profile: EnhancedUserProfile;

  // Account verification
  verification: UserVerification;

  // Metadata
  createdAt: Timestamp;
  lastLogin: Timestamp;
}

// ==================== RELATIONSHIP-BASED DATA TYPES ====================

export interface RelationshipChastityData {
  relationshipId: string;
  submissiveId: string;
  keyholderId: string;

  // Current session
  currentSession: {
    id: string;
    isActive: boolean;
    startTime: Timestamp;
    pausedAt?: Timestamp;
    accumulatedPauseTime: number;
    keyholderApprovalRequired: boolean;
  };

  // Goals and requirements
  goals: {
    personal: {
      duration: number;
      type: "soft" | "hardcore";
      setBy: "submissive" | "keyholder";
    };
    keyholder: {
      minimumDuration: number;
      canBeModified: boolean;
    };
  };

  // Settings
  settings: {
    allowPausing: boolean;
    pauseCooldown: number;
    requireReasonForEnd: boolean;
    trackingEnabled: boolean;
  };

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==================== SESSION HISTORY ====================

export interface SessionEvent {
  type: "start" | "pause" | "resume" | "end";
  timestamp: Timestamp;
  reason?: string;
  initiatedBy: "submissive" | "keyholder" | "system";
}

export interface RelationshipSession {
  id: string;
  relationshipId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  duration: number;
  effectiveDuration: number; // Minus pause time

  // Session events
  events: SessionEvent[];

  // Status tracking
  goalMet: boolean;
  keyholderApproval: {
    required: boolean;
    granted?: boolean;
    grantedAt?: Timestamp;
  };

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==================== MULTI-USER TASKS ====================

export enum RelationshipTaskStatus {
  PENDING = "pending",
  SUBMITTED = "submitted",
  APPROVED = "approved",
  REJECTED = "rejected",
  COMPLETED = "completed",
}

export interface RelationshipTask {
  id: string;
  relationshipId: string;
  text: string;

  // Assignment
  assignedBy: "submissive" | "keyholder";
  assignedTo: "submissive"; // Tasks are for submissives
  createdAt: Timestamp;
  dueDate?: Timestamp;

  // Status and approval
  status: RelationshipTaskStatus;
  submittedAt?: Timestamp;
  approvedAt?: Timestamp;
  completedAt?: Timestamp;

  // Notes and communication
  submissiveNote?: string;
  keyholderFeedback?: string;

  // Consequences (rewards/punishments)
  consequence?: {
    type: "reward" | "punishment";
    duration?: number; // Additional/reduced chastity time
    description?: string;
  };

  // Metadata
  updatedAt: Timestamp;
}

// ==================== EVENT LOGS ====================

export interface RelationshipEvent {
  id: string;
  relationshipId: string;
  type: "orgasm" | "sexual_activity" | "milestone" | "note";
  timestamp: Timestamp;

  // Event details
  details: {
    duration?: number;
    participants?: ("submissive" | "keyholder" | "other")[];
    notes?: string;
    mood?: string;
  };

  // Logging
  loggedBy: "submissive" | "keyholder";
  isPrivate: boolean; // Visible only to logger
  tags?: string[];

  // Metadata
  createdAt: Timestamp;
}

// ==================== HELPER TYPES ====================

export interface DefaultRelationshipPermissions {
  keyholderCanEdit: {
    sessions: boolean;
    tasks: boolean;
    goals: boolean;
    punishments: boolean;
    settings: boolean;
  };
  submissiveCanPause: boolean;
  emergencyUnlock: boolean;
  requireApproval: {
    sessionEnd: boolean;
    taskCompletion: boolean;
    goalChanges: boolean;
  };
}

// Factory function type for creating default permissions
export type CreateDefaultPermissions = () => DefaultRelationshipPermissions;
