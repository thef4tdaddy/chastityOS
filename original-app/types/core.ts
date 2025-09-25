import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email?: string;
  displayName?: string;
  role: UserRole;
  profile: UserProfile;
  verification: UserVerification;
  createdAt: Timestamp;
  lastLogin: Timestamp;
}

// Define dummy interfaces for missing types to avoid errors
export interface UserProfile {}
export interface UserVerification {}

export interface ChastitySession {
  id: string;
  userId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  isPaused: boolean;
  pauseStartTime?: Timestamp;
  accumulatedPauseTime: number;
  goalDuration?: number;
  isHardcoreMode: boolean;
  events: SessionEvent[];
}

export interface SessionEvent {
  type: EventType;
  timestamp: Timestamp;
  notes?: string;
}

export interface Task {
  id: string;
  userId: string;
  text: string;
  status: TaskStatus;
  assignedBy: 'submissive' | 'keyholder';
  createdAt: Timestamp;
  dueDate?: Timestamp;
  submittedAt?: Timestamp;
  approvedAt?: Timestamp;
  submissiveNote?: string;
  keyholderFeedback?: string;
  consequence?: TaskConsequence;
}

// Define dummy interface for missing type
export interface TaskConsequence {}

export type TaskStatus = 'pending' | 'submitted' | 'approved' | 'rejected' | 'completed';
export type UserRole = 'submissive' | 'keyholder' | 'both';
export type EventType = 'cage_on' | 'cage_off' | 'pause_start' | 'pause_end' | 'orgasm' | 'sexual_activity';
