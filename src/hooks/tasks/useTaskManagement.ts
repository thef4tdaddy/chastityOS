/**
 * Task Management Hook
 *
 * Extracts task CRUD operations and management logic from TaskManagement component.
 * Provides comprehensive task filtering, sorting, and bulk operations.
 */

import { useState, useCallback, useMemo } from "react";
import { Task } from "@/types/core";
import { applyAllFilters } from "./task-filter-utils";
import { sortTasks } from "./task-sort-utils";
import { useTaskCRUD } from "./useTaskCRUD";
import { useTaskAssignment } from "./useTaskAssignment";

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

  // CRUD operations
  const { createTask, updateTask, deleteTask } = useTaskCRUD({
    tasks,
    setTasks,
    setError,
    setIsCreating,
    setIsUpdating,
    setIsDeleting,
  });

  // Assignment operations
  const { assignTask, bulkAssign, completeTask } = useTaskAssignment({
    setError,
    updateTask,
  });

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    const filtered = applyAllFilters(tasks, currentFilter);
    return sortTasks(filtered, currentSort, currentDirection);
  }, [tasks, currentFilter, currentSort, currentDirection]);

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
