/**
 * AchievementEngine Unit Tests
 * Tests for achievement tracking and awarding logic
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AchievementEngine } from "../AchievementEngine";
import {
  DBSession,
  DBGoal,
  DBTask,
  DBAchievement,
  AchievementCategory,
  AchievementDifficulty,
} from "../../types";

// Mock the database services
vi.mock("../database", () => ({
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

// Import mocks after mock setup and cast to Vitest mocked types
import {
  achievementDBService,
  sessionDBService,
  taskDBService,
  goalDBService,
} from "../database";

// Properly type the mocks
const mockAchievementDBService = vi.mocked(achievementDBService);
const mockSessionDBService = vi.mocked(sessionDBService);
const mockTaskDBService = vi.mocked(taskDBService);
const mockGoalDBService = vi.mocked(goalDBService);

// Test data factory functions
const createMockSession = (
  id: string,
  startTime: Date,
  endTime?: Date,
): DBSession => ({
  id,
  userId: "user-123",
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
  condition?: string,
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
      condition,
    },
  ],
  isHidden: false,
  isActive: true,
  syncStatus: "synced",
  lastModified: new Date(),
});

const createMockTask = (
  id: string,
  status: "pending" | "completed" | "approved" | "rejected",
  completedAt?: Date,
  dueDate?: Date,
): DBTask => ({
  id,
  userId: "user-123",
  text: `Task ${id}`,
  status,
  priority: "medium",
  assignedBy: "keyholder",
  createdAt: new Date("2025-01-01"),
  completedAt,
  dueDate,
  syncStatus: "synced",
  lastModified: new Date(),
});

const createMockGoal = (
  id: string,
  currentValue: number,
  targetValue: number,
  isCompleted: boolean,
): DBGoal => ({
  id,
  userId: "user-123",
  type: "duration",
  title: `Goal ${id}`,
  targetValue,
  currentValue,
  unit: "seconds",
  isCompleted,
  createdAt: new Date("2025-01-01"),
  createdBy: "submissive",
  isPublic: false,
  syncStatus: "synced",
  lastModified: new Date(),
});

describe("AchievementEngine", () => {
  let engine: AchievementEngine;
  const userId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new AchievementEngine();
    mockAchievementDBService.getAllAchievements.mockResolvedValue([]);
    mockAchievementDBService.getUserAchievements.mockResolvedValue([]);
    mockAchievementDBService.getAchievementsByCategory.mockResolvedValue([]);
  });

  describe("initialize", () => {
    it("should initialize with predefined achievements when database is empty", async () => {
      mockAchievementDBService.getAllAchievements.mockResolvedValue([]);

      await engine.initialize();

      expect(mockAchievementDBService.getAllAchievements).toHaveBeenCalled();
    });

    it("should not re-initialize when already initialized", async () => {
      mockAchievementDBService.getAllAchievements.mockResolvedValue([]);

      await engine.initialize();
      await engine.initialize();

      expect(mockAchievementDBService.getAllAchievements).toHaveBeenCalledTimes(
        1,
      );
    });

    it("should skip adding achievements if some already exist", async () => {
      const existingAchievements = [
        createMockAchievement(
          "ach-1",
          AchievementCategory.SESSION_MILESTONES,
          "session_count",
          1,
        ),
      ];
      mockAchievementDBService.getAllAchievements.mockResolvedValue(
        existingAchievements,
      );

      await engine.initialize();

      expect(mockAchievementDBService.createAchievement).not.toHaveBeenCalled();
    });
  });

  describe("processSessionEvent", () => {
    it("should check session milestones on session end", async () => {
      const sessions = [
        createMockSession("s1", new Date("2025-01-01"), new Date("2025-01-02")),
        createMockSession("s2", new Date("2025-01-02"), new Date("2025-01-03")),
      ];
      mockSessionDBService.getUserSessions.mockResolvedValue(sessions);
      mockAchievementDBService.getAchievementsByCategory.mockResolvedValue([]);

      await engine.processSessionEvent(userId, "session_end");

      expect(mockSessionDBService.getUserSessions).toHaveBeenCalledWith(userId);
      expect(
        mockAchievementDBService.getAchievementsByCategory,
      ).toHaveBeenCalledWith(AchievementCategory.SESSION_MILESTONES);
    });

    it("should award achievement when session count milestone is reached", async () => {
      const sessions = Array.from({ length: 10 }, (_, i) =>
        createMockSession(
          `s${i}`,
          new Date(`2025-01-${i + 1}`),
          new Date(`2025-01-${i + 2}`),
        ),
      );
      mockSessionDBService.getUserSessions.mockResolvedValue(sessions);

      const achievement = createMockAchievement(
        "ach-milestone-10",
        AchievementCategory.SESSION_MILESTONES,
        "session_count",
        10,
      );
      mockAchievementDBService.getAchievementsByCategory.mockResolvedValue([
        achievement,
      ]);
      mockAchievementDBService.getUserAchievements.mockResolvedValue([]);
      mockAchievementDBService.getAchievementById.mockResolvedValue(
        achievement,
      );

      await engine.processSessionEvent(userId, "session_end");

      expect(mockAchievementDBService.awardAchievement).toHaveBeenCalledWith(
        userId,
        "ach-milestone-10",
        100,
      );
      expect(mockAchievementDBService.createNotification).toHaveBeenCalled();
    });

    it("should not award achievement if user already has it", async () => {
      const sessions = Array.from({ length: 10 }, (_, i) =>
        createMockSession(
          `s${i}`,
          new Date(`2025-01-${i + 1}`),
          new Date(`2025-01-${i + 2}`),
        ),
      );
      mockSessionDBService.getUserSessions.mockResolvedValue(sessions);

      const achievement = createMockAchievement(
        "ach-milestone-10",
        AchievementCategory.SESSION_MILESTONES,
        "session_count",
        10,
      );
      mockAchievementDBService.getAchievementsByCategory.mockResolvedValue([
        achievement,
      ]);
      mockAchievementDBService.getUserAchievements.mockResolvedValue([
        { achievementId: "ach-milestone-10" },
      ]);

      await engine.processSessionEvent(userId, "session_end");

      expect(mockAchievementDBService.awardAchievement).not.toHaveBeenCalled();
    });

    it("should check special start conditions on session start", async () => {
      const earlyMorningSession = createMockSession(
        "s1",
        new Date("2025-01-15T06:30:00"),
      );
      mockAchievementDBService.getAchievementsByCategory.mockResolvedValue([]);

      await engine.processSessionEvent(
        userId,
        "session_start",
        earlyMorningSession,
      );

      expect(
        mockAchievementDBService.getAchievementsByCategory,
      ).toHaveBeenCalledWith(AchievementCategory.SPECIAL_ACHIEVEMENTS);
    });

    it("should track progress for special conditions before 8am", async () => {
      const earlySession = createMockSession(
        "s1",
        new Date("2025-01-15T07:00:00"),
      );
      const achievement = createMockAchievement(
        "ach-early-bird",
        AchievementCategory.SPECIAL_ACHIEVEMENTS,
        "special_condition",
        5,
        "sessions_before_8am",
      );
      mockAchievementDBService.getAchievementsByCategory.mockResolvedValue([
        achievement,
      ]);
      mockAchievementDBService.getAchievementProgress.mockResolvedValue({
        currentValue: 3,
        targetValue: 5,
        isCompleted: false,
      });

      await engine.processSessionEvent(userId, "session_start", earlySession);

      expect(
        mockAchievementDBService.updateAchievementProgress,
      ).toHaveBeenCalledWith(userId, "ach-early-bird", 4, 5);
    });

    it("should not track progress for sessions after 8am", async () => {
      const lateSession = createMockSession(
        "s1",
        new Date("2025-01-15T09:00:00"),
      );
      const achievement = createMockAchievement(
        "ach-early-bird",
        AchievementCategory.SPECIAL_ACHIEVEMENTS,
        "special_condition",
        5,
        "sessions_before_8am",
      );
      mockAchievementDBService.getAchievementsByCategory.mockResolvedValue([
        achievement,
      ]);

      await engine.processSessionEvent(userId, "session_start", lateSession);

      expect(
        mockAchievementDBService.updateAchievementProgress,
      ).not.toHaveBeenCalled();
    });

    it("should check weekend sessions", async () => {
      const weekendSession = createMockSession(
        "s1",
        new Date("2025-01-11T10:00:00"), // Saturday
      );
      const achievement = createMockAchievement(
        "ach-weekend",
        AchievementCategory.SPECIAL_ACHIEVEMENTS,
        "special_condition",
        3,
        "weekend_sessions",
      );
      mockAchievementDBService.getAchievementsByCategory.mockResolvedValue([
        achievement,
      ]);
      mockAchievementDBService.getAchievementProgress.mockResolvedValue(null);

      await engine.processSessionEvent(userId, "session_start", weekendSession);

      expect(
        mockAchievementDBService.updateAchievementProgress,
      ).toHaveBeenCalledWith(userId, "ach-weekend", 1, 3);
    });
  });

  describe("processTaskEvent", () => {
    it("should check task achievements when task is completed", async () => {
      const tasks = [
        createMockTask("t1", "completed", new Date("2025-01-15")),
        createMockTask("t2", "completed", new Date("2025-01-16")),
      ];
      mockTaskDBService.getTasks.mockResolvedValue(tasks);
      mockAchievementDBService.getAchievementsByCategory.mockResolvedValue([]);

      await engine.processTaskEvent(userId, "task_completed");

      expect(mockTaskDBService.getTasks).toHaveBeenCalledWith(userId);
      expect(
        mockAchievementDBService.getAchievementsByCategory,
      ).toHaveBeenCalledWith(AchievementCategory.TASK_COMPLETION);
    });

    it("should award achievement when task count milestone is reached", async () => {
      const tasks = Array.from({ length: 5 }, (_, i) =>
        createMockTask(`t${i}`, "completed", new Date(`2025-01-${i + 1}`)),
      );
      mockTaskDBService.getTasks.mockResolvedValue(tasks);

      const achievement = createMockAchievement(
        "ach-task-5",
        AchievementCategory.TASK_COMPLETION,
        "task_completion",
        5,
      );
      mockAchievementDBService.getAchievementsByCategory.mockResolvedValue([
        achievement,
      ]);
      mockAchievementDBService.getUserAchievements.mockResolvedValue([]);
      mockAchievementDBService.getAchievementById.mockResolvedValue(
        achievement,
      );

      await engine.processTaskEvent(userId, "task_completed");

      expect(mockAchievementDBService.awardAchievement).toHaveBeenCalledWith(
        userId,
        "ach-task-5",
        100,
      );
    });

    it("should award achievement for high task approval rate", async () => {
      const tasks = [
        createMockTask("t1", "approved"),
        createMockTask("t2", "approved"),
        createMockTask("t3", "approved"),
        createMockTask("t4", "approved"),
        createMockTask("t5", "rejected"),
      ];
      mockTaskDBService.getTasks.mockResolvedValue(tasks);

      const achievement = createMockAchievement(
        "ach-approval-rate",
        AchievementCategory.TASK_COMPLETION,
        "special_condition",
        80,
        "task_approval_rate",
      );
      mockAchievementDBService.getAchievementsByCategory.mockResolvedValue([
        achievement,
      ]);
      mockAchievementDBService.getUserAchievements.mockResolvedValue([]);
      mockAchievementDBService.getAchievementById.mockResolvedValue(
        achievement,
      );

      await engine.processTaskEvent(userId, "task_approved");

      expect(mockAchievementDBService.awardAchievement).toHaveBeenCalledWith(
        userId,
        "ach-approval-rate",
        100,
      );
    });

    it("should award achievement for tasks completed early", async () => {
      const tasks = [
        createMockTask(
          "t1",
          "completed",
          new Date("2025-01-10"),
          new Date("2025-01-15"),
        ),
        createMockTask(
          "t2",
          "completed",
          new Date("2025-01-11"),
          new Date("2025-01-20"),
        ),
        createMockTask(
          "t3",
          "completed",
          new Date("2025-01-12"),
          new Date("2025-01-18"),
        ),
      ];
      mockTaskDBService.getTasks.mockResolvedValue(tasks);

      const achievement = createMockAchievement(
        "ach-early-tasks",
        AchievementCategory.TASK_COMPLETION,
        "special_condition",
        3,
        "tasks_completed_early",
      );
      mockAchievementDBService.getAchievementsByCategory.mockResolvedValue([
        achievement,
      ]);
      mockAchievementDBService.getUserAchievements.mockResolvedValue([]);
      mockAchievementDBService.getAchievementById.mockResolvedValue(
        achievement,
      );

      await engine.processTaskEvent(userId, "task_completed");

      expect(mockAchievementDBService.awardAchievement).toHaveBeenCalledWith(
        userId,
        "ach-early-tasks",
        100,
      );
    });
  });

  describe("processGoalEvent", () => {
    it("should check goal achievements when goal is completed", async () => {
      const goals = [
        createMockGoal("g1", 100, 100, true),
        createMockGoal("g2", 200, 200, true),
      ];
      mockGoalDBService.getGoals.mockResolvedValue(goals);
      mockAchievementDBService.getAchievementsByCategory.mockResolvedValue([]);

      await engine.processGoalEvent(userId, "goal_completed");

      expect(mockGoalDBService.getGoals).toHaveBeenCalledWith(userId);
      expect(
        mockAchievementDBService.getAchievementsByCategory,
      ).toHaveBeenCalledWith(AchievementCategory.GOAL_BASED);
    });

    it("should award achievement when goal count milestone is reached", async () => {
      const goals = Array.from({ length: 3 }, (_, i) =>
        createMockGoal(`g${i}`, 100, 100, true),
      );
      mockGoalDBService.getGoals.mockResolvedValue(goals);

      const achievement = createMockAchievement(
        "ach-goal-3",
        AchievementCategory.GOAL_BASED,
        "goal_completion",
        3,
      );
      mockAchievementDBService.getAchievementsByCategory.mockResolvedValue([
        achievement,
      ]);
      mockAchievementDBService.getUserAchievements.mockResolvedValue([]);
      mockAchievementDBService.getAchievementById.mockResolvedValue(
        achievement,
      );

      await engine.processGoalEvent(userId, "goal_completed");

      expect(mockAchievementDBService.awardAchievement).toHaveBeenCalledWith(
        userId,
        "ach-goal-3",
        100,
      );
    });

    it("should award achievement for exceeding goal by 50%", async () => {
      const goal = createMockGoal("g1", 150, 100, true);
      mockGoalDBService.getGoals.mockResolvedValue([goal]);

      const achievement = createMockAchievement(
        "ach-overachiever",
        AchievementCategory.GOAL_BASED,
        "special_condition",
        1,
        "exceed_goal_by_50_percent",
      );
      mockAchievementDBService.getAchievementsByCategory.mockResolvedValue([
        achievement,
      ]);
      mockAchievementDBService.getUserAchievements.mockResolvedValue([]);
      mockAchievementDBService.getAchievementById.mockResolvedValue(
        achievement,
      );

      await engine.processGoalEvent(userId, "goal_completed", goal);

      expect(mockAchievementDBService.awardAchievement).toHaveBeenCalledWith(
        userId,
        "ach-overachiever",
        100,
      );
    });

    it("should award achievement for exact goal achievement", async () => {
      const goal = createMockGoal("g1", 100, 100, true);
      mockGoalDBService.getGoals.mockResolvedValue([goal]);

      const achievement = createMockAchievement(
        "ach-precision",
        AchievementCategory.GOAL_BASED,
        "special_condition",
        1,
        "exact_goal_achievement",
      );
      mockAchievementDBService.getAchievementsByCategory.mockResolvedValue([
        achievement,
      ]);
      mockAchievementDBService.getUserAchievements.mockResolvedValue([]);
      mockAchievementDBService.getAchievementById.mockResolvedValue(
        achievement,
      );

      await engine.processGoalEvent(userId, "goal_completed", goal);

      expect(mockAchievementDBService.awardAchievement).toHaveBeenCalledWith(
        userId,
        "ach-precision",
        100,
      );
    });
  });

  describe("performFullCheck", () => {
    it("should check all achievement categories", async () => {
      mockSessionDBService.getUserSessions.mockResolvedValue([]);
      mockTaskDBService.getTasks.mockResolvedValue([]);
      mockGoalDBService.getGoals.mockResolvedValue([]);
      mockAchievementDBService.getAchievementsByCategory.mockResolvedValue([]);

      await engine.performFullCheck(userId);

      expect(mockSessionDBService.getUserSessions).toHaveBeenCalledWith(userId);
      expect(mockTaskDBService.getTasks).toHaveBeenCalledWith(userId);
      expect(mockGoalDBService.getGoals).toHaveBeenCalledWith(userId);
      // Called at least once - actual count depends on internal implementation
      expect(
        mockAchievementDBService.getAchievementsByCategory,
      ).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty session list", async () => {
      mockSessionDBService.getUserSessions.mockResolvedValue([]);
      mockAchievementDBService.getAchievementsByCategory.mockResolvedValue([]);

      await expect(
        engine.processSessionEvent(userId, "session_end"),
      ).resolves.not.toThrow();
    });

    it("should handle sessions without end time", async () => {
      const activeSessions = [createMockSession("s1", new Date("2025-01-01"))];
      mockSessionDBService.getUserSessions.mockResolvedValue(activeSessions);
      mockAchievementDBService.getAchievementsByCategory.mockResolvedValue([]);

      await expect(
        engine.processSessionEvent(userId, "session_end"),
      ).resolves.not.toThrow();
    });

    it("should handle achievements with no requirements", async () => {
      const achievement = {
        ...createMockAchievement(
          "ach-empty",
          AchievementCategory.SESSION_MILESTONES,
          "session_count",
          10,
        ),
        requirements: [],
      };
      mockSessionDBService.getUserSessions.mockResolvedValue([
        createMockSession("s1", new Date("2025-01-01"), new Date("2025-01-02")),
      ]);
      mockAchievementDBService.getAchievementsByCategory.mockResolvedValue([
        achievement,
      ]);

      await expect(
        engine.processSessionEvent(userId, "session_end"),
      ).resolves.not.toThrow();

      expect(mockAchievementDBService.awardAchievement).not.toHaveBeenCalled();
    });

    it("should handle database errors gracefully", async () => {
      mockSessionDBService.getUserSessions.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(
        engine.processSessionEvent(userId, "session_end"),
      ).resolves.not.toThrow();
    });

    it("should handle boundary case: exactly at target value", async () => {
      const sessions = Array.from({ length: 10 }, (_, i) =>
        createMockSession(
          `s${i}`,
          new Date(`2025-01-${i + 1}`),
          new Date(`2025-01-${i + 2}`),
        ),
      );
      mockSessionDBService.getUserSessions.mockResolvedValue(sessions);

      const achievement = createMockAchievement(
        "ach-milestone-10",
        AchievementCategory.SESSION_MILESTONES,
        "session_count",
        10,
      );
      mockAchievementDBService.getAchievementsByCategory.mockResolvedValue([
        achievement,
      ]);
      mockAchievementDBService.getUserAchievements.mockResolvedValue([]);
      mockAchievementDBService.getAchievementById.mockResolvedValue(
        achievement,
      );

      await engine.processSessionEvent(userId, "session_end");

      expect(mockAchievementDBService.awardAchievement).toHaveBeenCalled();
    });

    it("should handle New Year session special condition", async () => {
      const newYearSession = createMockSession(
        "s1",
        new Date("2025-01-01T00:30:00"),
      );
      const achievement = createMockAchievement(
        "ach-new-year",
        AchievementCategory.SPECIAL_ACHIEVEMENTS,
        "special_condition",
        1,
        "new_year_session",
      );
      mockAchievementDBService.getAchievementsByCategory.mockResolvedValue([
        achievement,
      ]);
      mockAchievementDBService.getAchievementProgress.mockResolvedValue(null);

      await engine.processSessionEvent(userId, "session_start", newYearSession);

      expect(
        mockAchievementDBService.updateAchievementProgress,
      ).toHaveBeenCalledWith(userId, "ach-new-year", 1, 1);
    });
  });
});
