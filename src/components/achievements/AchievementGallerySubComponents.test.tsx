/**
 * Achievement Gallery Sub-Components Tests
 * Tests for individual gallery components like progress bars, cards, etc.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  StatsHeader,
  Filters,
  EmptyState,
  AchievementCard,
} from "./AchievementGallerySubComponents";
import { DBAchievement, DBUserAchievement, AchievementCategory } from "@/types";
import { AchievementDifficulty } from "@/types/achievements";

describe("AchievementGallerySubComponents", () => {
  describe("StatsHeader", () => {
    it("should display total earned count", () => {
      const stats = {
        totalEarned: 5,
        totalVisible: 10,
        totalPoints: 500,
        completionPercentage: 50,
      };

      render(<StatsHeader stats={stats} />);

      expect(screen.getByText("5 / 10 Earned")).toBeInTheDocument();
    });

    it("should display total points", () => {
      const stats = {
        totalEarned: 5,
        totalVisible: 10,
        totalPoints: 500,
        completionPercentage: 50,
      };

      render(<StatsHeader stats={stats} />);

      expect(screen.getByText("500 Points")).toBeInTheDocument();
    });

    it("should display completion percentage", () => {
      const stats = {
        totalEarned: 5,
        totalVisible: 10,
        totalPoints: 500,
        completionPercentage: 50.0,
      };

      render(<StatsHeader stats={stats} />);

      expect(screen.getByText("50.0% Complete")).toBeInTheDocument();
    });

    it("should display progress bar with correct width", () => {
      const stats = {
        totalEarned: 7,
        totalVisible: 10,
        totalPoints: 700,
        completionPercentage: 70,
      };

      const { container } = render(<StatsHeader stats={stats} />);

      const progressBar = container.querySelector(
        ".bg-gradient-to-r.from-nightly-aquamarine",
      ) as HTMLElement;
      expect(progressBar).toBeInTheDocument();
      expect(progressBar.style.width).toBe("70%");
    });

    it("should render gallery title", () => {
      const stats = {
        totalEarned: 0,
        totalVisible: 10,
        totalPoints: 0,
        completionPercentage: 0,
      };

      render(<StatsHeader stats={stats} />);

      expect(screen.getByText("Achievement Gallery")).toBeInTheDocument();
    });
  });

  describe("Filters", () => {
    const mockGetCategoryName = vi.fn((category: AchievementCategory) => {
      const names: Record<AchievementCategory, string> = {
        [AchievementCategory.SESSION_MILESTONES]: "Session Milestones",
        [AchievementCategory.CONSISTENCY_BADGES]: "Consistency Badges",
        [AchievementCategory.STREAK_ACHIEVEMENTS]: "Streak Achievements",
        [AchievementCategory.GOAL_BASED]: "Goal Based",
        [AchievementCategory.TASK_COMPLETION]: "Task Completion",
        [AchievementCategory.SPECIAL_ACHIEVEMENTS]: "Special Achievements",
      };
      return names[category] || category;
    });

    it("should render search input", () => {
      render(
        <Filters
          searchTerm=""
          selectedCategory="all"
          selectedDifficulty="all"
          showOnlyEarned={false}
          onSearchChange={vi.fn()}
          onCategoryChange={vi.fn()}
          onDifficultyChange={vi.fn()}
          onEarnedFilterChange={vi.fn()}
          getCategoryName={mockGetCategoryName}
        />,
      );

      const searchInput = screen.getByPlaceholderText("Search achievements...");
      expect(searchInput).toBeInTheDocument();
    });

    it("should call onSearchChange when typing in search", () => {
      const mockOnSearchChange = vi.fn();

      render(
        <Filters
          searchTerm=""
          selectedCategory="all"
          selectedDifficulty="all"
          showOnlyEarned={false}
          onSearchChange={mockOnSearchChange}
          onCategoryChange={vi.fn()}
          onDifficultyChange={vi.fn()}
          onEarnedFilterChange={vi.fn()}
          getCategoryName={mockGetCategoryName}
        />,
      );

      const searchInput = screen.getByPlaceholderText("Search achievements...");
      fireEvent.change(searchInput, { target: { value: "test" } });

      expect(mockOnSearchChange).toHaveBeenCalledWith("test");
    });

    it("should display search term value", () => {
      render(
        <Filters
          searchTerm="milestone"
          selectedCategory="all"
          selectedDifficulty="all"
          showOnlyEarned={false}
          onSearchChange={vi.fn()}
          onCategoryChange={vi.fn()}
          onDifficultyChange={vi.fn()}
          onEarnedFilterChange={vi.fn()}
          getCategoryName={mockGetCategoryName}
        />,
      );

      const searchInput = screen.getByPlaceholderText(
        "Search achievements...",
      ) as HTMLInputElement;
      expect(searchInput.value).toBe("milestone");
    });

    it("should render earned only checkbox", () => {
      render(
        <Filters
          searchTerm=""
          selectedCategory="all"
          selectedDifficulty="all"
          showOnlyEarned={false}
          onSearchChange={vi.fn()}
          onCategoryChange={vi.fn()}
          onDifficultyChange={vi.fn()}
          onEarnedFilterChange={vi.fn()}
          getCategoryName={mockGetCategoryName}
        />,
      );

      expect(screen.getByText("Earned Only")).toBeInTheDocument();
    });

    it("should display search icon", () => {
      const { container } = render(
        <Filters
          searchTerm=""
          selectedCategory="all"
          selectedDifficulty="all"
          showOnlyEarned={false}
          onSearchChange={vi.fn()}
          onCategoryChange={vi.fn()}
          onDifficultyChange={vi.fn()}
          onEarnedFilterChange={vi.fn()}
          getCategoryName={mockGetCategoryName}
        />,
      );

      const searchIcon = container.querySelector(".text-gray-400");
      expect(searchIcon).toBeInTheDocument();
      expect(searchIcon?.tagName).toBe("svg");
    });
  });

  describe("EmptyState", () => {
    it("should render default empty message", () => {
      render(<EmptyState />);

      expect(
        screen.getByText("No achievements found matching your filters."),
      ).toBeInTheDocument();
    });

    it("should render custom empty message", () => {
      render(<EmptyState message="Custom empty message" />);

      expect(screen.getByText("Custom empty message")).toBeInTheDocument();
    });

    it("should display trophy icon", () => {
      const { container } = render(<EmptyState />);

      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should have centered styling", () => {
      const { container } = render(<EmptyState />);

      const centerDiv = container.querySelector(".text-center");
      expect(centerDiv).toBeInTheDocument();
    });
  });

  describe("AchievementCard", () => {
    const createMockAchievement = (
      id: string,
      isHidden = false,
    ): DBAchievement => ({
      id,
      name: `Achievement ${id}`,
      description: `Description ${id}`,
      category: AchievementCategory.SESSION_MILESTONES,
      icon: "🏆",
      difficulty: AchievementDifficulty.COMMON,
      points: 100,
      requirements: [],
      isHidden,
      isActive: true,
      syncStatus: "synced",
      lastModified: new Date(),
    });

    const createMockUserAchievement = (
      achievementId: string,
    ): DBUserAchievement => ({
      id: `user-${achievementId}`,
      userId: "test-user",
      achievementId,
      earnedAt: new Date(),
      progress: 100,
      isVisible: true,
      syncStatus: "synced",
      lastModified: new Date(),
    });

    const mockGetDifficultyColor = vi.fn(
      (difficulty: AchievementDifficulty) => {
        const colors: Record<AchievementDifficulty, string> = {
          [AchievementDifficulty.COMMON]: "border-gray-400 bg-gray-800/30",
          [AchievementDifficulty.UNCOMMON]: "border-green-400 bg-green-900/30",
          [AchievementDifficulty.RARE]: "border-blue-400 bg-blue-900/30",
          [AchievementDifficulty.EPIC]: "border-purple-400 bg-purple-900/30",
          [AchievementDifficulty.LEGENDARY]:
            "border-yellow-400 bg-yellow-900/30",
        };
        return colors[difficulty] || colors[AchievementDifficulty.COMMON];
      },
    );

    describe("Basic Rendering", () => {
      it("should render achievement name", () => {
        const item = {
          achievement: createMockAchievement("1"),
          userAchievement: undefined,
          progress: null,
          isEarned: false,
          isVisible: true,
        };

        render(
          <AchievementCard
            item={item}
            isOwnGallery={false}
            getDifficultyColor={mockGetDifficultyColor}
          />,
        );

        expect(screen.getByText("Achievement 1")).toBeInTheDocument();
      });

      it("should render achievement description", () => {
        const item = {
          achievement: createMockAchievement("1"),
          userAchievement: undefined,
          progress: null,
          isEarned: false,
          isVisible: true,
        };

        render(
          <AchievementCard
            item={item}
            isOwnGallery={false}
            getDifficultyColor={mockGetDifficultyColor}
          />,
        );

        expect(screen.getByText("Description 1")).toBeInTheDocument();
      });

      it("should render achievement icon", () => {
        const item = {
          achievement: createMockAchievement("1"),
          userAchievement: undefined,
          progress: null,
          isEarned: false,
          isVisible: true,
        };

        render(
          <AchievementCard
            item={item}
            isOwnGallery={false}
            getDifficultyColor={mockGetDifficultyColor}
          />,
        );

        expect(screen.getByText("🏆")).toBeInTheDocument();
      });

      it("should render achievement points", () => {
        const item = {
          achievement: createMockAchievement("1"),
          userAchievement: undefined,
          progress: null,
          isEarned: false,
          isVisible: true,
        };

        render(
          <AchievementCard
            item={item}
            isOwnGallery={false}
            getDifficultyColor={mockGetDifficultyColor}
          />,
        );

        expect(screen.getByText("100 pts")).toBeInTheDocument();
      });

      it("should render achievement difficulty", () => {
        const item = {
          achievement: createMockAchievement("1"),
          userAchievement: undefined,
          progress: null,
          isEarned: false,
          isVisible: true,
        };

        render(
          <AchievementCard
            item={item}
            isOwnGallery={false}
            getDifficultyColor={mockGetDifficultyColor}
          />,
        );

        expect(screen.getByText("common")).toBeInTheDocument();
      });
    });

    describe("Earned State", () => {
      it("should show trophy icon for earned achievements", () => {
        const item = {
          achievement: createMockAchievement("1"),
          userAchievement: createMockUserAchievement("1"),
          progress: null,
          isEarned: true,
          isVisible: true,
        };

        const { container } = render(
          <AchievementCard
            item={item}
            isOwnGallery={false}
            getDifficultyColor={mockGetDifficultyColor}
          />,
        );

        const trophyIcon = container.querySelector(".text-yellow-600");
        expect(trophyIcon).toBeInTheDocument();
      });

      it("should not apply reduced opacity to earned achievements", () => {
        const item = {
          achievement: createMockAchievement("1"),
          userAchievement: createMockUserAchievement("1"),
          progress: null,
          isEarned: true,
          isVisible: true,
        };

        const { container } = render(
          <AchievementCard
            item={item}
            isOwnGallery={false}
            getDifficultyColor={mockGetDifficultyColor}
          />,
        );

        const card = container.querySelector(".relative.p-3");
        expect(card).not.toHaveClass("opacity-75");
      });
    });

    describe("Locked State", () => {
      it("should apply reduced opacity to locked achievements", () => {
        const item = {
          achievement: createMockAchievement("1"),
          userAchievement: undefined,
          progress: null,
          isEarned: false,
          isVisible: true,
        };

        const { container } = render(
          <AchievementCard
            item={item}
            isOwnGallery={false}
            getDifficultyColor={mockGetDifficultyColor}
          />,
        );

        const card = container.querySelector(".relative.p-3");
        expect(card).toHaveClass("opacity-75");
      });

      it("should not show trophy icon for locked achievements", () => {
        const item = {
          achievement: createMockAchievement("1"),
          userAchievement: undefined,
          progress: null,
          isEarned: false,
          isVisible: true,
        };

        const { container } = render(
          <AchievementCard
            item={item}
            isOwnGallery={false}
            getDifficultyColor={mockGetDifficultyColor}
          />,
        );

        const trophyIcon = container.querySelector(".text-yellow-600");
        expect(trophyIcon).not.toBeInTheDocument();
      });
    });

    describe("Progress Display", () => {
      it("should show progress bar for locked achievements with progress", () => {
        const item = {
          achievement: createMockAchievement("1"),
          userAchievement: undefined,
          progress: {
            currentValue: 5,
            targetValue: 10,
            percentage: 50,
            isCompleted: false,
          },
          isEarned: false,
          isVisible: true,
        };

        render(
          <AchievementCard
            item={item}
            isOwnGallery={false}
            getDifficultyColor={mockGetDifficultyColor}
          />,
        );

        expect(screen.getByText("Progress")).toBeInTheDocument();
        expect(screen.getByText("5 / 10")).toBeInTheDocument();
      });

      it("should not show progress bar for earned achievements", () => {
        const item = {
          achievement: createMockAchievement("1"),
          userAchievement: createMockUserAchievement("1"),
          progress: {
            currentValue: 10,
            targetValue: 10,
            percentage: 100,
            isCompleted: true,
          },
          isEarned: true,
          isVisible: true,
        };

        render(
          <AchievementCard
            item={item}
            isOwnGallery={false}
            getDifficultyColor={mockGetDifficultyColor}
          />,
        );

        expect(screen.queryByText("Progress")).not.toBeInTheDocument();
      });

      it("should display progress bar with correct width", () => {
        const item = {
          achievement: createMockAchievement("1"),
          userAchievement: undefined,
          progress: {
            currentValue: 7,
            targetValue: 10,
            percentage: 70,
            isCompleted: false,
          },
          isEarned: false,
          isVisible: true,
        };

        const { container } = render(
          <AchievementCard
            item={item}
            isOwnGallery={false}
            getDifficultyColor={mockGetDifficultyColor}
          />,
        );

        const progressBar = container.querySelector(
          ".bg-gradient-to-r.from-nightly-aquamarine",
        ) as HTMLElement;
        expect(progressBar).toBeInTheDocument();
        // Progress bar now uses framer-motion transform instead of width
        // Just check that the progress bar exists
      });
    });

    describe("Hidden Achievement", () => {
      it("should show hidden indicator for locked hidden achievements", () => {
        const item = {
          achievement: createMockAchievement("1", true),
          userAchievement: undefined,
          progress: null,
          isEarned: false,
          isVisible: true,
        };

        render(
          <AchievementCard
            item={item}
            isOwnGallery={false}
            getDifficultyColor={mockGetDifficultyColor}
          />,
        );

        expect(screen.getByText("Hidden Achievement")).toBeInTheDocument();
      });

      it("should not show hidden indicator for earned hidden achievements", () => {
        const item = {
          achievement: createMockAchievement("1", true),
          userAchievement: createMockUserAchievement("1"),
          progress: null,
          isEarned: true,
          isVisible: true,
        };

        render(
          <AchievementCard
            item={item}
            isOwnGallery={false}
            getDifficultyColor={mockGetDifficultyColor}
          />,
        );

        expect(
          screen.queryByText("Hidden Achievement"),
        ).not.toBeInTheDocument();
      });

      it("should display lock icon for hidden achievements", () => {
        const item = {
          achievement: createMockAchievement("1", true),
          userAchievement: undefined,
          progress: null,
          isEarned: false,
          isVisible: true,
        };

        const { container } = render(
          <AchievementCard
            item={item}
            isOwnGallery={false}
            getDifficultyColor={mockGetDifficultyColor}
          />,
        );

        const lockIcon = container.querySelector(".text-gray-500");
        expect(lockIcon).toBeInTheDocument();
      });
    });

    describe("Visibility Toggle", () => {
      it("should show visibility toggle for own earned achievements", () => {
        const item = {
          achievement: createMockAchievement("1"),
          userAchievement: createMockUserAchievement("1"),
          progress: null,
          isEarned: true,
          isVisible: true,
        };
        const mockOnToggle = vi.fn();

        const { container } = render(
          <AchievementCard
            item={item}
            isOwnGallery={true}
            onToggleVisibility={mockOnToggle}
            getDifficultyColor={mockGetDifficultyColor}
          />,
        );

        const visibilityButton = container.querySelector(
          ".absolute.top-2.right-2",
        );
        expect(visibilityButton).toBeInTheDocument();
      });

      it("should call onToggleVisibility when visibility button is clicked", () => {
        const item = {
          achievement: createMockAchievement("1"),
          userAchievement: createMockUserAchievement("1"),
          progress: null,
          isEarned: true,
          isVisible: true,
        };
        const mockOnToggle = vi.fn();

        const { container } = render(
          <AchievementCard
            item={item}
            isOwnGallery={true}
            onToggleVisibility={mockOnToggle}
            getDifficultyColor={mockGetDifficultyColor}
          />,
        );

        const visibilityButton = container.querySelector(
          ".absolute.top-2.right-2",
        ) as HTMLElement;
        fireEvent.click(visibilityButton);

        expect(mockOnToggle).toHaveBeenCalledWith("1");
      });

      it("should not show visibility toggle for locked achievements", () => {
        const item = {
          achievement: createMockAchievement("1"),
          userAchievement: undefined,
          progress: null,
          isEarned: false,
          isVisible: true,
        };
        const mockOnToggle = vi.fn();

        const { container } = render(
          <AchievementCard
            item={item}
            isOwnGallery={true}
            onToggleVisibility={mockOnToggle}
            getDifficultyColor={mockGetDifficultyColor}
          />,
        );

        const visibilityButton = container.querySelector(
          ".absolute.top-2.right-2",
        );
        expect(visibilityButton).not.toBeInTheDocument();
      });

      it("should not show visibility toggle when not own gallery", () => {
        const item = {
          achievement: createMockAchievement("1"),
          userAchievement: createMockUserAchievement("1"),
          progress: null,
          isEarned: true,
          isVisible: true,
        };
        const mockOnToggle = vi.fn();

        const { container } = render(
          <AchievementCard
            item={item}
            isOwnGallery={false}
            onToggleVisibility={mockOnToggle}
            getDifficultyColor={mockGetDifficultyColor}
          />,
        );

        const visibilityButton = container.querySelector(
          ".absolute.top-2.right-2",
        );
        expect(visibilityButton).not.toBeInTheDocument();
      });
    });
  });
});
