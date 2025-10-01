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

// Search and filtering helper functions
export function applyTextSearch(
  entries: AuditEntry[],
  query?: string,
): AuditEntry[] {
  if (!query) return entries;

  const searchTerm = query.toLowerCase();
  return entries.filter(
    (entry) =>
      entry.details.description.toLowerCase().includes(searchTerm) ||
      entry.action.toLowerCase().includes(searchTerm),
  );
}

export function applySearchFilters(
  entries: AuditEntry[],
  filters?: AuditFilter,
): AuditEntry[] {
  if (!filters) return entries;

  let results = entries;

  if (filters.startDate && filters.endDate) {
    results = results.filter(
      (entry) =>
        entry.timestamp >= filters.startDate! &&
        entry.timestamp <= filters.endDate!,
    );
  }

  if (filters.userId) {
    results = results.filter((entry) => entry.userId === filters.userId);
  }

  if (filters.actions && filters.actions.length > 0) {
    results = results.filter((entry) =>
      filters.actions!.includes(entry.action),
    );
  }

  if (filters.categories && filters.categories.length > 0) {
    results = results.filter((entry) =>
      filters.categories!.includes(entry.category),
    );
  }

  if (filters.severity) {
    results = results.filter((entry) => entry.severity === filters.severity);
  }

  if (filters.outcome) {
    results = results.filter((entry) => entry.outcome === filters.outcome);
  }

  return results;
}

export function applySorting(
  entries: AuditEntry[],
  sortBy?: string,
  sortOrder?: "asc" | "desc",
): AuditEntry[] {
  if (!sortBy) return entries;

  return [...entries].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "timestamp":
        comparison = a.timestamp.getTime() - b.timestamp.getTime();
        break;
      case "severity": {
        const severityOrder: Record<string, number> = {
          low: 0,
          medium: 1,
          high: 2,
          critical: 3,
        };
        comparison = severityOrder[a.severity] - severityOrder[b.severity];
        break;
      }
      case "category":
        comparison = a.category.localeCompare(b.category);
        break;
    }

    return sortOrder === "desc" ? -comparison : comparison;
  });
}

export function applyPagination(
  entries: AuditEntry[],
  limit?: number,
  offset?: number,
): AuditEntry[] {
  if (!limit && !offset) return entries;

  const start = offset || 0;
  const end = start + (limit || entries.length);
  return entries.slice(start, end);
}
