/**
 * Goal Database Service
 * Handles all local database operations for goals
 */
import { BaseDBService } from "./BaseDBService";
import { db } from "../storage/ChastityDB";
import type { DBGoal } from "@/types/database";
import { serviceLogger } from "@/utils/logging";
import { generateUUID } from "@/utils";

const logger = serviceLogger("GoalDBService");

class GoalDBService extends BaseDBService<DBGoal> {
  constructor() {
    super(db.goals);
  }

  /**
   * Add a new goal
   */
  async addGoal(options: {
    userId: string;
    title: string;
    type: DBGoal["type"];
    targetValue: number;
    unit: string;
    description?: string;
    dueDate?: Date;
    isPublic?: boolean;
    createdBy?: DBGoal["createdBy"];
  }): Promise<string> {
    try {
      const goalId = generateUUID();
      const goal: Omit<DBGoal, "lastModified" | "syncStatus"> = {
        id: goalId,
        userId: options.userId,
        title: options.title,
        type: options.type,
        targetValue: options.targetValue,
        currentValue: 0,
        unit: options.unit,
        isCompleted: false,
        createdAt: new Date(),
        description: options.description,
        dueDate: options.dueDate,
        isPublic: options.isPublic || false,
        createdBy: options.createdBy || "keyholder",
      };

      await this.create(goal);

      logger.info("Added new goal", {
        goalId,
        userId: options.userId,
        title: options.title,
      });
      return goalId;
    } catch (error) {
      logger.error("Failed to add goal", {
        error: error as Error,
        userId: options.userId,
        title: options.title,
      });
      throw error;
    }
  }

  /**
   * Get goals for a user
   */
  async getGoals(userId: string): Promise<DBGoal[]> {
    try {
      const goals = await this.table
        .where("userId")
        .equals(userId)
        .sortBy("createdAt");
      logger.debug("Get goals", { userId, count: goals.length });
      return goals;
    } catch (error) {
      logger.error("Failed to get goals", { error: error as Error, userId });
      throw error;
    }
  }

  /**
   * Update the progress of a goal
   */
  async updateGoalProgress(
    goalId: string,
    currentValue: number,
  ): Promise<void> {
    try {
      const goal = await this.findById(goalId);
      if (!goal) {
        throw new Error("Goal not found");
      }

      const isCompleted = currentValue >= goal.targetValue;
      const updateData: Partial<DBGoal> = {
        currentValue,
        isCompleted,
      };
      if (isCompleted) {
        updateData.completedAt = new Date();
      }

      await this.update(goalId, updateData);

      logger.info("Updated goal progress", {
        goalId,
        currentValue,
        isCompleted,
      });
    } catch (error) {
      logger.error("Failed to update goal progress", {
        error: error as Error,
        goalId,
        currentValue,
      });
      throw error;
    }
  }

  /**
   * Get goals by completion status
   */
  async getGoalsByStatus(
    userId: string,
    isCompleted: boolean,
  ): Promise<DBGoal[]> {
    try {
      const goals = await this.table
        .where({ userId, isCompleted })
        .sortBy("createdAt");

      logger.debug("Get goals by status", {
        userId,
        isCompleted,
        count: goals.length,
      });
      return goals;
    } catch (error) {
      logger.error("Failed to get goals by status", {
        error: error as Error,
        userId,
        isCompleted,
      });
      throw error;
    }
  }
}

export const goalDBService = new GoalDBService();
