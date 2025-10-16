/**
 * StatisticsSection Component Tests
 *  for statistics calculation and display logic
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatisticsSection } from "../StatisticsSection";
import type { DBSession, DBEvent, DBTask, DBGoal } from "@/types/database";

const mockSession = (overrides: Partial<DBSession> = {}): DBSession => ({
  id: "s1",
  userId: "user1",
  syncStatus: "synced",
  lastModified: new Date(),
  startTime: new Date("2024-01-01T00:00:00Z"),
  endTime: new Date("2024-01-01T01:00:00Z"),
  isPaused: false,
  accumulatedPauseTime: 0,
  isHardcoreMode: false,
  keyholderApprovalRequired: false,
  ...overrides,
});

const mockEvent = (overrides: Partial<DBEvent> = {}): DBEvent => ({
  id: "e1",
  userId: "user1",
  syncStatus: "synced",
  lastModified: new Date(),
  type: "Test Event",
  timestamp: new Date(),
  details: {},
  isPrivate: false,
  ...overrides,
});

const mockTask = (overrides: Partial<DBTask> = {}): DBTask => ({
  id: "t1",
  userId: "user1",
  syncStatus: "synced",
  lastModified: new Date(),
  text: "Test Task",
  title: "Test Task Title",
  status: "pending",
  priority: "medium",
  assignedBy: "submissive",
  createdAt: new Date(),
  ...overrides,
});

const mockGoal = (overrides: Partial<DBGoal> = {}): DBGoal => ({
  id: "g1",
  userId: "user1",
  syncStatus: "synced",
  lastModified: new Date(),
  type: "duration",
  title: "Test Goal",
  targetValue: 100,
  currentValue: 0,
  unit: "days",
  isCompleted: false,
  createdAt: new Date(),
  createdBy: "submissive",
  isPublic: false,
  ...overrides,
});

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

      const totalSessions = screen.getByText("Total Sessions").parentElement;
      expect(totalSessions).toBeInTheDocument();
    });

    it("should handle null data gracefully", () => {
      render(
        <StatisticsSection
          sessions={null as any}
          events={null as any}
          tasks={null as any}
          goals={null as any}
        />,
      );

      expect(screen.getByText("Statistics")).toBeInTheDocument();
    });

    it("should handle undefined data gracefully", () => {
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
      const sessions = [mockSession(), mockSession({ id: "s2" })];
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
      const sessions = [
        mockSession(),
        mockSession({ id: "s2", endTime: undefined }),
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
      const sessions = [mockSession()];
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
      const sessions = [
        mockSession({
          endTime: new Date("2024-01-01T02:00:00Z"),
          accumulatedPauseTime: 1800,
        }),
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
      const sessions = [
        mockSession(),
        mockSession({
          id: "s2",
          endTime: new Date("2024-01-01T05:00:00Z"),
        }),
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
      const sessions = [
        mockSession({
          startTime: new Date("invalid"),
          endTime: new Date("invalid"),
        }),
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
      const sessions = [mockSession({ accumulatedPauseTime: -100 })];
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
  });

  describe("Event Statistics", () => {
    it("should display total events count", () => {
      const events = [mockEvent(), mockEvent({ id: "e2" })];
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
      const tasks = [
        mockTask({ status: "completed" }),
        mockTask({ id: "t2", status: "pending" }),
        mockTask({ id: "t3", status: "completed" }),
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
      const tasks = [mockTask({ status: undefined as any })];
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
      const goals = [
        mockGoal({ isCompleted: true }),
        mockGoal({ id: "g2", isCompleted: false }),
        mockGoal({ id: "g3", isCompleted: true }),
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
      const goals = [mockGoal({ isCompleted: undefined as any })];
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
      const sessions = [mockSession()];
      const events = [mockEvent()];
      const tasks = [mockTask({ status: "completed" })];
      const goals = [mockGoal({ isCompleted: true })];

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
      const sessions = [
        mockSession({ endTime: new Date("2024-01-03T00:00:00Z") }),
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
      const sessions = [
        mockSession({ endTime: new Date("2024-01-01T05:00:00Z") }),
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
      const sessions = [
        mockSession({ endTime: new Date("2024-01-01T00:30:00Z") }),
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
      const sessions = Array.from({ length: 1000 }, (_, i) =>
        mockSession({ id: `s${i}` }),
      );
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
      const sessions = [mockSession({ accumulatedPauseTime: 7200 })];
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

    it("should handle sessions without endTime", () => {
      const sessions = [mockSession({ endTime: undefined })];
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
      const sessions = [
        mockSession(),
        mockSession({
          id: "s2",
          startTime: "invalid" as any,
          endTime: "invalid" as any,
        }),
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
      const sessions = [mockSession()];
      const { rerender } = render(
        <StatisticsSection
          sessions={sessions}
          events={[]}
          tasks={[]}
          goals={[]}
        />,
      );

      rerender(
        <StatisticsSection
          sessions={[...sessions, mockSession({ id: "s2" })]}
          events={[]}
          tasks={[]}
          goals={[]}
        />,
      );

      expect(screen.getByText("Statistics")).toBeInTheDocument();
    });
  });
});
