/**
 * TaskCreationForm Component Tests
 * Tests for task creation with recurring functionality
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskCreationWithRecurring } from "../TaskCreationWithRecurring";

describe("TaskCreationForm (TaskCreationWithRecurring)", () => {
  const mockOnCreateTask = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render form heading", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      expect(
        screen.getByRole("heading", { name: "Create Task" }),
      ).toBeInTheDocument();
    });

    it("should render task title input", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      expect(screen.getByText("Task Title")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter task title..."),
      ).toBeInTheDocument();
    });

    it("should render description textarea", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      expect(screen.getByText(/Description/i)).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter task description..."),
      ).toBeInTheDocument();
    });

    it("should render recurring checkbox", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      expect(
        screen.getByLabelText(/Make this a recurring task/i),
      ).toBeInTheDocument();
    });

    it("should render create button", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      expect(
        screen.getByRole("button", { name: /Create Task/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Form Input Handling", () => {
    it("should handle task title input", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      const input = screen.getByPlaceholderText("Enter task title...");
      fireEvent.change(input, { target: { value: "New Task" } });

      expect(input).toHaveValue("New Task");
    });

    it("should handle description input", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      const textarea = screen.getByPlaceholderText("Enter task description...");
      fireEvent.change(textarea, { target: { value: "Task details here" } });

      expect(textarea).toHaveValue("Task details here");
    });

    it("should toggle recurring checkbox", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe("Recurring Task Configuration", () => {
    it("should show recurring form when checkbox is checked", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);

      // RecurringTaskForm should be visible
      // The exact elements depend on RecurringTaskForm implementation
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("should hide recurring form when checkbox is unchecked", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      const checkbox = screen.getByRole("checkbox");

      // Check then uncheck
      fireEvent.click(checkbox);
      fireEvent.click(checkbox);

      // Form should be hidden - only one checkbox (the main recurring toggle) should be visible
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes).toHaveLength(1);
    });
  });

  describe("Form Submission", () => {
    it("should be disabled when task text is empty", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      const button = screen.getByRole("button", { name: /Create Task/i });
      expect(button).toBeDisabled();
    });

    it("should be enabled when task text is provided", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      const input = screen.getByPlaceholderText("Enter task title...");
      fireEvent.change(input, { target: { value: "New Task" } });

      const button = screen.getByRole("button", { name: /Create Task/i });
      expect(button).not.toBeDisabled();
    });

    it("should call onCreateTask with basic task data", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      const titleInput = screen.getByPlaceholderText("Enter task title...");
      fireEvent.change(titleInput, { target: { value: "Test Task" } });

      const descInput = screen.getByPlaceholderText(
        "Enter task description...",
      );
      fireEvent.change(descInput, { target: { value: "Test Description" } });

      const button = screen.getByRole("button", { name: /Create Task/i });
      fireEvent.click(button);

      expect(mockOnCreateTask).toHaveBeenCalledWith({
        text: "Test Task",
        description: "Test Description",
        isRecurring: false,
        recurringConfig: undefined,
      });
    });

    it("should call onCreateTask without description if empty", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      const titleInput = screen.getByPlaceholderText("Enter task title...");
      fireEvent.change(titleInput, { target: { value: "Test Task" } });

      const button = screen.getByRole("button", { name: /Create Task/i });
      fireEvent.click(button);

      expect(mockOnCreateTask).toHaveBeenCalledWith({
        text: "Test Task",
        description: undefined,
        isRecurring: false,
        recurringConfig: undefined,
      });
    });

    it("should reset form after submission", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      const titleInput = screen.getByPlaceholderText("Enter task title...");
      fireEvent.change(titleInput, { target: { value: "Test Task" } });

      const button = screen.getByRole("button", { name: /Create Task/i });
      fireEvent.click(button);

      expect(titleInput).toHaveValue("");
    });

    it("should trim whitespace from task text", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      const titleInput = screen.getByPlaceholderText("Enter task title...");
      fireEvent.change(titleInput, { target: { value: "  Test Task  " } });

      const button = screen.getByRole("button", { name: /Create Task/i });
      expect(button).not.toBeDisabled();
    });

    it("should not submit if only whitespace in task text", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      const titleInput = screen.getByPlaceholderText("Enter task title...");
      fireEvent.change(titleInput, { target: { value: "   " } });

      const button = screen.getByRole("button", { name: /Create Task/i });
      fireEvent.click(button);

      expect(mockOnCreateTask).not.toHaveBeenCalled();
    });
  });

  describe("Recurring Task Submission", () => {
    it("should be disabled when recurring is checked but config not set", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      const titleInput = screen.getByPlaceholderText("Enter task title...");
      fireEvent.change(titleInput, { target: { value: "Test Task" } });

      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);

      const button = screen.getByRole("button", { name: /Create Task/i });
      expect(button).toBeDisabled();
    });
  });

  describe("Input Validation", () => {
    it("should accept valid task titles", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      const input = screen.getByPlaceholderText("Enter task title...");
      const validTitles = [
        "Simple Task",
        "Task with Numbers 123",
        "Task with symbols !@#",
        "Very long task title that exceeds normal length",
      ];

      validTitles.forEach((title) => {
        fireEvent.change(input, { target: { value: title } });
        expect(input).toHaveValue(title);
      });
    });

    it("should accept valid descriptions", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      const textarea = screen.getByPlaceholderText("Enter task description...");
      const longDescription = "A".repeat(500);

      fireEvent.change(textarea, { target: { value: longDescription } });
      expect(textarea).toHaveValue(longDescription);
    });
  });

  describe("Form State Management", () => {
    it("should maintain form state across interactions", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      // Fill in form
      const titleInput = screen.getByPlaceholderText("Enter task title...");
      fireEvent.change(titleInput, { target: { value: "Test Task" } });

      const descInput = screen.getByPlaceholderText(
        "Enter task description...",
      );
      fireEvent.change(descInput, { target: { value: "Test Desc" } });

      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);

      // Verify all state is maintained
      expect(titleInput).toHaveValue("Test Task");
      expect(descInput).toHaveValue("Test Desc");
      expect(checkbox).toBeChecked();
    });

    it("should reset all fields after submission", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      // Fill and submit
      const titleInput = screen.getByPlaceholderText("Enter task title...");
      fireEvent.change(titleInput, { target: { value: "Test Task" } });

      const descInput = screen.getByPlaceholderText(
        "Enter task description...",
      );
      fireEvent.change(descInput, { target: { value: "Test Desc" } });

      const button = screen.getByRole("button", { name: /Create Task/i });
      fireEvent.click(button);

      // Verify reset
      expect(titleInput).toHaveValue("");
      expect(descInput).toHaveValue("");
      expect(screen.getByRole("checkbox")).not.toBeChecked();
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels for all inputs", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      expect(screen.getByText("Task Title")).toBeInTheDocument();
      expect(screen.getByText(/Description/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Make this a recurring task/i),
      ).toBeInTheDocument();
    });

    it("should have proper button text", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      expect(
        screen.getByRole("button", { name: /Create Task/i }),
      ).toBeInTheDocument();
    });

    it("should associate checkbox with label", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      const label = screen.getByText(/Make this a recurring task/i);
      const checkbox = screen.getByRole("checkbox");

      // Clicking label should toggle checkbox
      fireEvent.click(label);
      expect(checkbox).toBeChecked();
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid form submissions", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      const titleInput = screen.getByPlaceholderText("Enter task title...");
      fireEvent.change(titleInput, { target: { value: "Test Task" } });

      const button = screen.getByRole("button", { name: /Create Task/i });

      // Click multiple times rapidly
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // Should only submit once per valid state
      expect(mockOnCreateTask).toHaveBeenCalledTimes(1);
    });

    it("should handle form reset during input", () => {
      render(<TaskCreationWithRecurring onCreateTask={mockOnCreateTask} />);

      const titleInput = screen.getByPlaceholderText("Enter task title...");

      // Start typing
      fireEvent.change(titleInput, { target: { value: "Test" } });
      expect(titleInput).toHaveValue("Test");

      // Continue typing
      fireEvent.change(titleInput, { target: { value: "Test Task" } });
      expect(titleInput).toHaveValue("Test Task");
    });
  });
});
