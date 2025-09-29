/**
 * useAuditLog - Comprehensive Audit System Hook
 *
 * Complete audit logging system for transparency, compliance, and security monitoring
 * across all user actions.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
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
  CleanupResult,
  AuditExportOptions,
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
} from "./auditHelpers";

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
    autoLogActions = true,
    retentionDays = 365,
  } = options;

  // Audit state
  const [auditState, setAuditState] = useState<AuditLogState>({
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
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load recent audit entries on mount
  useEffect(() => {
    const loadRecentEntries = async () => {
      try {
        setLoading(true);
        setError(null);

        // In real implementation, fetch from backend/Firebase
        const entries = await fetchRecentAuditEntries(userId, relationshipId);

        setAuditState((prev) => ({
          ...prev,
          recentEntries: entries,
        }));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load audit log",
        );
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadRecentEntries();
    }
  }, [userId, relationshipId]);

  // Log an action
  const logAction = useCallback(
    async (
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

        // In real implementation, save to backend
        await saveAuditEntry(entry);

        // Update local state
        setAuditState((prev) => ({
          ...prev,
          recentEntries: [entry, ...prev.recentEntries.slice(0, 99)], // Keep last 100
        }));
      } catch (err) {
        // Failed to log audit action
      }
    },
    [userId, relationshipId, auditState.privacySettings],
  );

  // Log security event
  const logSecurityEvent = useCallback(
    async (event: SecurityEvent): Promise<void> => {
      const details: AuditDetails = {
        description: event.description,
        metadata: event.metadata,
      };

      const entry: AuditEntry = {
        id: `security_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        userId,
        action: AuditAction.PERMISSION_CHECK, // Generic security action
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
    },
    [userId, relationshipId, auditState.privacySettings],
  );

  // Log permission check
  const logPermissionCheck = useCallback(
    async (
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
    },
    [logAction],
  );

  // Get entries by date range
  const getEntriesByDateRange = useCallback(
    async (start: Date, end: Date): Promise<AuditEntry[]> => {
      // In real implementation, query backend with date filters
      return auditState.recentEntries.filter(
        (entry) => entry.timestamp >= start && entry.timestamp <= end,
      );
    },
    [auditState.recentEntries],
  );

  // Get entries by category
  const getEntriesByCategory = useCallback(
    async (category: AuditCategory): Promise<AuditEntry[]> => {
      return auditState.recentEntries.filter(
        (entry) => entry.category === category,
      );
    },
    [auditState.recentEntries],
  );

  // Get entries by user
  const getEntriesByUser = useCallback(
    async (targetUserId: string): Promise<AuditEntry[]> => {
      return auditState.recentEntries.filter(
        (entry) =>
          entry.userId === targetUserId ||
          entry.context.targetUserId === targetUserId,
      );
    },
    [auditState.recentEntries],
  );

  // Search entries
  const searchEntries = useCallback(
    async (query: AuditSearchQuery): Promise<AuditEntry[]> => {
      let results = auditState.recentEntries;

      // Apply text search
      results = applyTextSearch(results, query.query);

      // Apply filters
      results = applySearchFilters(results, query.filters);

      // Apply sorting
      results = applySorting(results, query.sortBy, query.sortOrder);

      // Apply pagination
      results = applyPagination(results, query.limit, query.offset);

      return results;
    },
    [auditState.recentEntries],
  );

  // Apply filters
  const applyFilters = useCallback((filters: AuditFilter): void => {
    setAuditState((prev) => ({
      ...prev,
      filters,
    }));
  }, []);

  // Get security summary
  const getSecuritySummary = useCallback((): SecurityAuditSummary => {
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
  }, [auditState.recentEntries]);

  // Get compliance report
  const getComplianceReport = useCallback((): ComplianceReport => {
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
  }, [auditState.recentEntries]);

  // Export audit log
  const exportAuditLog = useCallback(
    async (
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
    },
    [auditState.recentEntries],
  );

  // Share with keyholder
  const shareWithKeyholder = useCallback(
    async (entries: string[]): Promise<void> => {
      if (!relationshipId) {
        throw new Error("No relationship context for sharing");
      }

      // In real implementation, this would share selected entries with keyholder
      // In real implementation, this would share selected entries with keyholder
    },
    [relationshipId],
  );

  // Update privacy settings
  const updatePrivacySettings = useCallback(
    async (settings: Partial<AuditPrivacySettings>): Promise<void> => {
      setAuditState((prev) => ({
        ...prev,
        privacySettings: {
          ...prev.privacySettings,
          ...settings,
        },
      }));

      // In real implementation, save to backend
      await savePrivacySettings(userId, settings);
    },
    [userId],
  );

  // Cleanup old entries
  const cleanupOldEntries = useCallback(
    async (retentionDays: number): Promise<CleanupResult> => {
      const cutoffDate = new Date(
        Date.now() - retentionDays * 24 * 60 * 60 * 1000,
      );

      const oldEntries = auditState.recentEntries.filter(
        (entry) => entry.timestamp < cutoffDate,
      );

      // In real implementation, delete/anonymize old entries in backend
      const result: CleanupResult = {
        deletedEntries: oldEntries.length,
        anonymizedEntries: 0,
        errors: [],
      };

      // Update local state
      setAuditState((prev) => ({
        ...prev,
        recentEntries: prev.recentEntries.filter(
          (entry) => entry.timestamp >= cutoffDate,
        ),
      }));

      return result;
    },
    [auditState.recentEntries],
  );

  // Computed values
  const computedValues = useMemo(() => {
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
  }, [auditState.recentEntries]);

  return {
    // Audit data
    recentEntries: auditState.recentEntries,
    categories: auditState.categories,
    filters: auditState.filters,
    loading,
    error,

    // Logging actions
    logAction,
    logSecurityEvent,
    logPermissionCheck,

    // Querying audit log
    getEntriesByDateRange,
    getEntriesByCategory,
    getEntriesByUser,
    searchEntries,

    // Filtering and analysis
    applyFilters,
    getSecuritySummary,
    getComplianceReport,

    // Export and sharing
    exportAuditLog,
    shareWithKeyholder,

    // Privacy and retention
    updatePrivacySettings,
    cleanupOldEntries,

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

function applySearchFilters(entries: AuditEntry[], filters?: AuditFilter): AuditEntry[] {
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
    results = results.filter(
      (entry) => entry.severity === filters.severity,
    );
  }

  if (filters.outcome) {
    results = results.filter(
      (entry) => entry.outcome === filters.outcome,
    );
  }

  return results;
}

function applySorting(
  entries: AuditEntry[], 
  sortBy?: string, 
  sortOrder?: "asc" | "desc"
): AuditEntry[] {
  if (!sortBy) return entries;

  return [...entries].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "timestamp":
        comparison = a.timestamp.getTime() - b.timestamp.getTime();
        break;
      case "severity":
        const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
        comparison =
          severityOrder[a.severity] - severityOrder[b.severity];
        break;
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
  offset?: number
): AuditEntry[] {
  if (!limit && !offset) return entries;
  
  const start = offset || 0;
  const end = start + (limit || entries.length);
  return entries.slice(start, end);
}
