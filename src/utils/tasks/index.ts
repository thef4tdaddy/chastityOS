import { TaskFilters, TaskStatus } from "../../types/database";

/**
 * Task Management Utilities
 * Query keys and helper functions for task hooks
 */

// Query Keys
export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (userId: string, filters?: TaskFilters) =>
    [...taskKeys.lists(), userId, filters] as const,
  detail: (taskId: string) => [...taskKeys.all, "detail", taskId] as const,
  byStatus: (userId: string, status: TaskStatus) =>
    [...taskKeys.all, "status", userId, status] as const,
  assigned: (userId: string) => [...taskKeys.all, "assigned", userId] as const,
  assignedBy: (keyholderUid: string) =>
    [...taskKeys.all, "assignedBy", keyholderUid] as const,
} as const;
