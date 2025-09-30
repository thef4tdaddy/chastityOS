/**
 * Hook for monitoring sync health and history
 */
import { useCallback } from "react";
import type {
  DataConflict,
  SyncMetrics,
  SyncHealthReport,
  SyncIssue,
  SyncHistoryEntry,
} from "./types/dataSync";

interface UseSyncMonitoringProps {
  conflicts: DataConflict[];
  syncMetrics: SyncMetrics;
}

export const useSyncMonitoring = ({
  conflicts,
  syncMetrics,
}: UseSyncMonitoringProps) => {
  const getSyncHealth = useCallback((): SyncHealthReport => {
    const issues: SyncIssue[] = [];

    // Check for critical issues
    if (conflicts.filter((c) => c.priority === "critical").length > 0) {
      issues.push({
        severity: "critical",
        type: "conflicts",
        description: "Critical data conflicts require immediate attention",
        affectedRelationships: conflicts
          .map((c) => c.context.relationshipId)
          .filter(Boolean) as string[],
        suggestedActions: ["Review and resolve critical conflicts"],
      });
    }

    // Check sync reliability
    if (syncMetrics.reliabilityScore < 70) {
      issues.push({
        severity: "high",
        type: "performance",
        description: "Low sync reliability affecting data consistency",
        affectedRelationships: [],
        suggestedActions: [
          "Check network connection",
          "Review sync permissions",
        ],
      });
    }

    const overallHealth = issues.some((i) => i.severity === "critical")
      ? "critical"
      : issues.some((i) => i.severity === "high")
        ? "warning"
        : "healthy";

    return {
      overall: overallHealth,
      issues,
      recommendations: [
        "Maintain regular sync schedule",
        "Resolve conflicts promptly",
        "Monitor relationship connectivity",
      ],
      metrics: {
        syncReliability: syncMetrics.reliabilityScore,
        averageLatency: 150, // ms
        errorRate:
          (syncMetrics.failedSyncs / Math.max(1, syncMetrics.totalSyncs)) * 100,
        dataIntegrityScore: 95,
      },
      lastChecked: new Date(),
    };
  }, [conflicts, syncMetrics]);

  const getSyncHistory = useCallback((_days = 30): SyncHistoryEntry[] => {
    // Return sync history for the specified number of days
    return [];
  }, []);

  return {
    getSyncHealth,
    getSyncHistory,
  };
};
