/**
 * Security-related type definitions for ChastityOS
 */
import { UserRole } from "./core";

// ==================== PERMISSION TYPES ====================

export enum PermissionCategory {
  SESSION = "session",
  TASKS = "tasks",
  PROFILE = "profile",
  RELATIONSHIPS = "relationships",
  ADMIN = "admin",
  DATA = "data",
}

export enum PermissionLevel {
  NONE = "none",
  READ = "read",
  WRITE = "write",
  ADMIN = "admin",
}

export enum PermissionScope {
  SELF = "self",
  RELATIONSHIP = "relationship",
  GLOBAL = "global",
}

export interface PermissionCondition {
  type: "time" | "location" | "relationship" | "session_status";
  value: any;
  operator:
    | "equals"
    | "not_equals"
    | "greater_than"
    | "less_than"
    | "in"
    | "not_in";
}

export interface Permission {
  id: string;
  name: string;
  category: PermissionCategory;
  level: PermissionLevel;
  scope: PermissionScope;
  conditions?: PermissionCondition[];
  expiresAt?: Date;
}

export interface RolePermission {
  role: UserRole;
  permissions: Permission[];
  inheritedFrom?: string;
}

export interface PermissionContext {
  relationshipId?: string;
  sessionId?: string;
  targetUserId?: string;
  resourceType?: string;
  resourceId?: string;
}

export interface ContextPermission {
  context: PermissionContext;
  permissions: Permission[];
  restrictions: PermissionRestriction[];
  inheritedFrom?: string;
}

export interface PermissionRestriction {
  type: "time_limit" | "ip_restriction" | "device_restriction";
  value: unknown;
  description?: string;
}

export interface PermissionCache {
  [key: string]: {
    result: boolean;
    timestamp: Date;
    expiresAt: Date;
  };
}

export interface PermissionCheckLog {
  permission: string;
  context?: PermissionContext;
  result: boolean;
  timestamp: Date;
  userId: string;
}

export interface PermissionRequest {
  id: string;
  userId: string;
  permission: string;
  justification: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

export interface ElevatedAccessRequest {
  id: string;
  userId: string;
  duration: number; // minutes
  reason: string;
  status: "pending" | "approved" | "rejected" | "expired";
  requestedAt: Date;
  approvedAt?: Date;
  expiresAt?: Date;
}

export interface PermissionDetails {
  permission: Permission;
  currentStatus: boolean;
  reasons: string[];
  restrictions: PermissionRestriction[];
  expiresAt?: Date;
}

export interface PermissionHistoryEntry {
  action: "granted" | "revoked" | "requested" | "elevated";
  permission: string;
  timestamp: Date;
  context?: PermissionContext;
  notes?: string;
}

export interface PermissionState {
  userPermissions: Permission[];
  rolePermissions: RolePermission[];
  contextPermissions: ContextPermission[];
  permissionCache: PermissionCache;
  permissionChecks: PermissionCheckLog[];
}

// ==================== AUDIT LOG TYPES ====================

export enum AuditAction {
  LOGIN = "login",
  LOGOUT = "logout",
  SESSION_START = "session_start",
  SESSION_END = "session_end",
  SESSION_PAUSE = "session_pause",
  SESSION_RESUME = "session_resume",
  TASK_CREATE = "task_create",
  TASK_UPDATE = "task_update",
  TASK_DELETE = "task_delete",
  TASK_SUBMIT = "task_submit",
  TASK_APPROVE = "task_approve",
  PERMISSION_CHECK = "permission_check",
  PERMISSION_GRANT = "permission_grant",
  PERMISSION_REVOKE = "permission_revoke",
  DATA_EXPORT = "data_export",
  DATA_IMPORT = "data_import",
  SETTINGS_UPDATE = "settings_update",
  RELATIONSHIP_REQUEST = "relationship_request",
  RELATIONSHIP_ACCEPT = "relationship_accept",
  RELATIONSHIP_END = "relationship_end",
}

export enum AuditCategory {
  AUTHENTICATION = "authentication",
  SESSION = "session",
  TASKS = "tasks",
  PERMISSIONS = "permissions",
  DATA = "data",
  RELATIONSHIPS = "relationships",
  SECURITY = "security",
  SYSTEM = "system",
}

export enum AuditSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum AuditOutcome {
  SUCCESS = "success",
  FAILURE = "failure",
  PARTIAL = "partial",
  UNAUTHORIZED = "unauthorized",
}

export interface AuditContext {
  relationshipId?: string;
  sessionId?: string;
  targetUserId?: string;
  resourceType?: string;
  resourceId?: string;
  additionalContext?: Record<string, unknown>;
}

export interface AuditDetails {
  description: string;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown>;
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: AuditAction;
  category: AuditCategory;
  context: AuditContext;
  details: AuditDetails;
  severity: AuditSeverity;
  ipAddress?: string;
  userAgent?: string;
  outcome: AuditOutcome;
}

export interface AuditFilter {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  actions?: AuditAction[];
  categories?: AuditCategory[];
  severity?: AuditSeverity;
  outcome?: AuditOutcome;
}

export interface AuditSearchQuery {
  query: string;
  filters?: AuditFilter;
  sortBy?: "timestamp" | "severity" | "category";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface SecurityEvent {
  type:
    | "failed_login"
    | "permission_violation"
    | "suspicious_activity"
    | "data_breach";
  description: string;
  severity: AuditSeverity;
  metadata?: Record<string, unknown>;
}

export interface SecurityAuditSummary {
  totalEntries: number;
  securityEvents: number;
  failedLogins: number;
  permissionViolations: number;
  dataExports: number;
  lastSecurityEvent?: Date;
}

export interface ComplianceReport {
  period: {
    start: Date;
    end: Date;
  };
  totalActions: number;
  actionsByCategory: Record<AuditCategory, number>;
  securityScore: number;
  recommendations: string[];
}

export type ExportFormat = "json" | "csv" | "pdf";

export interface AuditExport {
  format: ExportFormat;
  data: string | Uint8Array;
  filename: string;
  generatedAt: Date;
}

export interface AuditPrivacySettings {
  shareWithKeyholder: boolean;
  includeIPAddresses: boolean;
  includeUserAgent: boolean;
  retentionDays: number;
  anonymizeAfterDays?: number;
}

export interface CleanupResult {
  deletedEntries: number;
  anonymizedEntries: number;
  errors: string[];
}

export interface AuditLogState {
  recentEntries: AuditEntry[];
  categories: AuditCategory[];
  filters: AuditFilter;
  exportOptions: AuditExportOptions;
  privacySettings: AuditPrivacySettings;
}

export interface AuditExportOptions {
  formats: ExportFormat[];
  maxRecords: number;
  includeMetadata: boolean;
}

// ==================== SECURITY SETTINGS TYPES ====================

export interface SessionSecuritySettings {
  sessionTimeout: number; // minutes
  adminSessionTimeout: number; // minutes
  requireReauthForSensitive: boolean;
  logoutOnBrowserClose: boolean;
  allowConcurrentSessions: boolean;
  maxConcurrentSessions: number;
}

export interface AccessControlSettings {
  trustedDevices: DeviceInfo[];
  ipWhitelist: string[];
  geoRestrictions: GeoRestriction[];
  timeRestrictions: TimeRestriction[];
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: "desktop" | "mobile" | "tablet";
  userAgent: string;
  lastUsed: Date;
  isActive: boolean;
}

export interface GeoRestriction {
  type: "allow" | "deny";
  countries: string[];
  regions?: string[];
}

export interface TimeRestriction {
  days: number[]; // 0-6, Sunday is 0
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  timezone: string;
}

export interface MonitoringSettings {
  enableSecurityAlerts: boolean;
  alertThresholds: AlertThreshold[];
  notificationChannels: string[];
  logLevel: "minimal" | "standard" | "detailed" | "verbose";
}

export interface AlertThreshold {
  type: "failed_logins" | "permission_violations" | "suspicious_activity";
  count: number;
  timeWindow: number; // minutes
  action: "log" | "alert" | "block";
}

export interface PrivacySecuritySettings {
  shareAuditWithKeyholder: boolean;
  anonymizeOldData: boolean;
  dataRetentionDays: number;
  allowDataExport: boolean;
  requirePasswordForSensitiveActions: boolean;
}

export interface SecurityScore {
  overall: number; // 0-100
  breakdown: {
    authentication: number;
    access_control: number;
    monitoring: number;
    privacy: number;
  };
  recommendations: SecurityRecommendation[];
}

export interface SecurityRecommendation {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  category: "authentication" | "access_control" | "monitoring" | "privacy";
  action?: string;
}

export interface SecurityHealthCheck {
  status: "healthy" | "warning" | "critical";
  issues: SecurityIssue[];
  lastCheck: Date;
  nextCheck: Date;
}

export interface SecurityIssue {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  recommendation: string;
  autoFixable: boolean;
}

export interface SecuritySettingsState {
  sessionSettings: SessionSecuritySettings;
  accessSettings: AccessControlSettings;
  monitoringSettings: MonitoringSettings;
  privacySettings: PrivacySecuritySettings;
}
