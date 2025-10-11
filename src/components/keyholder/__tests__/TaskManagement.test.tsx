/**
 * TaskManagement Component Tests
 * Tests for keyholder task management functionality
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TaskManagement } from "../TaskManagement";

// Mock hooks
vi.mock("../../../hooks/api", () => ({
  useTasksQuery: vi.fn(),
  useTaskMutations: vi.fn(),
}));

vi.mock("../../../stores", () => ({
  useNotificationActions: vi.fn(),
}));

import { useTasksQuery, useTaskMutations } from "../../../hooks/api";
import { useNotificationActions } from "../../../stores";

const mockUseTasksQuery = useTasksQuery as unknown as ReturnType<typeof vi.fn>;
const mockUseTaskMutations = useTaskMutations as unknown as ReturnType<
  typeof vi.fn
>;
const mockUseNotificationActions =
  useNotificationActions as unknown as ReturnType<typeof vi.fn>;

describe("TaskManagement", () => {
  const mockShowSuccess = vi.fn();
  const mockShowError = vi.fn();
  const mockApproveTask = vi.fn();
  const mockRejectTask = vi.fn();
  const mockCreateTask = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseNotificationActions.mockReturnValue({
      showSuccess: mockShowSuccess,
      showError: mockShowError,
    });

    mockUseTaskMutations.mockReturnValue({
      approveTask: {
        mutateAsync: mockApproveTask,
        isPending: false,
      },
      rejectTask: {
        mutateAsync: mockRejectTask,
        isPending: false,
      },
      createTask: {
        mutateAsync: mockCreateTask,
        isPending: false,
      },
    });

    mockUseTasksQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
  });

  describe("Basic Rendering", () => {
    it("should render task management header", () => {
      render(<TaskManagement userId="user-1" />);

      expect(screen.getByText("Task Management")).toBeInTheDocument();
    });

    it("should render add task button", () => {
      render(<TaskManagement userId="user-1" />);

      expect(
        screen.getByRole("button", { name: /Add Task/i }),
      ).toBeInTheDocument();
    });

    it("should show no pending tasks message when empty", () => {
      render(<TaskManagement userId="user-1" />);

      expect(screen.getByText("No pending tasks")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should show loading indicator", () => {
      mockUseTasksQuery.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      });

      render(<TaskManagement userId="user-1" />);

      expect(screen.getByText("Loading tasks...")).toBeInTheDocument();
    });

    it("should not show tasks while loading", () => {
      mockUseTasksQuery.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      });

      render(<TaskManagement userId="user-1" />);

      // Task list should not be visible while loading
      expect(screen.getByText("Loading tasks...")).toBeInTheDocument();
      expect(screen.queryByText("No pending tasks")).not.toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should show error message on fetch failure", () => {
      mockUseTasksQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error("Failed to fetch"),
      });

      render(<TaskManagement userId="user-1" />);

      expect(screen.getByText(/Failed to load tasks/i)).toBeInTheDocument();
    });
  });

  describe("Task Display", () => {
    it("should display pending tasks", () => {
      mockUseTasksQuery.mockReturnValue({
        data: [
          {
            id: "task-1",
            text: "Complete task 1",
            status: "pending",
            createdAt: new Date(),
          },
          {
            id: "task-2",
            text: "Complete task 2",
            status: "pending",
            createdAt: new Date(),
          },
        ],
        isLoading: false,
        error: null,
      });

      render(<TaskManagement userId="user-1" />);

      expect(screen.getByText("Complete task 1")).toBeInTheDocument();
      expect(screen.getByText("Complete task 2")).toBeInTheDocument();
    });

    it("should display submitted tasks", () => {
      mockUseTasksQuery.mockReturnValue({
        data: [
          {
            id: "task-1",
            text: "Submitted task",
            status: "submitted",
            submissiveNote: "Task completed",
            createdAt: new Date(),
          },
        ],
        isLoading: false,
        error: null,
      });

      render(<TaskManagement userId="user-1" />);

      expect(screen.getByText("Submitted task")).toBeInTheDocument();
      expect(screen.getByText("Task completed")).toBeInTheDocument();
    });

    it("should not display approved or rejected tasks", () => {
      mockUseTasksQuery.mockReturnValue({
        data: [
          {
            id: "task-1",
            text: "Pending task",
            status: "pending",
            createdAt: new Date(),
          },
          {
            id: "task-2",
            text: "Approved task",
            status: "approved",
            createdAt: new Date(),
          },
          {
            id: "task-3",
            text: "Rejected task",
            status: "rejected",
            createdAt: new Date(),
          },
        ],
        isLoading: false,
        error: null,
      });

      render(<TaskManagement userId="user-1" />);

      expect(screen.getByText("Pending task")).toBeInTheDocument();
      expect(screen.queryByText("Approved task")).not.toBeInTheDocument();
      expect(screen.queryByText("Rejected task")).not.toBeInTheDocument();
    });

    it("should display task metadata", () => {
      mockUseTasksQuery.mockReturnValue({
        data: [
          {
            id: "task-1",
            text: "Test task",
            status: "pending",
            priority: "high",
            deadline: new Date("2024-12-31"),
            description: "Task description",
            createdAt: new Date(),
          },
        ],
        isLoading: false,
        error: null,
      });

      render(<TaskManagement userId="user-1" />);

      expect(screen.getByText("Test task")).toBeInTheDocument();
      expect(screen.getByText("Task description")).toBeInTheDocument();
      expect(screen.getByText(/Priority: high/i)).toBeInTheDocument();
      expect(screen.getByText(/Due: 12\/31\/2024/i)).toBeInTheDocument();
    });
  });

  describe("Add Task Form", () => {
    it("should show form when add button clicked", () => {
      render(<TaskManagement userId="user-1" />);

      const addButton = screen.getByRole("button", { name: /Add Task/i });
      fireEvent.click(addButton);

      expect(screen.getByText("Create New Task")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Task description/i),
      ).toBeInTheDocument();
    });

    it("should hide form when cancel button clicked", () => {
      render(<TaskManagement userId="user-1" />);

      // Open form
      const addButton = screen.getByRole("button", { name: /Add Task/i });
      fireEvent.click(addButton);

      // Close form
      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(screen.queryByText("Create New Task")).not.toBeInTheDocument();
    });

    it("should handle task text input", () => {
      render(<TaskManagement userId="user-1" />);

      // Open form
      const addButton = screen.getByRole("button", { name: /Add Task/i });
      fireEvent.click(addButton);

      // Type in task description
      const input = screen.getByPlaceholderText(/Task description/i);
      fireEvent.change(input, { target: { value: "New task" } });

      expect(input).toHaveValue("New task");
    });

    it("should handle point value input", () => {
      render(<TaskManagement userId="user-1" />);

      // Open form
      const addButton = screen.getByRole("button", { name: /Add Task/i });
      fireEvent.click(addButton);

      // Change point value
      const pointInput = screen.getByPlaceholderText("10");
      fireEvent.change(pointInput, { target: { value: "25" } });

      expect(pointInput).toHaveValue(25);
    });

    it("should limit point value to 0-100", () => {
      render(<TaskManagement userId="user-1" />);

      // Open form
      const addButton = screen.getByRole("button", { name: /Add Task/i });
      fireEvent.click(addButton);

      const pointInput = screen.getByPlaceholderText("10");

      // Try to set value above 100
      fireEvent.change(pointInput, { target: { value: "150" } });
      expect(pointInput).toHaveValue(100);

      // Try to set negative value
      fireEvent.change(pointInput, { target: { value: "-10" } });
      expect(pointInput).toHaveValue(0);
    });

    it("should disable create button when task text is empty", () => {
      render(<TaskManagement userId="user-1" />);

      // Open form
      const addButton = screen.getByRole("button", { name: /Add Task/i });
      fireEvent.click(addButton);

      const createButton = screen.getByRole("button", { name: /Create Task/i });
      expect(createButton).toBeDisabled();
    });

    it("should enable create button when task text is provided", () => {
      render(<TaskManagement userId="user-1" />);

      // Open form
      const addButton = screen.getByRole("button", { name: /Add Task/i });
      fireEvent.click(addButton);

      // Type in task description
      const input = screen.getByPlaceholderText(/Task description/i);
      fireEvent.change(input, { target: { value: "New task" } });

      const createButton = screen.getByRole("button", { name: /Create Task/i });
      expect(createButton).not.toBeDisabled();
    });

    it("should call createTask on form submit", async () => {
      mockCreateTask.mockResolvedValue({});

      render(<TaskManagement userId="user-1" />);

      // Open form
      const addButton = screen.getByRole("button", { name: /Add Task/i });
      fireEvent.click(addButton);

      // Fill form
      const input = screen.getByPlaceholderText(/Task description/i);
      fireEvent.change(input, { target: { value: "New task" } });

      // Submit
      const createButton = screen.getByRole("button", { name: /Create Task/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockCreateTask).toHaveBeenCalledWith({
          userId: "user-1",
          title: "New task",
          description: "",
          pointValue: 10,
        });
      });
    });

    it("should show success notification on task creation", async () => {
      mockCreateTask.mockResolvedValue({});

      render(<TaskManagement userId="user-1" />);

      // Open form
      const addButton = screen.getByRole("button", { name: /Add Task/i });
      fireEvent.click(addButton);

      // Fill and submit
      const input = screen.getByPlaceholderText(/Task description/i);
      fireEvent.change(input, { target: { value: "New task" } });

      const createButton = screen.getByRole("button", { name: /Create Task/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith(
          "Task created successfully",
          "Task Added",
        );
      });
    });

    it("should show error notification on task creation failure", async () => {
      mockCreateTask.mockRejectedValue(new Error("Failed to create"));

      render(<TaskManagement userId="user-1" />);

      // Open form
      const addButton = screen.getByRole("button", { name: /Add Task/i });
      fireEvent.click(addButton);

      // Fill and submit
      const input = screen.getByPlaceholderText(/Task description/i);
      fireEvent.change(input, { target: { value: "New task" } });

      const createButton = screen.getByRole("button", { name: /Create Task/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith(
          "Failed to create task. Please try again.",
          "Task Creation Failed",
        );
      });
    });

    it("should reset form after successful creation", async () => {
      mockCreateTask.mockResolvedValue({});

      render(<TaskManagement userId="user-1" />);

      // Open form
      const addButton = screen.getByRole("button", { name: /Add Task/i });
      fireEvent.click(addButton);

      // Fill and submit
      const input = screen.getByPlaceholderText(/Task description/i);
      fireEvent.change(input, { target: { value: "New task" } });

      const createButton = screen.getByRole("button", { name: /Create Task/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.queryByText("Create New Task")).not.toBeInTheDocument();
      });
    });

    it("should show loading state during creation", () => {
      mockUseTaskMutations.mockReturnValue({
        approveTask: {
          mutateAsync: mockApproveTask,
          isPending: false,
        },
        rejectTask: {
          mutateAsync: mockRejectTask,
          isPending: false,
        },
        createTask: {
          mutateAsync: mockCreateTask,
          isPending: true,
        },
      });

      render(<TaskManagement userId="user-1" />);

      // Open form
      const addButton = screen.getByRole("button", { name: /Add Task/i });
      fireEvent.click(addButton);

      expect(
        screen.getByRole("button", { name: /Creating.../i }),
      ).toBeDisabled();
    });
  });

  describe("Task Actions", () => {
    beforeEach(() => {
      mockUseTasksQuery.mockReturnValue({
        data: [
          {
            id: "task-1",
            text: "Submitted task",
            status: "submitted",
            submissiveNote: "Task completed",
            createdAt: new Date(),
          },
        ],
        isLoading: false,
        error: null,
      });
    });

    it("should show approve button for submitted tasks", () => {
      render(<TaskManagement userId="user-1" />);

      expect(
        screen.getByRole("button", { name: /Approve/i }),
      ).toBeInTheDocument();
    });

    it("should show reject button for submitted tasks", () => {
      render(<TaskManagement userId="user-1" />);

      expect(
        screen.getByRole("button", { name: /Reject/i }),
      ).toBeInTheDocument();
    });

    it("should not show action buttons for pending tasks", () => {
      mockUseTasksQuery.mockReturnValue({
        data: [
          {
            id: "task-1",
            text: "Pending task",
            status: "pending",
            createdAt: new Date(),
          },
        ],
        isLoading: false,
        error: null,
      });

      render(<TaskManagement userId="user-1" />);

      expect(
        screen.queryByRole("button", { name: /Approve/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Reject/i }),
      ).not.toBeInTheDocument();
    });

    it("should call approveTask when approve button clicked", async () => {
      mockApproveTask.mockResolvedValue({});

      render(<TaskManagement userId="user-1" />);

      const approveButton = screen.getByRole("button", { name: /Approve/i });
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(mockApproveTask).toHaveBeenCalledWith({
          taskId: "task-1",
          userId: "user-1",
          feedback: undefined,
        });
      });
    });

    it("should call rejectTask when reject button clicked", async () => {
      mockRejectTask.mockResolvedValue({});

      render(<TaskManagement userId="user-1" />);

      const rejectButton = screen.getByRole("button", { name: /Reject/i });
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(mockRejectTask).toHaveBeenCalledWith({
          taskId: "task-1",
          userId: "user-1",
          feedback: undefined,
        });
      });
    });

    it("should show success notification on approve", async () => {
      mockApproveTask.mockResolvedValue({});

      render(<TaskManagement userId="user-1" />);

      const approveButton = screen.getByRole("button", { name: /Approve/i });
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith(
          "Task approved successfully",
          "Task Updated",
        );
      });
    });

    it("should show success notification on reject", async () => {
      mockRejectTask.mockResolvedValue({});

      render(<TaskManagement userId="user-1" />);

      const rejectButton = screen.getByRole("button", { name: /Reject/i });
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith(
          "Task rejected successfully",
          "Task Updated",
        );
      });
    });

    it("should show error notification on approve failure", async () => {
      mockApproveTask.mockRejectedValue(new Error("Failed to approve"));

      render(<TaskManagement userId="user-1" />);

      const approveButton = screen.getByRole("button", { name: /Approve/i });
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith(
          "Failed to approve task. Please try again.",
          "Task Update Failed",
        );
      });
    });

    it("should disable action buttons during update", () => {
      mockUseTaskMutations.mockReturnValue({
        approveTask: {
          mutateAsync: mockApproveTask,
          isPending: true,
        },
        rejectTask: {
          mutateAsync: mockRejectTask,
          isPending: true,
        },
        createTask: {
          mutateAsync: mockCreateTask,
          isPending: false,
        },
      });

      render(<TaskManagement userId="user-1" />);

      const buttons = screen.getAllByRole("button", { name: /Processing.../i });
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper button labels", () => {
      render(<TaskManagement userId="user-1" />);

      expect(
        screen.getByRole("button", { name: /Add Task/i }),
      ).toBeInTheDocument();
    });

    it("should maintain focus management in forms", () => {
      render(<TaskManagement userId="user-1" />);

      const addButton = screen.getByRole("button", { name: /Add Task/i });
      fireEvent.click(addButton);

      const input = screen.getByPlaceholderText(/Task description/i);
      expect(input).toBeInTheDocument();
    });
  });
});
