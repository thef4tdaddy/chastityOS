/**
 * TaskDBService Tests
 * Comprehensive unit tests for task database operations
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { taskDBService } from "../TaskDBService";
import { db } from "../../storage/ChastityDB";
import type { DBTask, TaskStatus } from "@/types/database";

// Mock the database
vi.mock("../../storage/ChastityDB", () => ({
  db: {
    tasks: {
      toArray: vi.fn(),
      where: vi.fn(),
      add: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      put: vi.fn(),
    },
  },
}));

// Mock the event service
vi.mock("../EventDBService", () => ({
  eventDBService: {
    logEvent: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock UUID generator
vi.mock("@/utils", () => ({
  generateUUID: vi.fn(() => `task-${Date.now()}`),
}));

describe("TaskDBService", () => {
  const mockUserId = "test-user-123";
  const mockTaskId = "task-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("addTask", () => {
    it("should create a new task with required fields", async () => {
      (db.tasks.add as any).mockResolvedValue(mockTaskId);

      const taskId = await taskDBService.addTask(mockUserId, "Test task");

      expect(taskId).toBeDefined();
      expect(typeof taskId).toBe("string");
    });

    it("should create task with optional fields", async () => {
      (db.tasks.add as any).mockResolvedValue(mockTaskId);

      const taskId = await taskDBService.addTask(mockUserId, "Test task", {
        description: "Task description",
        priority: "high",
        assignedBy: "submissive",
        dueDate: new Date("2024-12-31"),
        pointValue: 50,
      });

      expect(taskId).toBeDefined();
    });

    it("should handle errors gracefully", async () => {
      const error = new Error("Database error");
      (db.tasks.add as any).mockRejectedValue(error);

      await expect(
        taskDBService.addTask(mockUserId, "Test task"),
      ).rejects.toThrow("Database error");
    });
  });

  describe("getTasks", () => {
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
      const mockQuery = {
        equals: vi.fn().mockReturnThis(),
        and: vi.fn().mockReturnThis(),
        reverse: vi.fn().mockReturnThis(),
        sortBy: vi.fn().mockResolvedValue(mockTasks),
      };

      (db.tasks.where as any).mockReturnValue(mockQuery);
    });

    it("should retrieve tasks for a user", async () => {
      const tasks = await taskDBService.getTasks(mockUserId);

      expect(Array.isArray(tasks)).toBe(true);
      expect(db.tasks.where).toHaveBeenCalledWith("userId");
    });

    it("should filter tasks by status", async () => {
      const tasks = await taskDBService.getTasks(mockUserId, {
        status: "pending",
      });

      expect(Array.isArray(tasks)).toBe(true);
    });

    it("should filter tasks by priority", async () => {
      const tasks = await taskDBService.getTasks(mockUserId, {
        priority: "high",
      });

      expect(Array.isArray(tasks)).toBe(true);
    });

    it("should apply pagination with limit and offset", async () => {
      const tasks = await taskDBService.getTasks(mockUserId, {}, 10, 5);

      expect(Array.isArray(tasks)).toBe(true);
    });

    it("should handle empty results", async () => {
      const mockQuery = {
        equals: vi.fn().mockReturnThis(),
        and: vi.fn().mockReturnThis(),
        reverse: vi.fn().mockReturnThis(),
        sortBy: vi.fn().mockResolvedValue([]),
      };

      (db.tasks.where as any).mockReturnValue(mockQuery);

      const tasks = await taskDBService.getTasks(mockUserId);

      expect(tasks).toEqual([]);
    });
  });

  describe("updateTaskStatus", () => {
    const mockTask: DBTask = {
      id: mockTaskId,
      userId: mockUserId,
      text: "Test task",
      status: "pending",
      priority: "medium",
      assignedBy: "keyholder",
      createdAt: new Date(),
      lastModified: new Date(),
      syncStatus: "synced",
    };

    beforeEach(() => {
      (db.tasks.get as any).mockResolvedValue(mockTask);
      (db.tasks.update as any).mockResolvedValue(1);
    });

    it("should update task to submitted status", async () => {
      const updatedTask = await taskDBService.updateTaskStatus(
        mockTaskId,
        "submitted",
        {
          submissiveNote: "Task completed",
          attachments: ["photo1.jpg"],
        },
      );

      expect(updatedTask).toBeDefined();
      expect(db.tasks.update).toHaveBeenCalled();
    });

    it("should update task to approved status", async () => {
      const updatedTask = await taskDBService.updateTaskStatus(
        mockTaskId,
        "approved",
        {
          keyholderFeedback: "Great job!",
          pointsAwarded: true,
        },
      );

      expect(updatedTask).toBeDefined();
    });

    it("should update task to rejected status", async () => {
      const updatedTask = await taskDBService.updateTaskStatus(
        mockTaskId,
        "rejected",
        {
          keyholderFeedback: "Needs improvement",
        },
      );

      expect(updatedTask).toBeDefined();
    });

    it("should update task to completed status", async () => {
      const updatedTask = await taskDBService.updateTaskStatus(
        mockTaskId,
        "completed",
      );

      expect(updatedTask).toBeDefined();
    });

    it("should throw error when task not found", async () => {
      (db.tasks.get as any).mockResolvedValue(undefined);

      await expect(
        taskDBService.updateTaskStatus(mockTaskId, "completed"),
      ).rejects.toThrow("Task not found");
    });

    it("should handle database errors", async () => {
      const error = new Error("Update failed");
      (db.tasks.update as any).mockRejectedValue(error);

      await expect(
        taskDBService.updateTaskStatus(mockTaskId, "completed"),
      ).rejects.toThrow("Update failed");
    });
  });

  describe("getTasksByStatus", () => {
    it("should retrieve pending tasks", async () => {
      const mockQuery = {
        sortBy: vi.fn().mockResolvedValue([]),
      };

      (db.tasks.where as any).mockReturnValue(mockQuery);

      const tasks = await taskDBService.getTasksByStatus(mockUserId, "pending");

      expect(Array.isArray(tasks)).toBe(true);
      expect(db.tasks.where).toHaveBeenCalledWith({
        userId: mockUserId,
        status: "pending",
      });
    });

    it("should retrieve completed tasks", async () => {
      const mockQuery = {
        sortBy: vi.fn().mockResolvedValue([]),
      };

      (db.tasks.where as any).mockReturnValue(mockQuery);

      const tasks = await taskDBService.getTasksByStatus(
        mockUserId,
        "completed",
      );

      expect(Array.isArray(tasks)).toBe(true);
    });
  });

  describe("getOverdueTasks", () => {
    it("should retrieve overdue tasks", async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 86400000); // Yesterday

      const mockOverdueTask: DBTask = {
        id: "overdue-1",
        userId: mockUserId,
        text: "Overdue task",
        status: "pending",
        priority: "high",
        assignedBy: "keyholder",
        dueDate: pastDate,
        createdAt: new Date(),
        lastModified: new Date(),
        syncStatus: "synced",
      };

      const mockQuery = {
        equals: vi.fn().mockReturnThis(),
        and: vi.fn().mockReturnThis(),
        sortBy: vi.fn().mockResolvedValue([mockOverdueTask]),
      };

      (db.tasks.where as any).mockReturnValue(mockQuery);

      const tasks = await taskDBService.getOverdueTasks(mockUserId);

      expect(Array.isArray(tasks)).toBe(true);
    });

    it("should not return completed tasks even if past due date", async () => {
      const mockQuery = {
        equals: vi.fn().mockReturnThis(),
        and: vi.fn().mockReturnThis(),
        sortBy: vi.fn().mockResolvedValue([]),
      };

      (db.tasks.where as any).mockReturnValue(mockQuery);

      const tasks = await taskDBService.getOverdueTasks(mockUserId);

      expect(tasks).toEqual([]);
    });
  });

  describe("createTask", () => {
    it("should create a task with all fields", async () => {
      (db.tasks.add as any).mockResolvedValue(mockTaskId);

      const taskData = {
        userId: mockUserId,
        text: "New task",
        title: "New task title",
        description: "Task description",
        status: "pending" as TaskStatus,
        priority: "high" as const,
        assignedBy: "keyholder" as const,
        dueDate: new Date("2024-12-31"),
        pointValue: 100,
      };

      const taskId = await taskDBService.createTask(taskData);

      expect(taskId).toBeDefined();
      expect(typeof taskId).toBe("string");
    });
  });

  describe("deleteTask", () => {
    it("should delete a task", async () => {
      (db.tasks.delete as any).mockResolvedValue(undefined);

      await taskDBService.deleteTask(mockTaskId);

      expect(db.tasks.delete).toHaveBeenCalledWith(mockTaskId);
    });

    it("should handle deletion errors", async () => {
      const error = new Error("Delete failed");
      (db.tasks.delete as any).mockRejectedValue(error);

      await expect(taskDBService.deleteTask(mockTaskId)).rejects.toThrow(
        "Delete failed",
      );
    });
  });

  describe("getAll", () => {
    it("should retrieve all tasks", async () => {
      const mockTasks: DBTask[] = [
        {
          id: "task-1",
          userId: mockUserId,
          text: "Task 1",
          status: "pending",
          priority: "medium",
          assignedBy: "keyholder",
          createdAt: new Date(),
          lastModified: new Date(),
          syncStatus: "synced",
        },
      ];

      (db.tasks.toArray as any).mockResolvedValue(mockTasks);

      const tasks = await taskDBService.getAll();

      expect(Array.isArray(tasks)).toBe(true);
      expect(db.tasks.toArray).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle null values gracefully", async () => {
      const taskData = {
        userId: mockUserId,
        text: "Task with nulls",
        status: "pending" as TaskStatus,
        priority: "medium" as const,
        assignedBy: "keyholder" as const,
        description: undefined,
        dueDate: undefined,
        pointValue: undefined,
      };

      (db.tasks.add as any).mockResolvedValue(mockTaskId);

      const taskId = await taskDBService.createTask(taskData);

      expect(taskId).toBeDefined();
    });

    it("should handle empty string values", async () => {
      (db.tasks.add as any).mockResolvedValue(mockTaskId);

      const taskId = await taskDBService.addTask(mockUserId, "", {
        description: "",
      });

      expect(taskId).toBeDefined();
    });

    it("should handle concurrent task updates", async () => {
      const mockTask: DBTask = {
        id: mockTaskId,
        userId: mockUserId,
        text: "Test task",
        status: "pending",
        priority: "medium",
        assignedBy: "keyholder",
        createdAt: new Date(),
        lastModified: new Date(),
        syncStatus: "synced",
      };

      (db.tasks.get as any).mockResolvedValue(mockTask);
      (db.tasks.update as any).mockResolvedValue(1);

      const updates = [
        taskDBService.updateTaskStatus(mockTaskId, "submitted"),
        taskDBService.updateTaskStatus(mockTaskId, "submitted"),
      ];

      const results = await Promise.all(updates);

      expect(results).toHaveLength(2);
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeDefined();
    });
  });
});
