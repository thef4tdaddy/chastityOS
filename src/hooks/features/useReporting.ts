/**
 * useReporting Hook - Advanced Reporting & Analytics
 *
 * Comprehensive reporting system with custom reports, data visualization,
 * and export capabilities for detailed analysis.
 */

import { useQuery } from "@tanstack/react-query";
import { ReportStorageService } from "../../services/reportStorage";
import { useReportingMutations } from "./useReportingMutations";

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

/**
 * Advanced Reporting Hook
 */
export const useReporting = (userId?: string, _relationshipId?: string) => {
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

  const {
    generateReportMutation,
    createCustomReportMutation,
    scheduleReportMutation,
    exportReportMutation,
    exportRawDataMutation,
  } = useReportingMutations(
    userId,
    availableReports,
    recentReports,
    preferences,
  );

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
