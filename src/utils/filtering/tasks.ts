/**
 * Task filtering utilities
 */
import { Task, TaskStatus, TaskPriority } from "@/types/core";
import { TaskFilter } from "./useTaskManagement";

/**
 * Apply status filter to tasks
 */
export const filterByStatus = (
  tasks: Task[],
  statusFilter?: TaskStatus[],
): Task[] => {
  if (!statusFilter || statusFilter.length === 0) return tasks;
  return tasks.filter((task) => statusFilter.includes(task.status));
};

/**
 * Apply priority filter to tasks
 */
export const filterByPriority = (
  tasks: Task[],
  priorityFilter?: TaskPriority[],
): Task[] => {
  if (!priorityFilter || priorityFilter.length === 0) return tasks;
  return tasks.filter((task) => priorityFilter.includes(task.priority));
};

/**
 * Apply assigned by filter to tasks
 */
export const filterByAssignedBy = (
  tasks: Task[],
  assignedByFilter?: ("submissive" | "keyholder")[],
): Task[] => {
  if (!assignedByFilter || assignedByFilter.length === 0) return tasks;
  return tasks.filter((task) => assignedByFilter.includes(task.assignedBy));
};

/**
 * Apply deadline filter to tasks
 */
export const filterByDeadline = (
  tasks: Task[],
  hasDeadline?: boolean,
): Task[] => {
  if (hasDeadline === undefined) return tasks;
  return tasks.filter((task) => (hasDeadline ? !!task.dueDate : !task.dueDate));
};

/**
 * Apply search text filter to tasks
 */
export const filterBySearchText = (
  tasks: Task[],
  searchText?: string,
): Task[] => {
  if (!searchText) return tasks;
  const searchLower = searchText.toLowerCase();
  return tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchLower) ||
      (task.description?.toLowerCase().includes(searchLower) ?? false) ||
      (task.category?.toLowerCase().includes(searchLower) ?? false),
  );
};

/**
 * Apply all filters to tasks
 */
export const applyAllFilters = (tasks: Task[], filter: TaskFilter): Task[] => {
  let filtered = [...tasks];
  filtered = filterByStatus(filtered, filter.status);
  filtered = filterByPriority(filtered, filter.priority);
  filtered = filterByAssignedBy(filtered, filter.assignedBy);
  filtered = filterByDeadline(filtered, filter.hasDeadline);
  filtered = filterBySearchText(filtered, filter.searchText);
  return filtered;
};
