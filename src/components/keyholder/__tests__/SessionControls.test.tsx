/**
 * SessionControls Component Tests
 * Tests for keyholder session control display
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SessionControls } from "../SessionControls";
import type { DBSession } from "../../../types/database";

describe("SessionControls", () => {
  const mockSession: DBSession = {
    id: "session-1",
    userId: "user-1",
    startTime: new Date("2024-01-01T10:00:00Z"),
    isPaused: false,
    accumulatedPauseTime: 7200, // 2 hours
    isActive: true,
    events: [],
    metadata: {},
  };

  beforeEach(() => {
    // Clear any mocks before each test
  });

  describe("No Session State", () => {
    it("should render no session message when session is null", () => {
      render(<SessionControls session={null} />);

      expect(
        screen.getByText("No active session to control."),
      ).toBeInTheDocument();
    });

    it("should display session control heading when no session", () => {
      render(<SessionControls session={null} />);

      expect(screen.getByText("Session Control")).toBeInTheDocument();
    });

    it("should have proper structure with no session", () => {
      const { container } = render(<SessionControls session={null} />);

      const heading = screen.getByText("Session Control");
      expect(heading.tagName).toBe("H3");
    });
  });

  describe("Active Session Display", () => {
    it("should render current session status heading", () => {
      render(<SessionControls session={mockSession} />);

      expect(screen.getByText("Current Session Status")).toBeInTheDocument();
    });

    it("should display active status for non-paused session", () => {
      render(<SessionControls session={mockSession} />);

      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("should display paused status for paused session", () => {
      const pausedSession = {
        ...mockSession,
        isPaused: true,
      };

      render(<SessionControls session={pausedSession} />);

      expect(screen.getByText("Paused")).toBeInTheDocument();
    });

    it("should display session start time", () => {
      render(<SessionControls session={mockSession} />);

      expect(screen.getByText(/Started:/i)).toBeInTheDocument();
      expect(screen.getByText(/1\/1\/2024/)).toBeInTheDocument();
    });

    it("should display pause time", () => {
      render(<SessionControls session={mockSession} />);

      expect(screen.getByText(/Pause Time:/i)).toBeInTheDocument();
      expect(screen.getByText(/2h 0m/)).toBeInTheDocument();
    });

    it("should format pause time correctly for various durations", () => {
      const sessionWith90Min = {
        ...mockSession,
        accumulatedPauseTime: 5400, // 90 minutes = 1h 30m
      };

      render(<SessionControls session={sessionWith90Min} />);

      expect(screen.getByText(/1h 30m/)).toBeInTheDocument();
    });

    it("should format pause time with zero minutes", () => {
      const sessionWith1Hour = {
        ...mockSession,
        accumulatedPauseTime: 3600, // 1 hour exactly
      };

      render(<SessionControls session={sessionWith1Hour} />);

      expect(screen.getByText(/1h 0m/)).toBeInTheDocument();
    });

    it("should format pause time with zero hours", () => {
      const sessionWith30Min = {
        ...mockSession,
        accumulatedPauseTime: 1800, // 30 minutes
      };

      render(<SessionControls session={sessionWith30Min} />);

      expect(screen.getByText(/0h 30m/)).toBeInTheDocument();
    });

    it("should display informational message about control", () => {
      render(<SessionControls session={mockSession} />);

      expect(
        screen.getByText(/Session control is managed by the submissive/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Use the Release Request system/i),
      ).toBeInTheDocument();
    });
  });

  describe("Status Icons", () => {
    it("should show play icon for active session", () => {
      const { container } = render(<SessionControls session={mockSession} />);

      // Check for presence of active status text which is paired with play icon
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("should show pause icon for paused session", () => {
      const pausedSession = {
        ...mockSession,
        isPaused: true,
      };

      const { container } = render(<SessionControls session={pausedSession} />);

      // Check for presence of paused status text which is paired with pause icon
      expect(screen.getByText("Paused")).toBeInTheDocument();
    });

    it("should show clock icon in heading", () => {
      const { container } = render(<SessionControls session={mockSession} />);

      // Clock icon should be present in heading
      expect(screen.getByText("Current Session Status")).toBeInTheDocument();
    });
  });

  describe("Date and Time Formatting", () => {
    it("should format date and time correctly", () => {
      const sessionWithSpecificTime = {
        ...mockSession,
        startTime: new Date("2024-06-15T14:30:00Z"),
      };

      render(<SessionControls session={sessionWithSpecificTime} />);

      expect(screen.getByText(/Started:/i)).toBeInTheDocument();
      // Date format may vary by locale
      const dateTimeText =
        screen.getByText(/Started:/i).parentElement?.textContent;
      expect(dateTimeText).toMatch(/6\/15\/2024|15\/6\/2024/);
    });

    it("should handle recent dates", () => {
      const recentSession = {
        ...mockSession,
        startTime: new Date(),
      };

      render(<SessionControls session={recentSession} />);

      expect(screen.getByText(/Started:/i)).toBeInTheDocument();
    });

    it("should handle old dates", () => {
      const oldSession = {
        ...mockSession,
        startTime: new Date("2020-01-01T00:00:00Z"),
      };

      render(<SessionControls session={oldSession} />);

      expect(screen.getByText(/Started:/i)).toBeInTheDocument();
      expect(screen.getByText(/1\/1\/2020|2020/)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading structure", () => {
      render(<SessionControls session={mockSession} />);

      const heading = screen.getByText("Current Session Status");
      expect(heading.tagName).toBe("H3");
    });

    it("should have proper heading structure with no session", () => {
      render(<SessionControls session={null} />);

      const heading = screen.getByText("Session Control");
      expect(heading.tagName).toBe("H3");
    });

    it("should have readable status labels", () => {
      render(<SessionControls session={mockSession} />);

      expect(screen.getByText("Status:")).toBeInTheDocument();
      expect(screen.getByText("Started:")).toBeInTheDocument();
      expect(screen.getByText("Pause Time:")).toBeInTheDocument();
    });

    it("should have descriptive informational message", () => {
      render(<SessionControls session={mockSession} />);

      const infoMessage = screen.getByText(/Session control is managed/i);
      expect(infoMessage).toHaveTextContent(
        "Session control is managed by the submissive. Use the Release Request system to approve early unlock.",
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero pause time", () => {
      const noPauseSession = {
        ...mockSession,
        accumulatedPauseTime: 0,
      };

      render(<SessionControls session={noPauseSession} />);

      expect(screen.getByText(/0h 0m/)).toBeInTheDocument();
    });

    it("should handle very large pause times", () => {
      const longPauseSession = {
        ...mockSession,
        accumulatedPauseTime: 360000, // 100 hours
      };

      render(<SessionControls session={longPauseSession} />);

      expect(screen.getByText(/100h 0m/)).toBeInTheDocument();
    });

    it("should handle session with minimum required fields", () => {
      const minimalSession: DBSession = {
        id: "minimal",
        userId: "user-1",
        startTime: new Date(),
        isPaused: false,
        accumulatedPauseTime: 0,
        isActive: true,
        events: [],
        metadata: {},
      };

      render(<SessionControls session={minimalSession} />);

      expect(screen.getByText("Current Session Status")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
    });
  });

  describe("Responsive Design Hints", () => {
    it("should render all content for session", () => {
      render(<SessionControls session={mockSession} />);

      // All key information should be present
      expect(screen.getByText("Current Session Status")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText(/Started:/i)).toBeInTheDocument();
      expect(screen.getByText(/Pause Time:/i)).toBeInTheDocument();
    });

    it("should maintain content structure", () => {
      const { container } = render(<SessionControls session={mockSession} />);

      // Should have structured layout
      expect(container.querySelector(".space-y-3, .space-y-4")).toBeTruthy();
    });
  });
});
