/**
 * Report Storage Service Tests
 * Tests for localStorage operations related to reporting
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ReportStorageService, REPORT_STORAGE_KEYS } from "../reportStorage";

// Define interfaces for the report types to ensure type safety in tests
interface CustomReport {
  id: string;
  definition: {
    name?: string;
  };
  createdAt: Date;
}

interface RecentReport {
  id: string;
  templateId: string;
  name: string;
  parameters: object;
  data: object;
  generatedAt: Date;
  generatedBy: string;
  size: number;
}

interface ReportPreferences {
  defaultFormat: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  maxReports?: number;
  customSettings?: object;
}

describe("ReportStorageService", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("Custom Reports", () => {
    it("should return empty array when no custom reports exist", () => {
      const reports = ReportStorageService.getCustomReports<CustomReport>();
      expect(reports).toEqual([]);
    });

    it("should save and retrieve custom reports", () => {
      const customReports: CustomReport[] = [
        {
          id: "custom-1",
          definition: { name: "My Custom Report" },
          createdAt: new Date("2024-01-01"),
        },
      ];

      const success = ReportStorageService.setCustomReports(customReports);
      expect(success).toBe(true);

      const retrieved = ReportStorageService.getCustomReports<CustomReport>();
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0]!.id).toBe("custom-1");
      expect(retrieved[0]!.definition.name).toBe("My Custom Report");
    });

    it("should handle multiple custom reports", () => {
      const customReports: CustomReport[] = [
        { id: "custom-1", definition: {}, createdAt: new Date() },
        { id: "custom-2", definition: {}, createdAt: new Date() },
        { id: "custom-3", definition: {}, createdAt: new Date() },
      ];

      ReportStorageService.setCustomReports(customReports);
      const retrieved = ReportStorageService.getCustomReports<CustomReport>();
      expect(retrieved).toHaveLength(3);
    });

    it("should return empty array on JSON parse error", () => {
      localStorage.setItem(REPORT_STORAGE_KEYS.CUSTOM_REPORTS, "invalid-json");
      const reports = ReportStorageService.getCustomReports<CustomReport>();
      expect(reports).toEqual([]);
    });

    it("should handle save errors gracefully", () => {
      const setItemSpy = vi
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(() => {
          throw new Error("Storage quota exceeded");
        });

      const result = ReportStorageService.setCustomReports<CustomReport>([
        { id: "test", definition: {}, createdAt: new Date() },
      ]);
      expect(result).toBe(false);

      setItemSpy.mockRestore();
    });
  });

  describe("Recent Reports", () => {
    it("should return empty array when no recent reports exist", () => {
      const reports = ReportStorageService.getRecentReports<RecentReport>();
      expect(reports).toEqual([]);
    });

    it("should save and retrieve recent reports", () => {
      const recentReports: RecentReport[] = [
        {
          id: "report-1",
          templateId: "session-summary",
          name: "Session Summary",
          parameters: {
            dateRange: {
              start: new Date("2024-01-01"),
              end: new Date("2024-01-31"),
            },
          },
          data: { summary: { totalSessions: 5 } },
          generatedAt: new Date("2024-01-31"),
          generatedBy: "user-123",
          size: 1024,
        },
      ];

      const success = ReportStorageService.setRecentReports(recentReports);
      expect(success).toBe(true);

      const retrieved = ReportStorageService.getRecentReports<RecentReport>();
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0]!.id).toBe("report-1");
      expect(retrieved[0]!.name).toBe("Session Summary");
    });

    it("should handle empty recent reports array", () => {
      ReportStorageService.setRecentReports([]);
      const retrieved = ReportStorageService.getRecentReports<RecentReport>();
      expect(retrieved).toEqual([]);
    });

    it("should return empty array on JSON parse error", () => {
      localStorage.setItem(REPORT_STORAGE_KEYS.RECENT_REPORTS, "invalid-json");
      const reports = ReportStorageService.getRecentReports<RecentReport>();
      expect(reports).toEqual([]);
    });
  });

  describe("Reporting Preferences", () => {
    it("should return null when no preferences exist", () => {
      const prefs = ReportStorageService.getPreferences<ReportPreferences>();
      expect(prefs).toBeNull();
    });

    it("should save and retrieve preferences", () => {
      const preferences: ReportPreferences = {
        defaultFormat: "JSON",
        autoRefresh: true,
        refreshInterval: 300000,
        maxReports: 50,
      };

      const success = ReportStorageService.setPreferences(preferences);
      expect(success).toBe(true);

      const retrieved =
        ReportStorageService.getPreferences<ReportPreferences>();
      expect(retrieved).toEqual(preferences);
    });
  });

  describe("clearAll", () => {
    it("should clear all reporting storage", () => {
      ReportStorageService.setCustomReports([]);
      ReportStorageService.setRecentReports([]);
      ReportStorageService.setPreferences({ defaultFormat: "JSON" });

      const success = ReportStorageService.clearAll();
      expect(success).toBe(true);

      expect(ReportStorageService.getCustomReports()).toEqual([]);
      expect(ReportStorageService.getRecentReports()).toEqual([]);
      expect(ReportStorageService.getPreferences()).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("should handle circular references in data", () => {
      const circular: { id: string; self?: unknown } = { id: "test" };
      circular.self = circular;

      // JSON.stringify will throw on circular references
      const result = ReportStorageService.setCustomReports([circular as any]);
      expect(result).toBe(false);
    });

    it("should handle very large data sets", () => {
      const largeData = {
        data: new Array(10000)
          .fill(0)
          .map((_, i) => ({ id: i, value: `value-${i}` })),
      };

      const result = ReportStorageService.setPreferences(largeData);
      expect(typeof result).toBe("boolean");
    });
  });
});
