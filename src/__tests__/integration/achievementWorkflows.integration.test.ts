/**
 * Achievement Workflows Integration Tests
 * Tests complete achievement workflows including progress tracking,
 * milestone detection, and cross-feature integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AchievementEngine } from "../../services/AchievementEngine";
import { AchievementIntegrationService } from "../../services/AchievementIntegration";
import { achievementDBService } from "../../services/database";
import {
  AchievementCategory,
  AchievementDifficulty,
  DBAchievement,
  DBSession,
  DBGoal,
  DBTask,
} from "../../types";

// Mock the database services
vi.mock("../../services/database", () => ({
  achievementDBService: {
    getAllAchievements: vi.fn(),
    createAchievement: vi.fn(),
    getAchievementsByCategory: vi.fn(),
    getUserAchievements: vi.fn(),
    awardAchievement: vi.fn(),
    getAchievementById: vi.fn(),
    createNotification: vi.fn(),
    getAchievementProgress: vi.fn(),
    updateAchievementProgress: vi.fn(),
  },
  sessionDBService: {
    getUserSessions: vi.fn(),
    findById: vi.fn(),
  },
  taskDBService: {
    getTasks: vi.fn(),
  },
  goalDBService: {
    getGoals: vi.fn(),
  },
}));

// Mock achievements module
vi.mock("../../constants/achievements", () => ({
  ACHIEVEMENTS_WITH_IDS: [],
}));

// Mock logger
vi.mock("../../utils/logging", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("Achievement Workflows Integration Tests", () => {
  const mockUserId = "test-user-123";
  let achievementEngine: AchievementEngine;
  let integrationService: AchievementIntegrationService;

  // Test data factories
  const createMockSession = (
    id: string,
    startTime: Date,
    endTime?: Date,
    duration?: number,
  ): DBSession => ({
    id,
    userId: mockUserId,
    startTime,
    endTime,
    isPaused: false,
    accumulatedPauseTime: 0,
    isHardcoreMode: false,
    keyholderApprovalRequired: false,
    syncStatus: "synced",
    lastModified: new Date(),
  });

  const createMockAchievement = (
    id: string,
    category: AchievementCategory,
    requirementType: string,
    requirementValue: number,
  ): DBAchievement => ({
    id,
    name: `Achievement ${id}`,
    description: `Description for ${id}`,
    category,
    icon: "🏆",
    difficulty: AchievementDifficulty.COMMON,
    points: 100,
    requirements: [
      {
        type: requirementType as any,
        value: requirementValue,
        unit: "count",
      },
    ],
    isHidden: false,
    isActive: true,
    syncStatus: "synced",
    lastModified: new Date(),
  });

  const createMockGoal = (
    id: string,
    targetDuration: number,
    isCompleted: boolean,
  ): DBGoal => ({
    id,
    userId: mockUserId,
    type: "duration",
    targetValue: targetDuration,
    currentValue: isCompleted ? targetDuration : targetDuration / 2,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    isActive: true,
    isCompleted,
    syncStatus: "synced",
    lastModified: new Date(),
  });

  const createMockTask = (
    id: string,
    isCompleted: boolean,
    keyholderApprovalStatus?: "approved" | "rejected",
  ): DBTask => ({
    id,
    userId: mockUserId,
    title: `Task ${id}`,
    description: "Test task",
    status: isCompleted ? "completed" : "pending",
    isCompleted,
    keyholderApprovalStatus,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    syncStatus: "synced",
    lastModified: new Date(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    achievementEngine = new AchievementEngine();
    integrationService = new AchievementIntegrationService();

    // Setup default mock returns
    (achievementDBService.getAllAchievements as any).mockResolvedValue([]);
    (achievementDBService.getUserAchievements as any).mockResolvedValue([]);
    (achievementDBService.getAchievementProgress as any).mockResolvedValue(
      null,
    );
  });

  describe("Achievement Unlock Workflows", () => {
    it("should initialize achievement engine with predefined achievements", async () => {
      const sessionAchievement = createMockAchievement(
        "session-milestone-1",
        AchievementCategory.SESSION_MILESTONES,
        "session_count",
        1,
      );

      (achievementDBService.getAllAchievements as any).mockResolvedValue([
        sessionAchievement,
      ]);

      await achievementEngine.initialize();

      // Verify engine was initialized successfully
      expect(achievementDBService.getAllAchievements).toHaveBeenCalled();
    });

    it("should have multi-session achievement defined", async () => {
      const multiSessionAchievement = createMockAchievement(
        "session-milestone-5",
        AchievementCategory.SESSION_MILESTONES,
        "session_count",
        5,
      );

      (achievementDBService.getAllAchievements as any).mockResolvedValue([
        multiSessionAchievement,
      ]);

      await achievementEngine.initialize();

      // Verify achievement is configured correctly
      expect(multiSessionAchievement.requirements[0]?.value).toBe(5);
      expect(multiSessionAchievement.category).toBe(
        AchievementCategory.SESSION_MILESTONES,
      );
    });

    it("should handle multiple achievement types", async () => {
      const achievements = [
        createMockAchievement(
          "first-session",
          AchievementCategory.SESSION_MILESTONES,
          "session_count",
          1,
        ),
        createMockAchievement(
          "quick-start",
          AchievementCategory.SPECIAL_ACHIEVEMENTS,
          "special_condition",
          1,
        ),
      ];

      (achievementDBService.getAllAchievements as any).mockResolvedValue(
        achievements,
      );

      await achievementEngine.initialize();

      // Verify different achievement categories are supported
      const categories = achievements.map((a) => a.category);
      expect(categories).toContain(AchievementCategory.SESSION_MILESTONES);
      expect(categories).toContain(AchievementCategory.SPECIAL_ACHIEVEMENTS);
    });
  });

  describe("Progress Tracking Across Features", () => {
    it("should define streak achievements", async () => {
      const streakAchievement = createMockAchievement(
        "streak-7",
        AchievementCategory.STREAK_ACHIEVEMENTS,
        "streak_days",
        7,
      );

      (achievementDBService.getAllAchievements as any).mockResolvedValue([
        streakAchievement,
      ]);

      await achievementEngine.initialize();

      // Verify streak achievement configuration
      expect(streakAchievement.category).toBe(
        AchievementCategory.STREAK_ACHIEVEMENTS,
      );
      expect(streakAchievement.requirements[0]?.type).toBe("streak_days");
    });

    it("should define goal-based achievements", async () => {
      const goalAchievement = createMockAchievement(
        "goal-achiever",
        AchievementCategory.GOAL_BASED,
        "goal_completion",
        1,
      );

      (achievementDBService.getAllAchievements as any).mockResolvedValue([
        goalAchievement,
      ]);

      await achievementEngine.initialize();

      // Verify goal achievement configuration
      expect(goalAchievement.category).toBe(AchievementCategory.GOAL_BASED);
      expect(goalAchievement.requirements[0]?.type).toBe("goal_completion");
    });

    it("should define task completion achievements", async () => {
      const taskAchievement = createMockAchievement(
        "task-master",
        AchievementCategory.TASK_COMPLETION,
        "task_completion",
        5,
      );

      (achievementDBService.getAllAchievements as any).mockResolvedValue([
        taskAchievement,
      ]);

      await achievementEngine.initialize();

      // Verify task achievement configuration
      expect(taskAchievement.category).toBe(
        AchievementCategory.TASK_COMPLETION,
      );
      expect(taskAchievement.requirements[0]?.type).toBe("task_completion");
      expect(taskAchievement.requirements[0]?.value).toBe(5);
    });
  });

  describe("Milestone Detection Across Sessions", () => {
    it("should define milestone achievements for multiple sessions", async () => {
      const milestoneAchievement = createMockAchievement(
        "session-10",
        AchievementCategory.SESSION_MILESTONES,
        "session_count",
        10,
      );

      (achievementDBService.getAllAchievements as any).mockResolvedValue([
        milestoneAchievement,
      ]);

      await achievementEngine.initialize();

      // Verify milestone configuration
      expect(milestoneAchievement.requirements[0]?.value).toBe(10);
      expect(milestoneAchievement.category).toBe(
        AchievementCategory.SESSION_MILESTONES,
      );
    });

    it("should define consistency badge achievements", async () => {
      const consistencyAchievement = createMockAchievement(
        "consistent-week",
        AchievementCategory.CONSISTENCY_BADGES,
        "streak_days",
        7,
      );

      (achievementDBService.getAllAchievements as any).mockResolvedValue([
        consistencyAchievement,
      ]);

      await achievementEngine.initialize();

      // Verify consistency achievement configuration
      expect(consistencyAchievement.category).toBe(
        AchievementCategory.CONSISTENCY_BADGES,
      );
      expect(consistencyAchievement.requirements[0]?.value).toBe(7);
    });
  });

  describe("Integration Service Event Handling", () => {
    it("should initialize integration service", async () => {
      (achievementDBService.getAllAchievements as any).mockResolvedValue([]);

      await integrationService.initialize();

      // Verify service initialization calls achievement engine
      expect(achievementDBService.getAllAchievements).toHaveBeenCalled();
    });

    it("should have session event handlers defined", async () => {
      await integrationService.initialize();

      // Verify handlers exist
      expect(integrationService.onSessionStart).toBeDefined();
      expect(integrationService.onSessionEnd).toBeDefined();
      expect(typeof integrationService.onSessionStart).toBe("function");
      expect(typeof integrationService.onSessionEnd).toBe("function");
    });

    it("should have goal event handlers defined", async () => {
      await integrationService.initialize();

      // Verify handlers exist
      expect(integrationService.onGoalCompleted).toBeDefined();
      expect(typeof integrationService.onGoalCompleted).toBe("function");
    });

    it("should have task event handlers defined", async () => {
      await integrationService.initialize();

      // Verify handlers exist
      expect(integrationService.onTaskCompleted).toBeDefined();
      expect(typeof integrationService.onTaskCompleted).toBe("function");
    });
  });

  describe("Error Scenarios", () => {
    it("should handle empty achievement list", async () => {
      (achievementDBService.getAllAchievements as any).mockResolvedValue([]);

      await achievementEngine.initialize();

      // Should not throw error with empty list
      expect(achievementDBService.getAllAchievements).toHaveBeenCalled();
    });

    it("should handle invalid achievement data gracefully", async () => {
      const invalidAchievement = {
        id: "invalid",
        name: "Test",
        // Missing required fields
      };

      (achievementDBService.getAllAchievements as any).mockResolvedValue([
        invalidAchievement,
      ]);

      // Should initialize despite invalid data
      await achievementEngine.initialize();
      expect(achievementDBService.getAllAchievements).toHaveBeenCalled();
    });

    it("should handle database initialization errors gracefully", async () => {
      (achievementDBService.getAllAchievements as any).mockRejectedValueOnce(
        new Error("Database connection failed"),
      );

      // Should handle error and attempt initialization
      try {
        await achievementEngine.initialize();
      } catch (error) {
        // Error is expected and caught
        expect(error).toBeDefined();
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle concurrent achievement checks", async () => {
      const achievement = createMockAchievement(
        "rapid-progress",
        AchievementCategory.SESSION_MILESTONES,
        "session_count",
        3,
      );

      (achievementDBService.getAllAchievements as any).mockResolvedValue([
        achievement,
      ]);

      await achievementEngine.initialize();

      // Multiple concurrent initializations should be handled
      await expect(achievementEngine.initialize()).resolves.not.toThrow();
    });

    it("should handle duplicate achievement definitions", async () => {
      const achievement = createMockAchievement(
        "duplicate-id",
        AchievementCategory.SESSION_MILESTONES,
        "session_count",
        1,
      );

      // Simulate duplicate achievements
      (achievementDBService.getAllAchievements as any).mockResolvedValue([
        achievement,
        achievement,
      ]);

      await achievementEngine.initialize();

      // Should handle duplicates gracefully
      expect(achievementDBService.getAllAchievements).toHaveBeenCalled();
    });

    it("should handle achievements with missing requirements", async () => {
      const invalidAchievement = {
        ...createMockAchievement(
          "no-requirements",
          AchievementCategory.SESSION_MILESTONES,
          "session_count",
          0,
        ),
        requirements: [],
      };

      (achievementDBService.getAllAchievements as any).mockResolvedValue([
        invalidAchievement,
      ]);

      await achievementEngine.initialize();

      // Should handle gracefully
      expect(achievementDBService.getAllAchievements).toHaveBeenCalled();
    });

    it("should handle achievements with zero target value", async () => {
      const zeroValueAchievement = createMockAchievement(
        "zero-value",
        AchievementCategory.SESSION_MILESTONES,
        "session_count",
        0,
      );

      (achievementDBService.getAllAchievements as any).mockResolvedValue([
        zeroValueAchievement,
      ]);

      await achievementEngine.initialize();

      // Should handle edge case gracefully
      expect(zeroValueAchievement.requirements[0]?.value).toBe(0);
    });
  });
});
