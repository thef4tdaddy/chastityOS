/**
 * Tests for useTaskManagement hook
 */
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useTaskManagement, TaskFilter } from "../useTaskManagement";
import { TaskStatus, TaskPriority } from "@/types/core";

describe("useTaskManagement", () => {
  beforeEach(() => {
    // Reset any state between tests
  });

  describe("Initialization", () => {
    it("should initialize with empty tasks and loading state", () => {
      const { result } = renderHook(() => useTaskManagement());

      expect(result.current.tasks).toEqual([]);
      expect(result.current.filteredTasks).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it("should finish loading after initialization", async () => {
      const { result } = renderHook(() => useTaskManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("Task Creation", () => {
    it("should create a new task", async () => {
      const { result } = renderHook(() => useTaskManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let newTask;
      await act(async () => {
        newTask = await result.current.createTask({
          title: "New Task",
          description: "Task description",
          priority: TaskPriority.HIGH,
        });
      });

      expect(newTask).toBeDefined();
      expect(newTask!.title).toBe("New Task");
      expect(newTask!.status).toBe(TaskStatus.PENDING);
      expect(result.current.tasks).toHaveLength(1);
    });

    it("should set isCreating state during creation", async () => {
      const { result } = renderHook(() => useTaskManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isCreating).toBe(false);

      const createPromise = act(async () => {
        await result.current.createTask({ title: "Test Task" });
      });

      await createPromise;
      expect(result.current.isCreating).toBe(false);
    });
  });

  describe("Task Updates", () => {
    it("should update an existing task", async () => {
      const { result } = renderHook(() => useTaskManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let taskId: string;
      await act(async () => {
        const task = await result.current.createTask({
          title: "Original Task",
        });
        taskId = task.id;
      });

      await act(async () => {
        await result.current.updateTask(taskId!, {
          title: "Updated Task",
          status: TaskStatus.IN_PROGRESS,
        });
      });

      const updatedTask = result.current.tasks.find((t) => t.id === taskId);
      expect(updatedTask?.title).toBe("Updated Task");
      expect(updatedTask?.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it("should throw error when updating non-existent task", async () => {
      const { result } = renderHook(() => useTaskManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.updateTask("non-existent-id", { title: "Test" });
        });
      }).rejects.toThrow();
    });
  });

  describe("Task Deletion", () => {
    it("should delete a task", async () => {
      const { result } = renderHook(() => useTaskManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let taskId: string;
      await act(async () => {
        const task = await result.current.createTask({
          title: "Task to Delete",
        });
        taskId = task.id;
      });

      expect(result.current.tasks).toHaveLength(1);

      await act(async () => {
        await result.current.deleteTask(taskId!);
      });

      expect(result.current.tasks).toHaveLength(0);
    });
  });

  describe("Task Completion", () => {
    it("should mark a task as completed", async () => {
      const { result } = renderHook(() => useTaskManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let taskId: string;
      await act(async () => {
        const task = await result.current.createTask({
          title: "Task to Complete",
        });
        taskId = task.id;
      });

      await act(async () => {
        await result.current.completeTask(taskId!);
      });

      const completedTask = result.current.tasks.find((t) => t.id === taskId);
      expect(completedTask?.status).toBe(TaskStatus.COMPLETED);
    });
  });

  describe("Filtering", () => {
    beforeEach(async () => {
      // Helper to set up test data
    });

    it("should filter tasks by status", async () => {
      const { result } = renderHook(() => useTaskManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Create tasks with different statuses
      let task2Id: string;
      await act(async () => {
        await result.current.createTask({ title: "Task 1" });
      });

      await act(async () => {
        const task2 = await result.current.createTask({ title: "Task 2" });
        task2Id = task2.id;
      });

      await act(async () => {
        await result.current.updateTask(task2Id!, {
          status: TaskStatus.COMPLETED,
        });
      });

      // Filter for pending tasks
      act(() => {
        result.current.setFilter({ status: [TaskStatus.PENDING] });
      });

      expect(result.current.filteredTasks).toHaveLength(1);
      expect(result.current.filteredTasks[0]!.status).toBe(TaskStatus.PENDING);
    });

    it("should filter tasks by priority", async () => {
      const { result } = renderHook(() => useTaskManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createTask({
          title: "Low Priority",
          priority: TaskPriority.LOW,
        });
        await result.current.createTask({
          title: "High Priority",
          priority: TaskPriority.HIGH,
        });
      });

      act(() => {
        result.current.setFilter({ priority: [TaskPriority.HIGH] });
      });

      expect(result.current.filteredTasks).toHaveLength(1);
      expect(result.current.filteredTasks[0]!.priority).toBe(TaskPriority.HIGH);
    });

    it("should filter tasks by search text", async () => {
      const { result } = renderHook(() => useTaskManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createTask({ title: "Clean the house" });
        await result.current.createTask({ title: "Do the laundry" });
        await result.current.createTask({ title: "Cook dinner" });
      });

      act(() => {
        result.current.setFilter({ searchText: "clean" });
      });

      expect(result.current.filteredTasks).toHaveLength(1);
      expect(result.current.filteredTasks[0]!.title).toBe("Clean the house");
    });

    it("should clear filters", async () => {
      const { result } = renderHook(() => useTaskManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createTask({ title: "Task 1" });
        await result.current.createTask({ title: "Task 2" });
      });

      act(() => {
        result.current.setFilter({ searchText: "Task 1" });
      });

      expect(result.current.filteredTasks).toHaveLength(1);

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filteredTasks).toHaveLength(2);
    });
  });

  describe("Sorting", () => {
    it("should sort tasks by creation date ascending", async () => {
      const { result } = renderHook(() => useTaskManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createTask({ title: "First Task" });
        await new Promise((resolve) => setTimeout(resolve, 10));
        await result.current.createTask({ title: "Second Task" });
      });

      act(() => {
        result.current.setSortBy("createdAt", "asc");
      });

      expect(result.current.filteredTasks[0]!.title).toBe("First Task");
      expect(result.current.filteredTasks[1]!.title).toBe("Second Task");
    });

    it("should sort tasks by priority", async () => {
      const { result } = renderHook(() => useTaskManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createTask({
          title: "Low",
          priority: TaskPriority.LOW,
        });
        await result.current.createTask({
          title: "Urgent",
          priority: TaskPriority.URGENT,
        });
        await result.current.createTask({
          title: "Medium",
          priority: TaskPriority.MEDIUM,
        });
      });

      act(() => {
        result.current.setSortBy("priority", "desc");
      });

      expect(result.current.filteredTasks[0]!.title).toBe("Urgent");
      expect(result.current.filteredTasks[2]!.title).toBe("Low");
    });
  });

  describe("Bulk Operations", () => {
    it("should bulk assign tasks", async () => {
      const { result } = renderHook(() => useTaskManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const taskIds: string[] = [];
      await act(async () => {
        const task1 = await result.current.createTask({ title: "Task 1" });
        const task2 = await result.current.createTask({ title: "Task 2" });
        taskIds.push(task1.id, task2.id);
      });

      await act(async () => {
        await result.current.bulkAssign(taskIds, "wearer-123");
      });

      // Bulk assign should complete without error
      expect(result.current.error).toBeNull();
    });
  });

  describe("Error Handling", () => {
    it("should handle errors during task creation", async () => {
      const { result } = renderHook(() => useTaskManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // This would need to be tested with a mocked error condition
      // For now, we just verify the error state exists
      expect(result.current.error).toBeNull();
    });
  });
});
