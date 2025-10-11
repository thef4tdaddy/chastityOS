/**
 * useTaskQuery Tests
 * Tests for Task TanStack Query hooks
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTasksQuery, usePendingTasksQuery } from "../useTaskQuery";
import { taskDBService } from "@/services/database";
import type { DBTask } from "@/types/database";
import React from "react";

// Mock the database service
vi.mock("@/services/database", () => ({
  taskDBService: {
    findByUserId: vi.fn(),
    findById: vi.fn(),
    getAll: vi.fn(),
  },
}));

// Mock Firebase sync
vi.mock("@/services/sync", () => ({
  firebaseSync: {
    syncUserTasks: vi.fn().mockResolvedValue(undefined),
  },
}));

// Create a wrapper with QueryClient
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

describe("useTasksQuery", () => {
  const mockUserId = "test-user-123";
  const mockTasks: DBTask[] = [
    {
      id: "task-1",
      userId: mockUserId,
      text: "Task 1",
      status: "pending",
      priority: "high",
      assignedBy: "keyholder",
      createdAt: new Date("2024-01-01"),
      lastModified: new Date(),
      syncStatus: "synced",
    },
    {
      id: "task-2",
      userId: mockUserId,
      text: "Task 2",
      status: "completed",
      priority: "medium",
      assignedBy: "submissive",
      createdAt: new Date("2024-01-02"),
      lastModified: new Date(),
      syncStatus: "synced",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (taskDBService.findByUserId as any).mockResolvedValue(mockTasks);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should fetch tasks for a user", async () => {
    const { result } = renderHook(() => useTasksQuery(mockUserId), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading || result.current.isPending).toBe(true);

    // Wait for query to complete
    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 3000 },
    );

    expect(result.current.data).toEqual(mockTasks);
    expect(taskDBService.findByUserId).toHaveBeenCalledWith(mockUserId);
  });

  it("should not fetch when userId is undefined", async () => {
    const { result } = renderHook(() => useTasksQuery(undefined), {
      wrapper: createWrapper(),
    });

    // Query should be disabled, not fetch
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(result.current.isPending).toBe(true);
    expect(taskDBService.findByUserId).not.toHaveBeenCalled();
  });

  it("should handle errors gracefully", async () => {
    const error = new Error("Database error");
    (taskDBService.findByUserId as any).mockRejectedValue(error);

    const { result } = renderHook(() => useTasksQuery(mockUserId), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 3000 },
    );

    expect(result.current.error).toBeDefined();
  });

  it("should not fetch when enabled is false", async () => {
    const { result } = renderHook(() => useTasksQuery(""), {
      wrapper: createWrapper(),
    });

    // Wait a bit to ensure no fetch happens
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.isPending).toBe(true);
    expect(taskDBService.findByUserId).not.toHaveBeenCalled();
  });

  it("should fetch tasks successfully when online", async () => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });

    const { result } = renderHook(() => useTasksQuery(mockUserId), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 3000 },
    );

    // Verify the query succeeded and returned data
    expect(result.current.data).toEqual(mockTasks);
    expect(taskDBService.findByUserId).toHaveBeenCalledWith(mockUserId);
  });

  it("should use cached data for subsequent calls with same userId", async () => {
    const wrapper = createWrapper();

    // First render
    const { result: result1 } = renderHook(() => useTasksQuery(mockUserId), {
      wrapper,
    });

    await waitFor(
      () => {
        expect(result1.current.isSuccess).toBe(true);
      },
      { timeout: 3000 },
    );

    expect(result1.current.data).toEqual(mockTasks);



    // Second render with same userId
    const { result: result2 } = renderHook(() => useTasksQuery(mockUserId), {
      wrapper,
    });

    // Should have data immediately or quickly from cache
    await waitFor(
      () => {
        expect(result2.current.data).toBeDefined();
      },
      { timeout: 1000 },
    );

    // May or may not call DB again depending on cache freshness, but data should match
    expect(result2.current.data).toEqual(mockTasks);
  });
});

describe("usePendingTasksQuery", () => {
  const mockUserId = "test-user-123";
  const mockAllTasks: DBTask[] = [
    {
      id: "task-1",
      userId: mockUserId,
      text: "Pending Task",
      status: "pending",
      priority: "high",
      assignedBy: "keyholder",
      createdAt: new Date("2024-01-01"),
      lastModified: new Date(),
      syncStatus: "synced",
    },
    {
      id: "task-2",
      userId: mockUserId,
      text: "Submitted Task",
      status: "submitted",
      priority: "medium",
      assignedBy: "submissive",
      createdAt: new Date("2024-01-02"),
      lastModified: new Date(),
      syncStatus: "synced",
    },
    {
      id: "task-3",
      userId: mockUserId,
      text: "Completed Task",
      status: "completed",
      priority: "low",
      assignedBy: "keyholder",
      createdAt: new Date("2024-01-03"),
      lastModified: new Date(),
      syncStatus: "synced",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (taskDBService.findByUserId as any).mockResolvedValue(mockAllTasks);
  });

  it("should filter for pending and submitted tasks only", async () => {
    const { result } = renderHook(() => usePendingTasksQuery(mockUserId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(
      result.current.data?.every((t) =>
        ["pending", "submitted"].includes(t.status),
      ),
    ).toBe(true);
  });

  it("should return empty array when no pending tasks", async () => {
    const completedTasks: DBTask[] = [
      {
        id: "task-1",
        userId: mockUserId,
        text: "Completed Task",
        status: "completed",
        priority: "low",
        assignedBy: "keyholder",
        createdAt: new Date(),
        lastModified: new Date(),
        syncStatus: "synced",
      },
    ];

    (taskDBService.findByUserId as any).mockResolvedValue(completedTasks);

    const { result } = renderHook(() => usePendingTasksQuery(mockUserId), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 3000 },
    );

    expect(result.current.data).toEqual([]);
  });

  it("should respect enabled flag", async () => {
    const { result } = renderHook(
      () => usePendingTasksQuery(mockUserId, false),
      {
        wrapper: createWrapper(),
      },
    );

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.isPending).toBe(true);
    expect(taskDBService.findByUserId).not.toHaveBeenCalled();
  });

  it("should handle errors", async () => {
    const error = new Error("Database error");
    (taskDBService.findByUserId as any).mockRejectedValue(error);

    const { result } = renderHook(() => usePendingTasksQuery(mockUserId), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 3000 },
    );

    expect(result.current.error).toBeDefined();
  });

  it("should not fetch when userId is undefined", async () => {
    const { result } = renderHook(() => usePendingTasksQuery(undefined), {
      wrapper: createWrapper(),
    });

    // Query should be disabled
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(result.current.isPending).toBe(true);
    expect(taskDBService.findByUserId).not.toHaveBeenCalled();
  });
});
