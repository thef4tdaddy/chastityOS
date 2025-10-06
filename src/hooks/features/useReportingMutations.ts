/**
 * Reporting mutations hook
 * Separates mutation logic from main useReporting hook
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logger } from "../../utils/logging";
import { ReportStorageService } from "../../services/reportStorage";
import {
  ReportTemplate,
  GeneratedReport,
  CustomReport,
  CustomReportDefinition,
  ScheduledReport,
  ReportSchedule,
  ReportExport,
  DataExport,
  DataFilter,
  ExportFormat,
  ReportParameters,
  ReportingPreferences,
} from "./useReporting";
import {
  generateReportData,
  calculateNextRun,
  exportReportData,
  getRawData,
  exportData,
} from "../../utils/reporting/reportingHelpers";

export function useReportingMutations(
  userId: string | undefined,
  availableReports: ReportTemplate[],
  recentReports: GeneratedReport[],
  preferences: ReportingPreferences | undefined,
) {
  const queryClient = useQueryClient();

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

      const customReports =
        ReportStorageService.getCustomReports<CustomReport>();
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

      const exportDataResult = await exportReportData(report, format);

      const exportResult: ReportExport = {
        id: `export-${Date.now()}`,
        reportId,
        format,
        url: exportDataResult.url,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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

  return {
    generateReportMutation,
    createCustomReportMutation,
    scheduleReportMutation,
    exportReportMutation,
    exportRawDataMutation,
  };
}
