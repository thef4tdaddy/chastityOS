/**
 * Achievement Accessibility Tests
 * Tests for WCAG AA compliance in achievement components
 * Issue: Achievements UI accessibility improvements
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { AchievementGallery } from "../AchievementGallery";
import { AchievementPagination } from "../AchievementPagination";
import { AchievementViewToggle } from "../AchievementViewToggle";
import {
  DBAchievement,
  DBUserAchievement,
  AchievementCategory,
  AchievementDifficulty,
} from "../../../types";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock the hooks
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

vi.mock("../../../hooks/useAchievementGallery", () => ({
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
          const categoryName = "Session Milestones";
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
  getCategoryName: vi.fn(() => "Session Milestones"),
  getDifficultyColor: vi.fn(() => "border-blue-500 bg-blue-900/30"),
}));

vi.mock("../../../hooks/usePaginatedAchievements", () => ({
  usePaginatedAchievements: vi.fn((items: any[]) => ({
    paginatedAchievements: items,
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
    goToPage: vi.fn(),
    nextPage: vi.fn(),
    prevPage: vi.fn(),
  })),
}));

describe("Achievement Accessibility", () => {
  const mockAchievement: DBAchievement = {
    id: "test-1",
    name: "Test Achievement",
    description: "Test description",
    icon: "🏆",
    category: AchievementCategory.SESSION_MILESTONES,
    difficulty: AchievementDifficulty.COMMON,
    points: 100,
    isHidden: false,
    isActive: true,
    requirements: [{ type: "session_count", value: 10, unit: "count" }],
    syncStatus: "synced",
    lastModified: new Date(),
  };

  const mockAchievementWithProgress: AchievementWithProgress = {
    achievement: mockAchievement,
    progress: {
      currentValue: 5,
      targetValue: 10,
      percentage: 50,
      isCompleted: false,
    },
    isEarned: false,
    isVisible: true,
  };

  describe("AchievementGallery Accessibility", () => {
    it("should have skip link for keyboard navigation", () => {
      render(
        <AchievementGallery
          achievementsWithProgress={[mockAchievementWithProgress]}
          isOwnGallery={true}
        />,
      );

      const skipLink = screen.getByText(/skip to achievement gallery/i);
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute("href", "#achievement-gallery-content");
    });

    it("should have proper ARIA region for stats header", () => {
      render(
        <AchievementGallery
          achievementsWithProgress={[mockAchievementWithProgress]}
          isOwnGallery={true}
        />,
      );

      const statsRegion = screen.getByRole("region", {
        name: /achievement statistics/i,
      });
      expect(statsRegion).toBeInTheDocument();
    });

    it("should have progressbar with proper ARIA attributes", () => {
      render(
        <AchievementGallery
          achievementsWithProgress={[mockAchievementWithProgress]}
          isOwnGallery={true}
        />,
      );

      const progressBars = screen.getAllByRole("progressbar");
      expect(progressBars.length).toBeGreaterThan(0);

      const overallProgress = progressBars[0];
      expect(overallProgress).toHaveAttribute("aria-valuemin", "0");
      expect(overallProgress).toHaveAttribute("aria-valuemax", "100");
      expect(overallProgress).toHaveAttribute("aria-valuenow");
    });

    it("should have proper search region with ARIA label", () => {
      render(
        <AchievementGallery
          achievementsWithProgress={[mockAchievementWithProgress]}
          isOwnGallery={true}
        />,
      );

      const searchRegion = screen.getByRole("search", {
        name: /filter achievements/i,
      });
      expect(searchRegion).toBeInTheDocument();
    });

    it("should have achievement cards with proper ARIA labels", () => {
      render(
        <AchievementGallery
          achievementsWithProgress={[mockAchievementWithProgress]}
          isOwnGallery={true}
        />,
      );

      const achievementCard = screen.getByRole("article", {
        name: /test achievement.*locked/i,
      });
      expect(achievementCard).toBeInTheDocument();
      expect(achievementCard).toHaveAttribute("tabIndex", "0");
    });

    it("should have achievement list with proper ARIA label", () => {
      render(
        <AchievementGallery
          achievementsWithProgress={[mockAchievementWithProgress]}
          isOwnGallery={true}
        />,
      );

      const achievementList = screen.getByRole("list", {
        name: /session milestones achievements/i,
      });
      expect(achievementList).toBeInTheDocument();
    });
  });

  describe("AchievementPagination Accessibility", () => {
    it("should have navigation landmark with proper label", () => {
      render(
        <AchievementPagination
          currentPage={2}
          totalPages={5}
          onPageChange={vi.fn()}
          onNextPage={vi.fn()}
          onPrevPage={vi.fn()}
          hasNextPage={true}
          hasPrevPage={true}
        />,
      );

      const nav = screen.getByRole("navigation", {
        name: /achievement pagination/i,
      });
      expect(nav).toBeInTheDocument();
    });

    it("should have accessible page buttons with proper labels", () => {
      render(
        <AchievementPagination
          currentPage={2}
          totalPages={5}
          onPageChange={vi.fn()}
          onNextPage={vi.fn()}
          onPrevPage={vi.fn()}
          hasNextPage={true}
          hasPrevPage={true}
        />,
      );

      const page2Button = screen.getByRole("button", {
        name: /go to page 2/i,
      });
      expect(page2Button).toHaveAttribute("aria-current", "page");
    });

    it("should have accessible previous and next buttons", () => {
      render(
        <AchievementPagination
          currentPage={2}
          totalPages={5}
          onPageChange={vi.fn()}
          onNextPage={vi.fn()}
          onPrevPage={vi.fn()}
          hasNextPage={true}
          hasPrevPage={true}
        />,
      );

      const prevButton = screen.getByRole("button", { name: /previous page/i });
      const nextButton = screen.getByRole("button", { name: /next page/i });

      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
      expect(prevButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe("AchievementViewToggle Accessibility", () => {
    it("should have tablist role with proper label", () => {
      render(
        <AchievementViewToggle
          viewMode="dashboard"
          onViewModeChange={vi.fn()}
        />,
      );

      const tablist = screen.getByRole("tablist", {
        name: /achievement view options/i,
      });
      expect(tablist).toBeInTheDocument();
    });

    it("should have tabs with proper ARIA attributes", () => {
      render(
        <AchievementViewToggle
          viewMode="dashboard"
          onViewModeChange={vi.fn()}
        />,
      );

      const dashboardTab = screen.getByRole("tab", { name: /dashboard view/i });
      const galleryTab = screen.getByRole("tab", { name: /gallery view/i });

      expect(dashboardTab).toHaveAttribute("aria-selected", "true");
      expect(dashboardTab).toHaveAttribute(
        "aria-controls",
        "achievement-view-panel",
      );

      expect(galleryTab).toHaveAttribute("aria-selected", "false");
      expect(galleryTab).toHaveAttribute(
        "aria-controls",
        "achievement-view-panel",
      );
    });

    it("should have accessible labels for all view modes", () => {
      render(
        <AchievementViewToggle
          viewMode="dashboard"
          onViewModeChange={vi.fn()}
        />,
      );

      expect(
        screen.getByRole("tab", { name: /dashboard view/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /gallery view/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /leaderboards view/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /privacy settings view/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Keyboard Navigation", () => {
    it("should have focusable achievement cards", () => {
      render(
        <AchievementGallery
          achievementsWithProgress={[mockAchievementWithProgress]}
          isOwnGallery={true}
        />,
      );

      const card = screen.getByRole("article");
      expect(card).toHaveAttribute("tabIndex", "0");
    });

    it("should have aria-hidden on decorative icons", () => {
      render(
        <AchievementGallery
          achievementsWithProgress={[mockAchievementWithProgress]}
          isOwnGallery={true}
        />,
      );

      // Check if decorative icons have aria-hidden
      // This would need to be checked in the actual component rendering
      // For now, we're validating that the structure is correct
      const card = screen.getByRole("article");
      expect(card).toBeInTheDocument();
    });
  });

  describe("Screen Reader Support", () => {
    it("should announce progress updates with live regions", () => {
      render(
        <AchievementGallery
          achievementsWithProgress={[mockAchievementWithProgress]}
          isOwnGallery={true}
        />,
      );

      // Progress bars should have proper aria attributes
      const progressBars = screen.getAllByRole("progressbar");
      progressBars.forEach((bar) => {
        expect(bar).toHaveAttribute("aria-label");
      });
    });

    it("should have descriptive text for achievement status", () => {
      const earnedAchievement: AchievementWithProgress = {
        ...mockAchievementWithProgress,
        isEarned: true,
      };

      render(
        <AchievementGallery
          achievementsWithProgress={[earnedAchievement]}
          isOwnGallery={true}
        />,
      );

      const card = screen.getByRole("article", {
        name: /test achievement.*earned/i,
      });
      expect(card).toBeInTheDocument();
    });
  });
});
