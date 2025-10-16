/**
 * Helper functions for reporting operations
 */

import {
  ReportParameters,
  GeneratedReport,
  ExportFormat,
  ReportSchedule,
  DataFilter,
} from "../../hooks/features/useReporting";

/**
 * Generate mock report data
 */
export async function generateReportData(
  templateId: string,
  parameters: ReportParameters,
) {
  // In a real implementation, this would query actual data
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    summary: {
      totalSessions: Math.floor(Math.random() * 100),
      averageDuration: Math.floor(Math.random() * 72),
      longestSession: Math.floor(Math.random() * 168),
    },
    details: parameters.includeDetails ? generateDetailedData() : null,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate mock detailed data
 */
export function generateDetailedData() {
  return {
    sessions: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      startDate: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      ),
      duration: Math.floor(Math.random() * 72),
      events: Math.floor(Math.random() * 5),
    })),
  };
}

/**
 * Calculate next scheduled run based on schedule configuration
 */
export function calculateNextRun(schedule: ReportSchedule): Date {
  const now = new Date();
  const timeParts = schedule.time.split(":").map(Number);
  const hours = timeParts[0] ?? 0;
  const minutes = timeParts[1] ?? 0;

  const nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);

  if (nextRun <= now) {
    switch (schedule.frequency) {
      case "daily":
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case "weekly":
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case "monthly":
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
    }
  }

  return nextRun;
}

/**
 * Export report data to specific format
 */
export async function exportReportData(
  report: GeneratedReport,
  format: ExportFormat,
) {
  // Simulate export processing
  await new Promise((resolve) => setTimeout(resolve, 500));

  const blob = new Blob([JSON.stringify(report.data, null, 2)], {
    type: getContentType(format),
  });
  const url = URL.createObjectURL(blob);

  return { url };
}

/**
 * Get raw data based on type and filters
 */
export async function getRawData(dataType: string, filters: DataFilter[]) {
  // Simulate data retrieval
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { dataType, filters, records: [] };
}

/**
 * Export data in specified format
 */
export async function exportData(
  data: Record<string, unknown> | unknown[],
  format: ExportFormat,
) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: getContentType(format),
  });
  const url = URL.createObjectURL(blob);
  return { url };
}

/**
 * Get MIME content type for export format
 */
export function getContentType(format: ExportFormat): string {
  switch (format) {
    case ExportFormat.JSON:
      return "application/json";
    case ExportFormat.CSV:
      return "text/csv";
    case ExportFormat.PDF:
      return "application/pdf";
    case ExportFormat.XLSX:
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    default:
      return "application/octet-stream";
  }
}
