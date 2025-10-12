/**
 * Accessibility Tests for Full Report Components
 * Tests ARIA attributes, semantic HTML, and screen reader compatibility
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CurrentStatusSection } from "../CurrentStatusSection";
import { StatisticsSection } from "../StatisticsSection";
import { SessionHistorySection } from "../SessionHistorySection";
import type {
  DBSession,
  DBEvent,
  DBTask,
  DBGoal,
} from "../../../types/database";

describe("Full Report Accessibility", () => {
  describe("CurrentStatusSection Accessibility", () => {
    it("should have proper ARIA live region for status updates", () => {
      const mockSession: DBSession = {
        id: "session1",
        userId: "user1",
        startTime: new Date("2024-01-01T00:00:00Z"),
        endTime: null,
        isPaused: false,
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
      } as DBSession;

      const { container } = render(
        <CurrentStatusSection currentSession={mockSession} />,
      );

      // Check for live region
      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });

    it("should have proper region landmark with labelledby", () => {
      const mockSession: DBSession = {
        id: "session1",
        userId: "user1",
        startTime: new Date("2024-01-01T00:00:00Z"),
        endTime: null,
        isPaused: false,
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
      } as DBSession;

      const { container } = render(
        <CurrentStatusSection currentSession={mockSession} />,
      );

      // Check for region with proper labeling
      const region = container.querySelector('[role="region"]');
      expect(region).toBeInTheDocument();
      expect(region).toHaveAttribute(
        "aria-labelledby",
        "current-status-heading",
      );
    });

    it("should have proper heading with ID for landmark association", () => {
      const mockSession: DBSession = {
        id: "session1",
        userId: "user1",
        startTime: new Date("2024-01-01T00:00:00Z"),
        endTime: null,
        isPaused: false,
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
      } as DBSession;

      render(<CurrentStatusSection currentSession={mockSession} />);

      const heading = screen.getByText("Current Status");
      expect(heading).toHaveAttribute("id", "current-status-heading");
    });

    it("should hide decorative icons from screen readers", () => {
      const mockSession: DBSession = {
        id: "session1",
        userId: "user1",
        startTime: new Date("2024-01-01T00:00:00Z"),
        endTime: null,
        isPaused: false,
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
      } as DBSession;

      const { container } = render(
        <CurrentStatusSection currentSession={mockSession} />,
      );

      // Icons should be hidden from screen readers
      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenIcons.length).toBeGreaterThan(0);
    });

    it("should provide meaningful labels for time displays", () => {
      const mockSession: DBSession = {
        id: "session1",
        userId: "user1",
        startTime: new Date("2024-01-01T00:00:00Z"),
        endTime: null,
        isPaused: false,
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
      } as DBSession;

      const { container } = render(
        <CurrentStatusSection currentSession={mockSession} />,
      );

      // Check for aria-label on time displays
      const labeledElements = container.querySelectorAll(
        '[aria-label*="time"]',
      );
      expect(labeledElements.length).toBeGreaterThan(0);
    });
  });

  describe("StatisticsSection Accessibility", () => {
    const mockSessions: DBSession[] = [
      {
        id: "s1",
        userId: "user1",
        startTime: new Date("2024-01-01"),
        endTime: new Date("2024-01-02"),
        accumulatedPauseTime: 0,
      } as DBSession,
    ];

    const mockEvents: DBEvent[] = [
      {
        id: "e1",
        userId: "user1",
        type: "Orgasm (Self)",
        timestamp: new Date("2024-01-01"),
      } as DBEvent,
    ];

    const mockTasks: DBTask[] = [
      {
        id: "t1",
        userId: "user1",
        title: "Task 1",
        status: "completed",
      } as DBTask,
    ];

    const mockGoals: DBGoal[] = [
      {
        id: "g1",
        userId: "user1",
        title: "Goal 1",
        isCompleted: true,
      } as DBGoal,
    ];

    it("should have proper region landmark with labelledby", () => {
      const { container } = render(
        <StatisticsSection
          sessions={mockSessions}
          events={mockEvents}
          tasks={mockTasks}
          goals={mockGoals}
        />,
      );

      const region = container.querySelector('[role="region"]');
      expect(region).toBeInTheDocument();
      expect(region).toHaveAttribute("aria-labelledby", "statistics-heading");
    });

    it("should have list structure with proper ARIA roles", () => {
      const { container } = render(
        <StatisticsSection
          sessions={mockSessions}
          events={mockEvents}
          tasks={mockTasks}
          goals={mockGoals}
        />,
      );

      const list = container.querySelector('[role="list"]');
      expect(list).toBeInTheDocument();
      expect(list).toHaveAttribute("aria-label", "Session statistics");
    });

    it("should have article role for each stat item", () => {
      const { container } = render(
        <StatisticsSection
          sessions={mockSessions}
          events={mockEvents}
          tasks={mockTasks}
          goals={mockGoals}
        />,
      );

      const articles = container.querySelectorAll('[role="article"]');
      expect(articles.length).toBeGreaterThan(0);
    });

    it("should provide aria-labels for each statistic", () => {
      const { container } = render(
        <StatisticsSection
          sessions={mockSessions}
          events={mockEvents}
          tasks={mockTasks}
          goals={mockGoals}
        />,
      );

      const labeledStats = container.querySelectorAll(
        '[role="article"][aria-label]',
      );
      expect(labeledStats.length).toBeGreaterThan(0);
    });

    it("should have live regions for dynamic count updates", () => {
      const { container } = render(
        <StatisticsSection
          sessions={mockSessions}
          events={mockEvents}
          tasks={mockTasks}
          goals={mockGoals}
        />,
      );

      const liveRegions = container.querySelectorAll('[aria-live="polite"]');
      expect(liveRegions.length).toBeGreaterThan(0);
    });

    it("should hide decorative icons from screen readers", () => {
      const { container } = render(
        <StatisticsSection
          sessions={mockSessions}
          events={mockEvents}
          tasks={mockTasks}
          goals={mockGoals}
        />,
      );

      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenIcons.length).toBeGreaterThan(0);
    });
  });

  describe("SessionHistorySection Accessibility", () => {
    const mockSessions: DBSession[] = [
      {
        id: "s1",
        userId: "user1",
        startTime: new Date("2024-01-01T00:00:00Z"),
        endTime: new Date("2024-01-02T00:00:00Z"),
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
      } as DBSession,
      {
        id: "s2",
        userId: "user1",
        startTime: new Date("2024-01-03T00:00:00Z"),
        endTime: new Date("2024-01-04T00:00:00Z"),
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
      } as DBSession,
    ];

    it("should have proper region landmark with labelledby", () => {
      const { container } = render(
        <SessionHistorySection sessions={mockSessions} />,
      );

      const region = container.querySelector('[role="region"]');
      expect(region).toBeInTheDocument();
      expect(region).toHaveAttribute(
        "aria-labelledby",
        "session-history-heading",
      );
    });

    it("should have list structure for sessions", () => {
      const { container } = render(
        <SessionHistorySection sessions={mockSessions} />,
      );

      const list = container.querySelector('[role="list"]');
      expect(list).toBeInTheDocument();
      expect(list).toHaveAttribute("aria-label", "Past chastity sessions");
    });

    it("should have article role for each session item", () => {
      const { container } = render(
        <SessionHistorySection sessions={mockSessions} />,
      );

      const articles = container.querySelectorAll('[role="article"]');
      expect(articles.length).toBe(2);
    });

    it("should provide meaningful labels for session items", () => {
      const { container } = render(
        <SessionHistorySection sessions={mockSessions} />,
      );

      const labeledSessions = container.querySelectorAll(
        '[role="article"][aria-label*="Session"]',
      );
      expect(labeledSessions.length).toBe(2);
    });

    it("should have proper empty state with status role", () => {
      const { container } = render(<SessionHistorySection sessions={[]} />);

      const status = container.querySelector('[role="status"]');
      expect(status).toBeInTheDocument();
      expect(status).toHaveAttribute("aria-live", "polite");
    });

    it("should have expand/collapse button with proper ARIA attributes", () => {
      const manySessions: DBSession[] = Array.from({ length: 15 }, (_, i) => ({
        id: `s${i}`,
        userId: "user1",
        startTime: new Date(`2024-01-${i + 1}T00:00:00Z`),
        endTime: new Date(`2024-01-${i + 1}T01:00:00Z`),
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
      })) as DBSession[];

      const { container } = render(
        <SessionHistorySection sessions={manySessions} />,
      );

      const expandButton = container.querySelector("[aria-expanded]");
      expect(expandButton).toBeInTheDocument();
      expect(expandButton).toHaveAttribute(
        "aria-controls",
        "session-history-list",
      );
    });

    it("should hide decorative icons from screen readers", () => {
      const { container } = render(
        <SessionHistorySection sessions={mockSessions} />,
      );

      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenIcons.length).toBeGreaterThan(0);
    });
  });

  describe("Keyboard Navigation", () => {
    it("should have focusable interactive elements with proper tab order", () => {
      const manySessions: DBSession[] = Array.from({ length: 15 }, (_, i) => ({
        id: `s${i}`,
        userId: "user1",
        startTime: new Date(`2024-01-${i + 1}T00:00:00Z`),
        endTime: new Date(`2024-01-${i + 1}T01:00:00Z`),
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
      })) as DBSession[];

      const { container } = render(
        <SessionHistorySection sessions={manySessions} />,
      );

      // Check that buttons are focusable
      const buttons = container.querySelectorAll("button");
      buttons.forEach((button) => {
        expect(button).not.toHaveAttribute("tabindex", "-1");
      });
    });
  });

  describe("Screen Reader Compatibility", () => {
    it("should provide context for numeric values", () => {
      const mockSessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01"),
          endTime: new Date("2024-01-02"),
          accumulatedPauseTime: 0,
        } as DBSession,
      ];

      const { container } = render(
        <StatisticsSection
          sessions={mockSessions}
          events={[]}
          tasks={[]}
          goals={[]}
        />,
      );

      // Each statistic should have both the label and value accessible
      const articles = container.querySelectorAll('[role="article"]');
      articles.forEach((article) => {
        const label = article.getAttribute("aria-label");
        expect(label).toBeTruthy();
        expect(label).toMatch(/:/); // Should contain both label and value
      });
    });

    it("should announce status changes with live regions", () => {
      const mockSession: DBSession = {
        id: "session1",
        userId: "user1",
        startTime: new Date("2024-01-01T00:00:00Z"),
        endTime: null,
        isPaused: true,
        accumulatedPauseTime: 300,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
      } as DBSession;

      const { container } = render(
        <CurrentStatusSection currentSession={mockSession} />,
      );

      // Status should be in a live region
      const liveRegion = container.querySelector(
        '[role="status"][aria-live="polite"]',
      );
      expect(liveRegion).toBeInTheDocument();
    });
  });

  describe("Semantic HTML Structure", () => {
    it("should use proper heading hierarchy", () => {
      const mockSession: DBSession = {
        id: "session1",
        userId: "user1",
        startTime: new Date("2024-01-01T00:00:00Z"),
        endTime: null,
        isPaused: false,
        accumulatedPauseTime: 0,
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
      } as DBSession;

      render(<CurrentStatusSection currentSession={mockSession} />);

      // Should have h2 heading
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent("Current Status");
    });

    it("should use semantic landmarks appropriately", () => {
      const mockSessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01"),
          endTime: new Date("2024-01-02"),
          accumulatedPauseTime: 0,
        } as DBSession,
      ];

      const { container } = render(
        <SessionHistorySection sessions={mockSessions} />,
      );

      // Should have proper region landmark
      const region = container.querySelector('[role="region"]');
      expect(region).toBeInTheDocument();
    });
  });
});
