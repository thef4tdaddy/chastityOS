/**
 * Event type definitions and enums for ChastityOS
 */
import { Timestamp } from "firebase/firestore";

// User-selectable event types for manual logging
export const USER_EVENT_TYPES = [
  "Orgasm (Self)",
  "Orgasm (Partner)",
  "Ruined Orgasm",
  "Edging",
  "Tease & Denial",
  "Play Session",
  "Hygiene",
  "Medication",
  "Mood Entry",
] as const;

export type UserEventType = (typeof USER_EVENT_TYPES)[number];

// System event types for programmatic logging
export enum SystemEventType {
  SESSION_START = "SESSION_START",
  SESSION_END = "SESSION_END",
  SESSION_PAUSE = "SESSION_PAUSE",
  SESSION_RESUME = "SESSION_RESUME",
  EMERGENCY_UNLOCK = "EMERGENCY_UNLOCK",
  PERSONAL_GOAL_SET = "PERSONAL_GOAL_SET",
  PERSONAL_GOAL_COMPLETED = "PERSONAL_GOAL_COMPLETED",
  PERSONAL_GOAL_REMOVED = "PERSONAL_GOAL_REMOVED",
  TASK_ADDED = "TASK_ADDED",
  TASK_COMPLETED = "TASK_COMPLETED",
  TASK_DELETED = "TASK_DELETED",
  KEYHOLDER_SESSION_LOCKED = "KEYHOLDER_SESSION_LOCKED",
  KEYHOLDER_SESSION_UNLOCKED = "KEYHOLDER_SESSION_UNLOCKED",
  KEYHOLDER_TASK_APPROVED = "KEYHOLDER_TASK_APPROVED",
  KEYHOLDER_TASK_REJECTED = "KEYHOLDER_TASK_REJECTED",
  SESSION_EDIT = "SESSION_EDIT",
}

// All possible event types
export type EventType = UserEventType | SystemEventType;

// Event type definitions with metadata
export interface EventTypeDefinition {
  name: string;
  mode: "kinky" | "vanilla";
  userSelectable: boolean;
  description?: string;
}

export const EVENT_TYPE_DEFINITIONS: EventTypeDefinition[] = [
  {
    name: "Orgasm (Self)",
    mode: "kinky",
    userSelectable: true,
    description: "Self-induced orgasm",
  },
  {
    name: "Orgasm (Partner)",
    mode: "kinky",
    userSelectable: true,
    description: "Partner-induced orgasm",
  },
  {
    name: "Ruined Orgasm",
    mode: "kinky",
    userSelectable: true,
    description: "Ruined or denied orgasm",
  },
  {
    name: "Edging",
    mode: "kinky",
    userSelectable: true,
    description: "Edging session",
  },
  {
    name: "Tease & Denial",
    mode: "kinky",
    userSelectable: true,
    description: "Tease and denial session",
  },
  {
    name: "Play Session",
    mode: "kinky",
    userSelectable: true,
    description: "General play session",
  },
  {
    name: "Hygiene",
    mode: "vanilla",
    userSelectable: true,
    description: "Hygiene-related removal",
  },
  {
    name: "Medication",
    mode: "vanilla",
    userSelectable: true,
    description: "Medical-related removal",
  },
  {
    name: "Mood Entry",
    mode: "vanilla",
    userSelectable: true,
    description: "Mood or journal entry",
  },
  {
    name: "Session Edit",
    mode: "vanilla",
    userSelectable: false,
    description: "System session edit",
  },
];

// Reason categories
export const REMOVAL_REASONS = [
  "Orgasm",
  "Medical",
  "Travel",
  "Other",
] as const;
export const PAUSE_REASONS = [
  "Cleaning",
  "Medical",
  "Exercise",
  "Other",
] as const;

// Emergency unlock reason categories
export const EMERGENCY_UNLOCK_REASONS = [
  "Medical Emergency",
  "Safety Concern", 
  "Equipment Malfunction",
  "Urgent Situation",
  "Other",
] as const;

export type RemovalReason = (typeof REMOVAL_REASONS)[number];
export type PauseReason = (typeof PAUSE_REASONS)[number];
export type EmergencyUnlockReason = (typeof EMERGENCY_UNLOCK_REASONS)[number];

// Event categories for organization
export interface EventCategory {
  category: string;
  events: UserEventType[];
}

export const EVENT_CATEGORIES: EventCategory[] = [
  {
    category: "Orgasm",
    events: ["Orgasm (Self)", "Orgasm (Partner)", "Ruined Orgasm"],
  },
  {
    category: "Sexual Activity",
    events: ["Edging", "Tease & Denial", "Play Session"],
  },
  {
    category: "General",
    events: ["Hygiene", "Medication", "Mood Entry"],
  },
];

// System event metadata
export const SYSTEM_EVENT_METADATA: Record<
  SystemEventType,
  { text: string; description?: string }
> = {
  [SystemEventType.SESSION_START]: {
    text: "Session Started",
    description: "Chastity session began",
  },
  [SystemEventType.SESSION_END]: {
    text: "Session Ended",
    description: "Chastity session ended",
  },
  [SystemEventType.SESSION_PAUSE]: {
    text: "Session Paused",
    description: "Chastity session paused",
  },
  [SystemEventType.SESSION_RESUME]: {
    text: "Session Resumed",
    description: "Chastity session resumed",
  },
  [SystemEventType.EMERGENCY_UNLOCK]: {
    text: "Emergency Unlock Used",
    description: "Emergency unlock activated",
  },
  [SystemEventType.PERSONAL_GOAL_SET]: {
    text: "Personal Goal Set",
    description: "New personal goal created",
  },
  [SystemEventType.PERSONAL_GOAL_COMPLETED]: {
    text: "Personal Goal Completed",
    description: "Personal goal achieved",
  },
  [SystemEventType.PERSONAL_GOAL_REMOVED]: {
    text: "Personal Goal Removed",
    description: "Personal goal deleted",
  },
  [SystemEventType.TASK_ADDED]: {
    text: "Task Added",
    description: "New task created",
  },
  [SystemEventType.TASK_COMPLETED]: {
    text: "Task Completed",
    description: "Task marked as completed",
  },
  [SystemEventType.TASK_DELETED]: {
    text: "Task Deleted",
    description: "Task removed",
  },
  [SystemEventType.KEYHOLDER_SESSION_LOCKED]: {
    text: "Session Locked by Keyholder",
    description: "Keyholder locked session",
  },
  [SystemEventType.KEYHOLDER_SESSION_UNLOCKED]: {
    text: "Session Unlocked by Keyholder",
    description: "Keyholder unlocked session",
  },
  [SystemEventType.KEYHOLDER_TASK_APPROVED]: {
    text: "Task Approved by Keyholder",
    description: "Keyholder approved task",
  },
  [SystemEventType.KEYHOLDER_TASK_REJECTED]: {
    text: "Task Rejected by Keyholder",
    description: "Keyholder rejected task",
  },
  [SystemEventType.SESSION_EDIT]: {
    text: "Session Edited",
    description: "Session details modified",
  },
};

// Session event interface
export interface SessionEvent {
  id?: string;
  type: EventType;
  timestamp: Timestamp;
  notes?: string;
  details?: Record<string, unknown>;
  userId: string;
  sessionId?: string;
}
