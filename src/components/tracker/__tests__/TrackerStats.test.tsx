/**
 * TrackerStats Component Tests
 * Tests for statistics displays with real-time updates
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrackerStats } from "../TrackerStats";

// Mock the UI components
vi.mock("@/components/ui", () => ({
  Card: vi.fn(({ children, variant, className }) => (
    <div data-testid="card" data-variant={variant} className={className}>
      {children}
    </div>
  )),
}));

// Mock the icons
vi.mock("../../utils/iconImport", () => ({
  FaBullseye: () => <span data-testid="bullseye-icon">🎯</span>,
  FaLock: () => <span data-testid="lock-icon">🔒</span>,
}));

// Mock the stats sub-components
vi.mock("../stats", () => ({
  CageOnStats: vi.fn(({ displayData, stats }) => (
    <div data-testid="cage-on-stats">
      <p>Cage On Stats</p>
      <p>{stats.isCageOn ? "Active" : "Inactive"}</p>
    </div>
  )),
  CageOffStats: vi.fn(({ displayData, stats }) => (
    <div data-testid="cage-off-stats">
      <p>Cage Off Stats</p>
    </div>
  )),
}));

// Mock the hook
const mockHookReturn = {
  displayData: {
    isCageOn: false,
    isPaused: false,
    showPauseInfo: false,
  },
  stats: {
    topBoxLabel: null,
    topBoxTimestamp: null,
    totalChastityTimeFormatted: "0s",
    totalCageOffTimeFormatted: "0s",
    isCageOn: false,
  },
};

vi.mock("../../hooks/tracker/useTrackerStats", () => ({
  useTrackerStats: vi.fn(() => mockHookReturn),
}));

import { useTrackerStats } from "../../hooks/tracker/useTrackerStats";

describe("TrackerStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHookReturn.displayData = {
      isCageOn: false,
      isPaused: false,
      showPauseInfo: false,
    };
    mockHookReturn.stats = {
      topBoxLabel: null,
      topBoxTimestamp: null,
      totalChastityTimeFormatted: "0s",
      totalCageOffTimeFormatted: "0s",
      isCageOn: false,
    };
  });

  describe("Top Stat Card", () => {
    it("should render top stat card when label and timestamp provided", () => {
      mockHookReturn.stats.topBoxLabel = "Session Started";
      mockHookReturn.stats.topBoxTimestamp = "12:00:00 PM";

      render(<TrackerStats />);

      expect(screen.getByText("Session Started:")).toBeInTheDocument();
      expect(screen.getByText("12:00:00 PM")).toBeInTheDocument();
    });

    it("should not render top stat card when no label", () => {
      mockHookReturn.stats.topBoxLabel = null;
      mockHookReturn.stats.topBoxTimestamp = "12:00:00 PM";

      render(<TrackerStats />);

      expect(screen.queryByText(/12:00:00 PM/)).not.toBeInTheDocument();
    });

    it("should not render top stat card when no timestamp", () => {
      mockHookReturn.stats.topBoxLabel = "Session Started";
      mockHookReturn.stats.topBoxTimestamp = null;

      render(<TrackerStats />);

      expect(screen.queryByText(/Session Started/)).not.toBeInTheDocument();
    });

    it("should apply proper styling to top stat card", () => {
      mockHookReturn.stats.topBoxLabel = "Session Started";
      mockHookReturn.stats.topBoxTimestamp = "12:00:00 PM";

      const { container } = render(<TrackerStats />);

      const card = container.querySelector(".primary-stat-card");
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass("text-center");
      expect(card).toHaveClass("glass-float");
    });

    it("should apply gradient text to timestamp", () => {
      mockHookReturn.stats.topBoxLabel = "Session Started";
      mockHookReturn.stats.topBoxTimestamp = "12:00:00 PM";

      render(<TrackerStats />);

      const timestamp = screen.getByText("12:00:00 PM");
      expect(timestamp).toHaveClass("bg-gradient-to-r");
      expect(timestamp).toHaveClass("from-blue-200");
      expect(timestamp).toHaveClass("to-white");
      expect(timestamp).toHaveClass("bg-clip-text");
      expect(timestamp).toHaveClass("text-transparent");
    });

    it("should apply number-update animation class", () => {
      mockHookReturn.stats.topBoxLabel = "Session Started";
      mockHookReturn.stats.topBoxTimestamp = "12:00:00 PM";

      render(<TrackerStats />);

      const timestamp = screen.getByText("12:00:00 PM");
      expect(timestamp).toHaveClass("number-update");
    });
  });

  describe("Personal Goal Display", () => {
    const mockGoal = {
      id: "goal-123",
      userId: "user-123",
      title: "7 Day Challenge",
      description: "Complete 7 days in chastity",
      type: "time" as const,
      targetValue: 604800, // 7 days in seconds
      currentValue: 302400, // 3.5 days
      progress: 50,
      isActive: true,
      isHardcoreMode: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should render personal goal when provided", () => {
      render(<TrackerStats personalGoal={mockGoal} />);

      expect(screen.getByText("7 Day Challenge")).toBeInTheDocument();
      expect(
        screen.getByText("Complete 7 days in chastity"),
      ).toBeInTheDocument();
    });

    it("should not render goal when not provided", () => {
      render(<TrackerStats />);

      expect(screen.queryByText(/Challenge/)).not.toBeInTheDocument();
    });

    it("should display goal progress", () => {
      render(<TrackerStats personalGoal={mockGoal} />);

      expect(screen.getByText(/Progress: 50\.0%/)).toBeInTheDocument();
    });

    it("should display remaining time", () => {
      render(<TrackerStats personalGoal={mockGoal} />);

      expect(screen.getByText(/remaining/)).toBeInTheDocument();
    });

    it("should show hardcore badge for hardcore goals", () => {
      const hardcoreGoal = { ...mockGoal, isHardcoreMode: true };

      render(<TrackerStats personalGoal={hardcoreGoal} />);

      expect(screen.getByText("HARDCORE")).toBeInTheDocument();
      expect(screen.getByTestId("lock-icon")).toBeInTheDocument();
    });

    it("should not show hardcore badge for normal goals", () => {
      render(<TrackerStats personalGoal={mockGoal} />);

      expect(screen.queryByText("HARDCORE")).not.toBeInTheDocument();
    });

    it("should display bullseye icon", () => {
      render(<TrackerStats personalGoal={mockGoal} />);

      expect(screen.getByTestId("bullseye-icon")).toBeInTheDocument();
    });

    it("should apply red border for hardcore goals", () => {
      const hardcoreGoal = { ...mockGoal, isHardcoreMode: true };
      const { container } = render(
        <TrackerStats personalGoal={hardcoreGoal} />,
      );

      const cards = container.querySelectorAll('[data-testid="card"]');
      const goalCard = Array.from(cards).find((card) =>
        card.textContent?.includes("7 Day Challenge"),
      );

      expect(goalCard).toHaveClass("border-2", "border-red-500/50");
    });

    it("should show goal complete message when progress is 100%", () => {
      const completedGoal = {
        ...mockGoal,
        currentValue: 604800,
        progress: 100,
        targetValue: 604800,
      };

      render(<TrackerStats personalGoal={completedGoal} />);

      expect(screen.getByText("Goal Complete!")).toBeInTheDocument();
    });

    it("should render goal without description", () => {
      const goalWithoutDesc = { ...mockGoal, description: undefined };

      render(<TrackerStats personalGoal={goalWithoutDesc} />);

      expect(screen.getByText("7 Day Challenge")).toBeInTheDocument();
      expect(screen.queryByText(/Complete 7 days/)).not.toBeInTheDocument();
    });
  });

  describe("Current Session Stats", () => {
    it("should render cage on stats", () => {
      render(<TrackerStats />);

      expect(screen.getByTestId("cage-on-stats")).toBeInTheDocument();
    });

    it("should render cage off stats", () => {
      render(<TrackerStats />);

      expect(screen.getByTestId("cage-off-stats")).toBeInTheDocument();
    });

    it("should pass displayData to stats components", () => {
      mockHookReturn.displayData.isCageOn = true;
      mockHookReturn.stats.isCageOn = true;

      render(<TrackerStats />);

      const cageOnStats = screen.getByTestId("cage-on-stats");
      expect(cageOnStats).toHaveTextContent("Active");
    });

    it("should have proper grid layout", () => {
      const { container } = render(<TrackerStats />);

      const grid = container.querySelector(".grid");
      expect(grid).toHaveClass("grid-cols-1");
      expect(grid).toHaveClass("sm:grid-cols-2");
    });
  });

  describe("Total Stats", () => {
    it("should render total chastity time", () => {
      mockHookReturn.stats.totalChastityTimeFormatted = "5d 12h 30m 15s";

      render(<TrackerStats />);

      expect(screen.getByText("Total Time In Chastity:")).toBeInTheDocument();
      expect(screen.getByText("5d 12h 30m 15s")).toBeInTheDocument();
    });

    it("should render total cage off time", () => {
      mockHookReturn.stats.totalCageOffTimeFormatted = "2d 6h 15m 30s";

      render(<TrackerStats />);

      expect(screen.getByText("Total Time Cage Off:")).toBeInTheDocument();
      expect(screen.getByText("2d 6h 15m 30s")).toBeInTheDocument();
    });

    it("should apply number-update animation to totals", () => {
      mockHookReturn.stats.totalChastityTimeFormatted = "5d 12h 30m 15s";

      render(<TrackerStats />);

      const value = screen.getByText("5d 12h 30m 15s");
      expect(value).toHaveClass("number-update");
    });

    it("should have glass-hover effect on cards", () => {
      const { container } = render(<TrackerStats />);

      const cards = container.querySelectorAll('[data-testid="card"]');
      cards.forEach((card) => {
        expect(card).toHaveClass("glass-hover");
      });
    });

    it("should have proper grid layout for totals", () => {
      const { container } = render(<TrackerStats />);

      const grids = container.querySelectorAll(".grid");
      expect(grids.length).toBeGreaterThan(0);
    });
  });

  describe("Layout and Spacing", () => {
    it("should have proper spacing between sections", () => {
      mockHookReturn.stats.topBoxLabel = "Session Started";
      mockHookReturn.stats.topBoxTimestamp = "12:00:00 PM";

      const { container } = render(
        <TrackerStats
          personalGoal={{
            id: "goal-123",
            userId: "user-123",
            title: "Test Goal",
            type: "time" as const,
            targetValue: 100,
            currentValue: 50,
            progress: 50,
            isActive: true,
            isHardcoreMode: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }}
        />,
      );

      const mainContainer = container.querySelector(".space-y-3");
      expect(mainContainer).toBeInTheDocument();
    });

    it("should apply responsive spacing classes", () => {
      const { container } = render(<TrackerStats />);

      const mainContainer = container.querySelector(
        ".space-y-3.sm\\:space-y-4",
      );
      expect(mainContainer).toBeInTheDocument();
    });

    it("should have margin bottom", () => {
      const { container } = render(<TrackerStats />);

      const mainContainer = container.querySelector(".mb-6");
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("should have responsive text sizes", () => {
      mockHookReturn.stats.topBoxLabel = "Session Started";
      mockHookReturn.stats.topBoxTimestamp = "12:00:00 PM";

      render(<TrackerStats />);

      const label = screen.getByText("Session Started:");
      expect(label.className).toMatch(/text-(xs|sm|base|lg)/);
    });

    it("should have responsive padding", () => {
      const { container } = render(<TrackerStats />);

      const cards = container.querySelectorAll('[data-testid="card"]');
      expect(cards.length).toBeGreaterThan(0);
    });

    it("should use responsive grid gaps", () => {
      const { container } = render(<TrackerStats />);

      const grid = container.querySelector(".gap-3");
      expect(grid).toBeInTheDocument();
    });
  });

  describe("Memoization", () => {
    it("should render with memo optimization", () => {
      const { rerender } = render(<TrackerStats />);

      // Component should render successfully
      expect(screen.getByTestId("cage-on-stats")).toBeInTheDocument();

      // Rerender with same props
      rerender(<TrackerStats />);

      // Should still be in document
      expect(screen.getByTestId("cage-on-stats")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should use semantic HTML elements", () => {
      mockHookReturn.stats.totalChastityTimeFormatted = "5d 12h 30m 15s";

      render(<TrackerStats />);

      const label = screen.getByText("Total Time In Chastity:");
      expect(label.tagName).toBe("P");

      const value = screen.getByText("5d 12h 30m 15s");
      expect(value.tagName).toBe("P");
    });

    it("should have proper color contrast", () => {
      mockHookReturn.stats.totalChastityTimeFormatted = "5d 12h 30m 15s";

      render(<TrackerStats />);

      const label = screen.getByText("Total Time In Chastity:");
      expect(label).toHaveClass("text-gray-200");

      const value = screen.getByText("5d 12h 30m 15s");
      expect(value).toHaveClass("text-white");
    });
  });

  describe("Animation Classes", () => {
    it("should apply tracker-state-transition", () => {
      const { container } = render(<TrackerStats />);

      const transitionElements = container.querySelectorAll(
        ".tracker-state-transition",
      );
      expect(transitionElements.length).toBeGreaterThan(0);
    });

    it("should apply glass-float animation", () => {
      mockHookReturn.stats.topBoxLabel = "Session Started";
      mockHookReturn.stats.topBoxTimestamp = "12:00:00 PM";

      const { container } = render(<TrackerStats />);

      const floatElement = container.querySelector(".glass-float");
      expect(floatElement).toBeInTheDocument();
    });
  });

  describe("Hook Integration", () => {
    it("should call useTrackerStats with props", () => {
      const props = {
        isCageOn: true,
        isPaused: false,
        timeCageOff: 1000,
        totalChastityTime: 5000,
        totalTimeCageOff: 2000,
      };

      render(<TrackerStats {...props} />);

      expect(useTrackerStats).toHaveBeenCalledWith(props);
    });
  });
});
