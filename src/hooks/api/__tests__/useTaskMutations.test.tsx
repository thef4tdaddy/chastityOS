/**
 * useTaskMutations Tests
 * Tests for Task mutation hooks
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useCreateTask,
  useUpdateTaskStatus,
  useDeleteTask,
  useSubmitTaskForReview,
  useApproveTask,
  useRejectTask,
  useAssignTask,
} from "../useTaskMutations";
import { taskDBService } from "@/services/database";
import type { DBTask } from "@/types/database";
import React from "react";

// Mock the database service
vi.mock("@/services/database", () => ({
  taskDBService: {
    createTask: vi.fn(),
    updateTaskStatus: vi.fn(),
    deleteTask: vi.fn(),
    findById: vi.fn(),
  },
}));

// Mock Firebase sync
vi.mock("@/services/sync", () => ({
  firebaseSync: {
    syncUserTasks: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock notifications
vi.mock("@/services/notifications/TaskNotificationService", () => ({
  TaskNotificationService: {
    notifyTaskSubmitted: vi.fn().mockResolvedValue(undefined),
    notifyTaskApproved: vi.fn().mockResolvedValue(undefined),
    notifyTaskRejected: vi.fn().mockResolvedValue(undefined),
    notifyTaskAssigned: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock PointsService
vi.mock("@/services/points/PointsService", () => ({
  PointsService: {
    awardTaskPoints: vi.fn().mockResolvedValue({
      newTotal: 100,
      achievementsUnlocked: [],
    }),
  },
}));

// Mock RecurringTaskService
vi.mock("@/services/tasks/RecurringTaskService", () => ({
  RecurringTaskService: {
    createNextInstance: vi.fn().mockResolvedValue("next-task-id"),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useCreateTask", () => {
  const mockUserId = "test-user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    (taskDBService.createTask as any).mockResolvedValue("new-task-id");
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should create a new task", async () => {
    const { result } = renderHook(() => useCreateTask(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        userId: mockUserId,
        title: "New Task",
        description: "Task description",
      });
    });

    expect(result.current.isSuccess).toBe(true);
    expect(taskDBService.createTask).toHaveBeenCalled();
  });

  it("should handle errors during task creation", async () => {
    const error = new Error("Creation failed");
    (taskDBService.createTask as any).mockRejectedValue(error);

    const { result } = renderHook(() => useCreateTask(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          userId: mockUserId,
          title: "New Task",
        });
      } catch (e) {
        expect(e).toBe(error);
      }
    });

    expect(result.current.isError).toBe(true);
  });

  it("should trigger Firebase sync after creation", async () => {
    const { result } = renderHook(() => useCreateTask(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        userId: mockUserId,
        title: "New Task",
      });
    });

    const { firebaseSync } = await import("@/services/sync");
    await waitFor(() => {
      expect(firebaseSync.syncUserTasks).toHaveBeenCalledWith(mockUserId);
    });
  });
});

describe("useUpdateTaskStatus", () => {
  const mockUserId = "test-user-123";
  const mockTaskId = "task-123";
  const mockTask: DBTask = {
    id: mockTaskId,
    userId: mockUserId,
    text: "Test Task",
    status: "pending",
    priority: "medium",
    assignedBy: "keyholder",
    createdAt: new Date(),
    lastModified: new Date(),
    syncStatus: "synced",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (taskDBService.updateTaskStatus as any).mockResolvedValue(mockTask);
  });

  it("should update task status", async () => {
    const { result } = renderHook(() => useUpdateTaskStatus(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        taskId: mockTaskId,
        userId: mockUserId,
        status: "completed",
      });
    });

    expect(result.current.isSuccess).toBe(true);
    expect(taskDBService.updateTaskStatus).toHaveBeenCalledWith(
      mockTaskId,
      "completed",
      expect.any(Object),
    );
  });

  it("should include feedback in update", async () => {
    const { result } = renderHook(() => useUpdateTaskStatus(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        taskId: mockTaskId,
        userId: mockUserId,
        status: "approved",
        feedback: "Great work!",
      });
    });

    expect(taskDBService.updateTaskStatus).toHaveBeenCalledWith(
      mockTaskId,
      "approved",
      expect.objectContaining({
        keyholderFeedback: "Great work!",
      }),
    );
  });

  it("should handle update errors", async () => {
    const error = new Error("Update failed");
    (taskDBService.updateTaskStatus as any).mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateTaskStatus(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          taskId: mockTaskId,
          userId: mockUserId,
          status: "completed",
        });
      } catch (e) {
        expect(e).toBe(error);
      }
    });

    expect(result.current.isError).toBe(true);
  });
});

describe("useDeleteTask", () => {
  const mockUserId = "test-user-123";
  const mockTaskId = "task-123";

  beforeEach(() => {
    vi.clearAllMocks();
    (taskDBService.deleteTask as any).mockResolvedValue(undefined);
  });

  it("should delete a task", async () => {
    const { result } = renderHook(() => useDeleteTask(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        taskId: mockTaskId,
        userId: mockUserId,
      });
    });

    expect(result.current.isSuccess).toBe(true);
    expect(taskDBService.deleteTask).toHaveBeenCalledWith(mockTaskId);
  });

  it("should handle deletion errors", async () => {
    const error = new Error("Deletion failed");
    (taskDBService.deleteTask as any).mockRejectedValue(error);

    const { result } = renderHook(() => useDeleteTask(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          taskId: mockTaskId,
          userId: mockUserId,
        });
      } catch (e) {
        expect(e).toBe(error);
      }
    });

    expect(result.current.isError).toBe(true);
  });
});

describe("useSubmitTaskForReview", () => {
  const mockUserId = "test-user-123";
  const mockTaskId = "task-123";
  const mockTask: DBTask = {
    id: mockTaskId,
    userId: mockUserId,
    text: "Test Task",
    status: "submitted",
    priority: "medium",
    assignedBy: "keyholder",
    createdAt: new Date(),
    lastModified: new Date(),
    syncStatus: "synced",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (taskDBService.updateTaskStatus as any).mockResolvedValue(mockTask);
  });

  it("should submit task for review", async () => {
    const { result } = renderHook(() => useSubmitTaskForReview(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        taskId: mockTaskId,
        userId: mockUserId,
        note: "Task completed",
        attachments: ["photo.jpg"],
      });
    });

    expect(result.current.isSuccess).toBe(true);
    expect(taskDBService.updateTaskStatus).toHaveBeenCalledWith(
      mockTaskId,
      "submitted",
      expect.objectContaining({
        submissiveNote: "Task completed",
        attachments: ["photo.jpg"],
      }),
    );
  });

  it("should send notification when keyholder ID provided", async () => {
    const { result } = renderHook(() => useSubmitTaskForReview(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        taskId: mockTaskId,
        userId: mockUserId,
        keyholderUserId: "keyholder-123",
        submissiveName: "John",
      });
    });

    const { TaskNotificationService } = await import(
      "@/services/notifications/TaskNotificationService"
    );

    await waitFor(() => {
      expect(TaskNotificationService.notifyTaskSubmitted).toHaveBeenCalled();
    });
  });
});

describe("useApproveTask", () => {
  const mockUserId = "test-user-123";
  const mockTaskId = "task-123";
  const mockTask: DBTask = {
    id: mockTaskId,
    userId: mockUserId,
    text: "Test Task",
    status: "approved",
    priority: "medium",
    assignedBy: "keyholder",
    pointValue: 50,
    createdAt: new Date(),
    lastModified: new Date(),
    syncStatus: "synced",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (taskDBService.findById as any).mockResolvedValue(mockTask);
    (taskDBService.updateTaskStatus as any).mockResolvedValue(mockTask);
  });

  it("should approve a task", async () => {
    const { result } = renderHook(() => useApproveTask(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        taskId: mockTaskId,
        userId: mockUserId,
        feedback: "Excellent work!",
      });
    });

    expect(result.current.isSuccess).toBe(true);
    expect(taskDBService.updateTaskStatus).toHaveBeenCalledWith(
      mockTaskId,
      "approved",
      expect.objectContaining({
        keyholderFeedback: "Excellent work!",
        pointsAwarded: true,
      }),
    );
  });

  it("should award points when task has point value", async () => {
    const { result } = renderHook(() => useApproveTask(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        taskId: mockTaskId,
        userId: mockUserId,
      });
    });

    // Give time for async operations
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Points service should have been called
    const { PointsService } = await import("@/services/points/PointsService");
    await waitFor(
      () => {
        expect(PointsService.awardTaskPoints).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: mockUserId,
            taskId: mockTaskId,
            points: 50,
          }),
        );
      },
      { timeout: 1000 },
    );
  });

  it("should create next instance for recurring tasks", async () => {
    const recurringTask: DBTask = {
      ...mockTask,
      isRecurring: true,
      recurringConfig: {
        frequency: "daily",
        interval: 1,
      },
    };

    (taskDBService.findById as any).mockResolvedValue(recurringTask);
    (taskDBService.updateTaskStatus as any).mockResolvedValue(recurringTask);

    const { result } = renderHook(() => useApproveTask(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        taskId: mockTaskId,
        userId: mockUserId,
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Recurring service should have been called
    const { RecurringTaskService } = await import(
      "@/services/tasks/RecurringTaskService"
    );
    await waitFor(
      () => {
        expect(RecurringTaskService.createNextInstance).toHaveBeenCalledWith(
          recurringTask,
        );
      },
      { timeout: 1000 },
    );
  });
});

describe("useRejectTask", () => {
  const mockUserId = "test-user-123";
  const mockTaskId = "task-123";
  const mockTask: DBTask = {
    id: mockTaskId,
    userId: mockUserId,
    text: "Test Task",
    status: "rejected",
    priority: "medium",
    assignedBy: "keyholder",
    createdAt: new Date(),
    lastModified: new Date(),
    syncStatus: "synced",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (taskDBService.updateTaskStatus as any).mockResolvedValue(mockTask);
  });

  it("should reject a task", async () => {
    const { result } = renderHook(() => useRejectTask(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        taskId: mockTaskId,
        userId: mockUserId,
        feedback: "Needs improvement",
      });
    });

    expect(result.current.isSuccess).toBe(true);
    expect(taskDBService.updateTaskStatus).toHaveBeenCalledWith(
      mockTaskId,
      "rejected",
      expect.objectContaining({
        keyholderFeedback: "Needs improvement",
      }),
    );
  });

  it("should send rejection notification", async () => {
    const { result } = renderHook(() => useRejectTask(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        taskId: mockTaskId,
        userId: mockUserId,
        feedback: "Try again",
      });
    });

    const { TaskNotificationService } = await import(
      "@/services/notifications/TaskNotificationService"
    );

    await waitFor(() => {
      expect(TaskNotificationService.notifyTaskRejected).toHaveBeenCalled();
    });
  });
});

describe("useAssignTask", () => {
  const mockUserId = "test-user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    (taskDBService.createTask as any).mockResolvedValue("new-task-id");
  });

  it("should assign a task to a user", async () => {
    const { result } = renderHook(() => useAssignTask(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        userId: mockUserId,
        title: "Assigned Task",
        description: "Task description",
        priority: "high",
        dueDate: new Date("2024-12-31"),
      });
    });

    expect(result.current.isSuccess).toBe(true);
    expect(taskDBService.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUserId,
        text: "Assigned Task",
        assignedBy: "keyholder",
        priority: "high",
      }),
    );
  });

  it("should send assignment notification", async () => {
    const { result } = renderHook(() => useAssignTask(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        userId: mockUserId,
        title: "Assigned Task",
        keyholderName: "Master",
      });
    });

    const { TaskNotificationService } = await import(
      "@/services/notifications/TaskNotificationService"
    );

    await waitFor(() => {
      expect(TaskNotificationService.notifyTaskAssigned).toHaveBeenCalled();
    });
  });
});
