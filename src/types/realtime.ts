/**
 * Real-time communication and synchronization type definitions for ChastityOS
 */

// ==================== REAL-TIME SYNC TYPES ====================

export enum ConnectionStatus {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  RECONNECTING = "reconnecting",
  ERROR = "error",
}

export enum ChannelType {
  USER = "user",
  RELATIONSHIP = "relationship",
  SESSION = "session",
  TASK = "task",
  NOTIFICATION = "notification",
  SYSTEM = "system",
}

export interface SyncChannel {
  id: string;
  type: ChannelType;
  participants: string[];
  lastActivity: Date;
  isActive: boolean;
  encryptionEnabled: boolean;
}

export interface RealtimeUpdate {
  id: string;
  type: string;
  data: unknown;
  timestamp: Date;
  userId: string;
  channelId: string;
}

export interface RealtimeDataState {
  [key: string]: unknown;
}

export interface RealtimeSyncMetrics {
  lastSuccessfulSync: Date;
  syncErrors: number;
  messagesReceived: number;
  messagesSent: number;
  averageLatency: number;
  connectionUptime: number;
}

export interface Subscription {
  id: string;
  dataType: string;
  callback: UpdateCallback;
  isActive: boolean;
  created: Date;
}

export type UpdateCallback = (update: RealtimeUpdate) => void;

export interface RealtimeSyncState {
  connectionStatus: ConnectionStatus;
  activeChannels: SyncChannel[];
  realtimeData: RealtimeDataState;
  syncMetrics: RealtimeSyncMetrics;
}

// ==================== NOTIFICATION TYPES ====================

export enum NotificationType {
  INFO = "info",
  SUCCESS = "success",
  WARNING = "warning",
  ERROR = "error",
  TASK_ASSIGNED = "task_assigned",
  TASK_APPROVED = "task_approved",
  TASK_REJECTED = "task_rejected",
  SESSION_STARTED = "session_started",
  SESSION_ENDED = "session_ended",
  RELATIONSHIP_REQUEST = "relationship_request",
  RELATIONSHIP_ACCEPTED = "relationship_accepted",
  KEYHOLDER_MESSAGE = "keyholder_message",
  SYSTEM_ALERT = "system_alert",
}

export enum NotificationPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export enum NotificationChannelType {
  IN_APP = "in_app",
  PUSH = "push",
  EMAIL = "email",
  SMS = "sms",
  WEBHOOK = "webhook",
}

export interface NotificationChannel {
  type: NotificationChannelType;
  enabled: boolean;
  settings: NotificationChannelSettings;
}

export interface NotificationChannelSettings {
  [setting: string]: unknown;
  // Email settings
  emailAddress?: string;
  // Push settings
  endpoint?: string;
  // SMS settings
  phoneNumber?: string;
  // Webhook settings
  url?: string;
  headers?: Record<string, string>;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  timestamp: Date;
  isRead: boolean;
  userId: string;

  // Optional metadata
  actionUrl?: string;
  actionText?: string;
  imageUrl?: string;
  category?: string;
  expiresAt?: Date;

  // Relationship context
  relationshipId?: string;
  keyholderUserId?: string;

  // Rich content
  data?: Record<string, unknown>;
}

export interface NotificationPreferences {
  channels: NotificationChannel[];
  quietHours: QuietHours;
  categories: NotificationCategoryPreference[];
  globalEnabled: boolean;
}

export interface QuietHours {
  enabled: boolean;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  timezone: string;
  days: number[]; // 0-6, Sunday is 0
}

export interface NotificationCategoryPreference {
  category: NotificationType;
  enabled: boolean;
  channels: NotificationChannelType[];
  priority: NotificationPriority;
}

export interface NotificationHistoryEntry {
  notification: Notification;
  deliveryStatus: NotificationDeliveryStatus;
  deliveredAt?: Date;
  readAt?: Date;
  actionTakenAt?: Date;
}

export interface NotificationDeliveryStatus {
  [key in NotificationChannelType]?: {
    status: "pending" | "sent" | "delivered" | "failed";
    timestamp: Date;
    error?: string;
  };
}

export interface NotificationState {
  notifications: Notification[];
  preferences: NotificationPreferences;
  deliveryChannels: NotificationChannel[];
  notificationHistory: NotificationHistoryEntry[];
}

// ==================== PRESENCE TYPES ====================

export enum PresenceStatus {
  ONLINE = "online",
  OFFLINE = "offline",
  AWAY = "away",
  BUSY = "busy",
  IN_SESSION = "in_session",
}

export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  lastSeen: Date;
  customMessage?: string;

  // Activity context
  currentActivity?: ActivityContext;

  // Session context
  isInChastitySession?: boolean;
  sessionStartTime?: Date;

  // Device info
  deviceType?: "desktop" | "mobile" | "tablet";
  platform?: string;
}

export interface ActivityContext {
  type: "viewing_page" | "editing" | "in_call" | "typing";
  details?: string;
  timestamp: Date;
}

export interface PresenceSubscription {
  userIds: string[];
  callback: (presences: UserPresence[]) => void;
  isActive: boolean;
}

export interface PresenceState {
  userPresences: Record<string, UserPresence>;
  subscriptions: PresenceSubscription[];
  ownPresence: UserPresence;
}

// ==================== LIVE TIMER TYPES ====================

export enum TimerType {
  CHASTITY_SESSION = "chastity_session",
  TASK_DEADLINE = "task_deadline",
  PUNISHMENT_DURATION = "punishment_duration",
  KEYHOLDER_CONTROL = "keyholder_control",
}

export enum TimerStatus {
  RUNNING = "running",
  PAUSED = "paused",
  STOPPED = "stopped",
  COMPLETED = "completed",
}

export interface LiveTimer {
  id: string;
  type: TimerType;
  status: TimerStatus;

  // Time tracking
  startTime: Date;
  endTime?: Date;
  currentTime: Date;
  duration: number; // total duration in seconds
  elapsed: number; // elapsed time in seconds
  remaining: number; // remaining time in seconds

  // Pause tracking
  isPaused: boolean;
  pausedAt?: Date;
  totalPauseTime: number; // total pause time in seconds

  // Context
  userId: string;
  relationshipId?: string;
  sessionId?: string;
  taskId?: string;

  // Display
  title: string;
  description?: string;

  // Permissions
  canPause: boolean;
  canStop: boolean;
  canExtend: boolean;

  // Keyholder control
  isKeyholderControlled: boolean;
  keyholderUserId?: string;
}

export interface TimerSync {
  timerId: string;
  lastSync: Date;
  serverTime: Date;
  clientOffset: number; // ms difference between client and server
  syncAccuracy: number; // confidence in sync accuracy (0-1)
}

export interface TimerEvent {
  id: string;
  timerId: string;
  type: "start" | "pause" | "resume" | "stop" | "complete" | "extend";
  timestamp: Date;
  userId: string;
  data?: unknown;
}

export interface TimerSubscription {
  timerId: string;
  callback: (timer: LiveTimer) => void;
  events: string[]; // which events to listen for
  isActive: boolean;
}

export interface LiveTimerState {
  activeTimers: LiveTimer[];
  timerSyncs: TimerSync[];
  subscriptions: TimerSubscription[];
  events: TimerEvent[];
}

// ==================== COMBINED REAL-TIME STATE ====================

export interface RealtimeState {
  sync: RealtimeSyncState;
  notifications: NotificationState;
  presence: PresenceState;
  timers: LiveTimerState;
}
