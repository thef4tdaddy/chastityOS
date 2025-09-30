/**
 * Helper functions for audit logging
 */
import {
  AuditAction,
  AuditCategory,
  AuditEntry,
  AuditFilter,
  AuditPrivacySettings,
} from "../../types/security";

export function getCategoryForAction(action: AuditAction): AuditCategory {
  const categoryMap: Record<AuditAction, AuditCategory> = {
    [AuditAction.LOGIN]: AuditCategory.AUTHENTICATION,
    [AuditAction.LOGOUT]: AuditCategory.AUTHENTICATION,
    [AuditAction.SESSION_START]: AuditCategory.SESSION,
    [AuditAction.SESSION_END]: AuditCategory.SESSION,
    [AuditAction.SESSION_PAUSE]: AuditCategory.SESSION,
    [AuditAction.SESSION_RESUME]: AuditCategory.SESSION,
    [AuditAction.TASK_CREATE]: AuditCategory.TASKS,
    [AuditAction.TASK_UPDATE]: AuditCategory.TASKS,
    [AuditAction.TASK_DELETE]: AuditCategory.TASKS,
    [AuditAction.TASK_SUBMIT]: AuditCategory.TASKS,
    [AuditAction.TASK_APPROVE]: AuditCategory.TASKS,
    [AuditAction.PERMISSION_CHECK]: AuditCategory.PERMISSIONS,
    [AuditAction.PERMISSION_GRANT]: AuditCategory.PERMISSIONS,
    [AuditAction.PERMISSION_REVOKE]: AuditCategory.PERMISSIONS,
    [AuditAction.DATA_EXPORT]: AuditCategory.DATA,
    [AuditAction.DATA_IMPORT]: AuditCategory.DATA,
    [AuditAction.SETTINGS_UPDATE]: AuditCategory.SYSTEM,
    [AuditAction.RELATIONSHIP_REQUEST]: AuditCategory.RELATIONSHIPS,
    [AuditAction.RELATIONSHIP_ACCEPT]: AuditCategory.RELATIONSHIPS,
    [AuditAction.RELATIONSHIP_END]: AuditCategory.RELATIONSHIPS,
  };

  return categoryMap[action] || AuditCategory.SYSTEM;
}

export async function getClientIP(): Promise<string> {
  // In real implementation, get client IP from request or service
  return "127.0.0.1";
}

export function applyAuditFilters(
  entries: AuditEntry[],
  _filters: AuditFilter,
): AuditEntry[] {
  // Implementation would apply all filters
  return entries;
}

export function convertToCSV(entries: AuditEntry[]): string {
  const headers = [
    "Timestamp",
    "User ID",
    "Action",
    "Category",
    "Description",
    "Outcome",
  ];
  const rows = entries.map((entry) => [
    entry.timestamp.toISOString(),
    entry.userId,
    entry.action,
    entry.category,
    entry.details.description,
    entry.outcome,
  ]);

  return [headers, ...rows].map((row) => row.join(",")).join("\n");
}

export async function generatePDF(_entries: AuditEntry[]): Promise<Uint8Array> {
  // In real implementation, generate PDF using library like jsPDF
  return new Uint8Array();
}

export function calculateSecurityScore(entries: AuditEntry[]): number {
  // Simplified security score calculation
  const securityEvents = entries.filter(
    (e) => e.category === AuditCategory.SECURITY,
  );
  const failedLogins = entries.filter((e) => e.outcome === "failure");

  let score = 100;
  score -= securityEvents.length * 5;
  score -= failedLogins.length * 10;

  return Math.max(0, Math.min(100, score));
}

export function generateSecurityRecommendations(
  entries: AuditEntry[],
): string[] {
  const recommendations: string[] = [];

  const failedLogins = entries.filter((e) => e.outcome === "failure");
  if (failedLogins.length > 5) {
    recommendations.push("Consider enabling two-factor authentication");
  }

  return recommendations;
}

// API functions
export async function saveAuditEntry(_entry: AuditEntry): Promise<void> {
  // In real implementation, save to backend/Firebase
}

export async function fetchRecentAuditEntries(
  _userId: string,
  _relationshipId?: string,
): Promise<AuditEntry[]> {
  // In real implementation, fetch from backend
  return [];
}

export async function savePrivacySettings(
  _userId: string,
  _settings: Partial<AuditPrivacySettings>,
): Promise<void> {
  // In real implementation, save to backend
}
