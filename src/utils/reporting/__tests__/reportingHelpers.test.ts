/**
 * Reporting Helpers Tests
 * Tests for report generation, export, and calculation functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generateReportData,
  generateDetailedData,
  calculateNextRun,
  exportReportData,
  getRawData,
  exportData,
  getContentType,
} from "../reportingHelpers";
import {
  ExportFormat,
  ReportSchedule,
  type ReportParameters,
} from "@/hooks/features/useReporting";

describe("Reporting Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateReportData", () => {
    it("should generate report data with summary", async () => {
      const parameters = {
        dateRange: {
          start: new Date("2024-01-01"),
          end: new Date("2024-01-31"),
        },
        includeDetails: false,
        filters: {},
      };

      const result = await generateReportData("session-summary", parameters);

      expect(result).toHaveProperty("summary");
      expect(result.summary).toHaveProperty("totalSessions");
      expect(result.summary).toHaveProperty("averageDuration");
      expect(result.summary).toHaveProperty("longestSession");
      expect(result).toHaveProperty("generatedAt");
      expect(result.details).toBeNull();
    });

    it("should include detailed data when requested", async () => {
      const parameters = {
        dateRange: {
          start: new Date("2024-01-01"),
          end: new Date("2024-01-31"),
        },
        includeDetails: true,
        filters: {},
      };

      const result = await generateReportData("session-summary", parameters);

      expect(result.details).not.toBeNull();
      expect(result.details).toHaveProperty("sessions");
      expect(Array.isArray(result.details?.sessions)).toBe(true);
    });

    it("should generate numeric values within expected ranges", async () => {
      const parameters = {
        dateRange: { start: new Date(), end: new Date() },
        includeDetails: false,
        filters: {},
      };

      const result = await generateReportData("test-template", parameters);

      expect(result.summary.totalSessions).toBeGreaterThanOrEqual(0);
      expect(result.summary.totalSessions).toBeLessThan(100);
      expect(result.summary.averageDuration).toBeGreaterThanOrEqual(0);
      expect(result.summary.longestSession).toBeGreaterThanOrEqual(0);
    });

    it("should always include generatedAt timestamp", async () => {
      const parameters = {
        dateRange: { start: new Date(), end: new Date() },
        includeDetails: false,
        filters: {},
      };

      const result = await generateReportData("test-template", parameters);
      expect(result.generatedAt).toBeDefined();
      expect(typeof result.generatedAt).toBe("string");
      expect(new Date(result.generatedAt).toString()).not.toBe("Invalid Date");
    });
  });

  describe("generateDetailedData", () => {
    it("should generate array of sessions", () => {
      const result = generateDetailedData();

      expect(result).toHaveProperty("sessions");
      expect(Array.isArray(result.sessions)).toBe(true);
      expect(result.sessions.length).toBe(10);
    });

    it("should generate sessions with required fields", () => {
      const result = generateDetailedData();

      result.sessions.forEach((session) => {
        expect(session).toHaveProperty("id");
        expect(session).toHaveProperty("startDate");
        expect(session).toHaveProperty("duration");
        expect(session).toHaveProperty("events");
        expect(typeof session.id).toBe("number");
        expect(session.startDate).toBeInstanceOf(Date);
        expect(typeof session.duration).toBe("number");
        expect(typeof session.events).toBe("number");
      });
    });

    it("should generate valid date ranges for sessions", () => {
      const result = generateDetailedData();
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

      result.sessions.forEach((session) => {
        const sessionTime = session.startDate.getTime();
        expect(sessionTime).toBeGreaterThanOrEqual(thirtyDaysAgo);
        expect(sessionTime).toBeLessThanOrEqual(now);
      });
    });

    it("should generate non-negative durations and events", () => {
      const result = generateDetailedData();

      result.sessions.forEach((session) => {
        expect(session.duration).toBeGreaterThanOrEqual(0);
        expect(session.duration).toBeLessThan(72);
        expect(session.events).toBeGreaterThanOrEqual(0);
        expect(session.events).toBeLessThan(5);
      });
    });
  });

  describe("calculateNextRun", () => {
    beforeEach(() => {
      // Mock Date.now() to return a consistent value
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-15T14:30:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should calculate next daily run", () => {
      const schedule: ReportSchedule = {
        frequency: "daily",
        time: "09:00",
        recipients: ["user@example.com"],
        format: ExportFormat.JSON,
        enabled: true,
      };

      const nextRun = calculateNextRun(schedule);
      expect(nextRun.getHours()).toBe(9);
      expect(nextRun.getMinutes()).toBe(0);
    });

    it("should advance to next day if time has passed", () => {
      const schedule: ReportSchedule = {
        frequency: "daily",
        time: "08:00",
        recipients: [],
        format: ExportFormat.JSON,
        enabled: true,
      };

      const now = new Date("2024-01-15T14:30:00Z");
      const nextRun = calculateNextRun(schedule);

      // Since 8:00 AM has already passed today, should be tomorrow
      expect(nextRun.getDate()).toBeGreaterThan(now.getDate());
    });

    it("should calculate next weekly run", () => {
      const schedule: ReportSchedule = {
        frequency: "weekly",
        time: "10:00",
        recipients: [],
        format: ExportFormat.JSON,
        enabled: true,
      };

      const now = new Date("2024-01-15T14:30:00Z");
      const nextRun = calculateNextRun(schedule);

      // Should be 7 days from now if time has passed
      const daysDiff = Math.floor(
        (nextRun.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      expect(daysDiff).toBeGreaterThanOrEqual(0);
      expect(daysDiff).toBeLessThanOrEqual(7);
    });

    it("should calculate next monthly run", () => {
      const schedule: ReportSchedule = {
        frequency: "monthly",
        time: "12:00",
        recipients: [],
        format: ExportFormat.JSON,
        enabled: true,
      };

      const now = new Date("2024-01-15T14:30:00Z");
      const nextRun = calculateNextRun(schedule);

      // Month should be incremented if time has passed today
      const monthDiff =
        (nextRun.getFullYear() - now.getFullYear()) * 12 +
        (nextRun.getMonth() - now.getMonth());
      expect(monthDiff).toBeGreaterThanOrEqual(0);
      expect(monthDiff).toBeLessThanOrEqual(1);
    });

    it("should handle time at midnight", () => {
      const schedule: ReportSchedule = {
        frequency: "daily",
        time: "00:00",
        recipients: [],
        format: ExportFormat.JSON,
        enabled: true,
      };

      const nextRun = calculateNextRun(schedule);
      expect(nextRun.getHours()).toBe(0);
      expect(nextRun.getMinutes()).toBe(0);
    });

    it("should handle time at end of day", () => {
      const schedule: ReportSchedule = {
        frequency: "daily",
        time: "23:59",
        recipients: [],
        format: ExportFormat.JSON,
        enabled: true,
      };

      const nextRun = calculateNextRun(schedule);
      expect(nextRun.getHours()).toBe(23);
      expect(nextRun.getMinutes()).toBe(59);
    });

    it("should handle invalid time format gracefully", () => {
      const schedule: ReportSchedule = {
        frequency: "daily",
        time: "invalid",
        recipients: [],
        format: ExportFormat.JSON,
        enabled: true,
      };

      const nextRun = calculateNextRun(schedule);
      // Should default to 00:00 due to NaN handling
      expect(nextRun).toBeInstanceOf(Date);
    });
  });

  describe("exportReportData", () => {
    const mockParameters: ReportParameters = {
      dateRange: { start: new Date(), end: new Date() },
      includeDetails: false,
      filters: {},
    };

    beforeEach(() => {
      // Mock URL.createObjectURL
      global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    });

    it("should export report data and return URL", async () => {
      const report = {
        id: "report-1",
        templateId: "test",
        name: "Test Report",
        parameters: mockParameters,
        data: { summary: { totalSessions: 5 } },
        generatedAt: new Date(),
        generatedBy: "user",
        size: 100,
      };

      const result = await exportReportData(report, ExportFormat.JSON);

      expect(result).toHaveProperty("url");
      expect(result.url).toBe("blob:mock-url");
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it("should create blob with correct content type", async () => {
      const report = {
        id: "report-1",
        templateId: "test",
        name: "Test Report",
        parameters: mockParameters,
        data: { test: "data" },
        generatedAt: new Date(),
        generatedBy: "user",
        size: 50,
      };

      await exportReportData(report, ExportFormat.CSV);
      // Blob creation happens internally, we verify the function completes
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it("should handle different export formats", async () => {
      const report = {
        id: "report-1",
        templateId: "test",
        name: "Test Report",
        parameters: mockParameters,
        data: {},
        generatedAt: new Date(),
        generatedBy: "user",
        size: 10,
      };

      const formats = [
        ExportFormat.JSON,
        ExportFormat.CSV,
        ExportFormat.PDF,
        ExportFormat.XLSX,
      ];

      for (const format of formats) {
        const result = await exportReportData(report, format);
        expect(result.url).toBeDefined();
      }
    });
  });

  describe("getRawData", () => {
    it("should retrieve raw data with filters", async () => {
      const filters = [{ field: "date", value: "2024-01-01" }];

      const result = await getRawData("sessions", filters);

      expect(result).toHaveProperty("dataType");
      expect(result).toHaveProperty("filters");
      expect(result).toHaveProperty("records");
      expect(result.dataType).toBe("sessions");
      expect(result.filters).toEqual(filters);
    });

    it("should handle empty filters array", async () => {
      const result = await getRawData("events", []);

      expect(result.filters).toEqual([]);
      expect(result.records).toEqual([]);
    });

    it("should support multiple data types", async () => {
      const dataTypes = ["sessions", "events", "tasks", "goals"];

      for (const dataType of dataTypes) {
        const result = await getRawData(dataType, []);
        expect(result.dataType).toBe(dataType);
      }
    });
  });

  describe("exportData", () => {
    beforeEach(() => {
      global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    });

    it("should export data as JSON", async () => {
      const data = { sessions: [{ id: 1 }, { id: 2 }] };

      const result = await exportData(data, ExportFormat.JSON);

      expect(result).toHaveProperty("url");
      expect(result.url).toBe("blob:mock-url");
    });

    it("should export array data", async () => {
      const data = [1, 2, 3, 4, 5];

      const result = await exportData(data, ExportFormat.JSON);

      expect(result.url).toBeDefined();
    });

    it("should handle empty data", async () => {
      const result = await exportData({}, ExportFormat.JSON);

      expect(result.url).toBeDefined();
    });

    it("should handle null values in data", async () => {
      const data = { field1: null, field2: "value" };

      const result = await exportData(data, ExportFormat.JSON);

      expect(result.url).toBeDefined();
    });
  });

  describe("getContentType", () => {
    it("should return correct content type for JSON", () => {
      expect(getContentType(ExportFormat.JSON)).toBe("application/json");
    });

    it("should return correct content type for CSV", () => {
      expect(getContentType(ExportFormat.CSV)).toBe("text/csv");
    });

    it("should return correct content type for PDF", () => {
      expect(getContentType(ExportFormat.PDF)).toBe("application/pdf");
    });

    it("should return correct content type for XLSX", () => {
      expect(getContentType(ExportFormat.XLSX)).toBe(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
    });

    it("should return default content type for unknown format", () => {
      // @ts-expect-error Testing unknown format
      expect(getContentType("unknown")).toBe("application/octet-stream");
    });
  });

  describe("Edge Cases", () => {
    const mockParameters: ReportParameters = {
      dateRange: { start: new Date(), end: new Date() },
      includeDetails: false,
      filters: {},
    };

    it("should handle very large date ranges", async () => {
      const parameters = {
        dateRange: {
          start: new Date("2000-01-01"),
          end: new Date("2024-12-31"),
        },
        includeDetails: true,
        filters: {},
      };

      const result = await generateReportData("test", parameters);
      expect(result).toBeDefined();
    });

    it("should handle future dates in schedule", () => {
      const schedule: ReportSchedule = {
        frequency: "daily",
        time: "23:59",
        recipients: [],
        format: ExportFormat.JSON,
        enabled: true,
      };

      const nextRun = calculateNextRun(schedule);
      expect(nextRun.getTime()).toBeGreaterThanOrEqual(Date.now());
    });

    it("should handle empty report data export", async () => {
      const emptyReport = {
        id: "empty",
        templateId: "test",
        name: "Empty Report",
        parameters: mockParameters,
        data: {},
        generatedAt: new Date(),
        generatedBy: "user",
        size: 0,
      };

      const result = await exportReportData(emptyReport, ExportFormat.JSON);
      expect(result.url).toBeDefined();
    });

    it("should handle special characters in data", async () => {
      const data = {
        text: 'Special "quotes" and \\slashes\\',
        unicode: "emoji 😀 and symbols ©",
      };

      const result = await exportData(data, ExportFormat.JSON);
      expect(result.url).toBeDefined();
    });
  });
});
