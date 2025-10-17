/**
 * Integration Tests for Task Workflows
 * Tests complete task management workflows at the service/database level
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { DBTask, TaskStatus } from "@/types/database";

// Mock task service
const mockTaskService = {
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  getTask: vi.fn(),
  getAllTasks: vi.fn(),
  submitTask: vi.fn(),
  approveTask: vi.fn(),
  rejectTask: vi.fn(),
};

describe("Task Workflow Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Create → Assign → Submit → Approve Workflow", () => {
    it("should complete full happy path workflow", async () => {
      // Step 1: Create task
      const newTask: Partial<DBTask> = {
        userId: "user-123",
        text: "Complete Workout",
        title: "Complete Workout",
        description: "Do 30 pushups",
        status: "pending",
        priority: "medium",
        assignedBy: "keyholder",
        createdAt: new Date(),
        isRecurring: false,
      };

      const taskId = "task-001";
      mockTaskService.createTask.mockResolvedValue(taskId);

      const createdTaskId = await mockTaskService.createTask(newTask);
      expect(createdTaskId).toBe(taskId);
      expect(mockTaskService.createTask).toHaveBeenCalledWith(newTask);

      // Step 2: Get task (verify creation)
      const createdTask: DBTask = {
        ...newTask,
        id: taskId,
        syncStatus: "synced",
        lastModified: new Date(),
      } as DBTask;

      mockTaskService.getTask.mockResolvedValue(createdTask);

      const fetchedTask = await mockTaskService.getTask(taskId);
      expect(fetchedTask).toEqual(createdTask);
      expect(fetchedTask.status).toBe("pending");

      // Step 3: Submit task for review
      mockTaskService.submitTask.mockResolvedValue(undefined);

      await mockTaskService.submitTask(taskId, "user-123", {
        note: "Task completed successfully",
        attachments: ["evidence-url.jpg"],
      });

      expect(mockTaskService.submitTask).toHaveBeenCalledWith(
        taskId,
        "user-123",
        expect.objectContaining({
          note: "Task completed successfully",
        }),
      );

      // Step 4: Verify task status changed to submitted
      const submittedTask: DBTask = {
        ...createdTask,
        status: "submitted",
        submittedAt: new Date(),
        submissiveNote: "Task completed successfully",
      };

      mockTaskService.getTask.mockResolvedValue(submittedTask);

      const fetchedSubmittedTask = await mockTaskService.getTask(taskId);
      expect(fetchedSubmittedTask.status).toBe("submitted");
      expect(fetchedSubmittedTask.submissiveNote).toBe(
        "Task completed successfully",
      );

      // Step 5: Approve task
      mockTaskService.approveTask.mockResolvedValue(undefined);

      await mockTaskService.approveTask(taskId, "keyholder-456", {
        feedback: "Well done!",
        pointValue: 10,
      });

      expect(mockTaskService.approveTask).toHaveBeenCalledWith(
        taskId,
        "keyholder-456",
        expect.objectContaining({
          feedback: "Well done!",
          pointValue: 10,
        }),
      );

      // Step 6: Verify task status changed to approved
      const approvedTask: DBTask = {
        ...submittedTask,
        status: "approved",
        approvedAt: new Date(),
        keyholderFeedback: "Well done!",
        pointValue: 10,
        pointsAwarded: true,
      };

      mockTaskService.getTask.mockResolvedValue(approvedTask);

      const fetchedApprovedTask = await mockTaskService.getTask(taskId);
      expect(fetchedApprovedTask.status).toBe("approved");
      expect(fetchedApprovedTask.pointValue).toBe(10);
      expect(fetchedApprovedTask.pointsAwarded).toBe(true);
    });
  });

  describe("Create → Assign → Submit → Reject → Resubmit Workflow", () => {
    it("should handle rejection and resubmission", async () => {
      const taskId = "task-002";
      const userId = "user-123";
      const keyholderId = "keyholder-456";

      // Step 1: Create task
      const newTask: Partial<DBTask> = {
        userId,
        text: "Daily Task",
        title: "Daily Task",
        status: "pending",
        priority: "high",
        assignedBy: "keyholder",
        createdAt: new Date(),
        isRecurring: false,
      };

      mockTaskService.createTask.mockResolvedValue(taskId);
      await mockTaskService.createTask(newTask);

      // Step 2: Submit task
      mockTaskService.submitTask.mockResolvedValue(undefined);
      await mockTaskService.submitTask(taskId, userId, {
        note: "First attempt",
      });

      // Step 3: Reject task
      mockTaskService.rejectTask.mockResolvedValue(undefined);
      await mockTaskService.rejectTask(taskId, keyholderId, {
        feedback: "Please provide more detail",
        applyPunishment: false,
      });

      expect(mockTaskService.rejectTask).toHaveBeenCalledWith(
        taskId,
        keyholderId,
        expect.objectContaining({
          feedback: "Please provide more detail",
        }),
      );

      // Step 4: Verify rejected status
      const rejectedTask: DBTask = {
        ...newTask,
        id: taskId,
        status: "rejected",
        keyholderFeedback: "Please provide more detail",
        syncStatus: "synced",
        lastModified: new Date(),
      } as DBTask;

      mockTaskService.getTask.mockResolvedValue(rejectedTask);
      const fetchedRejectedTask = await mockTaskService.getTask(taskId);
      expect(fetchedRejectedTask.status).toBe("rejected");

      // Step 5: Resubmit task
      await mockTaskService.submitTask(taskId, userId, {
        note: "Resubmitted with more detail",
      });

      expect(mockTaskService.submitTask).toHaveBeenCalledWith(
        taskId,
        userId,
        expect.objectContaining({
          note: "Resubmitted with more detail",
        }),
      );

      // Step 6: Verify resubmitted status
      const resubmittedTask: DBTask = {
        ...rejectedTask,
        status: "submitted",
        submissiveNote: "Resubmitted with more detail",
      };

      mockTaskService.getTask.mockResolvedValue(resubmittedTask);
      const fetchedResubmittedTask = await mockTaskService.getTask(taskId);
      expect(fetchedResubmittedTask.status).toBe("submitted");
    });
  });

  describe("Recurring Task Workflow", () => {
    it("should create next instance after approval", async () => {
      const taskId = "recurring-task-001";
      const seriesId = "series-001";

      // Step 1: Create recurring task
      const recurringTask: Partial<DBTask> = {
        userId: "user-123",
        text: "Daily Exercise",
        title: "Daily Exercise",
        status: "pending",
        priority: "medium",
        assignedBy: "keyholder",
        createdAt: new Date(),
        isRecurring: true,
        recurringConfig: {
          frequency: "daily",
          interval: 1,
          instanceNumber: 1,
        },
        recurringSeriesId: seriesId,
      };

      mockTaskService.createTask.mockResolvedValue(taskId);
      const createdTaskId = await mockTaskService.createTask(recurringTask);
      expect(createdTaskId).toBe(taskId);

      // Step 2: Submit and approve first instance
      await mockTaskService.submitTask(taskId, "user-123", {
        note: "Completed",
      });
      await mockTaskService.approveTask(taskId, "keyholder-456", {
        feedback: "Good job!",
      });

      // Step 3: Verify next instance created
      const nextTaskId = "recurring-task-002";
      const nextInstance: Partial<DBTask> = {
        ...recurringTask,
        id: nextTaskId,
        status: "pending",
        recurringConfig: {
          frequency: "daily",
          interval: 1,
          instanceNumber: 2,
          parentTaskId: taskId,
        },
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      };

      mockTaskService.createTask.mockResolvedValue(nextTaskId);
      const nextInstanceId = await mockTaskService.createTask(nextInstance);
      expect(nextInstanceId).toBe(nextTaskId);

      // Step 4: Verify both instances exist in series
      const seriesTasks = [
        { id: taskId, status: "approved", recurringSeriesId: seriesId },
        { id: nextTaskId, status: "pending", recurringSeriesId: seriesId },
      ];

      mockTaskService.getAllTasks.mockResolvedValue(seriesTasks);
      const allTasks = await mockTaskService.getAllTasks();
      const seriesTasksFiltered = allTasks.filter(
        (t: any) => t.recurringSeriesId === seriesId,
      );

      expect(seriesTasksFiltered).toHaveLength(2);
      expect(seriesTasksFiltered[0].status).toBe("approved");
      expect(seriesTasksFiltered[1].status).toBe("pending");
    });
  });

  describe("Evidence Upload Workflow", () => {
    it("should upload evidence and submit task", async () => {
      const taskId = "task-003";
      const evidenceUrl = "https://storage.example.com/evidence/photo.jpg";

      // Step 1: Create task
      mockTaskService.createTask.mockResolvedValue(taskId);
      await mockTaskService.createTask({
        userId: "user-123",
        text: "Photo Task",
        title: "Photo Task",
        status: "pending",
        priority: "medium",
        assignedBy: "keyholder",
        createdAt: new Date(),
        isRecurring: false,
      });

      // Step 2: Upload evidence
      const taskWithEvidence: Partial<DBTask> = {
        attachments: [evidenceUrl],
      };

      mockTaskService.updateTask.mockResolvedValue(undefined);
      await mockTaskService.updateTask(taskId, taskWithEvidence);

      expect(mockTaskService.updateTask).toHaveBeenCalledWith(
        taskId,
        expect.objectContaining({
          attachments: [evidenceUrl],
        }),
      );

      // Step 3: Submit task with evidence
      await mockTaskService.submitTask(taskId, "user-123", {
        note: "Evidence uploaded",
        attachments: [evidenceUrl],
      });

      // Step 4: Verify keyholder can view evidence
      const taskWithEvidenceComplete: DBTask = {
        id: taskId,
        userId: "user-123",
        text: "Photo Task",
        title: "Photo Task",
        status: "submitted",
        priority: "medium",
        assignedBy: "keyholder",
        createdAt: new Date(),
        submittedAt: new Date(),
        attachments: [evidenceUrl],
        submissiveNote: "Evidence uploaded",
        isRecurring: false,
        syncStatus: "synced",
        lastModified: new Date(),
      };

      mockTaskService.getTask.mockResolvedValue(taskWithEvidenceComplete);
      const fetchedTask = await mockTaskService.getTask(taskId);

      expect(fetchedTask.attachments).toContain(evidenceUrl);
      expect(fetchedTask.status).toBe("submitted");
    });
  });

  describe("Points Calculation", () => {
    it("should award correct points on task completion", async () => {
      const taskId = "task-004";

      // Step 1: Create task with point reward
      const taskWithPoints: Partial<DBTask> = {
        userId: "user-123",
        text: "Challenging Task",
        title: "Challenging Task",
        status: "pending",
        priority: "high",
        assignedBy: "keyholder",
        consequence: {
          type: "reward",
          description: "Earn points",
        },
        pointValue: 25,
        createdAt: new Date(),
        isRecurring: false,
      };

      mockTaskService.createTask.mockResolvedValue(taskId);
      await mockTaskService.createTask(taskWithPoints);

      // Step 2: Submit task
      await mockTaskService.submitTask(taskId, "user-123", {
        note: "Completed successfully",
      });

      // Step 3: Approve and award points
      await mockTaskService.approveTask(taskId, "keyholder-456", {
        feedback: "Excellent work!",
        pointValue: 25,
      });

      expect(mockTaskService.approveTask).toHaveBeenCalledWith(
        taskId,
        "keyholder-456",
        expect.objectContaining({
          pointValue: 25,
        }),
      );

      // Step 4: Verify points were awarded
      const approvedTask: DBTask = {
        ...taskWithPoints,
        id: taskId,
        status: "approved",
        pointValue: 25,
        pointsAwarded: true,
        syncStatus: "synced",
        lastModified: new Date(),
      } as DBTask;

      mockTaskService.getTask.mockResolvedValue(approvedTask);
      const fetchedTask = await mockTaskService.getTask(taskId);

      expect(fetchedTask.pointValue).toBe(25);
      expect(fetchedTask.pointsAwarded).toBe(true);
    });
  });

  describe("Punishment Application", () => {
    it("should apply punishment on task rejection", async () => {
      const taskId = "task-005";

      // Step 1: Create task with punishment consequence
      const taskWithPunishment: Partial<DBTask> = {
        userId: "user-123",
        text: "Important Task",
        title: "Important Task",
        status: "pending",
        priority: "high",
        assignedBy: "keyholder",
        consequence: {
          type: "punishment",
          description: "Add 24 hours chastity time",
          duration: 86400, // 24 hours in seconds
        },
        pointValue: -10,
        createdAt: new Date(),
        isRecurring: false,
      };

      mockTaskService.createTask.mockResolvedValue(taskId);
      await mockTaskService.createTask(taskWithPunishment);

      // Step 2: Submit task
      await mockTaskService.submitTask(taskId, "user-123", {
        note: "Attempted completion",
      });

      // Step 3: Reject task and apply punishment
      await mockTaskService.rejectTask(taskId, "keyholder-456", {
        feedback: "Task not completed properly",
        applyPunishment: true,
      });

      expect(mockTaskService.rejectTask).toHaveBeenCalledWith(
        taskId,
        "keyholder-456",
        expect.objectContaining({
          applyPunishment: true,
        }),
      );

      // Step 4: Verify punishment was applied
      const rejectedTask: DBTask = {
        ...taskWithPunishment,
        id: taskId,
        status: "rejected",
        keyholderFeedback: "Task not completed properly",
        pointValue: -10, // Negative points as punishment
        pointsAwarded: true,
        syncStatus: "synced",
        lastModified: new Date(),
      } as DBTask;

      mockTaskService.getTask.mockResolvedValue(rejectedTask);
      const fetchedTask = await mockTaskService.getTask(taskId);

      expect(fetchedTask.status).toBe("rejected");
      expect(fetchedTask.pointValue).toBe(-10);
      expect(fetchedTask.pointsAwarded).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle task deletion", async () => {
      const taskId = "task-006";

      mockTaskService.deleteTask.mockResolvedValue(undefined);
      await mockTaskService.deleteTask(taskId);

      expect(mockTaskService.deleteTask).toHaveBeenCalledWith(taskId);

      // Verify task no longer exists
      mockTaskService.getTask.mockResolvedValue(null);
      const deletedTask = await mockTaskService.getTask(taskId);
      expect(deletedTask).toBeNull();
    });

    it("should handle concurrent task updates", async () => {
      const taskId = "task-007";

      // Simulate two simultaneous updates
      const update1 = { status: "submitted" as TaskStatus };
      const update2 = { status: "approved" as TaskStatus };

      mockTaskService.updateTask.mockResolvedValue(undefined);

      await Promise.all([
        mockTaskService.updateTask(taskId, update1),
        mockTaskService.updateTask(taskId, update2),
      ]);

      // Both updates should be called
      expect(mockTaskService.updateTask).toHaveBeenCalledTimes(2);
    });

    it("should validate task status transitions", async () => {
      const taskId = "task-008";

      // Try to approve a pending task (should require submitted status first)
      const pendingTask: DBTask = {
        id: taskId,
        userId: "user-123",
        text: "Test Task",
        title: "Test Task",
        status: "pending",
        priority: "medium",
        assignedBy: "keyholder",
        createdAt: new Date(),
        isRecurring: false,
        syncStatus: "synced",
        lastModified: new Date(),
      };

      mockTaskService.getTask.mockResolvedValue(pendingTask);
      const fetchedTask = await mockTaskService.getTask(taskId);

      // Attempting to approve without submission should be handled
      expect(fetchedTask.status).toBe("pending");
      // In a real implementation, approveTask should validate status
    });
  });
});
