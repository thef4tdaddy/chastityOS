/**
 * Tests for GoalTrackerService
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { GoalTrackerService } from "../GoalTrackerService";
import { goalDBService } from "../database/GoalDBService";
import { eventDBService } from "../database/EventDBService";
import type { DBSession, DBGoal } from "@/types/database";

// Mock the database services
vi.mock("../database/GoalDBService", () => ({
  goalDBService: {
    getGoals: vi.fn(),
    updateGoalProgress: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("../database/EventDBService", () => ({
  eventDBService: {
    logEvent: vi.fn(),
  },
}));

describe("GoalTrackerService", () => {
  const mockUserId = "test-user-123";
  const mockSessionId = "test-session-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("trackSessionCompletion", () => {
    it("should update goal progress when session completes", async () => {
      const mockSession: DBSession = {
        id: mockSessionId,
        userId: mockUserId,
        startTime: new Date("2024-01-01T00:00:00Z"),
        endTime: new Date("2024-01-01T02:00:00Z"), // 2 hour session
        isPaused: false,
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
        syncStatus: "synced",
        lastModified: new Date(),
      };

      const mockGoal: DBGoal = {
        id: "goal-1",
        userId: mockUserId,
        type: "duration",
        title: "7 Day Goal",
        targetValue: 7 * 24 * 3600, // 7 days in seconds
        currentValue: 5 * 24 * 3600, // 5 days already completed
        unit: "seconds",
        isCompleted: false,
        createdAt: new Date(),
        createdBy: "submissive",
        isPublic: false,
        syncStatus: "synced",
        lastModified: new Date(),
      };

      vi.mocked(goalDBService.getGoals).mockResolvedValue([mockGoal]);

      await GoalTrackerService.trackSessionCompletion(mockSession);

      // Should update goal progress with 2 hours (7200 seconds)
      expect(goalDBService.updateGoalProgress).toHaveBeenCalledWith(
        "goal-1",
        5 * 24 * 3600 + 7200, // Previous progress + 2 hours
      );
    });

    it("should complete goal when target is reached", async () => {
      const mockSession: DBSession = {
        id: mockSessionId,
        userId: mockUserId,
        startTime: new Date("2024-01-01T00:00:00Z"),
        endTime: new Date("2024-01-01T03:00:00Z"), // 3 hour session
        isPaused: false,
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
        syncStatus: "synced",
        lastModified: new Date(),
      };

      const mockGoal: DBGoal = {
        id: "goal-1",
        userId: mockUserId,
        type: "duration",
        title: "3 Hour Goal",
        targetValue: 3 * 3600, // 3 hours in seconds
        currentValue: 0,
        unit: "seconds",
        isCompleted: false,
        createdAt: new Date(),
        createdBy: "submissive",
        isPublic: false,
        syncStatus: "synced",
        lastModified: new Date(),
      };

      vi.mocked(goalDBService.getGoals).mockResolvedValue([mockGoal]);

      await GoalTrackerService.trackSessionCompletion(mockSession);

      // Should log goal completion event
      expect(eventDBService.logEvent).toHaveBeenCalledWith(
        mockUserId,
        "achievement",
        expect.objectContaining({
          action: "goal_completed",
          title: "Goal Completed: 3 Hour Goal",
        }),
        { sessionId: mockSessionId },
      );
    });

    it("should handle paused sessions correctly", async () => {
      const mockSession: DBSession = {
        id: mockSessionId,
        userId: mockUserId,
        startTime: new Date("2024-01-01T00:00:00Z"),
        endTime: new Date("2024-01-01T03:00:00Z"), // 3 hours total
        isPaused: false,
        accumulatedPauseTime: 1800, // 30 minutes paused
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
        syncStatus: "synced",
        lastModified: new Date(),
      };

      const mockGoal: DBGoal = {
        id: "goal-1",
        userId: mockUserId,
        type: "duration",
        title: "Test Goal",
        targetValue: 10000,
        currentValue: 0,
        unit: "seconds",
        isCompleted: false,
        createdAt: new Date(),
        createdBy: "submissive",
        isPublic: false,
        syncStatus: "synced",
        lastModified: new Date(),
      };

      vi.mocked(goalDBService.getGoals).mockResolvedValue([mockGoal]);

      await GoalTrackerService.trackSessionCompletion(mockSession);

      // Should update with effective time: 3 hours - 30 minutes = 2.5 hours = 9000 seconds
      expect(goalDBService.updateGoalProgress).toHaveBeenCalledWith(
        "goal-1",
        9000,
      );
    });

    it("should skip tracking if no active goals", async () => {
      const mockSession: DBSession = {
        id: mockSessionId,
        userId: mockUserId,
        startTime: new Date("2024-01-01T00:00:00Z"),
        endTime: new Date("2024-01-01T02:00:00Z"),
        isPaused: false,
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
        syncStatus: "synced",
        lastModified: new Date(),
      };

      vi.mocked(goalDBService.getGoals).mockResolvedValue([]);

      await GoalTrackerService.trackSessionCompletion(mockSession);

      expect(goalDBService.updateGoalProgress).not.toHaveBeenCalled();
    });

    it("should skip completed goals", async () => {
      const mockSession: DBSession = {
        id: mockSessionId,
        userId: mockUserId,
        startTime: new Date("2024-01-01T00:00:00Z"),
        endTime: new Date("2024-01-01T02:00:00Z"),
        isPaused: false,
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
        syncStatus: "synced",
        lastModified: new Date(),
      };

      const completedGoal: DBGoal = {
        id: "goal-1",
        userId: mockUserId,
        type: "duration",
        title: "Completed Goal",
        targetValue: 1000,
        currentValue: 1000,
        unit: "seconds",
        isCompleted: true,
        completedAt: new Date(),
        createdAt: new Date(),
        createdBy: "submissive",
        isPublic: false,
        syncStatus: "synced",
        lastModified: new Date(),
      };

      vi.mocked(goalDBService.getGoals).mockResolvedValue([completedGoal]);

      await GoalTrackerService.trackSessionCompletion(mockSession);

      expect(goalDBService.updateGoalProgress).not.toHaveBeenCalled();
    });
  });

  describe("getGoalStatistics", () => {
    it("should calculate statistics correctly", async () => {
      const mockGoals: DBGoal[] = [
        {
          id: "goal-1",
          userId: mockUserId,
          type: "duration",
          title: "Goal 1",
          targetValue: 1000,
          currentValue: 500,
          unit: "seconds",
          isCompleted: false,
          createdAt: new Date(),
          createdBy: "submissive",
          isPublic: false,
          syncStatus: "synced",
          lastModified: new Date(),
        },
        {
          id: "goal-2",
          userId: mockUserId,
          type: "duration",
          title: "Goal 2",
          targetValue: 2000,
          currentValue: 1000,
          unit: "seconds",
          isCompleted: false,
          createdAt: new Date(),
          createdBy: "submissive",
          isPublic: false,
          syncStatus: "synced",
          lastModified: new Date(),
        },
        {
          id: "goal-3",
          userId: mockUserId,
          type: "duration",
          title: "Goal 3",
          targetValue: 1000,
          currentValue: 1000,
          unit: "seconds",
          isCompleted: true,
          completedAt: new Date(),
          createdAt: new Date(),
          createdBy: "submissive",
          isPublic: false,
          syncStatus: "synced",
          lastModified: new Date(),
        },
      ];

      vi.mocked(goalDBService.getGoals).mockResolvedValue(mockGoals);

      const stats = await GoalTrackerService.getGoalStatistics(mockUserId);

      expect(stats).toEqual({
        total: 3,
        active: 2,
        completed: 1,
        completionRate: 33.3,
        averageProgress: 50, // (50% + 50%) / 2
      });
    });
  });

  describe("calculateProgress", () => {
    it("should calculate progress percentage correctly", () => {
      const goal: DBGoal = {
        id: "goal-1",
        userId: mockUserId,
        type: "duration",
        title: "Test",
        targetValue: 100,
        currentValue: 50,
        unit: "seconds",
        isCompleted: false,
        createdAt: new Date(),
        createdBy: "submissive",
        isPublic: false,
        syncStatus: "synced",
        lastModified: new Date(),
      };

      const progress = GoalTrackerService.calculateProgress(goal);
      expect(progress).toBe(50);
    });

    it("should cap progress at 100%", () => {
      const goal: DBGoal = {
        id: "goal-1",
        userId: mockUserId,
        type: "duration",
        title: "Test",
        targetValue: 100,
        currentValue: 150,
        unit: "seconds",
        isCompleted: false,
        createdAt: new Date(),
        createdBy: "submissive",
        isPublic: false,
        syncStatus: "synced",
        lastModified: new Date(),
      };

      const progress = GoalTrackerService.calculateProgress(goal);
      expect(progress).toBe(100);
    });

    it("should return 0 for zero target", () => {
      const goal: DBGoal = {
        id: "goal-1",
        userId: mockUserId,
        type: "duration",
        title: "Test",
        targetValue: 0,
        currentValue: 50,
        unit: "seconds",
        isCompleted: false,
        createdAt: new Date(),
        createdBy: "submissive",
        isPublic: false,
        syncStatus: "synced",
        lastModified: new Date(),
      };

      const progress = GoalTrackerService.calculateProgress(goal);
      expect(progress).toBe(0);
    });
  });

  describe("isGoalCompleted", () => {
    it("should return true when goal is marked completed", () => {
      const goal: DBGoal = {
        id: "goal-1",
        userId: mockUserId,
        type: "duration",
        title: "Test",
        targetValue: 100,
        currentValue: 50,
        unit: "seconds",
        isCompleted: true,
        createdAt: new Date(),
        createdBy: "submissive",
        isPublic: false,
        syncStatus: "synced",
        lastModified: new Date(),
      };

      expect(GoalTrackerService.isGoalCompleted(goal)).toBe(true);
    });

    it("should return true when current >= target", () => {
      const goal: DBGoal = {
        id: "goal-1",
        userId: mockUserId,
        type: "duration",
        title: "Test",
        targetValue: 100,
        currentValue: 100,
        unit: "seconds",
        isCompleted: false,
        createdAt: new Date(),
        createdBy: "submissive",
        isPublic: false,
        syncStatus: "synced",
        lastModified: new Date(),
      };

      expect(GoalTrackerService.isGoalCompleted(goal)).toBe(true);
    });

    it("should return false when goal is not completed", () => {
      const goal: DBGoal = {
        id: "goal-1",
        userId: mockUserId,
        type: "duration",
        title: "Test",
        targetValue: 100,
        currentValue: 50,
        unit: "seconds",
        isCompleted: false,
        createdAt: new Date(),
        createdBy: "submissive",
        isPublic: false,
        syncStatus: "synced",
        lastModified: new Date(),
      };

      expect(GoalTrackerService.isGoalCompleted(goal)).toBe(false);
    });
  });
});
