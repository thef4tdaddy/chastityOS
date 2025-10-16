/**
 * Achievement Gallery Tests
 * Tests for achievement visibility, UI correctness, and styling
 * Issue #463
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AchievementGallery } from "./AchievementGallery";
import {
  DBAchievement,
  DBUserAchievement,
  AchievementCategory,
  AchievementDifficulty,
} from "../../types";

// Mock the hook
interface AchievementWithProgress {
  achievement: DBAchievement;
  userAchievement?: DBUserAchievement;
  progress: {
    currentValue: number;
    targetValue: number;
    percentage: number;
    isCompleted: boolean;
  } | null;
  isEarned: boolean;
  isVisible: boolean;
}

vi.mock("../../hooks/useAchievementGallery", () => ({
  useAchievementGallery: vi.fn(
    (achievementsWithProgress: AchievementWithProgress[]) => ({
      selectedCategory: "all",
      selectedDifficulty: "all",
      showOnlyEarned: false,
      searchTerm: "",
      setSelectedCategory: vi.fn(),
      setSelectedDifficulty: vi.fn(),
      setShowOnlyEarned: vi.fn(),
      setSearchTerm: vi.fn(),
      stats: {
        totalEarned: achievementsWithProgress.filter(
          (a: AchievementWithProgress) => a.isEarned,
        ).length,
        totalVisible: achievementsWithProgress.length,
        totalPoints: achievementsWithProgress
          .filter((a: AchievementWithProgress) => a.isEarned)
          .reduce(
            (sum: number, a: AchievementWithProgress) =>
              sum + a.achievement.points,
            0,
          ),
        completionPercentage:
          (achievementsWithProgress.filter(
            (a: AchievementWithProgress) => a.isEarned,
          ).length /
            achievementsWithProgress.length) *
          100,
      },
      filteredAchievements: achievementsWithProgress,
      groupedAchievements: achievementsWithProgress.reduce(
        (
          groups: Record<string, AchievementWithProgress[]>,
          item: AchievementWithProgress,
        ) => {
          const categoryName =
            {
              [AchievementCategory.SESSION_MILESTONES]: "Session Milestones",
              [AchievementCategory.CONSISTENCY_BADGES]: "Consistency Badges",
              [AchievementCategory.STREAK_ACHIEVEMENTS]: "Streak Achievements",
              [AchievementCategory.GOAL_BASED]: "Goal Based",
              [AchievementCategory.TASK_COMPLETION]: "Task Completion",
              [AchievementCategory.SPECIAL_ACHIEVEMENTS]:
                "Special Achievements",
            }[item.achievement.category] || "Other";

          if (!groups[categoryName]) {
            groups[categoryName] = [];
          }
          groups[categoryName].push(item);
          return groups;
        },
        {} as Record<string, AchievementWithProgress[]>,
      ),
    }),
  ),
  getCategoryName: vi.fn((category: AchievementCategory) => {
    const names: Record<AchievementCategory, string> = {
      [AchievementCategory.SESSION_MILESTONES]: "Session Milestones",
      [AchievementCategory.CONSISTENCY_BADGES]: "Consistency Badges",
      [AchievementCategory.STREAK_ACHIEVEMENTS]: "Streak Achievements",
      [AchievementCategory.GOAL_BASED]: "Goal Based",
      [AchievementCategory.TASK_COMPLETION]: "Task Completion",
      [AchievementCategory.SPECIAL_ACHIEVEMENTS]: "Special Achievements",
    };
    return names[category] || category;
  }),
  getDifficultyColor: vi.fn((difficulty: AchievementDifficulty) => {
    const colors: Record<AchievementDifficulty, string> = {
      [AchievementDifficulty.COMMON]: "border-gray-400 bg-gray-800/30",
      [AchievementDifficulty.UNCOMMON]: "border-green-400 bg-green-900/30",
      [AchievementDifficulty.RARE]: "border-blue-400 bg-blue-900/30",
      [AchievementDifficulty.EPIC]: "border-purple-400 bg-purple-900/30",
      [AchievementDifficulty.LEGENDARY]: "border-yellow-400 bg-yellow-900/30",
    };
    return colors[difficulty] || colors[AchievementDifficulty.COMMON];
  }),
}));

describe("AchievementGallery", () => {
  // Mock achievement data
  const createMockAchievement = (
    id: string,
    name: string,
    difficulty: AchievementDifficulty,
    category: AchievementCategory,
    isHidden = false,
  ): DBAchievement => ({
    id,
    name,
    description: `Description for ${name}`,
    category,
    icon: "🏆",
    difficulty,
    points: 100,
    requirements: [
      {
        type: "session_count",
        value: 10,
        unit: "count",
      },
    ],
    isHidden,
    isActive: true,
    syncStatus: "synced",
    lastModified: new Date(),
  });

  const createMockUserAchievement = (
    achievementId: string,
    isVisible = true,
  ): DBUserAchievement => ({
    id: `user-${achievementId}`,
    userId: "test-user",
    achievementId,
    earnedAt: new Date(),
    progress: 100,
    isVisible,
    syncStatus: "synced",
    lastModified: new Date(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Achievement Visibility", () => {
    it("should display all achievements including locked ones", () => {
      const achievements = [
        {
          achievement: createMockAchievement(
            "1",
            "First Session",
            AchievementDifficulty.COMMON,
            AchievementCategory.SESSION_MILESTONES,
          ),
          userAchievement: createMockUserAchievement("1"),
          progress: null,
          isEarned: true,
          isVisible: true,
        },
        {
          achievement: createMockAchievement(
            "2",
            "Locked Achievement",
            AchievementDifficulty.RARE,
            AchievementCategory.SESSION_MILESTONES,
          ),
          userAchievement: undefined,
          progress: {
            currentValue: 5,
            targetValue: 10,
            percentage: 50,
            isCompleted: false,
          },
          isEarned: false,
          isVisible: true,
        },
      ];

      render(<AchievementGallery achievementsWithProgress={achievements} />);

      // Both achievements should be visible
      expect(screen.getByText("First Session")).toBeInTheDocument();
      expect(screen.getByText("Locked Achievement")).toBeInTheDocument();
    });

    it("should display hidden achievements when locked", () => {
      const achievements = [
        {
          achievement: createMockAchievement(
            "hidden-1",
            "Secret Achievement",
            AchievementDifficulty.LEGENDARY,
            AchievementCategory.SPECIAL_ACHIEVEMENTS,
            true, // isHidden
          ),
          userAchievement: undefined,
          progress: null,
          isEarned: false,
          isVisible: true,
        },
      ];

      render(<AchievementGallery achievementsWithProgress={achievements} />);

      // Hidden achievement should be visible
      expect(screen.getByText("Secret Achievement")).toBeInTheDocument();
      // Should show hidden indicator
      expect(screen.getByText("Hidden Achievement")).toBeInTheDocument();
    });

    it("should not show hidden indicator for earned hidden achievements", () => {
      const achievements = [
        {
          achievement: createMockAchievement(
            "hidden-2",
            "Earned Secret",
            AchievementDifficulty.LEGENDARY,
            AchievementCategory.SPECIAL_ACHIEVEMENTS,
            true, // isHidden
          ),
          userAchievement: createMockUserAchievement("hidden-2"),
          progress: null,
          isEarned: true,
          isVisible: true,
        },
      ];

      render(<AchievementGallery achievementsWithProgress={achievements} />);

      // Achievement should be visible
      expect(screen.getByText("Earned Secret")).toBeInTheDocument();
      // Hidden indicator should NOT be shown when earned
      expect(screen.queryByText("Hidden Achievement")).not.toBeInTheDocument();
    });
  });

  describe("Achievement Styling", () => {
    it("should apply reduced opacity to locked achievements", () => {
      const achievements = [
        {
          achievement: createMockAchievement(
            "locked",
            "Locked",
            AchievementDifficulty.COMMON,
            AchievementCategory.SESSION_MILESTONES,
          ),
          userAchievement: undefined,
          progress: null,
          isEarned: false,
          isVisible: true,
        },
      ];

      const { container } = render(
        <AchievementGallery achievementsWithProgress={achievements} />,
      );

      // Find the card by looking for the outer card container
      const card = container.querySelector(
        ".relative.p-4.rounded-lg.border-2.transition-all",
      );
      expect(card).toHaveClass("opacity-75");
    });

    it("should not apply reduced opacity to unlocked achievements", () => {
      const achievements = [
        {
          achievement: createMockAchievement(
            "unlocked",
            "Unlocked",
            AchievementDifficulty.COMMON,
            AchievementCategory.SESSION_MILESTONES,
          ),
          userAchievement: createMockUserAchievement("unlocked"),
          progress: null,
          isEarned: true,
          isVisible: true,
        },
      ];

      const { container } = render(
        <AchievementGallery achievementsWithProgress={achievements} />,
      );

      // Find the card by looking for the outer card container
      const card = container.querySelector(
        ".relative.p-4.rounded-lg.border-2.transition-all",
      );
      expect(card).not.toHaveClass("opacity-75");
    });

    it("should apply correct border colors for unlocked achievements based on difficulty", () => {
      const achievements = [
        {
          achievement: createMockAchievement(
            "legendary",
            "Legendary Achievement",
            AchievementDifficulty.LEGENDARY,
            AchievementCategory.SESSION_MILESTONES,
          ),
          userAchievement: createMockUserAchievement("legendary"),
          progress: null,
          isEarned: true,
          isVisible: true,
        },
      ];

      const { container } = render(
        <AchievementGallery achievementsWithProgress={achievements} />,
      );

      // Find the card by looking for the outer card container
      const card = container.querySelector(
        ".relative.p-4.rounded-lg.border-2.transition-all",
      );
      // Should have yellow border for legendary
      expect(card).toHaveClass("border-yellow-400");
    });

    it("should show trophy icon for earned achievements", () => {
      const achievements = [
        {
          achievement: createMockAchievement(
            "earned",
            "Earned Achievement",
            AchievementDifficulty.COMMON,
            AchievementCategory.SESSION_MILESTONES,
          ),
          userAchievement: createMockUserAchievement("earned"),
          progress: null,
          isEarned: true,
          isVisible: true,
        },
      ];

      const { container } = render(
        <AchievementGallery achievementsWithProgress={achievements} />,
      );

      // Check for trophy icon (FaTrophy component renders as SVG with specific class)
      const trophyIcon = container.querySelector(".text-yellow-600");
      expect(trophyIcon).toBeInTheDocument();
      // Should be an SVG element
      expect(trophyIcon?.tagName).toBe("svg");
    });
  });

  describe("Progress Display", () => {
    it("should show progress bar for locked achievements with progress", () => {
      const achievements = [
        {
          achievement: createMockAchievement(
            "progress",
            "In Progress",
            AchievementDifficulty.COMMON,
            AchievementCategory.SESSION_MILESTONES,
          ),
          userAchievement: undefined,
          progress: {
            currentValue: 7,
            targetValue: 10,
            percentage: 70,
            isCompleted: false,
          },
          isEarned: false,
          isVisible: true,
        },
      ];

      render(<AchievementGallery achievementsWithProgress={achievements} />);

      // Should show progress label
      expect(screen.getByText("Progress")).toBeInTheDocument();
      // Should show progress values
      expect(screen.getByText("7 / 10")).toBeInTheDocument();
    });

    it("should not show progress bar for earned achievements", () => {
      const achievements = [
        {
          achievement: createMockAchievement(
            "complete",
            "Complete",
            AchievementDifficulty.COMMON,
            AchievementCategory.SESSION_MILESTONES,
          ),
          userAchievement: createMockUserAchievement("complete"),
          progress: {
            currentValue: 10,
            targetValue: 10,
            percentage: 100,
            isCompleted: true,
          },
          isEarned: true,
          isVisible: true,
        },
      ];

      render(<AchievementGallery achievementsWithProgress={achievements} />);

      // Progress bar should not be shown for earned achievements
      expect(screen.queryByText("Progress")).not.toBeInTheDocument();
    });

    it("should show correct progress percentage", () => {
      const achievements = [
        {
          achievement: createMockAchievement(
            "halfway",
            "Halfway There",
            AchievementDifficulty.COMMON,
            AchievementCategory.SESSION_MILESTONES,
          ),
          userAchievement: undefined,
          progress: {
            currentValue: 50,
            targetValue: 100,
            percentage: 50,
            isCompleted: false,
          },
          isEarned: false,
          isVisible: true,
        },
      ];

      const { container } = render(
        <AchievementGallery achievementsWithProgress={achievements} />,
      );

      // Find the progress bar div
      const progressBars = container.querySelectorAll(
        ".bg-gradient-to-r.from-nightly-aquamarine",
      );
      const progressBar = Array.from(progressBars).find(
        (el) => (el as HTMLElement).style.width === "50%",
      );
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe("Achievement Stats", () => {
    it("should display correct total earned count", () => {
      const achievements = [
        {
          achievement: createMockAchievement(
            "1",
            "First",
            AchievementDifficulty.COMMON,
            AchievementCategory.SESSION_MILESTONES,
          ),
          userAchievement: createMockUserAchievement("1"),
          progress: null,
          isEarned: true,
          isVisible: true,
        },
        {
          achievement: createMockAchievement(
            "2",
            "Second",
            AchievementDifficulty.COMMON,
            AchievementCategory.SESSION_MILESTONES,
          ),
          userAchievement: undefined,
          progress: null,
          isEarned: false,
          isVisible: true,
        },
        {
          achievement: createMockAchievement(
            "3",
            "Third",
            AchievementDifficulty.COMMON,
            AchievementCategory.SESSION_MILESTONES,
          ),
          userAchievement: createMockUserAchievement("3"),
          progress: null,
          isEarned: true,
          isVisible: true,
        },
      ];

      render(<AchievementGallery achievementsWithProgress={achievements} />);

      // Should show 2 / 3 Earned
      expect(screen.getByText("2 / 3 Earned")).toBeInTheDocument();
    });

    it("should display correct total points", () => {
      const achievements = [
        {
          achievement: {
            ...createMockAchievement(
              "1",
              "100 Points",
              AchievementDifficulty.COMMON,
              AchievementCategory.SESSION_MILESTONES,
            ),
            points: 100,
          },
          userAchievement: createMockUserAchievement("1"),
          progress: null,
          isEarned: true,
          isVisible: true,
        },
        {
          achievement: {
            ...createMockAchievement(
              "2",
              "200 Points",
              AchievementDifficulty.RARE,
              AchievementCategory.SESSION_MILESTONES,
            ),
            points: 200,
          },
          userAchievement: createMockUserAchievement("2"),
          progress: null,
          isEarned: true,
          isVisible: true,
        },
      ];

      render(<AchievementGallery achievementsWithProgress={achievements} />);

      // Should show 300 total points
      expect(screen.getByText("300 Points")).toBeInTheDocument();
    });

    it("should display correct completion percentage", () => {
      const achievements = [
        {
          achievement: createMockAchievement(
            "1",
            "One",
            AchievementDifficulty.COMMON,
            AchievementCategory.SESSION_MILESTONES,
          ),
          userAchievement: createMockUserAchievement("1"),
          progress: null,
          isEarned: true,
          isVisible: true,
        },
        {
          achievement: createMockAchievement(
            "2",
            "Two",
            AchievementDifficulty.COMMON,
            AchievementCategory.SESSION_MILESTONES,
          ),
          userAchievement: undefined,
          progress: null,
          isEarned: false,
          isVisible: true,
        },
      ];

      render(<AchievementGallery achievementsWithProgress={achievements} />);

      // 1/2 = 50%
      expect(screen.getByText("50.0% Complete")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no achievements match filters", () => {
      const achievements: Array<{
        achievement: DBAchievement;
        userAchievement?: DBUserAchievement;
        progress: {
          currentValue: number;
          targetValue: number;
          percentage: number;
          isCompleted: boolean;
        } | null;
        isEarned: boolean;
        isVisible: boolean;
      }> = [];

      render(<AchievementGallery achievementsWithProgress={achievements} />);

      expect(
        screen.getByText("No achievements found matching your filters."),
      ).toBeInTheDocument();
    });
  });

  describe("Visibility Toggle", () => {
    it("should show visibility toggle for own earned achievements", () => {
      const onToggleVisibility = vi.fn();

      const achievements = [
        {
          achievement: createMockAchievement(
            "toggle-test",
            "Toggle Test",
            AchievementDifficulty.COMMON,
            AchievementCategory.SESSION_MILESTONES,
          ),
          userAchievement: createMockUserAchievement("toggle-test", true),
          progress: null,
          isEarned: true,
          isVisible: true,
        },
      ];

      const { container } = render(
        <AchievementGallery
          achievementsWithProgress={achievements}
          onToggleVisibility={onToggleVisibility}
          isOwnGallery={true}
        />,
      );

      // Should show eye icon (visibility toggle)
      const eyeButton = container.querySelector(
        'button[class*="absolute top-2 right-2"]',
      );
      expect(eyeButton).toBeInTheDocument();
    });

    it("should not show visibility toggle for locked achievements", () => {
      const onToggleVisibility = vi.fn();

      const achievements = [
        {
          achievement: createMockAchievement(
            "locked",
            "Locked",
            AchievementDifficulty.COMMON,
            AchievementCategory.SESSION_MILESTONES,
          ),
          userAchievement: undefined,
          progress: null,
          isEarned: false,
          isVisible: true,
        },
      ];

      const { container } = render(
        <AchievementGallery
          achievementsWithProgress={achievements}
          onToggleVisibility={onToggleVisibility}
          isOwnGallery={true}
        />,
      );

      // Should not show visibility toggle for locked achievements
      const eyeButton = container.querySelector(
        'button[class*="absolute top-2 right-2"]',
      );
      expect(eyeButton).not.toBeInTheDocument();
    });

    it("should not show visibility toggle when viewing others' galleries", () => {
      const onToggleVisibility = vi.fn();

      const achievements = [
        {
          achievement: createMockAchievement(
            "other-user",
            "Other User Achievement",
            AchievementDifficulty.COMMON,
            AchievementCategory.SESSION_MILESTONES,
          ),
          userAchievement: createMockUserAchievement("other-user"),
          progress: null,
          isEarned: true,
          isVisible: true,
        },
      ];

      const { container } = render(
        <AchievementGallery
          achievementsWithProgress={achievements}
          onToggleVisibility={onToggleVisibility}
          isOwnGallery={false}
        />,
      );

      // Should not show visibility toggle when not own gallery
      const eyeButton = container.querySelector(
        'button[class*="absolute top-2 right-2"]',
      );
      expect(eyeButton).not.toBeInTheDocument();
    });
  });
});
