/**
 * Task Database Service
 * Handles all local database operations for tasks
 */
import { BaseDBService } from "./BaseDBService";
import { db } from "../storage/ChastityDB";
import type { DBTask, TaskFilters, TaskStatus } from "@/types/database";
import { serviceLogger } from "@/utils/logging";
import { generateUUID } from "@/utils";

const logger = serviceLogger("TaskDBService");

class TaskDBService extends BaseDBService<DBTask> {
  constructor() {
    super(db.tasks);
  }

  /**
   * Add a new task
   */
  async addTask(
    userId: string,
    text: string,
    options: {
      description?: string;
      priority?: DBTask["priority"];
      assignedBy?: DBTask["assignedBy"];
      dueDate?: Date;
    } = {},
  ): Promise<string> {
    try {
      const taskId = generateUUID();
      const task: Omit<DBTask, "lastModified" | "syncStatus"> = {
        id: taskId,
        userId,
        text,
        description: options.description,
        status: "pending",
        priority: options.priority || "medium",
        assignedBy: options.assignedBy || "keyholder",
        createdAt: new Date(),
        dueDate: options.dueDate,
      };

      await this.create(task);

      logger.info("Added new task", { taskId, userId, text });
      return taskId;
    } catch (error) {
      logger.error("Failed to add task", {
        error: error as Error,
        userId,
        text,
      });
      throw error;
    }
  }

  /**
   * Get tasks for a user, with optional filtering
   */
  async getTasks(
    userId: string,
    filters: TaskFilters = {},
    limit: number = 50,
    offset: number = 0,
  ): Promise<DBTask[]> {
    try {
      let query = this.table.where("userId").equals(userId);

      if (filters.status) {
        query = query.and((task) => task.status === filters.status);
      }
      if (filters.priority) {
        query = query.and((task) => task.priority === filters.priority);
      }
      if (filters.assignedBy) {
        query = query.and((task) => task.assignedBy === filters.assignedBy);
      }
      if (typeof filters.isOverdue === "boolean") {
        query = query.and((task) => {
          if (!task.dueDate) return false;
          return filters.isOverdue
            ? new Date() > task.dueDate
            : new Date() <= task.dueDate;
        });
      }

      const tasks = await query
        .reverse()
        .sortBy("createdAt")
        .then((results) => results.slice(offset, offset + limit));

      logger.debug("Get tasks", {
        userId,
        filters,
        limit,
        offset,
        returned: tasks.length,
      });
      return tasks;
    } catch (error) {
      logger.error("Failed to get tasks", {
        error: error as Error,
        userId,
        filters,
      });
      throw error;
    }
  }

  /**
   * Update the status of a task
   */
  async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    options: {
      submissiveNote?: string;
      keyholderFeedback?: string;
    } = {},
  ): Promise<void> {
    try {
      const updateData: Partial<DBTask> = { status };
      if (status === "submitted") {
        updateData.submittedAt = new Date();
        updateData.submissiveNote = options.submissiveNote;
      }
      if (status === "approved" || status === "rejected") {
        updateData.approvedAt = new Date();
        updateData.keyholderFeedback = options.keyholderFeedback;
      }
      if (status === "completed") {
        updateData.completedAt = new Date();
      }

      await this.update(taskId, updateData);

      logger.info("Updated task status", { taskId, status });
    } catch (error) {
      logger.error("Failed to update task status", {
        error: error as Error,
        taskId,
        status,
      });
      throw error;
    }
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus(
    userId: string,
    status: TaskStatus,
  ): Promise<DBTask[]> {
    try {
      const tasks = await this.table
        .where({ userId, status })
        .sortBy("createdAt");

      logger.debug("Get tasks by status", {
        userId,
        status,
        count: tasks.length,
      });
      return tasks;
    } catch (error) {
      logger.error("Failed to get tasks by status", {
        error: error as Error,
        userId,
        status,
      });
      throw error;
    }
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(userId: string): Promise<DBTask[]> {
    try {
      const now = new Date();
      const tasks = await this.table
        .where("userId")
        .equals(userId)
        .and((task) =>
          task.dueDate
            ? task.dueDate < now && task.status === "pending"
            : false,
        )
        .sortBy("dueDate");

      logger.debug("Get overdue tasks", { userId, count: tasks.length });
      return tasks;
    } catch (error) {
      logger.error("Failed to get overdue tasks", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Create a new task (alias for addTask method)
   */
  async createTask(
    taskData: Omit<DBTask, "id" | "lastModified" | "syncStatus" | "createdAt">,
  ): Promise<string> {
    try {
      const taskId = generateUUID();
      const task: Omit<DBTask, "lastModified" | "syncStatus"> = {
        id: taskId,
        createdAt: new Date(),
        ...taskData,
      };

      await this.create(task);
      logger.info("Created new task", { taskId, userId: taskData.userId });
      return taskId;
    } catch (error) {
      logger.error("Failed to create task", { error: error as Error });
      throw error;
    }
  }

  /**
   * Delete a task (alias for delete method)
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      await this.delete(taskId);
      logger.info("Deleted task", { taskId });
    } catch (error) {
      logger.error("Failed to delete task", { error: error as Error, taskId });
      throw error;
    }
  }

  /**
   * Get all tasks (alias for getAll method)
   */
  async getAll(): Promise<DBTask[]> {
    try {
      const tasks = await this.table.toArray();
      logger.debug("Get all tasks", { count: tasks.length });
      return tasks;
    } catch (error) {
      logger.error("Failed to get all tasks", { error: error as Error });
      throw error;
    }
  }
}

export const taskDBService = new TaskDBService();
