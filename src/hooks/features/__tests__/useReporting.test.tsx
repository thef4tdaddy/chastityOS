/**
 * useReporting Hook Tests
 * Tests for the main reporting hook functionality
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useReporting, ExportFormat } from "../useReporting";

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useReporting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("Initial State", () => {
    it("should return default templates", async () => {
      const { result } = renderHook(() => useReporting("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.availableReports).toBeDefined();
        expect(result.current.availableReports.length).toBeGreaterThan(0);
      });
    });

    it("should return empty custom reports initially", async () => {
      const { result } = renderHook(() => useReporting("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.customReports).toEqual([]);
      });
    });

    it("should return empty recent reports initially", async () => {
      const { result } = renderHook(() => useReporting("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.recentReports).toEqual([]);
      });
    });

    it("should return default preferences", async () => {
      const { result } = renderHook(() => useReporting("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.preferences).toBeDefined();
        expect(result.current.preferences?.defaultFormat).toBe(
          ExportFormat.JSON,
        );
      });
    });
  });

  describe("Available Reports", () => {
    it("should include session summary template", async () => {
      const { result } = renderHook(() => useReporting("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        const sessionSummary = result.current.availableReports.find(
          (r) => r.id === "session-summary",
        );
        expect(sessionSummary).toBeDefined();
        expect(sessionSummary?.name).toBe("Session Summary");
      });
    });

    it("should include achievement progress template", async () => {
      const { result } = renderHook(() => useReporting("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        const achievementProgress = result.current.availableReports.find(
          (r) => r.id === "achievement-progress",
        );
        expect(achievementProgress).toBeDefined();
        expect(achievementProgress?.name).toBe("Achievement Progress");
      });
    });

    it("should include behavioral analysis template", async () => {
      const { result } = renderHook(() => useReporting("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        const behavioral = result.current.availableReports.find(
          (r) => r.id === "behavioral-analysis",
        );
        expect(behavioral).toBeDefined();
        expect(behavioral?.name).toBe("Behavioral Analysis");
      });
    });

    it("should have required parameters defined", async () => {
      const { result } = renderHook(() => useReporting("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        result.current.availableReports.forEach((template) => {
          expect(template).toHaveProperty("parameters");
          expect(Array.isArray(template.parameters)).toBe(true);
        });
      });
    });
  });

  describe("Actions", () => {
    it("should provide generateReport action", async () => {
      const { result } = renderHook(() => useReporting("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(typeof result.current.generateReport).toBe("function");
      });
    });

    it("should provide createCustomReport action", async () => {
      const { result } = renderHook(() => useReporting("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(typeof result.current.createCustomReport).toBe("function");
      });
    });

    it("should provide scheduleReport action", async () => {
      const { result } = renderHook(() => useReporting("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(typeof result.current.scheduleReport).toBe("function");
      });
    });

    it("should provide exportReport action", async () => {
      const { result } = renderHook(() => useReporting("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(typeof result.current.exportReport).toBe("function");
      });
    });

    it("should provide exportRawData action", async () => {
      const { result } = renderHook(() => useReporting("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(typeof result.current.exportRawData).toBe("function");
      });
    });
  });

  describe("Loading States", () => {
    it("should have isGenerating state", async () => {
      const { result } = renderHook(() => useReporting("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(typeof result.current.isGenerating).toBe("boolean");
        expect(result.current.isGenerating).toBe(false);
      });
    });

    it("should have isCreatingCustom state", async () => {
      const { result } = renderHook(() => useReporting("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(typeof result.current.isCreatingCustom).toBe("boolean");
        expect(result.current.isCreatingCustom).toBe(false);
      });
    });

    it("should have isScheduling state", async () => {
      const { result } = renderHook(() => useReporting("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(typeof result.current.isScheduling).toBe("boolean");
        expect(result.current.isScheduling).toBe(false);
      });
    });

    it("should have isExporting state", async () => {
      const { result } = renderHook(() => useReporting("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(typeof result.current.isExporting).toBe("boolean");
        expect(result.current.isExporting).toBe(false);
      });
    });
  });

  describe("Computed Properties", () => {
    it("should calculate totalReports correctly", async () => {
      const { result } = renderHook(() => useReporting("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(typeof result.current.totalReports).toBe("number");
        expect(result.current.totalReports).toBe(0);
      });
    });

    it("should indicate hasCustomReports status", async () => {
      const { result } = renderHook(() => useReporting("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(typeof result.current.hasCustomReports).toBe("boolean");
        expect(result.current.hasCustomReports).toBe(false);
      });
    });

    it("should track lastReportDate", async () => {
      const { result } = renderHook(() => useReporting("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.lastReportDate).toBeNull();
      });
    });
  });

  describe("Without User ID", () => {
    it("should handle undefined userId gracefully", async () => {
      const { result } = renderHook(() => useReporting(undefined), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.availableReports).toBeDefined();
      });
    });

    it("should not fetch custom reports without userId", async () => {
      const { result } = renderHook(() => useReporting(undefined), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.customReports).toEqual([]);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle relationship ID parameter", async () => {
      const { result } = renderHook(
        () => useReporting("user-123", "relationship-456"),
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(result.current.availableReports).toBeDefined();
      });
    });

    it("should handle rapid re-renders", async () => {
      const { result, rerender } = renderHook(
        ({ userId }) => useReporting(userId),
        {
          initialProps: { userId: "user-1" },
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(result.current.availableReports).toBeDefined();
      });

      // Re-render with different user
      rerender({ userId: "user-2" });

      await waitFor(() => {
        expect(result.current.availableReports).toBeDefined();
      });
    });

    it("should not error when localStorage is unavailable", async () => {
      // Mock localStorage to throw
      const getItemSpy = vi
        .spyOn(Storage.prototype, "getItem")
        .mockImplementation(() => {
          throw new Error("Storage unavailable");
        });

      const { result } = renderHook(() => useReporting("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.availableReports).toBeDefined();
      });

      getItemSpy.mockRestore();
    });

    it("should handle empty string userId", async () => {
      const { result } = renderHook(() => useReporting(""), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.availableReports).toBeDefined();
      });
    });
  });

  describe("Error Handling", () => {
    it("should expose error state", async () => {
      const { result } = renderHook(() => useReporting("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });

    it("should handle corrupted localStorage data", async () => {
      localStorage.setItem("chastity-reports-custom", "invalid-json");

      const { result } = renderHook(() => useReporting("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.customReports).toEqual([]);
      });
    });
  });
});
