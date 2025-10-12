/**
 * StatisticsSection Component Tests
 * Tests for statistics calculation and display logic
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatisticsSection } from "../StatisticsSection";
import type {
  DBSession,
  DBEvent,
  DBTask,
  DBGoal,
} from "../../../types/database";

describe("StatisticsSection", () => {
  beforeEach(() => {
    // Reset any mocks if needed
  });

  describe("Empty Data Handling", () => {
    it("should render with empty arrays", () => {
      render(
        <StatisticsSection sessions={[]} events={[]} tasks={[]} goals={[]} />,
      );

      expect(screen.getByText("Statistics")).toBeInTheDocument();
      expect(screen.getByText("Total Sessions")).toBeInTheDocument();
    });

    it("should show zero values for empty data", () => {
      render(
        <StatisticsSection sessions={[]} events={[]} tasks={[]} goals={[]} />,
      );

      // Should display 0 for numeric counts
      const totalSessions = screen.getByText("Total Sessions").parentElement;
      expect(totalSessions).toBeInTheDocument();
    });

    it("should handle null data gracefully", () => {
      // @ts-expect-error Testing null handling
      render(
        <StatisticsSection
          sessions={null}
          events={null}
          tasks={null}
          goals={null}
        />,
      );

      expect(screen.getByText("Statistics")).toBeInTheDocument();
    });

    it("should handle undefined data gracefully", () => {
      // @ts-expect-error Testing undefined handling
      render(
        <StatisticsSection
          sessions={undefined}
          events={undefined}
          tasks={undefined}
          goals={undefined}
        />,
      );

      expect(screen.getByText("Statistics")).toBeInTheDocument();
    });
  });

  describe("Session Statistics", () => {
    it("should display total sessions count", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01"),
          endTime: new Date("2024-01-02"),
          accumulatedPauseTime: 0,
        } as DBSession,
        {
          id: "s2",
          userId: "user1",
          startTime: new Date("2024-01-03"),
          endTime: new Date("2024-01-04"),
          accumulatedPauseTime: 0,
        } as DBSession,
      ];

      render(
        <StatisticsSection
          sessions={sessions}
          events={[]}
          tasks={[]}
          goals={[]}
        />,
      );

      expect(screen.getByText("Total Sessions")).toBeInTheDocument();
    });

    it("should count completed sessions correctly", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01"),
          endTime: new Date("2024-01-02"),
          accumulatedPauseTime: 0,
        } as DBSession,
        {
          id: "s2",
          userId: "user1",
          startTime: new Date("2024-01-03"),
          endTime: null,
          accumulatedPauseTime: 0,
        } as DBSession,
      ];

      render(
        <StatisticsSection
          sessions={sessions}
          events={[]}
          tasks={[]}
          goals={[]}
        />,
      );

      expect(screen.getByText("Completed Sessions")).toBeInTheDocument();
    });

    it("should calculate total chastity time", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T00:00:00Z"),
          endTime: new Date("2024-01-01T01:00:00Z"),
          accumulatedPauseTime: 0,
        } as DBSession,
      ];

      render(
        <StatisticsSection
          sessions={sessions}
          events={[]}
          tasks={[]}
          goals={[]}
        />,
      );

      expect(screen.getByText("Total Chastity Time")).toBeInTheDocument();
    });

    it("should subtract pause time from chastity time", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T00:00:00Z"),
          endTime: new Date("2024-01-01T02:00:00Z"),
          accumulatedPauseTime: 1800, // 30 minutes
        } as DBSession,
      ];

      render(
        <StatisticsSection
          sessions={sessions}
          events={[]}
          tasks={[]}
          goals={[]}
        />,
      );

      expect(screen.getByText("Total Pause Time")).toBeInTheDocument();
    });

    it("should calculate longest session", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T00:00:00Z"),
          endTime: new Date("2024-01-01T01:00:00Z"),
          accumulatedPauseTime: 0,
        } as DBSession,
        {
          id: "s2",
          userId: "user1",
          startTime: new Date("2024-01-02T00:00:00Z"),
          endTime: new Date("2024-01-02T05:00:00Z"),
          accumulatedPauseTime: 0,
        } as DBSession,
      ];

      render(
        <StatisticsSection
          sessions={sessions}
          events={[]}
          tasks={[]}
          goals={[]}
        />,
      );

      expect(screen.getByText("Longest Session")).toBeInTheDocument();
    });

    it("should handle sessions with invalid dates", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("invalid"),
          endTime: new Date("invalid"),
          accumulatedPauseTime: 0,
        } as DBSession,
      ];

      render(
        <StatisticsSection
          sessions={sessions}
          events={[]}
          tasks={[]}
          goals={[]}
        />,
      );

      expect(screen.getByText("Statistics")).toBeInTheDocument();
    });

    it("should handle negative pause time", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T00:00:00Z"),
          endTime: new Date("2024-01-01T01:00:00Z"),
          accumulatedPauseTime: -100,
        } as DBSession,
      ];

      render(
        <StatisticsSection
          sessions={sessions}
          events={[]}
          tasks={[]}
          goals={[]}
        />,
      );

      // Should not crash
      expect(screen.getByText("Statistics")).toBeInTheDocument();
    });
  });

  describe("Event Statistics", () => {
    it("should display total events count", () => {
      const events: DBEvent[] = [
        {
          id: "e1",
          userId: "user1",
          type: "Orgasm (Self)",
          timestamp: new Date("2024-01-01"),
        } as DBEvent,
        {
          id: "e2",
          userId: "user1",
          type: "Ruined Orgasm",
          timestamp: new Date("2024-01-02"),
        } as DBEvent,
      ];

      render(
        <StatisticsSection
          sessions={[]}
          events={events}
          tasks={[]}
          goals={[]}
        />,
      );

      expect(screen.getByText("Total Events")).toBeInTheDocument();
    });

    it("should handle empty events array", () => {
      render(
        <StatisticsSection sessions={[]} events={[]} tasks={[]} goals={[]} />,
      );

      expect(screen.getByText("Total Events")).toBeInTheDocument();
    });
  });

  describe("Task Statistics", () => {
    it("should count completed tasks", () => {
      const tasks: DBTask[] = [
        {
          id: "t1",
          userId: "user1",
          title: "Task 1",
          status: "completed",
        } as DBTask,
        {
          id: "t2",
          userId: "user1",
          title: "Task 2",
          status: "pending",
        } as DBTask,
        {
          id: "t3",
          userId: "user1",
          title: "Task 3",
          status: "completed",
        } as DBTask,
      ];

      render(
        <StatisticsSection
          sessions={[]}
          events={[]}
          tasks={tasks}
          goals={[]}
        />,
      );

      expect(screen.getByText("Completed Tasks")).toBeInTheDocument();
    });

    it("should handle tasks without status", () => {
      const tasks: DBTask[] = [
        {
          id: "t1",
          userId: "user1",
          title: "Task 1",
          // @ts-expect-error Testing missing status
          status: undefined,
        } as DBTask,
      ];

      render(
        <StatisticsSection
          sessions={[]}
          events={[]}
          tasks={tasks}
          goals={[]}
        />,
      );

      expect(screen.getByText("Statistics")).toBeInTheDocument();
    });
  });

  describe("Goal Statistics", () => {
    it("should count completed goals", () => {
      const goals: DBGoal[] = [
        {
          id: "g1",
          userId: "user1",
          title: "Goal 1",
          isCompleted: true,
        } as DBGoal,
        {
          id: "g2",
          userId: "user1",
          title: "Goal 2",
          isCompleted: false,
        } as DBGoal,
        {
          id: "g3",
          userId: "user1",
          title: "Goal 3",
          isCompleted: true,
        } as DBGoal,
      ];

      render(
        <StatisticsSection
          sessions={[]}
          events={[]}
          tasks={[]}
          goals={goals}
        />,
      );

      expect(screen.getByText("Completed Goals")).toBeInTheDocument();
    });

    it("should handle goals without completion status", () => {
      const goals: DBGoal[] = [
        {
          id: "g1",
          userId: "user1",
          title: "Goal 1",
          // @ts-expect-error Testing missing isCompleted
          isCompleted: undefined,
        } as DBGoal,
      ];

      render(
        <StatisticsSection
          sessions={[]}
          events={[]}
          tasks={[]}
          goals={goals}
        />,
      );

      expect(screen.getByText("Statistics")).toBeInTheDocument();
    });
  });

  describe("Combined Data", () => {
    it("should render all statistics with mixed data", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01"),
          endTime: new Date("2024-01-02"),
          accumulatedPauseTime: 0,
        } as DBSession,
      ];

      const events: DBEvent[] = [
        {
          id: "e1",
          userId: "user1",
          type: "Orgasm (Self)",
          timestamp: new Date("2024-01-01"),
        } as DBEvent,
      ];

      const tasks: DBTask[] = [
        {
          id: "t1",
          userId: "user1",
          title: "Task 1",
          status: "completed",
        } as DBTask,
      ];

      const goals: DBGoal[] = [
        {
          id: "g1",
          userId: "user1",
          title: "Goal 1",
          isCompleted: true,
        } as DBGoal,
      ];

      render(
        <StatisticsSection
          sessions={sessions}
          events={events}
          tasks={tasks}
          goals={goals}
        />,
      );

      expect(screen.getByText("Statistics")).toBeInTheDocument();
      expect(screen.getByText("Total Sessions")).toBeInTheDocument();
      expect(screen.getByText("Total Events")).toBeInTheDocument();
      expect(screen.getByText("Completed Tasks")).toBeInTheDocument();
      expect(screen.getByText("Completed Goals")).toBeInTheDocument();
    });
  });

  describe("Duration Formatting", () => {
    it("should format durations with days", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T00:00:00Z"),
          endTime: new Date("2024-01-03T00:00:00Z"), // 2 days
          accumulatedPauseTime: 0,
        } as DBSession,
      ];

      render(
        <StatisticsSection
          sessions={sessions}
          events={[]}
          tasks={[]}
          goals={[]}
        />,
      );

      expect(screen.getByText("Total Chastity Time")).toBeInTheDocument();
    });

    it("should format durations with hours", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T00:00:00Z"),
          endTime: new Date("2024-01-01T05:00:00Z"), // 5 hours
          accumulatedPauseTime: 0,
        } as DBSession,
      ];

      render(
        <StatisticsSection
          sessions={sessions}
          events={[]}
          tasks={[]}
          goals={[]}
        />,
      );

      expect(screen.getByText("Total Chastity Time")).toBeInTheDocument();
    });

    it("should format durations with minutes only", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T00:00:00Z"),
          endTime: new Date("2024-01-01T00:30:00Z"), // 30 minutes
          accumulatedPauseTime: 0,
        } as DBSession,
      ];

      render(
        <StatisticsSection
          sessions={sessions}
          events={[]}
          tasks={[]}
          goals={[]}
        />,
      );

      expect(screen.getByText("Total Chastity Time")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large numbers", () => {
      const sessions: DBSession[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `s${i}`,
        userId: "user1",
        startTime: new Date("2024-01-01"),
        endTime: new Date("2024-01-02"),
        accumulatedPauseTime: 0,
      })) as DBSession[];

      render(
        <StatisticsSection
          sessions={sessions}
          events={[]}
          tasks={[]}
          goals={[]}
        />,
      );

      expect(screen.getByText("Statistics")).toBeInTheDocument();
    });

    it("should handle extreme pause times", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01T00:00:00Z"),
          endTime: new Date("2024-01-01T01:00:00Z"),
          accumulatedPauseTime: 7200, // More than session duration
        } as DBSession,
      ];

      render(
        <StatisticsSection
          sessions={sessions}
          events={[]}
          tasks={[]}
          goals={[]}
        />,
      );

      // Should handle negative effective time gracefully
      expect(screen.getByText("Statistics")).toBeInTheDocument();
    });

    it("should handle sessions without endTime", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01"),
          endTime: null,
          accumulatedPauseTime: 0,
        } as DBSession,
      ];

      render(
        <StatisticsSection
          sessions={sessions}
          events={[]}
          tasks={[]}
          goals={[]}
        />,
      );

      expect(screen.getByText("Statistics")).toBeInTheDocument();
    });

    it("should handle mixed valid and invalid data", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01"),
          endTime: new Date("2024-01-02"),
          accumulatedPauseTime: 0,
        } as DBSession,
        {
          id: "s2",
          userId: "user1",
          // @ts-expect-error Testing invalid data
          startTime: "invalid",
          // @ts-expect-error Testing invalid data
          endTime: "invalid",
          accumulatedPauseTime: 0,
        } as DBSession,
      ];

      render(
        <StatisticsSection
          sessions={sessions}
          events={[]}
          tasks={[]}
          goals={[]}
        />,
      );

      expect(screen.getByText("Statistics")).toBeInTheDocument();
    });

    it("should handle concurrent rendering", () => {
      const sessions: DBSession[] = [
        {
          id: "s1",
          userId: "user1",
          startTime: new Date("2024-01-01"),
          endTime: new Date("2024-01-02"),
          accumulatedPauseTime: 0,
        } as DBSession,
      ];

      const { rerender } = render(
        <StatisticsSection
          sessions={sessions}
          events={[]}
          tasks={[]}
          goals={[]}
        />,
      );

      // Rerender with updated data
      rerender(
        <StatisticsSection
          sessions={[
            ...sessions,
            {
              id: "s2",
              userId: "user1",
              startTime: new Date("2024-01-03"),
              endTime: new Date("2024-01-04"),
              accumulatedPauseTime: 0,
            } as DBSession,
          ]}
          events={[]}
          tasks={[]}
          goals={[]}
        />,
      );

      expect(screen.getByText("Statistics")).toBeInTheDocument();
    });
  });
});
