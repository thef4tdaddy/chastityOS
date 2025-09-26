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
    challengeType?: DBGoal["challengeType"];
    challengeYear?: number;
    isSpecialChallenge?: boolean;
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
        challengeType: options.challengeType,
        challengeYear: options.challengeYear,
        isSpecialChallenge: options.isSpecialChallenge || false,
      };

      await this.create(goal);

      logger.info("Added new goal", {
        goalId,
        userId: options.userId,
        title: options.title,
        isSpecialChallenge: options.isSpecialChallenge,
        challengeType: options.challengeType,
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

  /**
   * Get special challenge goals for a user
   */
  async getSpecialChallengeGoals(userId: string): Promise<DBGoal[]> {
    try {
      const goals = await this.table
        .where({ userId, isSpecialChallenge: true })
        .sortBy("createdAt");

      logger.debug("Get special challenge goals", {
        userId,
        count: goals.length,
      });
      return goals;
    } catch (error) {
      logger.error("Failed to get special challenge goals", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get or create special challenge goal for the current year
   */
  async getOrCreateChallengeGoal(
    userId: string,
    challengeType: "locktober" | "no_nut_november",
  ): Promise<DBGoal> {
    try {
      const currentYear = new Date().getFullYear();

      // Check if challenge goal already exists for this year
      const existingGoal = await this.table
        .where({
          userId,
          challengeType,
          challengeYear: currentYear,
        })
        .first();

      if (existingGoal) {
        return existingGoal;
      }

      // Create new challenge goal
      const challengeNames = {
        locktober: "Locktober",
        no_nut_november: "No Nut November",
      };

      const challengeDescriptions = {
        locktober: "Complete the entire month of October in chastity",
        no_nut_november: "Complete the entire month of November without orgasm",
      };

      const targetDays = challengeType === "locktober" ? 31 : 30;
      const targetValue = targetDays * 24 * 60 * 60; // Convert to seconds

      // Set due date to end of challenge month
      const dueDate = new Date(
        currentYear,
        challengeType === "locktober" ? 10 : 11,
        1,
      ); // Month 10 = Nov, 11 = Dec

      const goalId = await this.addGoal({
        userId,
        title: `${challengeNames[challengeType]} ${currentYear}`,
        type: "special_challenge",
        targetValue,
        unit: "seconds",
        description: challengeDescriptions[challengeType],
        dueDate,
        isPublic: true,
        createdBy: "submissive",
        challengeType,
        challengeYear: currentYear,
        isSpecialChallenge: true,
      });

      const goal = await this.findById(goalId);
      if (!goal) {
        throw new Error("Failed to retrieve created challenge goal");
      }

      logger.info("Created new challenge goal", {
        goalId,
        userId,
        challengeType,
        challengeYear: currentYear,
      });

      return goal;
    } catch (error) {
      logger.error("Failed to get or create challenge goal", {
        error: error as Error,
        userId,
        challengeType,
      });
      throw error;
    }
  }

  /**
   * Check if user has active challenge for current month
   */
  async hasActiveChallengeForCurrentMonth(userId: string): Promise<{
    hasLocktober: boolean;
    hasNoNutNovember: boolean;
  }> {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth(); // 0-based: October = 9, November = 10
      const currentYear = currentDate.getFullYear();

      const challenges = await this.table
        .where({
          userId,
          challengeYear: currentYear,
          isSpecialChallenge: true,
        })
        .toArray();

      const hasLocktober =
        currentMonth === 9 &&
        challenges.some(
          (goal) => goal.challengeType === "locktober" && !goal.isCompleted,
        );

      const hasNoNutNovember =
        currentMonth === 10 &&
        challenges.some(
          (goal) =>
            goal.challengeType === "no_nut_november" && !goal.isCompleted,
        );

      return { hasLocktober, hasNoNutNovember };
    } catch (error) {
      logger.error("Failed to check active challenges", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }
}

export const goalDBService = new GoalDBService();
