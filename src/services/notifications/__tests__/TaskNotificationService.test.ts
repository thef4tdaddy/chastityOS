/**
 * TaskNotificationService Tests
 * Unit tests for task notification functionality
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { TaskNotificationService } from "../TaskNotificationService";
import { useNotificationStore } from "@/stores/notificationStore";

// Mock the notification store
vi.mock("@/stores/notificationStore", () => ({
  useNotificationStore: {
    getState: vi.fn(() => ({
      addNotification: vi.fn(() => "test-notification-id"),
    })),
  },
}));

describe("TaskNotificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("notifyTaskAssigned", () => {
    it("should send task assigned notification with default keyholder name", async () => {
      const params = {
        taskId: "task-123",
        taskTitle: "Clean the room",
        userId: "user-456",
      };

      const result = await TaskNotificationService.notifyTaskAssigned(params);

      expect(result).toBe("test-notification-id");
      expect(
        useNotificationStore.getState().addNotification,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "info",
          priority: "medium",
          title: "New Task Assigned",
          message: expect.stringContaining("Your Keyholder assigned you"),
          metadata: expect.objectContaining({
            taskId: "task-123",
            type: "task_assigned",
          }),
        }),
      );
    });

    it("should include keyholder name when provided", async () => {
      const params = {
        taskId: "task-123",
        taskTitle: "Clean the room",
        userId: "user-456",
        keyholderName: "Master John",
      };

      await TaskNotificationService.notifyTaskAssigned(params);

      expect(
        useNotificationStore.getState().addNotification,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Master John assigned you"),
        }),
      );
    });

    it("should set high priority when due date is provided", async () => {
      const params = {
        taskId: "task-123",
        taskTitle: "Clean the room",
        userId: "user-456",
        dueDate: new Date("2024-12-31"),
      };

      await TaskNotificationService.notifyTaskAssigned(params);

      expect(
        useNotificationStore.getState().addNotification,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: "high",
          message: expect.stringContaining("due"),
        }),
      );
    });
  });

  describe("notifyTaskSubmitted", () => {
    it("should send task submitted notification to keyholder", async () => {
      const params = {
        taskId: "task-123",
        taskTitle: "Clean the room",
        userId: "user-456",
        keyholderUserId: "keyholder-789",
        hasEvidence: false,
      };

      const result = await TaskNotificationService.notifyTaskSubmitted(params);

      expect(result).toBe("test-notification-id");
      expect(
        useNotificationStore.getState().addNotification,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "info",
          priority: "high",
          title: "Task Submitted for Review",
          message: expect.stringContaining("Your submissive submitted"),
          metadata: expect.objectContaining({
            taskId: "task-123",
            type: "task_submitted",
          }),
        }),
      );
    });

    it("should indicate when evidence is provided", async () => {
      const params = {
        taskId: "task-123",
        taskTitle: "Clean the room",
        userId: "user-456",
        keyholderUserId: "keyholder-789",
        hasEvidence: true,
      };

      await TaskNotificationService.notifyTaskSubmitted(params);

      expect(
        useNotificationStore.getState().addNotification,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("with evidence"),
        }),
      );
    });
  });

  describe("notifyTaskApproved", () => {
    it("should send task approved notification", async () => {
      const params = {
        taskId: "task-123",
        taskTitle: "Clean the room",
        userId: "user-456",
      };

      const result = await TaskNotificationService.notifyTaskApproved(params);

      expect(result).toBe("test-notification-id");
      expect(
        useNotificationStore.getState().addNotification,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success",
          priority: "medium",
          title: "Task Approved! ✅",
          message: expect.stringContaining("was approved"),
          metadata: expect.objectContaining({
            taskId: "task-123",
            type: "task_approved",
          }),
        }),
      );
    });

    it("should include points when provided", async () => {
      const params = {
        taskId: "task-123",
        taskTitle: "Clean the room",
        userId: "user-456",
        points: 10,
      };

      await TaskNotificationService.notifyTaskApproved(params);

      expect(
        useNotificationStore.getState().addNotification,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("+10 points"),
        }),
      );
    });
  });

  describe("notifyTaskRejected", () => {
    it("should send task rejected notification with persistent duration", async () => {
      const params = {
        taskId: "task-123",
        taskTitle: "Clean the room",
        userId: "user-456",
        reason: "Not thorough enough",
      };

      const result = await TaskNotificationService.notifyTaskRejected(params);

      expect(result).toBe("test-notification-id");
      expect(
        useNotificationStore.getState().addNotification,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "warning",
          priority: "high",
          title: "Task Needs Revision",
          duration: 0, // Persistent
          message: expect.stringContaining("was rejected"),
          metadata: expect.objectContaining({
            taskId: "task-123",
            type: "task_rejected",
          }),
        }),
      );
    });

    it("should include reason when provided", async () => {
      const params = {
        taskId: "task-123",
        taskTitle: "Clean the room",
        userId: "user-456",
        reason: "Not thorough enough",
      };

      await TaskNotificationService.notifyTaskRejected(params);

      expect(
        useNotificationStore.getState().addNotification,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Not thorough enough"),
        }),
      );
    });
  });

  describe("notifyDeadlineApproaching", () => {
    it("should send deadline approaching notification", async () => {
      const params = {
        taskId: "task-123",
        taskTitle: "Clean the room",
        userId: "user-456",
        hoursRemaining: 12,
      };

      const result =
        await TaskNotificationService.notifyDeadlineApproaching(params);

      expect(result).toBe("test-notification-id");
      expect(
        useNotificationStore.getState().addNotification,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "warning",
          priority: "high",
          title: "Task Deadline Approaching",
          message: expect.stringContaining("is due in 12 hours"),
          metadata: expect.objectContaining({
            taskId: "task-123",
            type: "task_deadline",
            hoursRemaining: 12,
          }),
        }),
      );
    });
  });

  describe("notifyTaskOverdue", () => {
    it("should send overdue notifications to both submissive and keyholder", async () => {
      const params = {
        taskId: "task-123",
        taskTitle: "Clean the room",
        userId: "user-456",
        keyholderUserId: "keyholder-789",
      };

      const result = await TaskNotificationService.notifyTaskOverdue(params);

      expect(result.submissiveNotificationId).toBe("test-notification-id");
      expect(result.keyholderNotificationId).toBe("test-notification-id");

      // Should call addNotification twice (once for submissive, once for keyholder)
      expect(
        useNotificationStore.getState().addNotification,
      ).toHaveBeenCalledTimes(2);

      // Check submissive notification
      expect(
        useNotificationStore.getState().addNotification,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          priority: "high",
          title: "Task Overdue",
          duration: 0, // Persistent
          metadata: expect.objectContaining({
            type: "task_overdue",
          }),
        }),
      );

      // Check keyholder notification
      expect(
        useNotificationStore.getState().addNotification,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "warning",
          priority: "medium",
          title: "Task Overdue",
          metadata: expect.objectContaining({
            type: "task_overdue_keyholder",
          }),
        }),
      );
    });
  });

  describe("shouldNotifyUser", () => {
    it("should return true by default", async () => {
      const result = await TaskNotificationService.shouldNotifyUser(
        "user-123",
        "task_assigned",
      );
      expect(result).toBe(true);
    });
  });
});
