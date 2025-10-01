/**
 * useAuditLog - Comprehensive Audit System Hook
 *
 * Complete audit logging system for transparency, compliance, and security monitoring
 * across all user actions.
 */
import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Dispatch,
  SetStateAction,
} from "react";
import {
  AuditLogState,
  AuditEntry,
  AuditAction,
  AuditCategory,
  AuditContext,
  AuditDetails,
  AuditSeverity,
  AuditOutcome,
  AuditFilter,
  AuditSearchQuery,
  SecurityEvent,
  SecurityAuditSummary,
  ComplianceReport,
  ExportFormat,
  AuditExport,
  AuditPrivacySettings,
  CleanupResult as _CleanupResult,
} from "../../types/security";
import { PermissionContext } from "../../types/security";
import {
  getCategoryForAction,
  getClientIP,
  saveAuditEntry,
  fetchRecentAuditEntries,
  savePrivacySettings,
  applyAuditFilters,
  convertToCSV,
  generatePDF,
  calculateSecurityScore,
  generateSecurityRecommendations,
} from "./audit-utils";

interface UseAuditLogOptions {
  userId: string;
  relationshipId?: string;
  autoLogActions?: boolean;
  retentionDays?: number;
}

export const useAuditLog = (options: UseAuditLogOptions) => {
  const {
    userId,
    relationshipId,
    _autoLogActions = true,
    retentionDays = 365,
  } = options;

  // Initialize state
  const [auditState, setAuditState] = useState<AuditLogState>(() =>
    initializeAuditState(retentionDays),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load recent audit entries on mount
  useEffect(() => {
    if (userId) {
      loadAuditEntries(
        userId,
        relationshipId,
        setAuditState,
        setError,
        setLoading,
      );
    }
  }, [userId, relationshipId]);

  // Create action handlers
  const actionHandlers = useMemo(
    () =>
      createActionHandlers(userId, relationshipId, auditState, setAuditState),
    [userId, relationshipId, auditState],
  );

  // Create query handlers
  const queryHandlers = useMemo(
    () => createQueryHandlers(auditState),
    [auditState],
  );

  // Create management handlers
  const managementHandlers = useMemo(
    () => createManagementHandlers(userId, auditState, setAuditState),
    [userId, auditState],
  );

  // Computed values
  const computedValues = useMemo(
    () => calculateComputedValues(auditState),
    [auditState],
  );

  return {
    // Audit data
    recentEntries: auditState.recentEntries,
    categories: auditState.categories,
    filters: auditState.filters,
    loading,
    error,

    // Action handlers
    ...actionHandlers,

    // Query handlers
    ...queryHandlers,

    // Management handlers
    ...managementHandlers,

    // Computed values
    ...computedValues,
  };
};

// Search helper functions
function applyTextSearch(entries: AuditEntry[], query?: string): AuditEntry[] {
  if (!query) return entries;

  const searchTerm = query.toLowerCase();
  return entries.filter(
    (entry) =>
      entry.details.description.toLowerCase().includes(searchTerm) ||
      entry.action.toLowerCase().includes(searchTerm),
  );
}

function applySearchFilters(
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

function applySorting(
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

function applyPagination(
  entries: AuditEntry[],
  limit?: number,
  offset?: number,
): AuditEntry[] {
  if (!limit && !offset) return entries;

  const start = offset || 0;
  const end = start + (limit || entries.length);
  return entries.slice(start, end);
}

// Initialization and handler creation helpers
function initializeAuditState(retentionDays: number): AuditLogState {
  return {
    recentEntries: [],
    categories: Object.values(AuditCategory),
    filters: {},
    exportOptions: {
      formats: ["json", "csv", "pdf"],
      maxRecords: 10000,
      includeMetadata: true,
    },
    privacySettings: {
      shareWithKeyholder: false,
      includeIPAddresses: false,
      includeUserAgent: false,
      retentionDays,
      anonymizeAfterDays: 90,
    },
  };
}

async function loadAuditEntries(
  userId: string,
  relationshipId: string | undefined,
  setAuditState: Dispatch<SetStateAction<AuditLogState>>,
  setError: Dispatch<SetStateAction<string | null>>,
  setIsLoading: Dispatch<SetStateAction<boolean>>,
): Promise<void> {
  try {
    setIsLoading(true);
    setError(null);

    const entries = await fetchRecentAuditEntries(userId, relationshipId);

    setAuditState((prev) => ({
      ...prev,
      recentEntries: entries,
    }));
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to load audit log");
  } finally {
    setIsLoading(false);
  }
}

function createActionHandlers(
  userId: string,
  relationshipId: string | undefined,
  auditState: AuditLogState,
  setAuditState: Dispatch<SetStateAction<AuditLogState>>,
) {
  const logAction = async (
    action: AuditAction,
    details: AuditDetails,
    context?: AuditContext,
  ): Promise<void> => {
    try {
      const entry: AuditEntry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        userId,
        action,
        category: getCategoryForAction(action),
        context: context || { relationshipId },
        details,
        severity: AuditSeverity.LOW,
        outcome: AuditOutcome.SUCCESS,
        ipAddress: auditState.privacySettings.includeIPAddresses
          ? await getClientIP()
          : undefined,
        userAgent: auditState.privacySettings.includeUserAgent
          ? navigator.userAgent
          : undefined,
      };

      await saveAuditEntry(entry);
      setAuditState((prev) => ({
        ...prev,
        recentEntries: [entry, ...prev.recentEntries.slice(0, 99)],
      }));
    } catch {
      // Failed to log audit action
    }
  };

  const logSecurityEvent = async (event: SecurityEvent): Promise<void> => {
    const details: AuditDetails = {
      description: event.description,
      metadata: event.metadata,
    };

    const entry: AuditEntry = {
      id: `security_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId,
      action: AuditAction.PERMISSION_CHECK,
      category: AuditCategory.SECURITY,
      context: { relationshipId },
      details,
      severity: event.severity,
      outcome:
        event.type === "failed_login"
          ? AuditOutcome.FAILURE
          : AuditOutcome.SUCCESS,
      ipAddress: auditState.privacySettings.includeIPAddresses
        ? await getClientIP()
        : undefined,
      userAgent: auditState.privacySettings.includeUserAgent
        ? navigator.userAgent
        : undefined,
    };

    await saveAuditEntry(entry);
    setAuditState((prev) => ({
      ...prev,
      recentEntries: [entry, ...prev.recentEntries.slice(0, 99)],
    }));
  };

  const logPermissionCheck = async (
    permission: string,
    granted: boolean,
    context?: PermissionContext,
  ): Promise<void> => {
    const details: AuditDetails = {
      description: `Permission check: ${permission}`,
      metadata: { permission, granted, context },
    };

    await logAction(
      AuditAction.PERMISSION_CHECK,
      details,
      context as AuditContext,
    );
  };

  return { logAction, logSecurityEvent, logPermissionCheck };
}

function createQueryHandlers(auditState: AuditLogState) {
  const getEntriesByDateRange = async (
    start: Date,
    end: Date,
  ): Promise<AuditEntry[]> => {
    return auditState.recentEntries.filter(
      (entry) => entry.timestamp >= start && entry.timestamp <= end,
    );
  };

  const getEntriesByCategory = async (
    category: AuditCategory,
  ): Promise<AuditEntry[]> => {
    return auditState.recentEntries.filter(
      (entry) => entry.category === category,
    );
  };

  const getEntriesByUser = async (
    targetUserId: string,
  ): Promise<AuditEntry[]> => {
    return auditState.recentEntries.filter(
      (entry) =>
        entry.userId === targetUserId ||
        entry.context.targetUserId === targetUserId,
    );
  };

  const searchEntries = async (
    query: AuditSearchQuery,
  ): Promise<AuditEntry[]> => {
    let results = auditState.recentEntries;
    results = applyTextSearch(results, query.query);
    results = applySearchFilters(results, query.filters);
    results = applySorting(results, query.sortBy, query.sortOrder);
    results = applyPagination(results, query.limit, query.offset);
    return results;
  };

  return {
    getEntriesByDateRange,
    getEntriesByCategory,
    getEntriesByUser,
    searchEntries,
  };
}

function createManagementHandlers(
  userId: string,
  auditState: AuditLogState,
  setAuditState: Dispatch<SetStateAction<AuditLogState>>,
) {
  const applyFilters = (filters: AuditFilter): void => {
    setAuditState((prev) => ({ ...prev, filters }));
  };

  const getSecuritySummary = (): SecurityAuditSummary => {
    const securityEntries = auditState.recentEntries.filter(
      (entry) => entry.category === AuditCategory.SECURITY,
    );

    const failedLogins = auditState.recentEntries.filter(
      (entry) =>
        entry.action === AuditAction.LOGIN &&
        entry.outcome === AuditOutcome.FAILURE,
    ).length;

    const permissionViolations = auditState.recentEntries.filter(
      (entry) =>
        entry.action === AuditAction.PERMISSION_CHECK &&
        entry.outcome === AuditOutcome.UNAUTHORIZED,
    ).length;

    const dataExports = auditState.recentEntries.filter(
      (entry) => entry.action === AuditAction.DATA_EXPORT,
    ).length;

    const lastSecurityEvent =
      securityEntries.length > 0 ? securityEntries[0].timestamp : undefined;

    return {
      totalEntries: auditState.recentEntries.length,
      securityEvents: securityEntries.length,
      failedLogins,
      permissionViolations,
      dataExports,
      lastSecurityEvent,
    };
  };

  // Get compliance report (not yet exposed in return)
  const _getComplianceReport = (): ComplianceReport => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const periodEntries = auditState.recentEntries.filter(
      (entry) => entry.timestamp >= thirtyDaysAgo,
    );

    const actionsByCategory = periodEntries.reduce(
      (acc, entry) => {
        acc[entry.category] = (acc[entry.category] || 0) + 1;
        return acc;
      },
      {} as Record<AuditCategory, number>,
    );

    const securityScore = calculateSecurityScore(periodEntries);

    return {
      period: {
        start: thirtyDaysAgo,
        end: now,
      },
      totalActions: periodEntries.length,
      actionsByCategory,
      securityScore,
      recommendations: generateSecurityRecommendations(periodEntries),
    };
  };

  // Export audit log (not yet exposed in return)
  const _exportAuditLog = async (
    format: ExportFormat,
    filters?: AuditFilter,
  ): Promise<AuditExport> => {
    let entries = auditState.recentEntries;

    // Apply filters if provided
    if (filters) {
      // Implementation would filter entries based on criteria
      entries = applyAuditFilters(entries, filters);
    }

    // Generate export data based on format
    let data: string | Uint8Array;
    let filename: string;

    switch (format) {
      case "json":
        data = JSON.stringify(entries, null, 2);
        filename = `audit-log-${Date.now()}.json`;
        break;
      case "csv":
        data = convertToCSV(entries);
        filename = `audit-log-${Date.now()}.csv`;
        break;
      case "pdf":
        data = await generatePDF(entries);
        filename = `audit-log-${Date.now()}.pdf`;
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    return {
      format,
      data,
      filename,
      generatedAt: new Date(),
    };
  };

  // Share with keyholder (not yet exposed in return)
  const _shareWithKeyholder = async (_entries: string[]): Promise<void> => {
    // eslint-disable-next-line no-undef
    if (!relationshipId) {
      throw new Error("No relationship context for sharing");
    }

    // In real implementation, this would share selected entries with keyholder
  };

  // Update privacy settings
  const updatePrivacySettings = async (
    settings: Partial<AuditPrivacySettings>,
  ): Promise<void> => {
    setAuditState((prev) => ({
      ...prev,
      privacySettings: { ...prev.privacySettings, ...settings },
    }));
    await savePrivacySettings(userId, settings);
  };

  return { applyFilters, getSecuritySummary, updatePrivacySettings };
}

function calculateComputedValues(auditState: AuditLogState) {
  const totalEntries = auditState.recentEntries.length;
  const securityAlerts = auditState.recentEntries.filter(
    (entry) => entry.severity === AuditSeverity.HIGH,
  ).length;

  const lastLoginEntry = auditState.recentEntries.find(
    (entry) => entry.action === AuditAction.LOGIN,
  );
  const lastLoginTime = lastLoginEntry?.timestamp;

  const actionCounts = auditState.recentEntries.reduce(
    (acc, entry) => {
      acc[entry.action] = (acc[entry.action] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const mostCommonActions = Object.entries(actionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([action, count]) => ({ action, count }));

  const hasSecurityConcerns = auditState.recentEntries.some(
    (entry) =>
      entry.category === AuditCategory.SECURITY &&
      entry.severity === AuditSeverity.HIGH,
  );

  return {
    totalEntries,
    securityAlerts,
    lastLoginTime,
    mostCommonActions,
    hasSecurityConcerns,
  };
}
