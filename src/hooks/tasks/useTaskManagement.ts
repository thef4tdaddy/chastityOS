/**
 * Task Management Hook
 *
 * Extracts task CRUD operations and management logic from TaskManagement component.
 * Provides comprehensive task filtering, sorting, and bulk operations.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Task, TaskStatus, TaskPriority } from "@/types/core";
import { Timestamp } from "firebase/firestore";

// Filter and sort types
export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignedBy?: ("submissive" | "keyholder")[];
  hasDeadline?: boolean;
  searchText?: string;
}

export type TaskSortBy =
  | "createdAt"
  | "dueDate"
  | "priority"
  | "status"
  | "title";

export type SortDirection = "asc" | "desc";

// Input types for creating and updating tasks
export interface CreateTaskInput {
  title: string;
  description?: string;
  category?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  assignedBy?: "submissive" | "keyholder";
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  category?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: Date;
  submissiveNote?: string;
  keyholderFeedback?: string;
}

// Hook return interface
export interface UseTaskManagementReturn {
  // Data
  tasks: Task[];
  filteredTasks: Task[];
  isLoading: boolean;
  error: Error | null;

  // Actions
  createTask: (task: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, updates: UpdateTaskInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  assignTask: (taskId: string, wearerId: string) => Promise<void>;
  bulkAssign: (taskIds: string[], wearerId: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;

  // Filtering
  setFilter: (filter: TaskFilter) => void;
  currentFilter: TaskFilter;
  clearFilters: () => void;

  // Sorting
  setSortBy: (sort: TaskSortBy, direction?: SortDirection) => void;
  currentSort: TaskSortBy;
  currentDirection: SortDirection;

  // State
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

/**
 * Task Management Hook
 *
 * @param keyholderMode - Whether to operate in keyholder mode (shows all wearer tasks)
 * @returns Task management interface with CRUD operations and filtering
 */
export function useTaskManagement(
  _keyholderMode: boolean = false,
): UseTaskManagementReturn {
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentFilter, setCurrentFilter] = useState<TaskFilter>({});
  const [currentSort, setCurrentSort] = useState<TaskSortBy>("createdAt");
  const [currentDirection, setCurrentDirection] =
    useState<SortDirection>("desc");

  // Action states
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Use a ref to always have access to the latest tasks
  const tasksRef = useRef(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Filter tasks based on current filter
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Status filter
    if (currentFilter.status && currentFilter.status.length > 0) {
      filtered = filtered.filter((task) =>
        currentFilter.status!.includes(task.status),
      );
    }

    // Priority filter
    if (currentFilter.priority && currentFilter.priority.length > 0) {
      filtered = filtered.filter((task) =>
        currentFilter.priority!.includes(task.priority),
      );
    }

    // Assigned by filter
    if (currentFilter.assignedBy && currentFilter.assignedBy.length > 0) {
      filtered = filtered.filter((task) =>
        currentFilter.assignedBy!.includes(task.assignedBy),
      );
    }

    // Has deadline filter
    if (currentFilter.hasDeadline !== undefined) {
      filtered = filtered.filter((task) =>
        currentFilter.hasDeadline ? !!task.dueDate : !task.dueDate,
      );
    }

    // Search text filter
    if (currentFilter.searchText) {
      const searchLower = currentFilter.searchText.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          (task.description?.toLowerCase().includes(searchLower) ?? false) ||
          (task.category?.toLowerCase().includes(searchLower) ?? false),
      );
    }

    // Sort tasks
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (currentSort) {
        case "createdAt":
          comparison =
            (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0);
          break;
        case "dueDate":
          comparison =
            (a.dueDate?.getTime() ?? Infinity) -
            (b.dueDate?.getTime() ?? Infinity);
          break;
        case "priority": {
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        }
        case "status": {
          const statusOrder = {
            pending: 1,
            in_progress: 2,
            submitted: 3,
            approved: 4,
            rejected: 5,
            completed: 6,
            overdue: 7,
          };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        }
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
      }

      return currentDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [tasks, currentFilter, currentSort, currentDirection]);

  // Create a new task
  const createTask = useCallback(
    async (task: CreateTaskInput): Promise<Task> => {
      setIsCreating(true);
      setError(null);

      try {
        // Mock implementation - in production, this would call Firebase/API
        const newTask: Task = {
          id: `task-${Date.now()}`,
          userId: "current-user-id", // Would come from auth context
          title: task.title,
          description: task.description,
          category: task.category,
          status: TaskStatus.PENDING,
          priority: task.priority ?? TaskPriority.MEDIUM,
          assignedBy: task.assignedBy ?? "submissive",
          createdAt: Timestamp.fromDate(new Date()),
          dueDate: task.dueDate ? Timestamp.fromDate(task.dueDate) : undefined,
          isRecurring: false,
        };

        setTasks((prev) => {
          const newTasks = [...prev, newTask];
          tasksRef.current = newTasks; // Update ref immediately
          return newTasks;
        });
        return newTask;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to create task");
        setError(error);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [],
  );

  // Update an existing task
  const updateTask = useCallback(
    async (id: string, updates: UpdateTaskInput): Promise<Task> => {
      setIsUpdating(true);
      setError(null);

      try {
        const currentTasks = tasksRef.current;
        const taskIndex = currentTasks.findIndex((t) => t.id === id);

        if (taskIndex === -1) {
          throw new Error(`Task with id ${id} not found`);
        }

        const updatedTask = { ...currentTasks[taskIndex], ...updates };
        const newTasks = [...currentTasks];
        newTasks[taskIndex] = updatedTask;

        setTasks(newTasks);
        tasksRef.current = newTasks; // Update ref immediately

        return updatedTask;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to update task");
        setError(error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  // Delete a task
  const deleteTask = useCallback(async (id: string): Promise<void> => {
    setIsDeleting(true);
    setError(null);

    try {
      setTasks((prev) => {
        const newTasks = prev.filter((t) => t.id !== id);
        tasksRef.current = newTasks; // Update ref immediately
        return newTasks;
      });
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to delete task");
      setError(error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  // Assign a task to a wearer
  const assignTask = useCallback(
    async (taskId: string, _wearerId: string): Promise<void> => {
      setError(null);

      try {
        // In production, this would update the task's wearer assignment
        await updateTask(taskId, {
          // Custom field for wearer assignment (not in base Task type)
          // Would need to extend Task type or use metadata
        } as Partial<Task>);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to assign task");
        setError(error);
        throw error;
      }
    },
    [updateTask],
  );

  // Bulk assign tasks to a wearer
  const bulkAssign = useCallback(
    async (taskIds: string[], wearerId: string): Promise<void> => {
      setError(null);

      try {
        await Promise.all(taskIds.map((id) => assignTask(id, wearerId)));
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to bulk assign tasks");
        setError(error);
        throw error;
      }
    },
    [assignTask],
  );

  // Complete a task
  const completeTask = useCallback(
    async (id: string): Promise<void> => {
      setError(null);

      try {
        await updateTask(id, {
          status: TaskStatus.COMPLETED,
        });
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to complete task");
        setError(error);
        throw error;
      }
    },
    [updateTask],
  );

  // Set filter
  const setFilter = useCallback((filter: TaskFilter) => {
    setCurrentFilter(filter);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setCurrentFilter({});
  }, []);

  // Set sort
  const setSortBy = useCallback(
    (sort: TaskSortBy, direction?: SortDirection) => {
      setCurrentSort(sort);
      if (direction) {
        setCurrentDirection(direction);
      }
    },
    [],
  );

  // Simulate initial load
  useState(() => {
    setTimeout(() => setIsLoading(false), 100);
  });

  return {
    // Data
    tasks,
    filteredTasks,
    isLoading,
    error,

    // Actions
    createTask,
    updateTask,
    deleteTask,
    assignTask,
    bulkAssign,
    completeTask,

    // Filtering
    setFilter,
    currentFilter,
    clearFilters,

    // Sorting
    setSortBy,
    currentSort,
    currentDirection,

    // State
    isCreating,
    isUpdating,
    isDeleting,
  };
}
