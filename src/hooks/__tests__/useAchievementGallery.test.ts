/**
 * Achievement Gallery Hook Tests
 * Tests for the useAchievementGallery hook filtering logic
 */

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAchievementGallery } from "../useAchievementGallery";
import {
  AchievementCategory,
  AchievementDifficulty,
} from "../../types/achievements";
import { DBAchievement, DBUserAchievement } from "../../types";

// Mock achievement data
const createMockAchievement = (
  id: string,
  name: string,
  isHidden: boolean = false,
  category: AchievementCategory = AchievementCategory.SESSION_MILESTONES,
  difficulty: AchievementDifficulty = AchievementDifficulty.COMMON,
): DBAchievement => ({
  id,
  name,
  description: `Description for ${name}`,
  category,
  icon: "🏆",
  difficulty,
  points: 100,
  requirements: [],
  isHidden,
  isActive: true,
  syncStatus: "synced",
  lastModified: new Date(),
});

const createAchievementWithProgress = (
  achievement: DBAchievement,
  isEarned: boolean = false,
  userAchievement?: DBUserAchievement,
) => ({
  achievement,
  userAchievement,
  progress: null,
  isEarned,
  isVisible: true,
});

describe("useAchievementGallery", () => {
  describe("achievement filtering", () => {
    it("should display all achievements including hidden ones that are not earned", () => {
      const achievements = [
        createAchievementWithProgress(
          createMockAchievement("1", "Public Achievement", false),
          false,
        ),
        createAchievementWithProgress(
          createMockAchievement("2", "Hidden Achievement", true),
          false,
        ),
        createAchievementWithProgress(
          createMockAchievement("3", "Earned Hidden Achievement", true),
          true,
        ),
      ];

      const { result } = renderHook(() => useAchievementGallery(achievements));

      // All achievements should be displayed, including locked/hidden ones
      expect(result.current.filteredAchievements).toHaveLength(3);
    });

    it("should calculate stats correctly with all achievements", () => {
      const achievements = [
        createAchievementWithProgress(
          createMockAchievement("1", "Achievement 1", false),
          true,
        ),
        createAchievementWithProgress(
          createMockAchievement("2", "Achievement 2", false),
          false,
        ),
        createAchievementWithProgress(
          createMockAchievement("3", "Hidden Achievement", true),
          false,
        ),
      ];

      const { result } = renderHook(() => useAchievementGallery(achievements));

      // Total visible should include all achievements
      expect(result.current.stats.totalVisible).toBe(3);
      // Only 1 is earned
      expect(result.current.stats.totalEarned).toBe(1);
      // Completion percentage should be 1/3 = 33.33%
      expect(result.current.stats.completionPercentage).toBeCloseTo(33.33, 1);
    });

    it("should filter by earned status when showOnlyEarned is true", () => {
      const achievements = [
        createAchievementWithProgress(
          createMockAchievement("1", "Earned Achievement", false),
          true,
        ),
        createAchievementWithProgress(
          createMockAchievement("2", "Locked Achievement", false),
          false,
        ),
      ];

      const { result } = renderHook(() => useAchievementGallery(achievements));

      // Initially show all
      expect(result.current.filteredAchievements).toHaveLength(2);

      // Set filter to show only earned
      act(() => {
        result.current.setShowOnlyEarned(true);
      });

      // Should only show earned achievement
      expect(result.current.filteredAchievements).toHaveLength(1);
      expect(result.current.filteredAchievements[0].isEarned).toBe(true);
    });

    it("should filter by category", () => {
      const achievements = [
        createAchievementWithProgress(
          createMockAchievement(
            "1",
            "Session Achievement",
            false,
            AchievementCategory.SESSION_MILESTONES,
          ),
          false,
        ),
        createAchievementWithProgress(
          createMockAchievement(
            "2",
            "Task Achievement",
            false,
            AchievementCategory.TASK_COMPLETION,
          ),
          false,
        ),
      ];

      const { result } = renderHook(() => useAchievementGallery(achievements));

      // Set filter to show only session milestones
      act(() => {
        result.current.setSelectedCategory(
          AchievementCategory.SESSION_MILESTONES,
        );
      });

      // Should only show session milestone achievement
      expect(result.current.filteredAchievements).toHaveLength(1);
      expect(result.current.filteredAchievements[0].achievement.category).toBe(
        AchievementCategory.SESSION_MILESTONES,
      );
    });

    it("should filter by difficulty", () => {
      const achievements = [
        createAchievementWithProgress(
          createMockAchievement(
            "1",
            "Common Achievement",
            false,
            AchievementCategory.SESSION_MILESTONES,
            AchievementDifficulty.COMMON,
          ),
          false,
        ),
        createAchievementWithProgress(
          createMockAchievement(
            "2",
            "Rare Achievement",
            false,
            AchievementCategory.SESSION_MILESTONES,
            AchievementDifficulty.RARE,
          ),
          false,
        ),
      ];

      const { result } = renderHook(() => useAchievementGallery(achievements));

      // Set filter to show only rare achievements
      act(() => {
        result.current.setSelectedDifficulty(AchievementDifficulty.RARE);
      });

      // Should only show rare achievement
      expect(result.current.filteredAchievements).toHaveLength(1);
      expect(
        result.current.filteredAchievements[0].achievement.difficulty,
      ).toBe(AchievementDifficulty.RARE);
    });

    it("should filter by search term", () => {
      const achievements = [
        createAchievementWithProgress(
          createMockAchievement("1", "First Session", false),
          false,
        ),
        createAchievementWithProgress(
          createMockAchievement("2", "Week Warrior", false),
          false,
        ),
      ];

      const { result } = renderHook(() => useAchievementGallery(achievements));

      // Search for "session"
      act(() => {
        result.current.setSearchTerm("session");
      });

      // Should only show achievement with "session" in name
      expect(result.current.filteredAchievements).toHaveLength(1);
      expect(result.current.filteredAchievements[0].achievement.name).toBe(
        "First Session",
      );
    });
  });

  describe("grouping achievements", () => {
    it("should group achievements by category", () => {
      const achievements = [
        createAchievementWithProgress(
          createMockAchievement(
            "1",
            "Session 1",
            false,
            AchievementCategory.SESSION_MILESTONES,
          ),
          false,
        ),
        createAchievementWithProgress(
          createMockAchievement(
            "2",
            "Session 2",
            false,
            AchievementCategory.SESSION_MILESTONES,
          ),
          false,
        ),
        createAchievementWithProgress(
          createMockAchievement(
            "3",
            "Task 1",
            false,
            AchievementCategory.TASK_COMPLETION,
          ),
          false,
        ),
      ];

      const { result } = renderHook(() => useAchievementGallery(achievements));

      // Should have 2 groups
      const groups = result.current.groupedAchievements;
      expect(Object.keys(groups)).toHaveLength(2);

      // Session Milestones group should have 2 achievements
      expect(groups["Session Milestones"]).toHaveLength(2);

      // Tasks group should have 1 achievement
      expect(groups["Tasks"]).toHaveLength(1);
    });
  });
});
