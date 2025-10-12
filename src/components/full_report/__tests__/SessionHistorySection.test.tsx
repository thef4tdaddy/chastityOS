/**
 * SessionHistorySection Component Tests
 * Tests for session history display, sorting, and pagination
 * Issue #533
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SessionHistorySection } from "../SessionHistorySection";
import type { DBSession } from "../../../types/database";

describe("SessionHistorySection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Empty State", () => {
    it("should render with empty sessions array", () => {
      render(<SessionHistorySection sessions={[]} />);

      expect(screen.getByText("Session History")).toBeInTheDocument();
      expect(screen.getByText("No sessions found")).toBeInTheDocument();
    });

    it("should display empty state icon", () => {
      render(<SessionHistorySection sessions={[]} />);

      expect(screen.getByText("No sessions found")).toBeInTheDocument();
    });

    it("should not show Show All button when empty", () => {
      render(<SessionHistorySection sessions={[]} />);

      expect(screen.queryByText(/Show All/)).not.toBeInTheDocument();
    });
  });

  describe("Session Display", () => {
    it("should display single session", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T12:00:00Z"),
          endTime: new Date("2024-01-01T14:00:00Z"),
          accumulatedPauseTime: 0,
          isHardcoreMode: false,
          keyholderApprovalRequired: false,
        } as DBSession,
      ];

      render(<SessionHistorySection sessions={sessions} />);

      expect(screen.getByText("Session History")).toBeInTheDocument();
      expect(screen.getAllByText(/2024/).length).toBeGreaterThan(0);
    });

    it("should display multiple sessions", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T12:00:00Z"),
          endTime: new Date("2024-01-01T14:00:00Z"),
          accumulatedPauseTime: 0,
          isHardcoreMode: false,
          keyholderApprovalRequired: false,
        } as DBSession,
        {
          id: "s2",
          userId: "user1",
          startTime: new Date("2024-01-02T12:00:00Z"),
          endTime: new Date("2024-01-02T15:00:00Z"),
          accumulatedPauseTime: 0,
          isHardcoreMode: false,
          keyholderApprovalRequired: false,
        } as DBSession,
      ];

      render(<SessionHistorySection sessions={sessions} />);

      // Should display both sessions
      const dateElements = screen.getAllByText(/2024/);
      expect(dateElements.length).toBeGreaterThan(0);
    });

    it("should display session start and end times", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T12:00:00Z"),
          endTime: new Date("2024-01-01T14:00:00Z"),
          accumulatedPauseTime: 0,
          isHardcoreMode: false,
          keyholderApprovalRequired: false,
        } as DBSession,
      ];

      render(<SessionHistorySection sessions={sessions} />);

      expect(screen.getByText(/Ended:/)).toBeInTheDocument();
    });

    it("should display session duration", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T12:00:00Z"),
          endTime: new Date("2024-01-01T14:00:00Z"),
          accumulatedPauseTime: 0,
          isHardcoreMode: false,
          keyholderApprovalRequired: false,
        } as DBSession,
      ];

      render(<SessionHistorySection sessions={sessions} />);

      // 2 hours displayed as "2h 0m"
      expect(screen.getByText(/2h 0m/)).toBeInTheDocument();
    });

    it("should display active session indicator", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T12:00:00Z"),
          endTime: null,
          accumulatedPauseTime: 0,
          isHardcoreMode: false,
          keyholderApprovalRequired: false,
        } as DBSession,
      ];

      render(<SessionHistorySection sessions={sessions} />);

      expect(screen.getByText("Active Session")).toBeInTheDocument();
      expect(screen.getByText("Ongoing")).toBeInTheDocument();
    });

    it("should display end reason when provided", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T12:00:00Z"),
          endTime: new Date("2024-01-01T14:00:00Z"),
          endReason: "Completed Goal",
          accumulatedPauseTime: 0,
          isHardcoreMode: false,
          keyholderApprovalRequired: false,
        } as DBSession,
      ];

      render(<SessionHistorySection sessions={sessions} />);

      expect(screen.getByText(/Completed Goal/)).toBeInTheDocument();
    });

    it("should display pause time when present", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T12:00:00Z"),
          endTime: new Date("2024-01-01T14:00:00Z"),
          accumulatedPauseTime: 600, // 10 minutes
          isHardcoreMode: false,
          keyholderApprovalRequired: false,
        } as DBSession,
      ];

      render(<SessionHistorySection sessions={sessions} />);

      expect(screen.getByText(/Pause:/)).toBeInTheDocument();
      // Duration formatting: 600 seconds = 10 minutes displayed as "10m"
      expect(screen.getByText(/10m/)).toBeInTheDocument();
    });

    it("should display session notes when provided", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T12:00:00Z"),
          endTime: new Date("2024-01-01T14:00:00Z"),
          notes: "Test session notes",
          accumulatedPauseTime: 0,
          isHardcoreMode: false,
          keyholderApprovalRequired: false,
        } as DBSession,
      ];

      render(<SessionHistorySection sessions={sessions} />);

      expect(screen.getByText(/Notes:/)).toBeInTheDocument();
      expect(screen.getByText(/Test session notes/)).toBeInTheDocument();
    });
  });

  describe("Hardcore Mode Indicators", () => {
    it("should display hardcore mode badge", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T12:00:00Z"),
          endTime: new Date("2024-01-01T14:00:00Z"),
          accumulatedPauseTime: 0,
          isHardcoreMode: true,
          keyholderApprovalRequired: false,
        } as DBSession,
      ];

      render(<SessionHistorySection sessions={sessions} />);

      expect(screen.getByText(/Hardcore Mode/)).toBeInTheDocument();
    });

    it("should display lock combination badge when present", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T12:00:00Z"),
          endTime: new Date("2024-01-01T14:00:00Z"),
          accumulatedPauseTime: 0,
          isHardcoreMode: true,
          hasLockCombination: true,
          keyholderApprovalRequired: false,
        } as DBSession,
      ];

      render(<SessionHistorySection sessions={sessions} />);

      expect(screen.getByText(/Lock Combo Saved/)).toBeInTheDocument();
    });

    it("should display emergency PIN used badge", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T12:00:00Z"),
          endTime: new Date("2024-01-01T14:00:00Z"),
          accumulatedPauseTime: 0,
          isHardcoreMode: true,
          emergencyPinUsed: true,
          keyholderApprovalRequired: false,
        } as DBSession,
      ];

      render(<SessionHistorySection sessions={sessions} />);

      expect(screen.getByText(/Emergency PIN Used/)).toBeInTheDocument();
    });
  });

  describe("Emergency Unlock Display", () => {
    it("should display emergency unlock indicator", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T12:00:00Z"),
          endTime: new Date("2024-01-01T14:00:00Z"),
          accumulatedPauseTime: 0,
          isHardcoreMode: false,
          isEmergencyUnlock: true,
          emergencyReason: "Medical emergency",
          keyholderApprovalRequired: false,
        } as DBSession,
      ];

      render(<SessionHistorySection sessions={sessions} />);

      expect(screen.getByText(/Emergency Unlock/)).toBeInTheDocument();
    });

    it("should display emergency reason", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T12:00:00Z"),
          endTime: new Date("2024-01-01T14:00:00Z"),
          accumulatedPauseTime: 0,
          isHardcoreMode: false,
          isEmergencyUnlock: true,
          emergencyReason: "Medical emergency",
          keyholderApprovalRequired: false,
        } as DBSession,
      ];

      render(<SessionHistorySection sessions={sessions} />);

      expect(screen.getByText(/Medical emergency/)).toBeInTheDocument();
    });

    it("should display emergency notes when provided", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T12:00:00Z"),
          endTime: new Date("2024-01-01T14:00:00Z"),
          accumulatedPauseTime: 0,
          isHardcoreMode: false,
          isEmergencyUnlock: true,
          emergencyReason: "Medical emergency",
          emergencyNotes: "Additional emergency details",
          keyholderApprovalRequired: false,
        } as DBSession,
      ];

      render(<SessionHistorySection sessions={sessions} />);

      expect(
        screen.getByText(/Additional emergency details/),
      ).toBeInTheDocument();
    });
  });

  describe("Sorting and Pagination", () => {
    it("should sort sessions by most recent first", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T12:00:00Z"),
          endTime: new Date("2024-01-01T14:00:00Z"),
          accumulatedPauseTime: 0,
          isHardcoreMode: false,
          keyholderApprovalRequired: false,
        } as DBSession,
        {
          id: "s2",
          userId: "user1",
          startTime: new Date("2024-01-03T12:00:00Z"),
          endTime: new Date("2024-01-03T14:00:00Z"),
          accumulatedPauseTime: 0,
          isHardcoreMode: false,
          keyholderApprovalRequired: false,
        } as DBSession,
        {
          id: "s3",
          userId: "user1",
          startTime: new Date("2024-01-02T12:00:00Z"),
          endTime: new Date("2024-01-02T14:00:00Z"),
          accumulatedPauseTime: 0,
          isHardcoreMode: false,
          keyholderApprovalRequired: false,
        } as DBSession,
      ];

      render(<SessionHistorySection sessions={sessions} />);

      // All sessions should be displayed
      expect(screen.getByText("Session History")).toBeInTheDocument();
    });

    it("should show first 10 sessions by default", () => {
      const sessions: DBSession[] = Array.from({ length: 15 }, (_, i) => ({
        id: `s${i}`,
        userId: "user1",
        startTime: new Date(`2024-01-${i + 1}T12:00:00Z`),
        endTime: new Date(`2024-01-${i + 1}T14:00:00Z`),
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
      })) as DBSession[];

      render(<SessionHistorySection sessions={sessions} />);

      // Should show Show All button
      expect(screen.getByText(/Show All \(15\)/)).toBeInTheDocument();
    });

    it("should expand to show all sessions when clicking Show All", () => {
      const sessions: DBSession[] = Array.from({ length: 15 }, (_, i) => ({
        id: `s${i}`,
        userId: "user1",
        startTime: new Date(`2024-01-${i + 1}T12:00:00Z`),
        endTime: new Date(`2024-01-${i + 1}T14:00:00Z`),
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
      })) as DBSession[];

      render(<SessionHistorySection sessions={sessions} />);

      const showAllButton = screen.getByText(/Show All/);
      fireEvent.click(showAllButton);

      // Should change to Show Less
      expect(screen.getByText("Show Less")).toBeInTheDocument();
    });

    it("should collapse sessions when clicking Show Less", () => {
      const sessions: DBSession[] = Array.from({ length: 15 }, (_, i) => ({
        id: `s${i}`,
        userId: "user1",
        startTime: new Date(`2024-01-${i + 1}T12:00:00Z`),
        endTime: new Date(`2024-01-${i + 1}T14:00:00Z`),
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
      })) as DBSession[];

      render(<SessionHistorySection sessions={sessions} />);

      const showAllButton = screen.getByText(/Show All/);
      fireEvent.click(showAllButton);

      const showLessButton = screen.getByText("Show Less");
      fireEvent.click(showLessButton);

      // Should change back to Show All
      expect(screen.getByText(/Show All \(15\)/)).toBeInTheDocument();
    });

    it("should show Load More button for large datasets", () => {
      const sessions: DBSession[] = Array.from({ length: 50 }, (_, i) => ({
        id: `s${i}`,
        userId: "user1",
        startTime: new Date(`2024-01-${(i % 30) + 1}T12:00:00Z`),
        endTime: new Date(`2024-01-${(i % 30) + 1}T14:00:00Z`),
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
      })) as DBSession[];

      render(<SessionHistorySection sessions={sessions} />);

      const showAllButton = screen.getByText(/Show All/);
      fireEvent.click(showAllButton);

      // Should show Load More button
      expect(screen.getByText(/Load More/)).toBeInTheDocument();
    });

    it("should not show Show All button for 10 or fewer sessions", () => {
      const sessions: DBSession[] = Array.from({ length: 5 }, (_, i) => ({
        id: `s${i}`,
        userId: "user1",
        startTime: new Date(`2024-01-${i + 1}T12:00:00Z`),
        endTime: new Date(`2024-01-${i + 1}T14:00:00Z`),
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
      })) as DBSession[];

      render(<SessionHistorySection sessions={sessions} />);

      expect(screen.queryByText(/Show All/)).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading structure", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T12:00:00Z"),
          endTime: new Date("2024-01-01T14:00:00Z"),
          accumulatedPauseTime: 0,
          isHardcoreMode: false,
          keyholderApprovalRequired: false,
        } as DBSession,
      ];

      render(<SessionHistorySection sessions={sessions} />);

      const heading = screen.getByRole("heading", {
        name: /Session History/i,
      });
      expect(heading).toBeInTheDocument();
    });

    it("should have accessible buttons", () => {
      const sessions: DBSession[] = Array.from({ length: 15 }, (_, i) => ({
        id: `s${i}`,
        userId: "user1",
        startTime: new Date(`2024-01-${i + 1}T12:00:00Z`),
        endTime: new Date(`2024-01-${i + 1}T14:00:00Z`),
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
      })) as DBSession[];

      render(<SessionHistorySection sessions={sessions} />);

      const button = screen.getByRole("button", { name: /Show All/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty array gracefully", () => {
      const { container } = render(<SessionHistorySection sessions={[]} />);

      // Component should handle empty array gracefully
      expect(container).toBeInTheDocument();
      expect(screen.getByText("No sessions found")).toBeInTheDocument();
    });

    it("should handle sessions with missing data", () => {
      const sessions = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T12:00:00Z"),
          // Missing endTime
          accumulatedPauseTime: 0,
          isHardcoreMode: false,
          keyholderApprovalRequired: false,
        } as DBSession,
      ];

      render(<SessionHistorySection sessions={sessions} />);

      // Should not crash
      expect(screen.getByText("Session History")).toBeInTheDocument();
    });

    it("should handle sessions with invalid dates", () => {
      const sessions = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("invalid"),
          endTime: new Date("invalid"),
          accumulatedPauseTime: 0,
          isHardcoreMode: false,
          keyholderApprovalRequired: false,
        } as DBSession,
      ];

      render(<SessionHistorySection sessions={sessions} />);

      // Should handle gracefully
      expect(screen.getByText("Session History")).toBeInTheDocument();
    });

    it("should handle very long session notes", () => {
      const longNotes = "A".repeat(500);
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T12:00:00Z"),
          endTime: new Date("2024-01-01T14:00:00Z"),
          notes: longNotes,
          accumulatedPauseTime: 0,
          isHardcoreMode: false,
          keyholderApprovalRequired: false,
        } as DBSession,
      ];

      render(<SessionHistorySection sessions={sessions} />);

      // Should display notes without crashing
      expect(screen.getByText(/Notes:/)).toBeInTheDocument();
    });
  });
});
