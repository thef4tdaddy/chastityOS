/**
 * useReporting Hook - Advanced Reporting & Analytics
 *
 * Comprehensive reporting system with custom reports, data visualization,
 * and export capabilities for detailed analysis.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { logger } from "../../utils/logging";
import {
  ReportStorageService,
  REPORT_STORAGE_KEYS,
} from "../../services/reportStorage";

// Report types
export enum ReportType {
  SUMMARY = "summary",
  DETAILED = "detailed",
  ANALYTICS = "analytics",
  CUSTOM = "custom",
}

// Export formats
export enum ExportFormat {
  JSON = "json",
  CSV = "csv",
  PDF = "pdf",
  XLSX = "xlsx",
}

// Report template
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  parameters: ReportParameter[];
  defaultParameters: Record<string, string | number | boolean | Date>;
}

// Report parameter
export interface ReportParameter {
  name: string;
  type: "string" | "number" | "date" | "boolean" | "select";
  required: boolean;
  options?: string[];
  default?: string | number | boolean | Date;
}

// Report parameters
export interface ReportParameters {
  dateRange: {
    start: Date;
    end: Date;
  };
  includeDetails: boolean;
  groupBy?: string;
  filters: Record<string, string | number | boolean | Date>;
}

// Generated report
export interface GeneratedReport {
  id: string;
  templateId: string;
  name: string;
  parameters: ReportParameters;
  data: Record<string, unknown> | unknown[];
  generatedAt: Date;
  generatedBy: string;
  size: number;
}

// Custom report definition
export interface CustomReportDefinition {
  name: string;
  description: string;
  dataSource: string;
  fields: string[];
  filters: ReportFilter[];
  grouping?: string[];
  sorting?: ReportSort[];
}

// Report filter
export interface ReportFilter {
  field: string;
  operator: "equals" | "contains" | "greater" | "less" | "between";
  value: string | number | boolean | Date;
}

// Report sort
export interface ReportSort {
  field: string;
  direction: "asc" | "desc";
}

// Custom report
export interface CustomReport {
  id: string;
  definition: CustomReportDefinition;
  createdAt: Date;
  lastRun?: Date;
}

// Report schedule
export interface ReportSchedule {
  frequency: "daily" | "weekly" | "monthly";
  time: string;
  recipients: string[];
  format: ExportFormat;
  enabled: boolean;
}

// Scheduled report
export interface ScheduledReport {
  id: string;
  reportId: string;
  schedule: ReportSchedule;
  nextRun: Date;
  lastRun?: Date;
}

// Report export
export interface ReportExport {
  id: string;
  reportId: string;
  format: ExportFormat;
  url: string;
  expiresAt: Date;
}

// Data export
export interface DataExport {
  id: string;
  dataType: string;
  filters: DataFilter[];
  format: ExportFormat;
  url: string;
  expiresAt: Date;
}

// Data filter
export interface DataFilter {
  field: string;
  value: string | number | boolean | Date;
}

// Reporting preferences
export interface ReportingPreferences {
  defaultFormat: ExportFormat;
  autoRefresh: boolean;
  refreshInterval: number;
  maxReports: number;
}

// Default templates
const DEFAULT_TEMPLATES: ReportTemplate[] = [
  {
    id: "session-summary",
    name: "Session Summary",
    description: "Summary of chastity sessions over time",
    type: ReportType.SUMMARY,
    parameters: [
      { name: "dateRange", type: "date", required: true },
      {
        name: "includeDetails",
        type: "boolean",
        required: false,
        default: false,
      },
    ],
    defaultParameters: {
      includeDetails: false,
    },
  },
  {
    id: "achievement-progress",
    name: "Achievement Progress",
    description: "Progress on achievements and goals",
    type: ReportType.ANALYTICS,
    parameters: [
      { name: "dateRange", type: "date", required: true },
      {
        name: "category",
        type: "select",
        required: false,
        options: ["all", "duration", "behavior", "goals"],
      },
    ],
    defaultParameters: {
      category: "all",
    },
  },
  {
    id: "behavioral-analysis",
    name: "Behavioral Analysis",
    description: "Analysis of behavioral patterns and events",
    type: ReportType.DETAILED,
    parameters: [
      { name: "dateRange", type: "date", required: true },
      {
        name: "eventTypes",
        type: "select",
        required: false,
        options: ["all", "sessions", "events", "tasks"],
      },
    ],
    defaultParameters: {
      eventTypes: "all",
    },
  },
];

// Storage keys (imported from service)
const STORAGE_KEYS = REPORT_STORAGE_KEYS;

/**
 * Advanced Reporting Hook
 */
export const useReporting = (userId?: string, _relationshipId?: string) => {
  const queryClient = useQueryClient();

  // Get available templates
  const { data: availableReports = DEFAULT_TEMPLATES } = useQuery<
    ReportTemplate[]
  >({
    queryKey: ["reports", "templates"],
    queryFn: () => DEFAULT_TEMPLATES,
    staleTime: 5 * 60 * 1000,
  });

  // Get custom reports
  const { data: customReports = [] } = useQuery<CustomReport[]>({
    queryKey: ["reports", "custom", userId],
    queryFn: () => {
      return ReportStorageService.getCustomReports<CustomReport>();
    },
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });

  // Get recent reports
  const { data: recentReports = [] } = useQuery<GeneratedReport[]>({
    queryKey: ["reports", "recent", userId],
    queryFn: () => {
      return ReportStorageService.getRecentReports<GeneratedReport>();
    },
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
  });

  // Get preferences
  const { data: preferences } = useQuery<ReportingPreferences>({
    queryKey: ["reports", "preferences", userId],
    queryFn: () => {
      const stored =
        ReportStorageService.getPreferences<ReportingPreferences>();
      return stored
        ? stored
        : {
            defaultFormat: ExportFormat.JSON,
            autoRefresh: false,
            refreshInterval: 300000, // 5 minutes
            maxReports: 50,
          };
    },
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async ({
      templateId,
      parameters,
    }: {
      templateId: string;
      parameters: ReportParameters;
    }) => {
      const template = availableReports.find((t) => t.id === templateId);
      if (!template) throw new Error("Template not found");

      logger.info("Generating report", { templateId, parameters });

      // Simulate report generation
      const reportData = await generateReportData(templateId, parameters);

      const report: GeneratedReport = {
        id: `report-${Date.now()}`,
        templateId,
        name: template.name,
        parameters,
        data: reportData,
        generatedAt: new Date(),
        generatedBy: userId || "anonymous",
        size: JSON.stringify(reportData).length,
      };

      // Store in recent reports
      const updated = [report, ...recentReports].slice(
        0,
        preferences?.maxReports || 50,
      );
      ReportStorageService.setRecentReports(updated);
      queryClient.setQueryData(["reports", "recent", userId], updated);

      return report;
    },
  });

  // Create custom report mutation
  const createCustomReportMutation = useMutation({
    mutationFn: async (definition: CustomReportDefinition) => {
      const customReport: CustomReport = {
        id: `custom-${Date.now()}`,
        definition,
        createdAt: new Date(),
      };

      const updated = [...customReports, customReport];
      ReportStorageService.setCustomReports(updated);
      queryClient.setQueryData(["reports", "custom", userId], updated);

      logger.info("Custom report created", { reportId: customReport.id });
      return customReport;
    },
  });

  // Schedule report mutation
  const scheduleReportMutation = useMutation({
    mutationFn: async ({
      reportId,
      schedule,
    }: {
      reportId: string;
      schedule: ReportSchedule;
    }) => {
      const scheduledReport: ScheduledReport = {
        id: `schedule-${Date.now()}`,
        reportId,
        schedule,
        nextRun: calculateNextRun(schedule),
      };

      logger.info("Report scheduled", {
        reportId,
        schedule: scheduledReport.id,
      });
      return scheduledReport;
    },
  });

  // Export report mutation
  const exportReportMutation = useMutation({
    mutationFn: async ({
      reportId,
      format,
    }: {
      reportId: string;
      format: ExportFormat;
    }) => {
      const report = recentReports.find((r) => r.id === reportId);
      if (!report) throw new Error("Report not found");

      const exportData = await exportReportData(report, format);

      const exportResult: ReportExport = {
        id: `export-${Date.now()}`,
        reportId,
        format,
        url: exportData.url,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      logger.info("Report exported", {
        reportId,
        format,
        exportId: exportResult.id,
      });
      return exportResult;
    },
  });

  // Export raw data mutation
  const exportRawDataMutation = useMutation({
    mutationFn: async ({
      dataType,
      filters,
      format,
    }: {
      dataType: string;
      filters: DataFilter[];
      format: ExportFormat;
    }) => {
      const rawData = await getRawData(dataType, filters);
      const exportResult = await exportData(rawData, format);

      const dataExport: DataExport = {
        id: `data-export-${Date.now()}`,
        dataType,
        filters,
        format,
        url: exportResult.url,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      logger.info("Raw data exported", {
        dataType,
        format,
        exportId: dataExport.id,
      });
      return dataExport;
    },
  });

  // Helper functions
  const generateReportData = async (
    templateId: string,
    parameters: ReportParameters,
  ) => {
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
  };

  const generateDetailedData = () => ({
    sessions: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      startDate: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      ),
      duration: Math.floor(Math.random() * 72),
      events: Math.floor(Math.random() * 5),
    })),
  });

  const calculateNextRun = (schedule: ReportSchedule): Date => {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(":").map(Number);

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
  };

  const exportReportData = async (
    report: GeneratedReport,
    format: ExportFormat,
  ) => {
    // Simulate export processing
    await new Promise((resolve) => setTimeout(resolve, 500));

    const blob = new Blob([JSON.stringify(report.data, null, 2)], {
      type: getContentType(format),
    });
    const url = URL.createObjectURL(blob);

    return { url };
  };

  const getRawData = async (dataType: string, filters: DataFilter[]) => {
    // Simulate data retrieval
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { dataType, filters, records: [] };
  };

  const exportData = async (data: Record<string, unknown> | unknown[], format: ExportFormat) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: getContentType(format),
    });
    const url = URL.createObjectURL(blob);
    return { url };
  };

  const getContentType = (format: ExportFormat): string => {
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
  };

  return {
    // Available reports and templates
    availableReports,
    customReports,
    recentReports,
    preferences,

    // Actions
    generateReport: generateReportMutation.mutate,
    createCustomReport: createCustomReportMutation.mutate,
    scheduleReport: scheduleReportMutation.mutate,
    exportReport: exportReportMutation.mutate,
    exportRawData: exportRawDataMutation.mutate,

    // Loading states
    isGenerating: generateReportMutation.isPending,
    isCreatingCustom: createCustomReportMutation.isPending,
    isScheduling: scheduleReportMutation.isPending,
    isExporting:
      exportReportMutation.isPending || exportRawDataMutation.isPending,

    // Results
    lastGeneratedReport: generateReportMutation.data,
    lastExport: exportReportMutation.data || exportRawDataMutation.data,

    // Computed properties
    totalReports: recentReports.length,
    hasScheduledReports: false, // Would check actual scheduled reports
    lastReportDate:
      recentReports.length > 0 ? recentReports[0].generatedAt : null,
    hasCustomReports: customReports.length > 0,

    // Errors
    error:
      generateReportMutation.error ||
      createCustomReportMutation.error ||
      scheduleReportMutation.error ||
      exportReportMutation.error ||
      exportRawDataMutation.error,
  };
};
