/**
 * TaskItem Component Tests
 * Tests for task display and submission functionality
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TaskItem } from "../TaskItem";
import type { DBTask } from "../../../types/database";

// Mock the hooks
vi.mock("../../../hooks/tasks/useTaskItem", () => ({
  useTaskItem: vi.fn(),
}));

vi.mock("../../../hooks/api/useTaskEvidence", () => ({
  useTaskEvidence: vi.fn(() => ({
    isConfigured: true,
    getThumbnailUrl: vi.fn((url) => url),
    getOptimizedUrl: vi.fn((url) => url),
  })),
}));

vi.mock("../useEvidenceUpload", () => ({
  useEvidenceUpload: vi.fn(() => ({
    files: [],
    isDragging: false,
    fileInputRef: { current: null },
    handleFiles: vi.fn(),
    removeFile: vi.fn(),
    uploadAllFiles: vi.fn(),
    setIsDragging: vi.fn(),
  })),
}));

import { useTaskItem } from "../../../hooks/tasks/useTaskItem";

const mockUseTaskItem = useTaskItem as unknown as ReturnType<typeof vi.fn>;

describe("TaskItem", () => {
  const mockOnSubmit = vi.fn();
  const baseDate = new Date("2024-01-15T12:00:00Z");

  const baseMockReturn = {
    note: "",
    isSubmitting: false,
    setNote: vi.fn(),
    setAttachments: vi.fn(),
    handleSubmit: vi.fn(),
    statusConfig: {
      icon: <span>✓</span>,
      text: "Pending",
      borderColor: "border-blue-500",
    },
    priorityStyles: null,
    isOverdue: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTaskItem.mockReturnValue(baseMockReturn);
  });

  const createMockTask = (overrides?: Partial<DBTask>): DBTask => ({
    id: "task-1",
    userId: "user-1",
    text: "Complete test task",
    description: "This is a test task",
    status: "pending",
    priority: "medium",
    assignedBy: "submissive",
    createdAt: baseDate,
    syncStatus: "synced" as const,
    lastModified: baseDate,
    ...overrides,
  });

  describe("Basic Rendering", () => {
    it("should render task details correctly", () => {
      const task = createMockTask();
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      expect(screen.getByText("Complete test task")).toBeInTheDocument();
      expect(screen.getByText("This is a test task")).toBeInTheDocument();
      expect(screen.getByText("Pending")).toBeInTheDocument();
    });

    it("should render without description", () => {
      const task = createMockTask({ description: undefined });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      expect(screen.getByText("Complete test task")).toBeInTheDocument();
      expect(screen.queryByText("This is a test task")).not.toBeInTheDocument();
    });

    it("should display created date", () => {
      const task = createMockTask();
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      expect(screen.getByText(/Created:/)).toBeInTheDocument();
    });
  });

  describe("Status Badges", () => {
    it("should show pending status for pending tasks", () => {
      mockUseTaskItem.mockReturnValue({
        ...baseMockReturn,
        statusConfig: {
          icon: <span data-testid="pending-icon">⏳</span>,
          text: "Pending",
          borderColor: "border-blue-500",
        },
      });

      const task = createMockTask({ status: "pending" });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      expect(screen.getByText("Pending")).toBeInTheDocument();
    });

    it("should show approved status with icon", () => {
      mockUseTaskItem.mockReturnValue({
        ...baseMockReturn,
        statusConfig: {
          icon: <span data-testid="approved-icon">✓</span>,
          text: "Approved",
          borderColor: "border-green-500",
        },
      });

      const task = createMockTask({ status: "approved" });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      expect(screen.getByText("Approved")).toBeInTheDocument();
      expect(screen.getByTestId("approved-icon")).toBeInTheDocument();
    });

    it("should show rejected status with icon", () => {
      mockUseTaskItem.mockReturnValue({
        ...baseMockReturn,
        statusConfig: {
          icon: <span data-testid="rejected-icon">✗</span>,
          text: "Rejected",
          borderColor: "border-red-500",
        },
      });

      const task = createMockTask({ status: "rejected" });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      expect(screen.getByText("Rejected")).toBeInTheDocument();
      expect(screen.getByTestId("rejected-icon")).toBeInTheDocument();
    });
  });

  describe("Priority Display", () => {
    it("should show priority badge when priority is set", () => {
      mockUseTaskItem.mockReturnValue({
        ...baseMockReturn,
        priorityStyles: {
          bgColor: "bg-red-500",
          textColor: "text-white",
        },
      });

      const task = createMockTask({ priority: "high" });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      expect(screen.getByText("HIGH")).toBeInTheDocument();
    });

    it("should not show priority badge when priority is not set", () => {
      const task = createMockTask({ priority: undefined });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      expect(screen.queryByText(/HIGH|MEDIUM|LOW/)).not.toBeInTheDocument();
    });
  });

  describe("Deadline and Countdown", () => {
    it("should display countdown timer when deadline is set", () => {
      const futureDate = new Date(Date.now() + 86400000); // 1 day from now
      const task = createMockTask({ dueDate: futureDate });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      expect(screen.getByText(/Due in:/)).toBeInTheDocument();
    });

    it("should not display countdown when no deadline", () => {
      const task = createMockTask({ dueDate: undefined });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      expect(screen.queryByText(/Due in:/)).not.toBeInTheDocument();
    });

    it("should show overdue indicator", () => {
      mockUseTaskItem.mockReturnValue({
        ...baseMockReturn,
        isOverdue: true,
      });

      const pastDate = new Date(Date.now() - 86400000); // 1 day ago
      const task = createMockTask({ dueDate: pastDate });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      expect(screen.getByText("OVERDUE")).toBeInTheDocument();
    });
  });

  describe("Recurring Task Badge", () => {
    it("should show recurring badge for recurring tasks", () => {
      const task = createMockTask({
        isRecurring: true,
        recurringConfig: {
          frequency: "daily",
          instanceNumber: 3,
        },
      });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      // The recurring badge component should be rendered
      expect(screen.getByText(/Daily/)).toBeInTheDocument();
    });

    it("should not show recurring badge for non-recurring tasks", () => {
      const task = createMockTask({ isRecurring: false });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      expect(
        screen.queryByText(/Daily|Weekly|Monthly/),
      ).not.toBeInTheDocument();
    });
  });

  describe("Task Submission", () => {
    it("should show submission form for pending tasks", () => {
      const task = createMockTask({ status: "pending" });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      expect(
        screen.getByPlaceholderText(/Add submission notes/),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Submit for Review/i }),
      ).toBeInTheDocument();
    });

    it("should not show submission form for submitted tasks", () => {
      const task = createMockTask({ status: "submitted" });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      expect(
        screen.queryByPlaceholderText(/Add submission notes/),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Submit for Review/i }),
      ).not.toBeInTheDocument();
    });

    it("should handle note input", () => {
      const mockSetNote = vi.fn();
      mockUseTaskItem.mockReturnValue({
        ...baseMockReturn,
        setNote: mockSetNote,
      });

      const task = createMockTask({ status: "pending" });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      const noteInput = screen.getByPlaceholderText(/Add submission notes/);
      fireEvent.change(noteInput, { target: { value: "Task completed" } });

      expect(mockSetNote).toHaveBeenCalledWith("Task completed");
    });

    it("should handle submit button click", () => {
      const mockHandleSubmit = vi.fn();
      mockUseTaskItem.mockReturnValue({
        ...baseMockReturn,
        handleSubmit: mockHandleSubmit,
      });

      const task = createMockTask({ status: "pending" });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      const submitButton = screen.getByRole("button", {
        name: /Submit for Review/i,
      });
      fireEvent.click(submitButton);

      expect(mockHandleSubmit).toHaveBeenCalled();
    });

    it("should disable submit button during submission", () => {
      mockUseTaskItem.mockReturnValue({
        ...baseMockReturn,
        isSubmitting: true,
      });

      const task = createMockTask({ status: "pending" });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      const submitButton = screen.getByRole("button", {
        name: /Submitting.../i,
      });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Evidence Display", () => {
    it("should display evidence when attachments exist", () => {
      const task = createMockTask({
        attachments: [
          "https://example.com/image1.jpg",
          "https://example.com/image2.jpg",
        ],
        status: "submitted",
      });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      expect(screen.getByText(/Evidence \(2\):/)).toBeInTheDocument();
    });

    it("should not display submitted evidence section when no attachments", () => {
      const task = createMockTask({
        attachments: undefined,
        status: "submitted",
      });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      // The "Evidence (X):" label should not be shown
      expect(screen.queryByText(/Evidence \(\d+\):/)).not.toBeInTheDocument();
    });

    it("should show evidence upload section for pending tasks", () => {
      const task = createMockTask({
        attachments: undefined,
        status: "pending",
      });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      // Upload section should be visible for pending tasks
      expect(
        screen.getByText(/Upload Evidence \(optional\):/),
      ).toBeInTheDocument();
    });
  });

  describe("Keyholder Feedback", () => {
    it("should display keyholder feedback when provided", () => {
      const task = createMockTask({
        keyholderFeedback: "Great job!",
        status: "approved",
      });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      expect(screen.getByText("Keyholder Feedback:")).toBeInTheDocument();
      expect(screen.getByText("Great job!")).toBeInTheDocument();
    });

    it("should not display feedback section when no feedback", () => {
      const task = createMockTask({ keyholderFeedback: undefined });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      expect(screen.queryByText("Keyholder Feedback:")).not.toBeInTheDocument();
    });
  });

  describe("Consequence Display", () => {
    it("should display reward consequence", () => {
      const task = createMockTask({
        status: "approved",
        consequence: {
          type: "reward",
          description: "30 minutes removed",
          duration: -1800,
        },
      });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      expect(screen.getByText("REWARD")).toBeInTheDocument();
      expect(screen.getByText("30 minutes removed")).toBeInTheDocument();
    });

    it("should display punishment consequence", () => {
      const task = createMockTask({
        status: "rejected",
        consequence: {
          type: "punishment",
          description: "1 hour added",
          duration: 3600,
        },
      });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      expect(screen.getByText("PUNISHMENT")).toBeInTheDocument();
      expect(screen.getByText("1 hour added")).toBeInTheDocument();
    });

    it("should not display consequence when not provided", () => {
      const task = createMockTask({ consequence: undefined });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      expect(screen.queryByText(/REWARD|PUNISHMENT/)).not.toBeInTheDocument();
    });
  });

  describe("Metadata Display", () => {
    it("should display submitted date when task is submitted", () => {
      const submittedDate = new Date("2024-01-16T12:00:00Z");
      const task = createMockTask({
        status: "submitted",
        submittedAt: submittedDate,
      });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      expect(screen.getByText(/Submitted:/)).toBeInTheDocument();
    });

    it("should display approved date when task is approved", () => {
      const approvedDate = new Date("2024-01-17T12:00:00Z");
      const task = createMockTask({
        status: "approved",
        approvedAt: approvedDate,
      });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      expect(screen.getByText(/Approved:/)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels for submit button", () => {
      const task = createMockTask({ status: "pending" });
      render(<TaskItem task={task} onSubmit={mockOnSubmit} userId="user-1" />);

      const submitButton = screen.getByRole("button", {
        name: /Submit for Review/i,
      });
      expect(submitButton).toBeInTheDocument();
    });
  });
});
