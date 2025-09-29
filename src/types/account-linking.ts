/**
 * Account Linking Types
 * Types for the private keyholder-wearer account linking system
 */
import { Timestamp } from "firebase/firestore";

// ==================== LINK CODE TYPES ====================

export interface LinkCode {
  id: string;
  wearerId: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  status: "pending" | "used" | "expired";
  maxUses: number;
  usedBy: string | null;
  usedAt?: Timestamp;
  // Optional metadata
  shareMethod?: "manual" | "qr" | "email" | "url";
  ipAddress?: string;
}

export interface LinkCodeResponse {
  code: string;
  expiresIn: string;
  shareUrl?: string;
  qrCodeData?: string;
}

// ==================== ADMIN RELATIONSHIP TYPES ====================

export interface AdminRelationship {
  id: string;
  keyholderId: string; // Admin account UID
  wearerId: string; // Managed account UID

  // Relationship metadata
  establishedAt: Timestamp;
  status: "active" | "paused" | "terminated";

  // Admin permissions - what keyholder can access/control
  permissions: AdminPermissions;

  // Security settings
  security: SecuritySettings;

  // Privacy settings
  privacy: PrivacySettings;

  // Linking metadata
  linkMethod: "code" | "qr" | "email";
  lastAdminAccess?: Timestamp;
  terminatedAt?: Timestamp;
  terminatedBy?: "wearer" | "keyholder";
  terminationReason?: string;
}

export interface AdminPermissions {
  // Data access
  viewSessions: boolean; // See all session history
  viewEvents: boolean; // See sexual event logs
  viewTasks: boolean; // See task history
  viewSettings: boolean; // See wearer's settings

  // Control permissions
  controlSessions: boolean; // Start/stop sessions, set requirements
  manageTasks: boolean; // Create, approve, reject tasks
  editSettings: boolean; // Modify wearer's settings
  setGoals: boolean; // Set minimum chastity requirements

  // Emergency controls
  emergencyUnlock: boolean; // Override emergency unlock codes
  forceEnd: boolean; // Force end sessions regardless of settings

  // Admin actions
  viewAuditLog: boolean; // See admin action history
  exportData: boolean; // Export wearer's data
}

export interface SecuritySettings {
  requireConfirmation: boolean; // Require wearer confirmation for major changes
  auditLog: boolean; // Log all admin actions
  sessionTimeout: number; // How long admin session lasts (minutes)
  requireReauth: boolean; // Require password re-entry for sensitive actions
  ipRestrictions: string[]; // Allowed IP addresses (optional)
  allowedHours?: {
    // Time restrictions (optional)
    start: string; // "09:00"
    end: string; // "21:00"
    timezone: string;
  };
}

export interface PrivacySettings {
  wearerCanSeeAdminActions: boolean; // Wearer sees what keyholder does
  keyholderCanSeePrivateNotes: boolean; // Access to private notes/events
  shareStatistics: boolean; // Share aggregated stats with keyholder
  retainDataAfterDisconnect: boolean; // Keep historical data accessible
  anonymizeHistoricalData: boolean; // Remove keyholder identity from old logs
}

// ==================== ADMIN SESSION TYPES ====================

export interface AdminSession {
  id: string;
  relationshipId: string;
  keyholderId: string;
  wearerId: string;
  startedAt: Timestamp;
  expiresAt: Timestamp;
  lastActivity: Timestamp;
  actions: AdminActionSummary;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
}

export interface AdminActionSummary {
  sessionViews: number;
  taskActions: number;
  settingChanges: number;
  emergencyActions: number;
  dataExports: number;
}

// ==================== ADMIN ACTION LOG TYPES ====================

export interface AdminAction {
  id: string;
  sessionId: string;
  relationshipId: string;
  keyholderId: string;
  wearerId: string;

  // Action details
  type: AdminActionType;
  target: string; // What was acted upon
  details: Record<string, unknown>; // Action-specific data

  // Metadata
  timestamp: Timestamp;
  ipAddress?: string;
  userAgent?: string;

  // Wearer awareness
  wearerNotified: boolean;
  wearerApprovalRequired?: boolean;
  wearerApprovalStatus?: "pending" | "approved" | "denied";
}

export type AdminActionType =
  | "session_start"
  | "session_end"
  | "session_pause"
  | "session_resume"
  | "session_extend"
  | "task_create"
  | "task_approve"
  | "task_reject"
  | "task_modify"
  | "setting_change"
  | "goal_set"
  | "goal_modify"
  | "emergency_unlock"
  | "force_end"
  | "data_export"
  | "view_data"
  | "relationship_pause"
  | "relationship_terminate";

// ==================== UI STATE TYPES ====================

export interface AccountLinkingState {
  // Link generation
  isGeneratingCode: boolean;
  currentLinkCode: LinkCodeResponse | null;
  linkCodeError: string | null;

  // Code usage
  isUsingCode: boolean;
  codeUsageError: string | null;

  // Relationship management
  adminRelationships: AdminRelationship[];
  selectedWearerId: string | null;

  // Admin session
  currentAdminSession: AdminSession | null;
  isAdminSessionActive: boolean;

  // UI state
  showQRCode: boolean;
  showDisconnectionDialog: boolean;
  showPermissionEditor: boolean;
}

// ==================== API REQUEST/RESPONSE TYPES ====================

export interface GenerateLinkCodeRequest {
  expirationHours?: number; // Default 24
  maxUses?: number; // Default 1
  shareMethod?: "manual" | "qr" | "email" | "url";
  recipientEmail?: string; // If sharing via email
}

export interface UseLinkCodeRequest {
  code: string;
  permissions?: Partial<AdminPermissions>;
  security?: Partial<SecuritySettings>;
  privacy?: Partial<PrivacySettings>;
}

export interface UpdateRelationshipRequest {
  relationshipId: string;
  permissions?: Partial<AdminPermissions>;
  security?: Partial<SecuritySettings>;
  privacy?: Partial<PrivacySettings>;
  status?: "active" | "paused" | "terminated";
  terminationReason?: string;
}

export interface AdminActionRequest {
  type: AdminActionType;
  target: string;
  details: Record<string, unknown>;
  requireWearerApproval?: boolean;
}

// ==================== VALIDATION TYPES ====================

export interface LinkCodeValidation {
  isValid: boolean;
  error?: string;
  code?: LinkCode;
  canUse: boolean;
  timeRemaining?: number; // seconds until expiration
}

export interface RelationshipValidation {
  canPerformAction: boolean;
  reason?: string;
  requiresConfirmation?: boolean;
  requiresReauth?: boolean;
}

// ==================== SHARING TYPES ====================

export interface QRCodeData {
  type: "chastityos_link";
  code: string;
  version: string;
  appUrl: string;
}

export interface SecureLinkUrl {
  url: string;
  token: string;
  expiresAt: Timestamp;
}

export interface EmailShareData {
  recipientEmail: string;
  linkCode: string;
  senderName?: string;
  customMessage?: string;
  expiresIn: string;
}

// ==================== AUDIT LOG TYPES ====================

export interface AuditLogEntry {
  id: string;
  relationshipId: string;
  timestamp: Timestamp;
  actor: "keyholder" | "wearer" | "system";
  actorId: string;
  action: string;
  details: Record<string, unknown>;
  severity: "info" | "warning" | "critical";
  category: "access" | "permission" | "data" | "security" | "relationship";
}

export interface AuditLogFilters {
  relationshipId?: string;
  actor?: "keyholder" | "wearer" | "system";
  dateRange?: {
    start: Date;
    end: Date;
  };
  severity?: "info" | "warning" | "critical";
  category?: string;
  limit?: number;
  offset?: number;
}

// ==================== NOTIFICATION TYPES ====================

export interface AdminNotification {
  id: string;
  relationshipId: string;
  recipientId: string; // wearer or keyholder
  recipientType: "wearer" | "keyholder";

  type:
    | "admin_action"
    | "permission_change"
    | "session_timeout"
    | "security_alert";
  title: string;
  message: string;
  details?: Record<string, unknown>;

  createdAt: Timestamp;
  readAt?: Timestamp;
  isRead: boolean;
  priority: "low" | "normal" | "high" | "urgent";
}

// ==================== ERROR TYPES ====================

export interface AccountLinkingError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Timestamp;
  userId?: string;
  relationshipId?: string;
}

export type LinkingErrorCode =
  | "INVALID_CODE"
  | "EXPIRED_CODE"
  | "CODE_ALREADY_USED"
  | "UNAUTHORIZED"
  | "RELATIONSHIP_EXISTS"
  | "PERMISSION_DENIED"
  | "SESSION_EXPIRED"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "VALIDATION_ERROR";
