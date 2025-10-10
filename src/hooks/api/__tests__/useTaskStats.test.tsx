/**
 * useTaskStats Tests
 * Tests for task statistics hooks from useTasks.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTaskStats } from "../useTasks";
import { taskDBService } from "@/services/database";
import type { DBTask } from "@/types/database";
import React from "react";

// Mock the database service
vi.mock("@/services/database", () => ({
  taskDBService: {
    findByUserId: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient(
    {
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    },
    { timeout: 3000 },
  );

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe(
  "useTaskStats",
  () => {
    const mockUserId = "test-user-123";

    beforeEach(
      () => {
        vi.clearAllMocks();
      },
      { timeout: 3000 },
    );

    afterEach(
      () => {
        vi.resetAllMocks();
      },
      { timeout: 3000 },
    );

    it(
      "should calculate task statistics correctly",
      async () => {
        const mockTasks: DBTask[] = [
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

        (taskDBService.findByUserId as any).mockResolvedValue(mockTasks);

        const { result } = renderHook(
          () => useTaskStats(mockUserId),
          {
            wrapper: createWrapper(),
          },
          { timeout: 3000 },
        );

        await waitFor(
          () => {
            expect(result.current.isSuccess).toBe(true);
          },
          { timeout: 3000 },
        );

        expect(result.current.data).toMatchObject(
          {
            total: 3,
            pending: 1,
            inProgress: 1, // submitted tasks count as in progress
            completed: 1,
            overdue: 0,
            byPriority: {
              high: 1,
              medium: 1,
              low: 1,
            },
          },
          { timeout: 3000 },
        );
      },
      { timeout: 3000 },
    );

    it(
      "should calculate completion rate correctly",
      async () => {
        const mockTasks: DBTask[] = [
          {
            id: "task-1",
            userId: mockUserId,
            text: "Task 1",
            status: "completed",
            priority: "medium",
            assignedBy: "keyholder",
            createdAt: new Date(),
            lastModified: new Date(),
            syncStatus: "synced",
          },
          {
            id: "task-2",
            userId: mockUserId,
            text: "Task 2",
            status: "completed",
            priority: "medium",
            assignedBy: "keyholder",
            createdAt: new Date(),
            lastModified: new Date(),
            syncStatus: "synced",
          },
          {
            id: "task-3",
            userId: mockUserId,
            text: "Task 3",
            status: "pending",
            priority: "medium",
            assignedBy: "keyholder",
            createdAt: new Date(),
            lastModified: new Date(),
            syncStatus: "synced",
          },
          {
            id: "task-4",
            userId: mockUserId,
            text: "Task 4",
            status: "pending",
            priority: "medium",
            assignedBy: "keyholder",
            createdAt: new Date(),
            lastModified: new Date(),
            syncStatus: "synced",
          },
        ];

        (taskDBService.findByUserId as any).mockResolvedValue(mockTasks);

        const { result } = renderHook(
          () => useTaskStats(mockUserId),
          {
            wrapper: createWrapper(),
          },
          { timeout: 3000 },
        );

        await waitFor(
          () => {
            expect(result.current.isSuccess).toBe(true);
          },
          { timeout: 3000 },
        );

        // 2 completed out of 4 total = 50%
        expect(result.current.data?.completionRate).toBe(50);
      },
      { timeout: 3000 },
    );

    it(
      "should identify overdue tasks",
      async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1); // Yesterday

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1); // Tomorrow

        const mockTasks: DBTask[] = [
          {
            id: "task-1",
            userId: mockUserId,
            text: "Overdue Task",
            status: "pending",
            priority: "high",
            assignedBy: "keyholder",
            dueDate: pastDate,
            createdAt: new Date(),
            lastModified: new Date(),
            syncStatus: "synced",
          },
          {
            id: "task-2",
            userId: mockUserId,
            text: "Future Task",
            status: "pending",
            priority: "medium",
            assignedBy: "keyholder",
            dueDate: futureDate,
            createdAt: new Date(),
            lastModified: new Date(),
            syncStatus: "synced",
          },
          {
            id: "task-3",
            userId: mockUserId,
            text: "Completed Overdue Task",
            status: "completed",
            priority: "low",
            assignedBy: "keyholder",
            dueDate: pastDate,
            createdAt: new Date(),
            lastModified: new Date(),
            syncStatus: "synced",
          },
        ];

        (taskDBService.findByUserId as any).mockResolvedValue(mockTasks);

        const { result } = renderHook(
          () => useTaskStats(mockUserId),
          {
            wrapper: createWrapper(),
          },
          { timeout: 3000 },
        );

        await waitFor(
          () => {
            expect(result.current.isSuccess).toBe(true);
          },
          { timeout: 3000 },
        );

        // Only the pending overdue task should count
        expect(result.current.data?.overdue).toBe(1);
      },
      { timeout: 3000 },
    );

    it(
      "should handle empty task list",
      async () => {
        (taskDBService.findByUserId as any).mockResolvedValue([]);

        const { result } = renderHook(
          () => useTaskStats(mockUserId),
          {
            wrapper: createWrapper(),
          },
          { timeout: 3000 },
        );

        await waitFor(
          () => {
            expect(result.current.isSuccess).toBe(true);
          },
          { timeout: 3000 },
        );

        expect(result.current.data).toMatchObject(
          {
            total: 0,
            pending: 0,
            inProgress: 0,
            completed: 0,
            overdue: 0,
            byPriority: {
              high: 0,
              medium: 0,
              low: 0,
            },
            completionRate: 0,
          },
          { timeout: 3000 },
        );
      },
      { timeout: 3000 },
    );

    it(
      "should handle tasks without due dates",
      async () => {
        const mockTasks: DBTask[] = [
          {
            id: "task-1",
            userId: mockUserId,
            text: "Task without due date",
            status: "pending",
            priority: "medium",
            assignedBy: "keyholder",
            createdAt: new Date(),
            lastModified: new Date(),
            syncStatus: "synced",
          },
        ];

        (taskDBService.findByUserId as any).mockResolvedValue(mockTasks);

        const { result } = renderHook(
          () => useTaskStats(mockUserId),
          {
            wrapper: createWrapper(),
          },
          { timeout: 3000 },
        );

        await waitFor(
          () => {
            expect(result.current.isSuccess).toBe(true);
          },
          { timeout: 3000 },
        );

        expect(result.current.data?.overdue).toBe(0);
      },
      { timeout: 3000 },
    );

    it(
      "should count priority distribution correctly",
      async () => {
        const mockTasks: DBTask[] = [
          {
            id: "task-1",
            userId: mockUserId,
            text: "High Priority Task",
            status: "pending",
            priority: "high",
            assignedBy: "keyholder",
            createdAt: new Date(),
            lastModified: new Date(),
            syncStatus: "synced",
          },
          {
            id: "task-2",
            userId: mockUserId,
            text: "High Priority Task 2",
            status: "pending",
            priority: "high",
            assignedBy: "keyholder",
            createdAt: new Date(),
            lastModified: new Date(),
            syncStatus: "synced",
          },
          {
            id: "task-3",
            userId: mockUserId,
            text: "Medium Priority Task",
            status: "pending",
            priority: "medium",
            assignedBy: "keyholder",
            createdAt: new Date(),
            lastModified: new Date(),
            syncStatus: "synced",
          },
        ];

        (taskDBService.findByUserId as any).mockResolvedValue(mockTasks);

        const { result } = renderHook(
          () => useTaskStats(mockUserId),
          {
            wrapper: createWrapper(),
          },
          { timeout: 3000 },
        );

        await waitFor(
          () => {
            expect(result.current.isSuccess).toBe(true);
          },
          { timeout: 3000 },
        );

        expect(result.current.data?.byPriority).toEqual(
          {
            high: 2,
            medium: 1,
            low: 0,
          },
          { timeout: 3000 },
        );
      },
      { timeout: 3000 },
    );

    it(
      "should not fetch when userId is undefined",
      async () => {
        const { result } = renderHook(
          () => useTaskStats(""),
          {
            wrapper: createWrapper(),
          },
          { timeout: 3000 },
        );

        // Wait a bit
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(result.current.isPending).toBe(true);
        expect(taskDBService.findByUserId).not.toHaveBeenCalled();
      },
      { timeout: 3000 },
    );

    it(
      "should handle database errors gracefully",
      async () => {
        const error = new Error("Database error");
        (taskDBService.findByUserId as any).mockRejectedValue(error);

        const { result } = renderHook(
          () => useTaskStats(mockUserId),
          {
            wrapper: createWrapper(),
          },
          { timeout: 3000 },
        );

        await waitFor(
          () => {
            expect(result.current.isError).toBe(true);
          },
          { timeout: 3000 },
        );

        expect(result.current.error).toBeDefined();
      },
      { timeout: 3000 },
    );

    it(
      "should return 0% completion rate when total is 0",
      async () => {
        (taskDBService.findByUserId as any).mockResolvedValue([]);

        const { result } = renderHook(
          () => useTaskStats(mockUserId),
          {
            wrapper: createWrapper(),
          },
          { timeout: 3000 },
        );

        await waitFor(
          () => {
            expect(result.current.isSuccess).toBe(true);
          },
          { timeout: 3000 },
        );

        expect(result.current.data?.completionRate).toBe(0);
      },
      { timeout: 3000 },
    );

    it(
      "should round completion rate correctly",
      async () => {
        const mockTasks: DBTask[] = [
          {
            id: "task-1",
            userId: mockUserId,
            text: "Task 1",
            status: "completed",
            priority: "medium",
            assignedBy: "keyholder",
            createdAt: new Date(),
            lastModified: new Date(),
            syncStatus: "synced",
          },
          {
            id: "task-2",
            userId: mockUserId,
            text: "Task 2",
            status: "pending",
            priority: "medium",
            assignedBy: "keyholder",
            createdAt: new Date(),
            lastModified: new Date(),
            syncStatus: "synced",
          },
          {
            id: "task-3",
            userId: mockUserId,
            text: "Task 3",
            status: "pending",
            priority: "medium",
            assignedBy: "keyholder",
            createdAt: new Date(),
            lastModified: new Date(),
            syncStatus: "synced",
          },
        ];

        (taskDBService.findByUserId as any).mockResolvedValue(mockTasks);

        const { result } = renderHook(
          () => useTaskStats(mockUserId),
          {
            wrapper: createWrapper(),
          },
          { timeout: 3000 },
        );

        await waitFor(
          () => {
            expect(result.current.isSuccess).toBe(true);
          },
          { timeout: 3000 },
        );

        // 1 out of 3 = 33.33... should round to 33
        expect(result.current.data?.completionRate).toBe(33);
      },
      { timeout: 3000 },
    );
  },
  { timeout: 3000 },
);
