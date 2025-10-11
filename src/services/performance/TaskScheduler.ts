/**
 * Task Scheduler Service
 * Breaks up long tasks and schedules work efficiently
 * Phase 4: Advanced Optimizations - Long Task Optimization
 */

import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("TaskScheduler");

type TaskCallback = () => void | Promise<void>;

interface ScheduledTask {
  id: string;
  callback: TaskCallback;
  priority: "high" | "normal" | "low";
  deadline?: number;
}

class TaskScheduler {
  private taskQueue: ScheduledTask[] = [];
  private isProcessing = false;
  private taskIdCounter = 0;

  /**
   * Schedule a task to run on idle
   */
  scheduleIdleTask(
    callback: TaskCallback,
    options: { timeout?: number; priority?: "high" | "normal" | "low" } = {},
  ): string {
    const { timeout = 5000, priority = "normal" } = options;

    const taskId = `task-${this.taskIdCounter++}`;
    const task: ScheduledTask = {
      id: taskId,
      callback,
      priority,
      deadline: timeout ? Date.now() + timeout : undefined,
    };

    this.taskQueue.push(task);
    this.sortTaskQueue();

    logger.debug("Task scheduled", { taskId, priority, timeout });

    if (!this.isProcessing) {
      this.processNextTask();
    }

    return taskId;
  }

  /**
   * Process the next task in the queue
   */
  private processNextTask(): void {
    if (this.taskQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const task = this.taskQueue.shift()!;

    // Check if task has expired
    if (task.deadline && Date.now() > task.deadline) {
      logger.warn("Task expired", { taskId: task.id });
      this.processNextTask();
      return;
    }

    if ("requestIdleCallback" in window) {
      const timeout = task.deadline ? task.deadline - Date.now() : 5000;

      requestIdleCallback(
        async (deadline) => {
          await this.executeTask(task, deadline);
          this.processNextTask();
        },
        { timeout: Math.max(timeout, 0) },
      );
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(async () => {
        await this.executeTask(task);
        this.processNextTask();
      }, 0);
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(
    task: ScheduledTask,
    deadline?: IdleDeadline,
  ): Promise<void> {
    const startTime = performance.now();

    try {
      // Check if we have time to execute
      if (deadline && deadline.timeRemaining() < 1) {
        logger.debug("Insufficient time, requeueing task", {
          taskId: task.id,
        });
        this.taskQueue.unshift(task);
        return;
      }

      await task.callback();

      const duration = performance.now() - startTime;
      logger.debug("Task completed", { taskId: task.id, duration });

      // Warn about long tasks
      if (duration > 50) {
        logger.warn("Long task detected", { taskId: task.id, duration });
      }
    } catch (error) {
      logger.error("Task execution failed", {
        taskId: task.id,
        error: error as Error,
      });
    }
  }

  /**
   * Break up a long task into smaller chunks
   */
  async breakUpTask<T>(
    items: T[],
    processor: (item: T) => void | Promise<void>,
    options: {
      chunkSize?: number;
      onProgress?: (progress: number) => void;
    } = {},
  ): Promise<void> {
    const { chunkSize = 10, onProgress } = options;

    logger.debug("Breaking up task", {
      totalItems: items.length,
      chunkSize,
    });

    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }

    for (let i = 0; i < chunks.length; i++) {
      await new Promise<void>((resolve) => {
        this.scheduleIdleTask(async () => {
          const chunk = chunks[i];
          if (!chunk) return;
          for (const item of chunk) {
            await processor(item);
          }

          if (onProgress) {
            const progress = ((i + 1) / chunks.length) * 100;
            onProgress(progress);
          }

          resolve();
        });
      });
    }

    logger.debug("Task completed", { totalChunks: chunks.length });
  }

  /**
   * Yield to the main thread
   */
  async yieldToMain(): Promise<void> {
    return new Promise((resolve) => {
      const scheduler = (
        window as Window & { scheduler?: { yield: () => Promise<void> } }
      ).scheduler;

      if ("scheduler" in window && scheduler && "yield" in scheduler) {
        scheduler.yield().then(resolve);
      } else if ("requestIdleCallback" in window) {
        requestIdleCallback(() => resolve());
      } else {
        setTimeout(resolve, 0);
      }
    });
  }

  /**
   * Run a task with automatic yielding
   */
  async runWithYield<T>(
    items: T[],
    processor: (item: T) => void | Promise<void>,
    yieldInterval = 50, // Yield every 50ms
  ): Promise<void> {
    let lastYield = performance.now();

    for (const item of items) {
      await processor(item);

      const now = performance.now();
      if (now - lastYield > yieldInterval) {
        await this.yieldToMain();
        lastYield = performance.now();
      }
    }
  }

  /**
   * Sort task queue by priority
   */
  private sortTaskQueue(): void {
    const priorityOrder = { high: 0, normal: 1, low: 2 };

    this.taskQueue.sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Cancel a scheduled task
   */
  cancelTask(taskId: string): boolean {
    const index = this.taskQueue.findIndex((task) => task.id === taskId);
    if (index !== -1) {
      this.taskQueue.splice(index, 1);
      logger.debug("Task cancelled", { taskId });
      return true;
    }
    return false;
  }

  /**
   * Clear all queued tasks
   */
  clearQueue(): void {
    const count = this.taskQueue.length;
    this.taskQueue = [];
    logger.info("Queue cleared", { tasksCleared: count });
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      queuedTasks: this.taskQueue.length,
      isProcessing: this.isProcessing,
      tasksByPriority: {
        high: this.taskQueue.filter((t) => t.priority === "high").length,
        normal: this.taskQueue.filter((t) => t.priority === "normal").length,
        low: this.taskQueue.filter((t) => t.priority === "low").length,
      },
    };
  }
}

// Export singleton instance
export const taskScheduler = new TaskScheduler();
