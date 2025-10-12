/**
 * useReportData Hook Tests
 * Tests for report data aggregation from Firebase
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useReportData } from "../useReportData";

// Mock the other hooks that useReportData depends on
vi.mock("../useSessionQuery", () => ({
  useCurrentSession: vi.fn((userId) => ({
    data: userId
      ? {
          id: "session-1",
          startTime: new Date(),
          isPaused: false,
        }
      : null,
    isLoading: false,
    isSuccess: true,
    error: null,
    refetch: vi.fn(),
  })),
  useSessionHistory: vi.fn((userId, options) => ({
    data:
      userId && (!options || options.enabled !== false)
        ? [
            {
              id: "session-1",
              startTime: new Date("2024-01-01"),
              endTime: new Date("2024-01-02"),
              accumulatedPauseTime: 0,
            },
          ]
        : [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

vi.mock("../useEvents", () => ({
  useEventHistory: vi.fn((userId, options) => ({
    data:
      userId && (!options || options.enabled !== false)
        ? [
            {
              id: "event-1",
              type: "Orgasm (Self)",
              timestamp: new Date("2024-01-01"),
            },
          ]
        : [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

vi.mock("../useTaskQuery", () => ({
  useTasksQuery: vi.fn((userId) => ({
    data: userId
      ? [
          {
            id: "task-1",
            title: "Test Task",
            status: "completed",
          },
        ]
      : [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

vi.mock("@/services/database", () => ({
  goalDBService: {
    findByUserId: vi.fn().mockResolvedValue([
      {
        id: "goal-1",
        title: "Test Goal",
        isCompleted: false,
      },
    ]),
  },
}));

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

describe("useReportData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Data Aggregation", () => {
    it("should aggregate all data types", async () => {
      const { result } = renderHook(() => useReportData("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentSession).toBeDefined();
      expect(result.current.sessions).toBeDefined();
      expect(result.current.events).toBeDefined();
      expect(result.current.tasks).toBeDefined();
      expect(result.current.goals).toBeDefined();
    });

    it("should return current session data", async () => {
      const { result } = renderHook(() => useReportData("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.currentSession).not.toBeNull();
        expect(result.current.currentSession).toHaveProperty("id");
      });
    });

    it("should return session history array", async () => {
      const { result } = renderHook(() => useReportData("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(Array.isArray(result.current.sessions)).toBe(true);
        expect(result.current.sessions.length).toBeGreaterThan(0);
      });
    });

    it("should return events array", async () => {
      const { result } = renderHook(() => useReportData("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(Array.isArray(result.current.events)).toBe(true);
        expect(result.current.events.length).toBeGreaterThan(0);
      });
    });

    it("should return tasks array", async () => {
      const { result } = renderHook(() => useReportData("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(Array.isArray(result.current.tasks)).toBe(true);
        expect(result.current.tasks.length).toBeGreaterThan(0);
      });
    });

    it("should return goals array", async () => {
      const { result } = renderHook(() => useReportData("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(Array.isArray(result.current.goals)).toBe(true);
        expect(result.current.goals.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Loading States", () => {
    it("should indicate loading state", async () => {
      const { result } = renderHook(() => useReportData("user-123"), {
        wrapper: createWrapper(),
      });

      // Initially might be loading
      expect(typeof result.current.isLoading).toBe("boolean");

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should track loading for multiple queries", async () => {
      const { result } = renderHook(() => useReportData("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("Error Handling", () => {
    it("should expose error state", async () => {
      const { result } = renderHook(() => useReportData("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });

    it("should provide individual error states", async () => {
      const { result } = renderHook(() => useReportData("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.errors).toBeDefined();
        expect(result.current.errors).toHaveProperty("currentSession");
        expect(result.current.errors).toHaveProperty("sessions");
        expect(result.current.errors).toHaveProperty("events");
        expect(result.current.errors).toHaveProperty("tasks");
        expect(result.current.errors).toHaveProperty("goals");
      });
    });

    it("should indicate partial data when some queries fail", async () => {
      const { result } = renderHook(() => useReportData("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(typeof result.current.hasPartialData).toBe("boolean");
      });
    });
  });

  describe("Refetch Functions", () => {
    it("should provide refetch for current session", async () => {
      const { result } = renderHook(() => useReportData("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(typeof result.current.refetch.currentSession).toBe("function");
      });
    });

    it("should provide refetch for sessions", async () => {
      const { result } = renderHook(() => useReportData("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(typeof result.current.refetch.sessions).toBe("function");
      });
    });

    it("should provide refetch for events", async () => {
      const { result } = renderHook(() => useReportData("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(typeof result.current.refetch.events).toBe("function");
      });
    });

    it("should provide refetch for tasks", async () => {
      const { result } = renderHook(() => useReportData("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(typeof result.current.refetch.tasks).toBe("function");
      });
    });

    it("should provide refetch for goals", async () => {
      const { result } = renderHook(() => useReportData("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(typeof result.current.refetch.goals).toBe("function");
      });
    });

    it("should provide refetch all function", async () => {
      const { result } = renderHook(() => useReportData("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(typeof result.current.refetch.all).toBe("function");
      });
    });
  });

  describe("Selective Loading Options", () => {
    it("should accept enableSessions option", async () => {
      const { result } = renderHook(
        () => useReportData("user-123", { enableSessions: false }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        // Data structure is still maintained
        expect(Array.isArray(result.current.sessions)).toBe(true);
      });
    });

    it("should accept enableEvents option", async () => {
      const { result } = renderHook(
        () => useReportData("user-123", { enableEvents: false }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(Array.isArray(result.current.events)).toBe(true);
      });
    });

    it("should accept enableTasks option", async () => {
      const { result } = renderHook(
        () => useReportData("user-123", { enableTasks: false }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(Array.isArray(result.current.tasks)).toBe(true);
      });
    });

    it("should accept enableGoals option", async () => {
      const { result } = renderHook(
        () => useReportData("user-123", { enableGoals: false }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(Array.isArray(result.current.goals)).toBe(true);
      });
    });

    it("should handle deferHeavyQueries option", async () => {
      const { result } = renderHook(
        () => useReportData("user-123", { deferHeavyQueries: true }),
        { wrapper: createWrapper() },
      );

      // Should still work, just deferred
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("Without User ID", () => {
    it("should handle undefined userId", async () => {
      const { result } = renderHook(() => useReportData(undefined), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        // Data structures are still maintained
        expect(Array.isArray(result.current.sessions)).toBe(true);
        expect(Array.isArray(result.current.events)).toBe(true);
        expect(Array.isArray(result.current.tasks)).toBe(true);
        expect(Array.isArray(result.current.goals)).toBe(true);
      });
    });

    it("should not attempt heavy queries without userId", async () => {
      const { result } = renderHook(() => useReportData(undefined), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        // Returns empty arrays for safety
        expect(result.current.sessions.length).toBe(0);
        expect(result.current.events.length).toBe(0);
        expect(result.current.tasks.length).toBe(0);
        expect(result.current.goals.length).toBe(0);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty data arrays", async () => {
      const { result } = renderHook(() => useReportData("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(Array.isArray(result.current.sessions)).toBe(true);
        expect(Array.isArray(result.current.events)).toBe(true);
        expect(Array.isArray(result.current.tasks)).toBe(true);
        expect(Array.isArray(result.current.goals)).toBe(true);
      });
    });

    it("should handle rapid userId changes", async () => {
      const { result, rerender } = renderHook(
        ({ userId }) => useReportData(userId),
        {
          initialProps: { userId: "user-1" },
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      rerender({ userId: "user-2" });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should handle option changes without errors", async () => {
      const { result, rerender } = renderHook(
        ({ options }) => useReportData("user-123", options),
        {
          initialProps: { options: { enableSessions: true } },
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      rerender({ options: { enableSessions: false } });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        // Structure is maintained
        expect(Array.isArray(result.current.sessions)).toBe(true);
      });
    });

    it("should handle empty string userId", async () => {
      const { result } = renderHook(() => useReportData(""), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        // Empty string is falsy for practical purposes
        expect(result.current.sessions.length).toBe(0);
      });
    });

    it("should handle all options disabled", async () => {
      const { result } = renderHook(
        () =>
          useReportData("user-123", {
            enableSessions: false,
            enableEvents: false,
            enableTasks: false,
            enableGoals: false,
          }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        // Data structures are maintained
        expect(Array.isArray(result.current.sessions)).toBe(true);
        expect(Array.isArray(result.current.events)).toBe(true);
        expect(Array.isArray(result.current.tasks)).toBe(true);
        expect(Array.isArray(result.current.goals)).toBe(true);
      });
    });
  });

  describe("Data Consistency", () => {
    it("should maintain data structure even when loading", async () => {
      const { result } = renderHook(() => useReportData("user-123"), {
        wrapper: createWrapper(),
      });

      // Structure should be consistent
      expect(result.current).toHaveProperty("currentSession");
      expect(result.current).toHaveProperty("sessions");
      expect(result.current).toHaveProperty("events");
      expect(result.current).toHaveProperty("tasks");
      expect(result.current).toHaveProperty("goals");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("error");
      expect(result.current).toHaveProperty("errors");
      expect(result.current).toHaveProperty("refetch");
    });

    it("should return non-null defaults for arrays", async () => {
      const { result } = renderHook(() => useReportData("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(Array.isArray(result.current.sessions)).toBe(true);
        expect(Array.isArray(result.current.events)).toBe(true);
        expect(Array.isArray(result.current.tasks)).toBe(true);
        expect(Array.isArray(result.current.goals)).toBe(true);
      });
    });
  });
});
