/**
 * RecurringTaskBadge Component Tests
 * Tests for recurring task indicator display
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecurringTaskBadge } from "../RecurringTaskBadge";
import type { DBTask } from "../../../types/database";

describe("RecurringTaskBadge", () => {
  const createMockTask = (overrides?: Partial<DBTask>): DBTask => ({
    id: "task-1",
    userId: "user-1",
    keyholderUserId: "keyholder-1",
    text: "Test task",
    status: "pending",
    createdAt: new Date(),
    isRecurring: true,
    recurringConfig: {
      frequency: "daily",
      instanceNumber: 1,
    },
    ...overrides,
  });

  describe("Rendering", () => {
    it("should render daily recurring badge", () => {
      const task = createMockTask({
        recurringConfig: {
          frequency: "daily",
          instanceNumber: 1,
        },
      });
      render(<RecurringTaskBadge task={task} />);

      expect(screen.getByText("Daily")).toBeInTheDocument();
    });

    it("should render weekly recurring badge", () => {
      const task = createMockTask({
        recurringConfig: {
          frequency: "weekly",
          instanceNumber: 2,
        },
      });
      render(<RecurringTaskBadge task={task} />);

      expect(screen.getByText("Weekly")).toBeInTheDocument();
    });

    it("should render monthly recurring badge", () => {
      const task = createMockTask({
        recurringConfig: {
          frequency: "monthly",
          instanceNumber: 3,
        },
      });
      render(<RecurringTaskBadge task={task} />);

      expect(screen.getByText("Monthly")).toBeInTheDocument();
    });

    it("should render custom frequency", () => {
      const task = createMockTask({
        recurringConfig: {
          frequency: "custom",
          instanceNumber: 1,
        },
      });
      render(<RecurringTaskBadge task={task} />);

      expect(screen.getByText("Custom")).toBeInTheDocument();
    });
  });

  describe("Instance Number", () => {
    it("should display instance number by default", () => {
      const task = createMockTask({
        recurringConfig: {
          frequency: "daily",
          instanceNumber: 5,
        },
      });
      render(<RecurringTaskBadge task={task} />);

      expect(screen.getByText("#5")).toBeInTheDocument();
    });

    it("should hide instance number when showInstanceNumber is false", () => {
      const task = createMockTask({
        recurringConfig: {
          frequency: "daily",
          instanceNumber: 5,
        },
      });
      render(<RecurringTaskBadge task={task} showInstanceNumber={false} />);

      expect(screen.queryByText("#5")).not.toBeInTheDocument();
    });

    it("should not display instance number when not provided", () => {
      const task = createMockTask({
        recurringConfig: {
          frequency: "daily",
          instanceNumber: undefined,
        },
      });
      render(<RecurringTaskBadge task={task} />);

      expect(screen.queryByText(/#\d+/)).not.toBeInTheDocument();
    });
  });

  describe("Conditional Rendering", () => {
    it("should not render when task is not recurring", () => {
      const task = createMockTask({ isRecurring: false });
      const { container } = render(<RecurringTaskBadge task={task} />);

      expect(container.firstChild).toBeNull();
    });

    it("should not render when recurringConfig is missing", () => {
      const task = createMockTask({
        isRecurring: true,
        recurringConfig: undefined,
      });
      const { container } = render(<RecurringTaskBadge task={task} />);

      expect(container.firstChild).toBeNull();
    });

    it("should render when both isRecurring and recurringConfig are present", () => {
      const task = createMockTask({
        isRecurring: true,
        recurringConfig: {
          frequency: "daily",
          instanceNumber: 1,
        },
      });
      render(<RecurringTaskBadge task={task} />);

      expect(screen.getByText("Daily")).toBeInTheDocument();
    });
  });

  describe("Styling and Icons", () => {
    it("should display sync icon", () => {
      const task = createMockTask();
      const { container } = render(<RecurringTaskBadge task={task} />);

      // Check for the icon (FaSync) - it should be in the DOM
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });
});
