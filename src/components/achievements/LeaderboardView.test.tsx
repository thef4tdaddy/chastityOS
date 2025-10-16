/**
 * Leaderboard View Component Tests
 * Tests for achievement leaderboard display and interactions
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LeaderboardView } from "./LeaderboardView";
import { LeaderboardCategory, LeaderboardPeriod } from "@/types";

// Mock the useAuthState context
const mockUser = { uid: "test-user-id" };
vi.mock("../../contexts", () => ({
  useAuthState: () => ({
    user: mockUser,
  }),
}));

// Mock the useLeaderboardActions hook
const mockUseLeaderboardActions = vi.fn();
vi.mock("../../hooks/achievements/useLeaderboardActions", () => ({
  useLeaderboardActions: () => mockUseLeaderboardActions(),
}));

describe("LeaderboardView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Opt-In Prompt", () => {
    it("should show opt-in prompt when user is not opted in", () => {
      mockUseLeaderboardActions.mockReturnValue({
        leaderboardData: [],
        userRank: null,
        isLoading: false,
        error: null,
        selectedCategory: LeaderboardCategory.TOTAL_POINTS,
        selectedPeriod: LeaderboardPeriod.ALL_TIME,
        isOptedIn: false,
        handleOptIn: vi.fn(),
        handleOptOut: vi.fn(),
        handleSkipOptIn: vi.fn(),
        handleCategoryChange: vi.fn(),
        handlePeriodChange: vi.fn(),
      });

      render(<LeaderboardView showOptInPrompt={true} />);

      expect(screen.getByText("Join the Leaderboards!")).toBeInTheDocument();
      expect(
        screen.getByText(/Compete with other users and see how your/i),
      ).toBeInTheDocument();
    });

    it("should display privacy features in opt-in prompt", () => {
      mockUseLeaderboardActions.mockReturnValue({
        leaderboardData: [],
        userRank: null,
        isLoading: false,
        error: null,
        selectedCategory: LeaderboardCategory.TOTAL_POINTS,
        selectedPeriod: LeaderboardPeriod.ALL_TIME,
        isOptedIn: false,
        handleOptIn: vi.fn(),
        handleOptOut: vi.fn(),
        handleSkipOptIn: vi.fn(),
        handleCategoryChange: vi.fn(),
        handlePeriodChange: vi.fn(),
      });

      render(<LeaderboardView showOptInPrompt={true} />);

      expect(screen.getByText("🔒 Privacy Features:")).toBeInTheDocument();
      expect(
        screen.getByText(/Use anonymous display names/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/Opt out anytime/i)).toBeInTheDocument();
    });

    it("should call handleOptIn when Join button is clicked", () => {
      const mockHandleOptIn = vi.fn();
      mockUseLeaderboardActions.mockReturnValue({
        leaderboardData: [],
        userRank: null,
        isLoading: false,
        error: null,
        selectedCategory: LeaderboardCategory.TOTAL_POINTS,
        selectedPeriod: LeaderboardPeriod.ALL_TIME,
        isOptedIn: false,
        handleOptIn: mockHandleOptIn,
        handleOptOut: vi.fn(),
        handleSkipOptIn: vi.fn(),
        handleCategoryChange: vi.fn(),
        handlePeriodChange: vi.fn(),
      });

      render(<LeaderboardView showOptInPrompt={true} />);

      const joinButton = screen.getByText("Join Leaderboards");
      fireEvent.click(joinButton);

      expect(mockHandleOptIn).toHaveBeenCalledTimes(1);
    });

    it("should call handleSkipOptIn when Maybe Later is clicked", () => {
      const mockHandleSkipOptIn = vi.fn();
      mockUseLeaderboardActions.mockReturnValue({
        leaderboardData: [],
        userRank: null,
        isLoading: false,
        error: null,
        selectedCategory: LeaderboardCategory.TOTAL_POINTS,
        selectedPeriod: LeaderboardPeriod.ALL_TIME,
        isOptedIn: false,
        handleOptIn: vi.fn(),
        handleOptOut: vi.fn(),
        handleSkipOptIn: mockHandleSkipOptIn,
        handleCategoryChange: vi.fn(),
        handlePeriodChange: vi.fn(),
      });

      render(<LeaderboardView showOptInPrompt={true} />);

      const skipButton = screen.getByText("Maybe Later");
      fireEvent.click(skipButton);

      expect(mockHandleSkipOptIn).toHaveBeenCalledTimes(1);
    });

    it("should not show opt-in prompt when showOptInPrompt is false", () => {
      mockUseLeaderboardActions.mockReturnValue({
        leaderboardData: [],
        userRank: null,
        isLoading: false,
        error: null,
        selectedCategory: LeaderboardCategory.TOTAL_POINTS,
        selectedPeriod: LeaderboardPeriod.ALL_TIME,
        isOptedIn: false,
        handleOptIn: vi.fn(),
        handleOptOut: vi.fn(),
        handleSkipOptIn: vi.fn(),
        handleCategoryChange: vi.fn(),
        handlePeriodChange: vi.fn(),
      });

      render(<LeaderboardView showOptInPrompt={false} />);

      expect(
        screen.queryByText("Join the Leaderboards!"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should render loading state when data is loading", () => {
      mockUseLeaderboardActions.mockReturnValue({
        leaderboardData: [],
        userRank: null,
        isLoading: true,
        error: null,
        selectedCategory: LeaderboardCategory.TOTAL_POINTS,
        selectedPeriod: LeaderboardPeriod.ALL_TIME,
        isOptedIn: true,
        handleOptIn: vi.fn(),
        handleOptOut: vi.fn(),
        handleSkipOptIn: vi.fn(),
        handleCategoryChange: vi.fn(),
        handlePeriodChange: vi.fn(),
      });

      const { container } = render(<LeaderboardView />);

      const loadingElement = container.querySelector(".animate-pulse");
      expect(loadingElement).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should render error state when there is an error", () => {
      mockUseLeaderboardActions.mockReturnValue({
        leaderboardData: [],
        userRank: null,
        isLoading: false,
        error: new Error("Failed to load"),
        selectedCategory: LeaderboardCategory.TOTAL_POINTS,
        selectedPeriod: LeaderboardPeriod.ALL_TIME,
        isOptedIn: true,
        handleOptIn: vi.fn(),
        handleOptOut: vi.fn(),
        handleSkipOptIn: vi.fn(),
        handleCategoryChange: vi.fn(),
        handlePeriodChange: vi.fn(),
      });

      render(<LeaderboardView />);

      expect(screen.getByText("Leaderboard Error")).toBeInTheDocument();
      expect(
        screen.getByText(/Unable to load leaderboard data/i),
      ).toBeInTheDocument();
    });
  });

  describe("Leaderboard Header", () => {
    it("should display leaderboards title", () => {
      mockUseLeaderboardActions.mockReturnValue({
        leaderboardData: [],
        userRank: null,
        isLoading: false,
        error: null,
        selectedCategory: LeaderboardCategory.TOTAL_POINTS,
        selectedPeriod: LeaderboardPeriod.ALL_TIME,
        isOptedIn: true,
        handleOptIn: vi.fn(),
        handleOptOut: vi.fn(),
        handleSkipOptIn: vi.fn(),
        handleCategoryChange: vi.fn(),
        handlePeriodChange: vi.fn(),
      });

      render(<LeaderboardView />);

      expect(screen.getByText("Leaderboards")).toBeInTheDocument();
    });

    it("should show Opt Out button when user is opted in", () => {
      mockUseLeaderboardActions.mockReturnValue({
        leaderboardData: [],
        userRank: null,
        isLoading: false,
        error: null,
        selectedCategory: LeaderboardCategory.TOTAL_POINTS,
        selectedPeriod: LeaderboardPeriod.ALL_TIME,
        isOptedIn: true,
        handleOptIn: vi.fn(),
        handleOptOut: vi.fn(),
        handleSkipOptIn: vi.fn(),
        handleCategoryChange: vi.fn(),
        handlePeriodChange: vi.fn(),
      });

      render(<LeaderboardView />);

      expect(screen.getByText("Opt Out")).toBeInTheDocument();
    });

    it("should call handleOptOut when Opt Out is clicked", () => {
      const mockHandleOptOut = vi.fn();
      mockUseLeaderboardActions.mockReturnValue({
        leaderboardData: [],
        userRank: null,
        isLoading: false,
        error: null,
        selectedCategory: LeaderboardCategory.TOTAL_POINTS,
        selectedPeriod: LeaderboardPeriod.ALL_TIME,
        isOptedIn: true,
        handleOptIn: vi.fn(),
        handleOptOut: mockHandleOptOut,
        handleSkipOptIn: vi.fn(),
        handleCategoryChange: vi.fn(),
        handlePeriodChange: vi.fn(),
      });

      render(<LeaderboardView />);

      const optOutButton = screen.getByText("Opt Out");
      fireEvent.click(optOutButton);

      expect(mockHandleOptOut).toHaveBeenCalledTimes(1);
    });
  });

  describe("Filters", () => {
    it("should render category and period filters", () => {
      mockUseLeaderboardActions.mockReturnValue({
        leaderboardData: [],
        userRank: null,
        isLoading: false,
        error: null,
        selectedCategory: LeaderboardCategory.TOTAL_POINTS,
        selectedPeriod: LeaderboardPeriod.ALL_TIME,
        isOptedIn: true,
        handleOptIn: vi.fn(),
        handleOptOut: vi.fn(),
        handleSkipOptIn: vi.fn(),
        handleCategoryChange: vi.fn(),
        handlePeriodChange: vi.fn(),
      });

      render(<LeaderboardView />);

      expect(screen.getByText("Category")).toBeInTheDocument();
      expect(screen.getByText("Period")).toBeInTheDocument();
    });
  });

  describe("User Rank Display", () => {
    it("should display user rank when available", () => {
      mockUseLeaderboardActions.mockReturnValue({
        leaderboardData: [],
        userRank: {
          rank: 5,
          value: 1000,
          totalParticipants: 100,
        },
        isLoading: false,
        error: null,
        selectedCategory: LeaderboardCategory.TOTAL_POINTS,
        selectedPeriod: LeaderboardPeriod.ALL_TIME,
        isOptedIn: true,
        handleOptIn: vi.fn(),
        handleOptOut: vi.fn(),
        handleSkipOptIn: vi.fn(),
        handleCategoryChange: vi.fn(),
        handlePeriodChange: vi.fn(),
      });

      render(<LeaderboardView />);

      expect(screen.getByText("Your Rank")).toBeInTheDocument();
      expect(screen.getByText("#5 of 100")).toBeInTheDocument();
      expect(screen.getByText("1,000")).toBeInTheDocument();
    });

    it("should show medal icon for top 3 ranks", () => {
      mockUseLeaderboardActions.mockReturnValue({
        leaderboardData: [],
        userRank: {
          rank: 1,
          value: 5000,
          totalParticipants: 100,
        },
        isLoading: false,
        error: null,
        selectedCategory: LeaderboardCategory.TOTAL_POINTS,
        selectedPeriod: LeaderboardPeriod.ALL_TIME,
        isOptedIn: true,
        handleOptIn: vi.fn(),
        handleOptOut: vi.fn(),
        handleSkipOptIn: vi.fn(),
        handleCategoryChange: vi.fn(),
        handlePeriodChange: vi.fn(),
      });

      render(<LeaderboardView />);

      expect(screen.getByText("🥇")).toBeInTheDocument();
    });
  });

  describe("Leaderboard Table", () => {
    it("should display leaderboard entries", () => {
      mockUseLeaderboardActions.mockReturnValue({
        leaderboardData: [
          {
            id: "user1",
            displayName: "Player One",
            value: 1000,
            isCurrentUser: false,
          },
          {
            id: "user2",
            displayName: "Player Two",
            value: 800,
            isCurrentUser: false,
          },
        ],
        userRank: null,
        isLoading: false,
        error: null,
        selectedCategory: LeaderboardCategory.TOTAL_POINTS,
        selectedPeriod: LeaderboardPeriod.ALL_TIME,
        isOptedIn: true,
        handleOptIn: vi.fn(),
        handleOptOut: vi.fn(),
        handleSkipOptIn: vi.fn(),
        handleCategoryChange: vi.fn(),
        handlePeriodChange: vi.fn(),
      });

      render(<LeaderboardView />);

      expect(screen.getByText("Player One")).toBeInTheDocument();
      expect(screen.getByText("Player Two")).toBeInTheDocument();
      expect(screen.getByText("1,000")).toBeInTheDocument();
      expect(screen.getByText("800")).toBeInTheDocument();
    });

    it("should highlight current user entry", () => {
      mockUseLeaderboardActions.mockReturnValue({
        leaderboardData: [
          {
            id: "user1",
            displayName: "Player One",
            value: 1000,
            isCurrentUser: true,
          },
        ],
        userRank: null,
        isLoading: false,
        error: null,
        selectedCategory: LeaderboardCategory.TOTAL_POINTS,
        selectedPeriod: LeaderboardPeriod.ALL_TIME,
        isOptedIn: true,
        handleOptIn: vi.fn(),
        handleOptOut: vi.fn(),
        handleSkipOptIn: vi.fn(),
        handleCategoryChange: vi.fn(),
        handlePeriodChange: vi.fn(),
      });

      const { container } = render(<LeaderboardView />);

      const currentUserRow = container.querySelector(".bg-blue-900\\/20");
      expect(currentUserRow).toBeInTheDocument();
      expect(currentUserRow).toHaveClass("border-l-4", "border-blue-400");
    });

    it("should display rank medals for top 3", () => {
      mockUseLeaderboardActions.mockReturnValue({
        leaderboardData: [
          {
            id: "user1",
            displayName: "First",
            value: 1000,
            isCurrentUser: false,
          },
          {
            id: "user2",
            displayName: "Second",
            value: 900,
            isCurrentUser: false,
          },
          {
            id: "user3",
            displayName: "Third",
            value: 800,
            isCurrentUser: false,
          },
        ],
        userRank: null,
        isLoading: false,
        error: null,
        selectedCategory: LeaderboardCategory.TOTAL_POINTS,
        selectedPeriod: LeaderboardPeriod.ALL_TIME,
        isOptedIn: true,
        handleOptIn: vi.fn(),
        handleOptOut: vi.fn(),
        handleSkipOptIn: vi.fn(),
        handleCategoryChange: vi.fn(),
        handlePeriodChange: vi.fn(),
      });

      render(<LeaderboardView />);

      expect(screen.getByText("🥇")).toBeInTheDocument();
      expect(screen.getByText("🥈")).toBeInTheDocument();
      expect(screen.getByText("🥉")).toBeInTheDocument();
    });

    it("should show empty state when no participants", () => {
      mockUseLeaderboardActions.mockReturnValue({
        leaderboardData: [],
        userRank: null,
        isLoading: false,
        error: null,
        selectedCategory: LeaderboardCategory.TOTAL_POINTS,
        selectedPeriod: LeaderboardPeriod.ALL_TIME,
        isOptedIn: true,
        handleOptIn: vi.fn(),
        handleOptOut: vi.fn(),
        handleSkipOptIn: vi.fn(),
        handleCategoryChange: vi.fn(),
        handlePeriodChange: vi.fn(),
      });

      render(<LeaderboardView />);

      expect(
        screen.getByText(/No participants in this leaderboard/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/Be the first to join!/i)).toBeInTheDocument();
    });
  });

  describe("Value Formatting", () => {
    it("should format time duration correctly", () => {
      mockUseLeaderboardActions.mockReturnValue({
        leaderboardData: [
          {
            id: "user1",
            displayName: "Player",
            value: 7200, // 2 hours in seconds
            isCurrentUser: false,
          },
        ],
        userRank: null,
        isLoading: false,
        error: null,
        selectedCategory: LeaderboardCategory.TOTAL_TIME,
        selectedPeriod: LeaderboardPeriod.ALL_TIME,
        isOptedIn: true,
        handleOptIn: vi.fn(),
        handleOptOut: vi.fn(),
        handleSkipOptIn: vi.fn(),
        handleCategoryChange: vi.fn(),
        handlePeriodChange: vi.fn(),
      });

      render(<LeaderboardView />);

      expect(screen.getByText("2h")).toBeInTheDocument();
    });

    it("should format streak duration correctly", () => {
      mockUseLeaderboardActions.mockReturnValue({
        leaderboardData: [
          {
            id: "user1",
            displayName: "Player",
            value: 30,
            isCurrentUser: false,
          },
        ],
        userRank: null,
        isLoading: false,
        error: null,
        selectedCategory: LeaderboardCategory.LONGEST_STREAK,
        selectedPeriod: LeaderboardPeriod.ALL_TIME,
        isOptedIn: true,
        handleOptIn: vi.fn(),
        handleOptOut: vi.fn(),
        handleSkipOptIn: vi.fn(),
        handleCategoryChange: vi.fn(),
        handlePeriodChange: vi.fn(),
      });

      render(<LeaderboardView />);

      expect(screen.getByText("30 days")).toBeInTheDocument();
    });
  });
});
