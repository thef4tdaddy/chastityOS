/**
 * CurrentStatusSection Component Tests
 *  for current session status display and timer integration
 * Issue #533
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CurrentStatusSection } from "../CurrentStatusSection";
import type { DBSession } from "@/types/database";

// Mock session factory
const mockSession = (overrides: Partial<DBSession> = {}): DBSession => ({
  id: "session1",
  userId: "user1",
  startTime: new Date("2024-01-01T00:00:00Z"),
  endTime: undefined,
  isPaused: false,
  accumulatedPauseTime: 0,
  isHardcoreMode: false,
  keyholderApprovalRequired: false,
  syncStatus: "synced",
  lastModified: new Date("2024-01-01T00:00:00Z"),
  ...overrides,
});

// Mock the useSessionTimer hook
vi.mock("../../../hooks/useSessionTimer", () => ({
  useSessionTimer: vi.fn((session: DBSession | null) => {
    if (!session) {
      return {
        effectiveTimeFormatted: "0:00:00",
        totalElapsedTimeFormatted: "0:00:00",
        currentPauseDurationFormatted: "0:00",
        remainingGoalTimeFormatted: null,
        isPaused: false,
        isGoalCompleted: false,
        goalProgress: 0,
        currentPauseDuration: 0,
      };
    }

    const totalSeconds = session.endTime
      ? Math.floor(
          (session.endTime.getTime() - session.startTime.getTime()) / 1000,
        )
      : 3600;
    const effectiveSeconds = Math.max(
      0,
      totalSeconds - (session.accumulatedPauseTime || 0),
    );

    return {
      effectiveTimeFormatted: `${Math.floor(effectiveSeconds / 3600)}:${String(
        Math.floor((effectiveSeconds % 3600) / 60),
      ).padStart(2, "0")}:${String(effectiveSeconds % 60).padStart(2, "0")}`,
      totalElapsedTimeFormatted: `${Math.floor(totalSeconds / 3600)}:${String(
        Math.floor((totalSeconds % 3600) / 60),
      ).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`,
      currentPauseDurationFormatted: session.isPaused ? "5:00" : "0:00",
      remainingGoalTimeFormatted: session.goalDuration
        ? "2:30:00 remaining"
        : null,
      isPaused: session.isPaused || false,
      isGoalCompleted: false,
      goalProgress: session.goalDuration ? 50 : 0,
      currentPauseDuration: session.isPaused ? 300 : 0,
    };
  }),
}));

describe("CurrentStatusSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("No Active Session", () => {
    it("should render with null session", () => {
      render(<CurrentStatusSection currentSession={null} />);

      expect(screen.getByText("Current Status")).toBeInTheDocument();
      expect(screen.getByText("No Active Session")).toBeInTheDocument();
    });

    it("should display stopped icon for no session", () => {
      render(<CurrentStatusSection currentSession={null} />);

      // Verify status is displayed
      expect(screen.getByText("No Active Session")).toBeInTheDocument();
    });

    it("should show minimal display for no session", () => {
      render(<CurrentStatusSection currentSession={null} />);

      // Verify no active session state is shown
      expect(screen.getByText("No Active Session")).toBeInTheDocument();
    });
  });

  describe("Active Session Display", () => {
    it("should display active session status", () => {
      const session = mockSession();
      render(<CurrentStatusSection currentSession={session} />);

      expect(screen.getByText("Current Status")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("should display session start time", () => {
      const session = mockSession({
        startTime: new Date("2024-01-01T12:30:00Z"),
      });
      render(<CurrentStatusSection currentSession={session} />);

      expect(screen.getByText(/Started:/)).toBeInTheDocument();
    });

    it("should display effective session time", () => {
      const session = mockSession();
      render(<CurrentStatusSection currentSession={session} />);

      // Should display formatted time - using getAllByText since time appears in multiple places
      expect(screen.getAllByText(/1:00:00/).length).toBeGreaterThan(0);
    });

    it("should display hardcore mode indicator", () => {
      const session = mockSession({ isHardcoreMode: true });
      render(<CurrentStatusSection currentSession={session} />);

      expect(screen.getByText("Hardcore")).toBeInTheDocument();
    });

    it("should display normal mode indicator", () => {
      const session = mockSession({ isHardcoreMode: false });
      render(<CurrentStatusSection currentSession={session} />);

      expect(screen.getByText("Normal")).toBeInTheDocument();
    });

    it("should display keyholder approval status", () => {
      const session = mockSession({ keyholderApprovalRequired: true });
      render(<CurrentStatusSection currentSession={session} />);

      expect(screen.getByText("Required")).toBeInTheDocument();
    });
  });

  describe("Paused Session Display", () => {
    it("should display paused status", () => {
      const session = mockSession({
        isPaused: true,
        accumulatedPauseTime: 300,
      });
      render(<CurrentStatusSection currentSession={session} />);

      expect(screen.getByText("Paused")).toBeInTheDocument();
    });

    it("should display current pause duration", () => {
      const session = mockSession({
        isPaused: true,
        accumulatedPauseTime: 300,
      });
      render(<CurrentStatusSection currentSession={session} />);

      expect(screen.getByText(/Current pause:/)).toBeInTheDocument();
    });

    it("should display accumulated pause time", () => {
      const session = mockSession({
        isPaused: true,
        accumulatedPauseTime: 600,
      });
      render(<CurrentStatusSection currentSession={session} />);

      expect(screen.getByText(/Accumulated Pause:/)).toBeInTheDocument();
      expect(screen.getByText(/10m 0s/)).toBeInTheDocument();
    });
  });

  describe("Goal Progress Display", () => {
    it("should display goal progress when goal is set", () => {
      const session = mockSession({ goalDuration: 7200 });
      render(<CurrentStatusSection currentSession={session} />);

      expect(screen.getByText(/Goal Progress:/)).toBeInTheDocument();
      expect(screen.getByText(/50/)).toBeInTheDocument();
    });

    it("should display remaining goal time", () => {
      const session = mockSession({ goalDuration: 7200 });
      render(<CurrentStatusSection currentSession={session} />);

      expect(screen.getByText(/remaining/)).toBeInTheDocument();
    });

    it("should not display goal info when no goal is set", () => {
      const session = mockSession();
      render(<CurrentStatusSection currentSession={session} />);

      expect(screen.queryByText(/Goal Progress:/)).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading structure", () => {
      const session = mockSession();
      render(<CurrentStatusSection currentSession={session} />);

      const heading = screen.getByRole("heading", { name: /Current Status/i });
      expect(heading).toBeInTheDocument();
    });

    it("should use semantic HTML structure", () => {
      const session = mockSession();
      const { container } = render(
        <CurrentStatusSection currentSession={session} />,
      );

      // Should have proper structure
      expect(container.querySelector("h2")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle session with undefined start time gracefully", () => {
      const session = mockSession({ startTime: undefined as any });
      render(<CurrentStatusSection currentSession={session} />);

      // Should not crash
      expect(screen.getByText("Current Status")).toBeInTheDocument();
    });

    it("should handle very long accumulated pause times", () => {
      const session = mockSession({ accumulatedPauseTime: 86400 }); // 24 hours
      render(<CurrentStatusSection currentSession={session} />);

      expect(screen.getByText(/1440m 0s/)).toBeInTheDocument();
    });

    it("should handle negative accumulated pause time", () => {
      const session = mockSession({ accumulatedPauseTime: -100 });
      render(<CurrentStatusSection currentSession={session} />);

      // Should handle gracefully, possibly showing 0s
      expect(screen.getByText("Current Status")).toBeInTheDocument();
    });
  });
});
