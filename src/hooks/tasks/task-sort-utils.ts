/**
 * Task sorting utilities
 */
import { Task, TaskStatus, TaskPriority } from "@/types/core";
import { TaskSortBy, SortDirection } from "./useTaskManagement";

/**
 * Get comparison value for sorting by created date
 */
const compareByCreatedAt = (a: Task, b: Task): number => {
  return (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0);
};

/**
 * Get comparison value for sorting by due date
 */
const compareByDueDate = (a: Task, b: Task): number => {
  return (
    (a.dueDate?.getTime() ?? Infinity) - (b.dueDate?.getTime() ?? Infinity)
  );
};

/**
 * Get comparison value for sorting by priority
 */
const compareByPriority = (a: Task, b: Task): number => {
  const priorityOrder: Record<TaskPriority, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  return priorityOrder[a.priority] - priorityOrder[b.priority];
};

/**
 * Get comparison value for sorting by status
 */
const compareByStatus = (a: Task, b: Task): number => {
  const statusOrder: Record<TaskStatus, number> = {
    pending: 1,
    in_progress: 2,
    submitted: 3,
    approved: 4,
    rejected: 5,
    completed: 6,
    overdue: 7,
  };
  return statusOrder[a.status] - statusOrder[b.status];
};

/**
 * Get comparison value for sorting by title
 */
const compareByTitle = (a: Task, b: Task): number => {
  return a.title.localeCompare(b.title);
};

/**
 * Sort tasks by the specified criteria
 */
export const sortTasks = (
  tasks: Task[],
  sortBy: TaskSortBy,
  direction: SortDirection,
): Task[] => {
  const sorted = [...tasks];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "createdAt":
        comparison = compareByCreatedAt(a, b);
        break;
      case "dueDate":
        comparison = compareByDueDate(a, b);
        break;
      case "priority":
        comparison = compareByPriority(a, b);
        break;
      case "status":
        comparison = compareByStatus(a, b);
        break;
      case "title":
        comparison = compareByTitle(a, b);
        break;
    }

    return direction === "asc" ? comparison : -comparison;
  });

  return sorted;
};
