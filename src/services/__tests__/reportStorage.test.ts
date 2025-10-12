/**
 * Report Storage Service Tests
 * Tests for localStorage operations related to reporting
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ReportStorageService, REPORT_STORAGE_KEYS } from "../reportStorage";

describe("ReportStorageService", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("Custom Reports", () => {
    it("should return empty array when no custom reports exist", () => {
      const reports = ReportStorageService.getCustomReports();
      expect(reports).toEqual([]);
    });

    it("should save and retrieve custom reports", () => {
      const customReports = [
        {
          id: "custom-1",
          definition: {
            name: "My Custom Report",
            description: "Test report",
            dataSource: "sessions",
            fields: ["date", "duration"],
            filters: [],
          },
          createdAt: new Date("2024-01-01"),
        },
      ];

      const success = ReportStorageService.setCustomReports(customReports);
      expect(success).toBe(true);

      const retrieved = ReportStorageService.getCustomReports();
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].id).toBe("custom-1");
      expect(retrieved[0].definition.name).toBe("My Custom Report");
    });

    it("should handle multiple custom reports", () => {
      const customReports = [
        { id: "custom-1", definition: {}, createdAt: new Date() },
        { id: "custom-2", definition: {}, createdAt: new Date() },
        { id: "custom-3", definition: {}, createdAt: new Date() },
      ];

      ReportStorageService.setCustomReports(customReports);
      const retrieved = ReportStorageService.getCustomReports();
      expect(retrieved).toHaveLength(3);
    });

    it("should return empty array on JSON parse error", () => {
      localStorage.setItem(REPORT_STORAGE_KEYS.CUSTOM_REPORTS, "invalid-json");
      const reports = ReportStorageService.getCustomReports();
      expect(reports).toEqual([]);
    });

    it("should handle save errors gracefully", () => {
      // Mock localStorage.setItem to throw an error
      const setItemSpy = vi
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(() => {
          throw new Error("Storage quota exceeded");
        });

      const result = ReportStorageService.setCustomReports([
        { id: "test", definition: {}, createdAt: new Date() },
      ]);
      expect(result).toBe(false);

      setItemSpy.mockRestore();
    });
  });

  describe("Recent Reports", () => {
    it("should return empty array when no recent reports exist", () => {
      const reports = ReportStorageService.getRecentReports();
      expect(reports).toEqual([]);
    });

    it("should save and retrieve recent reports", () => {
      const recentReports = [
        {
          id: "report-1",
          templateId: "session-summary",
          name: "Session Summary",
          parameters: {
            dateRange: {
              start: new Date("2024-01-01"),
              end: new Date("2024-01-31"),
            },
            includeDetails: false,
            filters: {},
          },
          data: { summary: { totalSessions: 5 } },
          generatedAt: new Date("2024-01-31"),
          generatedBy: "user-123",
          size: 1024,
        },
      ];

      const success = ReportStorageService.setRecentReports(recentReports);
      expect(success).toBe(true);

      const retrieved = ReportStorageService.getRecentReports();
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].id).toBe("report-1");
      expect(retrieved[0].name).toBe("Session Summary");
    });

    it("should handle empty recent reports array", () => {
      ReportStorageService.setRecentReports([]);
      const retrieved = ReportStorageService.getRecentReports();
      expect(retrieved).toEqual([]);
    });

    it("should return empty array on JSON parse error", () => {
      localStorage.setItem(REPORT_STORAGE_KEYS.RECENT_REPORTS, "invalid-json");
      const reports = ReportStorageService.getRecentReports();
      expect(reports).toEqual([]);
    });

    it("should handle large report arrays", () => {
      const largeArray = Array.from({ length: 100 }, (_, i) => ({
        id: `report-${i}`,
        templateId: "test",
        name: `Report ${i}`,
        parameters: {},
        data: {},
        generatedAt: new Date(),
        generatedBy: "user",
        size: 100,
      }));

      const success = ReportStorageService.setRecentReports(largeArray);
      expect(success).toBe(true);

      const retrieved = ReportStorageService.getRecentReports();
      expect(retrieved).toHaveLength(100);
    });
  });

  describe("Reporting Preferences", () => {
    it("should return null when no preferences exist", () => {
      const prefs = ReportStorageService.getPreferences();
      expect(prefs).toBeNull();
    });

    it("should save and retrieve preferences", () => {
      const preferences = {
        defaultFormat: "JSON",
        autoRefresh: true,
        refreshInterval: 300000,
        maxReports: 50,
      };

      const success = ReportStorageService.setPreferences(preferences);
      expect(success).toBe(true);

      const retrieved = ReportStorageService.getPreferences();
      expect(retrieved).toEqual(preferences);
    });

    it("should update existing preferences", () => {
      const prefs1 = { defaultFormat: "JSON", autoRefresh: false };
      ReportStorageService.setPreferences(prefs1);

      const prefs2 = { defaultFormat: "CSV", autoRefresh: true };
      ReportStorageService.setPreferences(prefs2);

      const retrieved = ReportStorageService.getPreferences();
      expect(retrieved).toEqual(prefs2);
    });

    it("should return null on JSON parse error", () => {
      localStorage.setItem(REPORT_STORAGE_KEYS.PREFERENCES, "invalid-json");
      const prefs = ReportStorageService.getPreferences();
      expect(prefs).toBeNull();
    });

    it("should handle complex preference objects", () => {
      const preferences = {
        defaultFormat: "PDF",
        autoRefresh: true,
        refreshInterval: 60000,
        maxReports: 100,
        customSettings: {
          theme: "dark",
          fontSize: 14,
          showGrid: true,
        },
      };

      ReportStorageService.setPreferences(preferences);
      const retrieved = ReportStorageService.getPreferences();
      expect(retrieved).toEqual(preferences);
    });
  });

  describe("clearAll", () => {
    it("should clear all reporting storage", () => {
      // Set up some data
      ReportStorageService.setCustomReports([
        { id: "custom-1", definition: {}, createdAt: new Date() },
      ]);
      ReportStorageService.setRecentReports([
        {
          id: "report-1",
          templateId: "test",
          name: "Test",
          parameters: {},
          data: {},
          generatedAt: new Date(),
          generatedBy: "user",
          size: 100,
        },
      ]);
      ReportStorageService.setPreferences({ defaultFormat: "JSON" });

      // Verify data exists
      expect(ReportStorageService.getCustomReports()).toHaveLength(1);
      expect(ReportStorageService.getRecentReports()).toHaveLength(1);
      expect(ReportStorageService.getPreferences()).not.toBeNull();

      // Clear all
      const success = ReportStorageService.clearAll();
      expect(success).toBe(true);

      // Verify data is cleared
      expect(ReportStorageService.getCustomReports()).toEqual([]);
      expect(ReportStorageService.getRecentReports()).toEqual([]);
      expect(ReportStorageService.getPreferences()).toBeNull();
    });

    it("should handle clear errors gracefully", () => {
      const removeItemSpy = vi
        .spyOn(Storage.prototype, "removeItem")
        .mockImplementation(() => {
          throw new Error("Cannot clear storage");
        });

      const result = ReportStorageService.clearAll();
      expect(result).toBe(false);

      removeItemSpy.mockRestore();
    });

    it("should not affect other localStorage items", () => {
      localStorage.setItem("other-key", "other-value");
      ReportStorageService.setCustomReports([
        { id: "custom-1", definition: {}, createdAt: new Date() },
      ]);

      ReportStorageService.clearAll();

      expect(localStorage.getItem("other-key")).toBe("other-value");
      expect(ReportStorageService.getCustomReports()).toEqual([]);
    });
  });

  describe("Edge Cases", () => {
    it("should handle null values gracefully", () => {
      // @ts-expect-error Testing null handling
      ReportStorageService.setCustomReports(null);
      // Should not throw, localStorage will convert to string
    });

    it("should handle undefined values gracefully", () => {
      // @ts-expect-error Testing undefined handling
      ReportStorageService.setRecentReports(undefined);
      // Should not throw, localStorage will convert to string
    });

    it("should handle circular references in data", () => {
      const circular: { id: string; self?: unknown } = { id: "test" };
      circular.self = circular;

      // JSON.stringify will throw on circular references
      // @ts-expect-error Testing circular reference handling
      const result = ReportStorageService.setCustomReports([circular]);
      expect(result).toBe(false);
    });

    it("should handle very large data sets", () => {
      const largeData = {
        data: new Array(10000)
          .fill(0)
          .map((_, i) => ({ id: i, value: `value-${i}` })),
      };

      const result = ReportStorageService.setPreferences(largeData);
      // May succeed or fail depending on browser limits
      expect(typeof result).toBe("boolean");
    });
  });
});
