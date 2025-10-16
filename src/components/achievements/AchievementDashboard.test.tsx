/**
 * Achievement Dashboard Component Tests
 * Tests for achievement overview and statistics display
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AchievementDashboard } from "./AchievementDashboard";
import {
  DBAchievement,
  DBUserAchievement,
  DBAchievementNotification,
  AchievementCategory,
} from "@/types";
import { AchievementDifficulty } from "@/types/achievements";

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

// Mock the useAuthState context
const mockUser = { uid: "test-user-id" };
vi.mock("../../contexts", () => ({
  useAuthState: () => ({
    user: mockUser,
  }),
}));

// Mock the useAchievements hook
const mockUseAchievements = vi.fn();
vi.mock("../../hooks/useAchievements", () => ({
  useAchievements: () => mockUseAchievements(),
}));

describe("AchievementDashboard", () => {
  const createMockAchievement = (
    id: string,
    category: AchievementCategory,
    points = 100,
  ): DBAchievement => ({
    id,
    name: `Achievement ${id}`,
    description: `Description ${id}`,
    category,
    icon: "🏆",
    difficulty: AchievementDifficulty.COMMON,
    points,
    requirements: [],
    isHidden: false,
    isActive: true,
    syncStatus: "synced",
    lastModified: new Date(),
  });

  const createMockUserAchievement = (
    achievementId: string,
    earnedAt = new Date(),
  ): DBUserAchievement => ({
    id: `user-${achievementId}`,
    userId: "test-user",
    achievementId,
    earnedAt,
    progress: 100,
    isVisible: true,
    syncStatus: "synced",
    lastModified: new Date(),
  });

  const createMockNotification = (
    id: string,
    achievementId: string,
  ): DBAchievementNotification => ({
    id,
    userId: "test-user",
    achievementId,
    type: "earned",
    title: "Achievement Earned",
    message: "You have earned a new achievement!",
    isRead: false,
    createdAt: new Date(),
    syncStatus: "synced",
    lastModified: new Date(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should render loading state when data is loading", () => {
      mockUseAchievements.mockReturnValue({
        isLoading: true,
        achievementStats: null,
        userAchievements: [],
        unreadNotifications: [],
        allAchievements: [],
        getAchievementsByCategory: vi.fn(() => []),
      });

      const { container } = render(<AchievementDashboard />);

      const loadingElement = container.querySelector(".animate-pulse");
      expect(loadingElement).toBeInTheDocument();
    });
  });

  describe("Stats Cards", () => {
    it("should render stats cards with correct data", () => {
      const achievements = [
        createMockAchievement("1", AchievementCategory.SESSION_MILESTONES, 100),
        createMockAchievement(
          "2",
          AchievementCategory.STREAK_ACHIEVEMENTS,
          200,
        ),
      ];
      const userAchievements = [createMockUserAchievement("1")];

      mockUseAchievements.mockReturnValue({
        isLoading: false,
        achievementStats: {
          totalEarned: 1,
          totalPoints: 100,
          completionPercentage: 50,
          categoryCounts: {
            [AchievementCategory.SESSION_MILESTONES]: 1,
          },
        },
        userAchievements,
        unreadNotifications: [],
        allAchievements: achievements,
        getAchievementsByCategory: vi.fn((category) =>
          achievements.filter((a) => a.category === category),
        ),
      });

      render(<AchievementDashboard />);

      expect(screen.getByText("Total Earned")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("Total Points")).toBeInTheDocument();
      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.getByText("Completion")).toBeInTheDocument();
      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("should display new unlocks count", () => {
      const notification = createMockNotification("n1", "1");

      mockUseAchievements.mockReturnValue({
        isLoading: false,
        achievementStats: {
          totalEarned: 2,
          totalPoints: 200,
          completionPercentage: 75,
          categoryCounts: {},
        },
        userAchievements: [],
        unreadNotifications: [notification],
        allAchievements: [],
        getAchievementsByCategory: vi.fn(() => []),
      });

      const { container } = render(<AchievementDashboard />);

      expect(screen.getByText("New Unlocks")).toBeInTheDocument();

      // Find the New Unlocks card specifically
      const newUnlocksCard = Array.from(
        container.querySelectorAll(".text-sm.text-nightly-celadon"),
      ).find((el) => el.textContent === "New Unlocks");

      const newUnlocksValue = newUnlocksCard?.nextElementSibling;
      expect(newUnlocksValue?.textContent).toBe("1");
    });
  });

  describe("Recent Achievements", () => {
    it("should display recent achievements", () => {
      const achievement = createMockAchievement(
        "1",
        AchievementCategory.SESSION_MILESTONES,
      );
      const userAchievement = createMockUserAchievement("1");

      mockUseAchievements.mockReturnValue({
        isLoading: false,
        achievementStats: {
          totalEarned: 1,
          totalPoints: 100,
          completionPercentage: 100,
          categoryCounts: {},
        },
        userAchievements: [userAchievement],
        unreadNotifications: [],
        allAchievements: [achievement],
        getAchievementsByCategory: vi.fn(() => []),
      });

      render(<AchievementDashboard />);

      expect(screen.getByText("Recent Achievements")).toBeInTheDocument();
      expect(screen.getByText("Achievement 1")).toBeInTheDocument();
      expect(screen.getByText("Description 1")).toBeInTheDocument();
      expect(screen.getByText("+100 points")).toBeInTheDocument();
    });

    it("should display most recent achievements first", () => {
      const oldDate = new Date("2024-01-01");
      const newDate = new Date("2024-12-01");

      const achievements = [
        createMockAchievement("1", AchievementCategory.SESSION_MILESTONES),
        createMockAchievement("2", AchievementCategory.STREAK_ACHIEVEMENTS),
      ];
      const userAchievements = [
        createMockUserAchievement("1", oldDate),
        createMockUserAchievement("2", newDate),
      ];

      mockUseAchievements.mockReturnValue({
        isLoading: false,
        achievementStats: {
          totalEarned: 2,
          totalPoints: 200,
          completionPercentage: 100,
          categoryCounts: {},
        },
        userAchievements,
        unreadNotifications: [],
        allAchievements: achievements,
        getAchievementsByCategory: vi.fn(() => []),
      });

      const { container } = render(<AchievementDashboard />);

      // Get all achievement names
      const achievementElements = Array.from(
        container.querySelectorAll(".font-semibold.text-nightly-honeydew"),
      );
      const achievementNames = achievementElements.map((el) => el.textContent);

      // Achievement 2 (newer) should appear before Achievement 1 (older)
      const index1 = achievementNames.indexOf("Achievement 2");
      const index2 = achievementNames.indexOf("Achievement 1");

      expect(index1).toBeLessThan(index2);
    });

    it("should limit recent achievements to 3", () => {
      const achievements = [
        createMockAchievement("1", AchievementCategory.SESSION_MILESTONES),
        createMockAchievement("2", AchievementCategory.STREAK_ACHIEVEMENTS),
        createMockAchievement("3", AchievementCategory.GOAL_BASED),
        createMockAchievement("4", AchievementCategory.TASK_COMPLETION),
      ];
      const userAchievements = achievements.map((a) =>
        createMockUserAchievement(a.id),
      );

      mockUseAchievements.mockReturnValue({
        isLoading: false,
        achievementStats: {
          totalEarned: 4,
          totalPoints: 400,
          completionPercentage: 100,
          categoryCounts: {},
        },
        userAchievements,
        unreadNotifications: [],
        allAchievements: achievements,
        getAchievementsByCategory: vi.fn(() => []),
      });

      const { container } = render(<AchievementDashboard />);

      // Count achievement cards in recent section
      const achievementCards = container.querySelectorAll(
        ".bg-white\\/5.rounded-lg",
      );
      expect(achievementCards.length).toBeLessThanOrEqual(3);
    });

    it("should not render recent achievements section when empty", () => {
      mockUseAchievements.mockReturnValue({
        isLoading: false,
        achievementStats: {
          totalEarned: 0,
          totalPoints: 0,
          completionPercentage: 0,
          categoryCounts: {},
        },
        userAchievements: [],
        unreadNotifications: [],
        allAchievements: [],
        getAchievementsByCategory: vi.fn(() => []),
      });

      render(<AchievementDashboard />);

      expect(screen.queryByText("Recent Achievements")).not.toBeInTheDocument();
    });
  });

  describe("Category Progress", () => {
    it("should display category progress", () => {
      const achievements = [
        createMockAchievement("1", AchievementCategory.SESSION_MILESTONES),
        createMockAchievement("2", AchievementCategory.SESSION_MILESTONES),
        createMockAchievement("3", AchievementCategory.STREAK_ACHIEVEMENTS),
      ];
      const userAchievements = [createMockUserAchievement("1")];

      mockUseAchievements.mockReturnValue({
        isLoading: false,
        achievementStats: {
          totalEarned: 1,
          totalPoints: 100,
          completionPercentage: 33,
          categoryCounts: {
            [AchievementCategory.SESSION_MILESTONES]: 1,
          },
        },
        userAchievements,
        unreadNotifications: [],
        allAchievements: achievements,
        getAchievementsByCategory: vi.fn((category) =>
          achievements.filter((a) => a.category === category),
        ),
      });

      render(<AchievementDashboard />);

      expect(screen.getByText("Progress by Category")).toBeInTheDocument();
      expect(screen.getByText("Session Milestones")).toBeInTheDocument();
    });

    it("should display progress bars for each category", () => {
      const achievements = [
        createMockAchievement("1", AchievementCategory.SESSION_MILESTONES),
        createMockAchievement("2", AchievementCategory.STREAK_ACHIEVEMENTS),
      ];

      mockUseAchievements.mockReturnValue({
        isLoading: false,
        achievementStats: {
          totalEarned: 1,
          totalPoints: 100,
          completionPercentage: 50,
          categoryCounts: {
            [AchievementCategory.SESSION_MILESTONES]: 1,
          },
        },
        userAchievements: [createMockUserAchievement("1")],
        unreadNotifications: [],
        allAchievements: achievements,
        getAchievementsByCategory: vi.fn((category) =>
          achievements.filter((a) => a.category === category),
        ),
      });

      const { container } = render(<AchievementDashboard />);

      // Check for progress bars (gradient background)
      const progressBars = container.querySelectorAll(
        ".bg-gradient-to-r.from-nightly-aquamarine.to-nightly-lavender-floral",
      );
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it("should display category icons", () => {
      const achievements = [
        createMockAchievement("1", AchievementCategory.SESSION_MILESTONES),
      ];

      mockUseAchievements.mockReturnValue({
        isLoading: false,
        achievementStats: {
          totalEarned: 1,
          totalPoints: 100,
          completionPercentage: 100,
          categoryCounts: {
            [AchievementCategory.SESSION_MILESTONES]: 1,
          },
        },
        userAchievements: [createMockUserAchievement("1")],
        unreadNotifications: [],
        allAchievements: achievements,
        getAchievementsByCategory: vi.fn(() => achievements),
      });

      const { container } = render(<AchievementDashboard />);

      // Check for icons (SVG elements)
      const icons = container.querySelectorAll("svg");
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe("Navigation", () => {
    it("should render link to view all achievements", () => {
      mockUseAchievements.mockReturnValue({
        isLoading: false,
        achievementStats: {
          totalEarned: 0,
          totalPoints: 0,
          completionPercentage: 0,
          categoryCounts: {},
        },
        userAchievements: [],
        unreadNotifications: [],
        allAchievements: [],
        getAchievementsByCategory: vi.fn(() => []),
      });

      render(<AchievementDashboard />);

      const link = screen.getByText("View All Achievements");
      expect(link).toBeInTheDocument();
      expect(link.closest("a")).toHaveAttribute("href", "/achievements");
    });
  });

  describe("Stats Card Icons", () => {
    it("should display trophy icon for total earned", () => {
      mockUseAchievements.mockReturnValue({
        isLoading: false,
        achievementStats: {
          totalEarned: 5,
          totalPoints: 500,
          completionPercentage: 50,
          categoryCounts: {},
        },
        userAchievements: [],
        unreadNotifications: [],
        allAchievements: [],
        getAchievementsByCategory: vi.fn(() => []),
      });

      const { container } = render(<AchievementDashboard />);

      const trophyIcon = container.querySelector(".text-nightly-aquamarine");
      expect(trophyIcon).toBeInTheDocument();
    });

    it("should display star icon for total points", () => {
      mockUseAchievements.mockReturnValue({
        isLoading: false,
        achievementStats: {
          totalEarned: 5,
          totalPoints: 500,
          completionPercentage: 50,
          categoryCounts: {},
        },
        userAchievements: [],
        unreadNotifications: [],
        allAchievements: [],
        getAchievementsByCategory: vi.fn(() => []),
      });

      const { container } = render(<AchievementDashboard />);

      const starIcon = container.querySelector(".text-nightly-lavender-floral");
      expect(starIcon).toBeInTheDocument();
    });
  });
});
