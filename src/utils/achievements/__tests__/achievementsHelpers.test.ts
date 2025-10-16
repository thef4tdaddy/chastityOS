/**
 * Achievement Helpers Unit Tests
 * Tests for achievement helper functions
 */

import { describe, it, expect } from "vitest";
import {
  findAchievementById,
  checkHasAchievement,
  findProgressForAchievement,
  filterAchievementsByCategory,
  filterUserAchievementsByCategory,
  calculateProgressPercentage,
  mapAchievementsWithProgress,
  getRecentAchievements,
} from "../achievementsHelpers";
import {
  DBAchievement,
  DBUserAchievement,
  DBAchievementProgress,
  AchievementCategory,
  AchievementDifficulty,
} from "../../../types";

// Test data factory functions
const createMockAchievement = (
  id: string,
  category: AchievementCategory = AchievementCategory.SESSION_MILESTONES,
): DBAchievement => ({
  id,
  name: `Achievement ${id}`,
  description: `Description for achievement ${id}`,
  category,
  icon: "🏆",
  difficulty: AchievementDifficulty.COMMON,
  points: 100,
  requirements: [
    {
      type: "session_count",
      value: 10,
      unit: "count",
    },
  ],
  isHidden: false,
  isActive: true,
  syncStatus: "synced",
  lastModified: new Date("2025-01-01"),
});

const createMockUserAchievement = (
  id: string,
  achievementId: string,
  earnedAt: Date = new Date("2025-01-15"),
): DBUserAchievement => ({
  id,
  userId: "user-123",
  achievementId,
  earnedAt,
  progress: 100,
  isVisible: true,
  syncStatus: "synced",
  lastModified: new Date("2025-01-15"),
});

const createMockProgress = (
  id: string,
  achievementId: string,
  currentValue: number,
  targetValue: number,
): DBAchievementProgress => ({
  id,
  userId: "user-123",
  achievementId,
  currentValue,
  targetValue,
  isCompleted: currentValue >= targetValue,
  syncStatus: "synced",
  lastModified: new Date("2025-01-15"),
});

describe("achievementsHelpers", () => {
  describe("findAchievementById", () => {
    it("should find achievement by id", () => {
      const achievements = [
        createMockAchievement("ach-1"),
        createMockAchievement("ach-2"),
        createMockAchievement("ach-3"),
      ];

      const result = findAchievementById(achievements, "ach-2");

      expect(result).toBeDefined();
      expect(result?.id).toBe("ach-2");
      expect(result?.name).toBe("Achievement ach-2");
    });

    it("should return undefined for non-existent id", () => {
      const achievements = [
        createMockAchievement("ach-1"),
        createMockAchievement("ach-2"),
      ];

      const result = findAchievementById(achievements, "non-existent");

      expect(result).toBeUndefined();
    });

    it("should handle empty array", () => {
      const result = findAchievementById([], "ach-1");

      expect(result).toBeUndefined();
    });
  });

  describe("checkHasAchievement", () => {
    it("should return true when user has achievement", () => {
      const userAchievements = [
        createMockUserAchievement("ua-1", "ach-1"),
        createMockUserAchievement("ua-2", "ach-2"),
      ];

      const result = checkHasAchievement(userAchievements, "ach-2");

      expect(result).toBe(true);
    });

    it("should return false when user does not have achievement", () => {
      const userAchievements = [
        createMockUserAchievement("ua-1", "ach-1"),
        createMockUserAchievement("ua-2", "ach-2"),
      ];

      const result = checkHasAchievement(userAchievements, "ach-3");

      expect(result).toBe(false);
    });

    it("should handle empty array", () => {
      const result = checkHasAchievement([], "ach-1");

      expect(result).toBe(false);
    });
  });

  describe("findProgressForAchievement", () => {
    it("should find progress for achievement", () => {
      const progress = [
        createMockProgress("p-1", "ach-1", 5, 10),
        createMockProgress("p-2", "ach-2", 7, 10),
      ];

      const result = findProgressForAchievement(progress, "ach-2");

      expect(result).toBeDefined();
      expect(result?.achievementId).toBe("ach-2");
      expect(result?.currentValue).toBe(7);
      expect(result?.targetValue).toBe(10);
    });

    it("should return undefined for non-existent achievement", () => {
      const progress = [createMockProgress("p-1", "ach-1", 5, 10)];

      const result = findProgressForAchievement(progress, "ach-2");

      expect(result).toBeUndefined();
    });

    it("should handle empty array", () => {
      const result = findProgressForAchievement([], "ach-1");

      expect(result).toBeUndefined();
    });
  });

  describe("filterAchievementsByCategory", () => {
    it("should filter achievements by category", () => {
      const achievements = [
        createMockAchievement("ach-1", AchievementCategory.SESSION_MILESTONES),
        createMockAchievement("ach-2", AchievementCategory.TASK_COMPLETION),
        createMockAchievement("ach-3", AchievementCategory.SESSION_MILESTONES),
        createMockAchievement("ach-4", AchievementCategory.STREAK_ACHIEVEMENTS),
      ];

      const result = filterAchievementsByCategory(
        achievements,
        AchievementCategory.SESSION_MILESTONES,
      );

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe("ach-1");
      expect(result[1]?.id).toBe("ach-3");
      expect(
        result.every(
          (a) => a.category === AchievementCategory.SESSION_MILESTONES,
        ),
      ).toBe(true);
    });

    it("should return empty array when no achievements match category", () => {
      const achievements = [
        createMockAchievement("ach-1", AchievementCategory.SESSION_MILESTONES),
        createMockAchievement("ach-2", AchievementCategory.TASK_COMPLETION),
      ];

      const result = filterAchievementsByCategory(
        achievements,
        AchievementCategory.GOAL_BASED,
      );

      expect(result).toHaveLength(0);
    });

    it("should handle empty array", () => {
      const result = filterAchievementsByCategory(
        [],
        AchievementCategory.SESSION_MILESTONES,
      );

      expect(result).toHaveLength(0);
    });
  });

  describe("filterUserAchievementsByCategory", () => {
    it("should filter user achievements by category", () => {
      const allAchievements = [
        createMockAchievement("ach-1", AchievementCategory.SESSION_MILESTONES),
        createMockAchievement("ach-2", AchievementCategory.TASK_COMPLETION),
        createMockAchievement("ach-3", AchievementCategory.SESSION_MILESTONES),
      ];
      const userAchievements = [
        createMockUserAchievement("ua-1", "ach-1"),
        createMockUserAchievement("ua-2", "ach-2"),
        createMockUserAchievement("ua-3", "ach-3"),
      ];

      const result = filterUserAchievementsByCategory(
        allAchievements,
        userAchievements,
        AchievementCategory.SESSION_MILESTONES,
      );

      expect(result).toHaveLength(2);
      expect(result[0]?.achievementId).toBe("ach-1");
      expect(result[1]?.achievementId).toBe("ach-3");
    });

    it("should return empty array when no user achievements match category", () => {
      const allAchievements = [
        createMockAchievement("ach-1", AchievementCategory.SESSION_MILESTONES),
        createMockAchievement("ach-2", AchievementCategory.TASK_COMPLETION),
      ];
      const userAchievements = [createMockUserAchievement("ua-1", "ach-1")];

      const result = filterUserAchievementsByCategory(
        allAchievements,
        userAchievements,
        AchievementCategory.STREAK_ACHIEVEMENTS,
      );

      expect(result).toHaveLength(0);
    });

    it("should handle empty arrays", () => {
      const result = filterUserAchievementsByCategory(
        [],
        [],
        AchievementCategory.SESSION_MILESTONES,
      );

      expect(result).toHaveLength(0);
    });
  });

  describe("calculateProgressPercentage", () => {
    it("should calculate progress percentage correctly", () => {
      expect(calculateProgressPercentage(5, 10)).toBe(50);
      expect(calculateProgressPercentage(7, 10)).toBe(70);
      expect(calculateProgressPercentage(1, 4)).toBe(25);
    });

    it("should return 100 when progress exceeds target", () => {
      expect(calculateProgressPercentage(15, 10)).toBe(100);
      expect(calculateProgressPercentage(100, 50)).toBe(100);
    });

    it("should return 0 when current value is 0", () => {
      expect(calculateProgressPercentage(0, 10)).toBe(0);
    });

    it("should return 100 when both values are equal", () => {
      expect(calculateProgressPercentage(10, 10)).toBe(100);
    });

    it("should handle decimal values correctly", () => {
      expect(calculateProgressPercentage(3.5, 10)).toBe(35);
      expect(calculateProgressPercentage(2.5, 5)).toBe(50);
    });

    it("should cap at 100%", () => {
      expect(calculateProgressPercentage(200, 100)).toBe(100);
    });
  });

  describe("mapAchievementsWithProgress", () => {
    it("should map achievements with progress information", () => {
      const achievements = [
        createMockAchievement("ach-1"),
        createMockAchievement("ach-2"),
        createMockAchievement("ach-3"),
      ];
      const userAchievements = [
        createMockUserAchievement("ua-1", "ach-1"),
        createMockUserAchievement("ua-3", "ach-3"),
      ];
      const progress = [
        createMockProgress("p-1", "ach-1", 10, 10),
        createMockProgress("p-2", "ach-2", 5, 10),
      ];

      const result = mapAchievementsWithProgress(
        achievements,
        userAchievements,
        progress,
      );

      expect(result).toHaveLength(3);

      // Check ach-1 (earned with progress)
      expect(result[0]?.achievement.id).toBe("ach-1");
      expect(result[0]?.isEarned).toBe(true);
      expect(result[0]?.userAchievement).toBeDefined();
      expect(result[0]?.progress).toBeDefined();
      expect(result[0]?.progress?.percentage).toBe(100);
      expect(result[0]?.progress?.isCompleted).toBe(true);

      // Check ach-2 (not earned, with progress)
      expect(result[1]?.achievement.id).toBe("ach-2");
      expect(result[1]?.isEarned).toBe(false);
      expect(result[1]?.userAchievement).toBeUndefined();
      expect(result[1]?.progress).toBeDefined();
      expect(result[1]?.progress?.percentage).toBe(50);
      expect(result[1]?.progress?.isCompleted).toBe(false);

      // Check ach-3 (earned, no progress record)
      expect(result[2]?.achievement.id).toBe("ach-3");
      expect(result[2]?.isEarned).toBe(true);
      expect(result[2]?.userAchievement).toBeDefined();
      expect(result[2]?.progress).toBeNull();
    });

    it("should set isVisible from userAchievement", () => {
      const achievements = [createMockAchievement("ach-1")];
      const userAchievement = createMockUserAchievement("ua-1", "ach-1");
      userAchievement.isVisible = false;
      const userAchievements = [userAchievement];

      const result = mapAchievementsWithProgress(
        achievements,
        userAchievements,
        [],
      );

      expect(result[0]?.isVisible).toBe(false);
    });

    it("should default isVisible to true when no userAchievement", () => {
      const achievements = [createMockAchievement("ach-1")];

      const result = mapAchievementsWithProgress(achievements, [], []);

      expect(result[0]?.isVisible).toBe(true);
    });

    it("should handle empty arrays", () => {
      const result = mapAchievementsWithProgress([], [], []);

      expect(result).toHaveLength(0);
    });
  });

  describe("getRecentAchievements", () => {
    it("should return achievements sorted by earned date (most recent first)", () => {
      const achievements = [
        createMockUserAchievement("ua-1", "ach-1", new Date("2025-01-01")),
        createMockUserAchievement("ua-2", "ach-2", new Date("2025-01-15")),
        createMockUserAchievement("ua-3", "ach-3", new Date("2025-01-10")),
        createMockUserAchievement("ua-4", "ach-4", new Date("2025-01-20")),
      ];

      const result = getRecentAchievements(achievements, 5);

      expect(result).toHaveLength(4);
      expect(result[0]?.id).toBe("ua-4"); // Jan 20 - most recent
      expect(result[1]?.id).toBe("ua-2"); // Jan 15
      expect(result[2]?.id).toBe("ua-3"); // Jan 10
      expect(result[3]?.id).toBe("ua-1"); // Jan 1 - oldest
    });

    it("should limit results to specified count", () => {
      const achievements = [
        createMockUserAchievement("ua-1", "ach-1", new Date("2025-01-01")),
        createMockUserAchievement("ua-2", "ach-2", new Date("2025-01-15")),
        createMockUserAchievement("ua-3", "ach-3", new Date("2025-01-10")),
        createMockUserAchievement("ua-4", "ach-4", new Date("2025-01-20")),
      ];

      const result = getRecentAchievements(achievements, 2);

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe("ua-4"); // Most recent
      expect(result[1]?.id).toBe("ua-2"); // Second most recent
    });

    it("should default to 5 achievements when count not specified", () => {
      const achievements = Array.from({ length: 10 }, (_, i) =>
        createMockUserAchievement(
          `ua-${i}`,
          `ach-${i}`,
          new Date(`2025-01-${i + 1}`),
        ),
      );

      const result = getRecentAchievements(achievements);

      expect(result).toHaveLength(5);
    });

    it("should return all achievements if less than requested count", () => {
      const achievements = [
        createMockUserAchievement("ua-1", "ach-1", new Date("2025-01-01")),
        createMockUserAchievement("ua-2", "ach-2", new Date("2025-01-02")),
      ];

      const result = getRecentAchievements(achievements, 5);

      expect(result).toHaveLength(2);
    });

    it("should handle empty array", () => {
      const result = getRecentAchievements([], 5);

      expect(result).toHaveLength(0);
    });
  });
});
