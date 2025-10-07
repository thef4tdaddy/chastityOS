/**
 * Recurring Task Service
 * Handles recurring task logic, date calculations, and instance creation
 */
import { taskDBService } from "../database/TaskDBService";
import type { DBTask, RecurringConfig } from "@/types/database";
import { generateUUID } from "@/utils";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("RecurringTaskService");

export class RecurringTaskService {
  /**
   * Calculate next due date based on recurring config
   */
  static calculateNextDueDate(config: RecurringConfig): Date {
    const now = new Date();

    switch (config.frequency) {
      case "daily":
        return this.addDays(now, config.interval || 1);

      case "weekly":
        return this.calculateNextWeekday(now, config.daysOfWeek || [1]);

      case "monthly":
        return this.calculateNextMonthday(now, config.dayOfMonth || 1);

      case "custom":
        return this.addDays(now, config.interval || 7);

      default:
        throw new Error(`Unknown frequency: ${config.frequency}`);
    }
  }

  /**
   * Create next instance of recurring task
   */
  static async createNextInstance(parentTask: DBTask): Promise<string> {
    if (!parentTask.isRecurring || !parentTask.recurringConfig) {
      throw new Error("Task is not recurring");
    }

    const nextDueDate = this.calculateNextDueDate(parentTask.recurringConfig);
    const instanceNumber = (parentTask.recurringConfig.instanceNumber || 0) + 1;

    // Generate series ID if this is the first instance
    const seriesId = parentTask.recurringSeriesId || generateUUID();

    const newTask: Omit<DBTask, "id" | "lastModified" | "syncStatus"> = {
      // Copy from parent
      userId: parentTask.userId,
      text: parentTask.text,
      title: parentTask.title,
      description: parentTask.description,
      category: parentTask.category,
      priority: parentTask.priority,
      assignedBy: parentTask.assignedBy,

      // New instance data
      status: "pending",
      dueDate: nextDueDate,
      createdAt: new Date(),

      // Recurring metadata
      isRecurring: true,
      recurringConfig: {
        ...parentTask.recurringConfig,
        instanceNumber,
        parentTaskId: parentTask.id,
        nextDueDate,
      },
      recurringSeriesId: seriesId,
    };

    // Create new task
    const taskId = await taskDBService.createTask(newTask);

    logger.info("Created recurring task instance", {
      parentTaskId: parentTask.id,
      newTaskId: taskId,
      instanceNumber,
      nextDueDate,
    });

    return taskId;
  }

  /**
   * Get all instances in a recurring series
   */
  static async getRecurringSeries(seriesId: string): Promise<DBTask[]> {
    try {
      const allTasks = await taskDBService.getAll();
      return allTasks.filter((task) => task.recurringSeriesId === seriesId);
    } catch (error) {
      logger.error("Failed to get recurring series", {
        error: error as Error,
        seriesId,
      });
      throw error;
    }
  }

  /**
   * Stop a recurring series (mark all future instances as cancelled)
   */
  static async stopRecurringSeries(seriesId: string): Promise<void> {
    try {
      const tasks = await this.getRecurringSeries(seriesId);

      for (const task of tasks) {
        if (["pending", "submitted"].includes(task.status)) {
          await taskDBService.updateTaskStatus(task.id, "cancelled");
        }
      }

      logger.info("Stopped recurring series", {
        seriesId,
        tasksAffected: tasks.length,
      });
    } catch (error) {
      logger.error("Failed to stop recurring series", {
        error: error as Error,
        seriesId,
      });
      throw error;
    }
  }

  /**
   * Helper: Add days to date
   */
  private static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Helper: Calculate next occurrence of specific weekday(s)
   */
  private static calculateNextWeekday(from: Date, daysOfWeek: number[]): Date {
    const result = new Date(from);

    for (let i = 1; i <= 7; i++) {
      result.setDate(from.getDate() + i);
      if (daysOfWeek.includes(result.getDay())) {
        return result;
      }
    }

    return result; // Fallback to 7 days later
  }

  /**
   * Helper: Calculate next occurrence of specific day of month
   */
  private static calculateNextMonthday(from: Date, dayOfMonth: number): Date {
    const result = new Date(from);

    // Try current month
    result.setDate(dayOfMonth);
    if (result > from) {
      return result;
    }

    // Move to next month
    result.setMonth(result.getMonth() + 1);
    result.setDate(dayOfMonth);
    return result;
  }
}
