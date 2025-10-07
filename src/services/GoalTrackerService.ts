/**
 * Goal Tracker Service
 * Automatically tracks and updates goal progress based on session/task completion
 */
import { goalDBService } from "./database/GoalDBService";
import type { DBSession, DBGoal } from "@/types/database";
import { serviceLogger } from "@/utils/logging";
import { eventDBService } from "./database/EventDBService";

const logger = serviceLogger("GoalTrackerService");

export class GoalTrackerService {
  /**
   * Track session completion and update relevant goals
   */
  static async trackSessionCompletion(session: DBSession): Promise<void> {
    try {
      const userId = session.userId;
      if (!userId) {
        logger.warn("Session has no userId, skipping goal tracking");
        return;
      }

      // Calculate session duration (excluding pauses)
      const sessionDuration = this.calculateSessionDuration(session);
      if (sessionDuration <= 0) {
        logger.debug("Session has no duration, skipping goal tracking");
        return;
      }

      // Get all active duration-based goals for this user
      const goals = await goalDBService.getGoals(userId);
      const activeGoals = goals.filter(
        (g) => g.type === "duration" && !g.isCompleted,
      );

      if (activeGoals.length === 0) {
        logger.debug("No active goals for user", { userId });
        return;
      }

      // Update progress for each active goal
      for (const goal of activeGoals) {
        await this.updateGoalProgress(goal, sessionDuration, session.id);
      }

      logger.info("Session goals updated", {
        sessionId: session.id,
        userId,
        goalCount: activeGoals.length,
        sessionDuration,
      });
    } catch (error) {
      logger.error("Failed to track session completion", {
        error: error as Error,
        sessionId: session.id,
      });
      // Don't throw - goal tracking shouldn't break session completion
    }
  }

  /**
   * Update a single goal's progress
   */
  private static async updateGoalProgress(
    goal: DBGoal,
    additionalProgress: number,
    sessionId: string,
  ): Promise<void> {
    try {
      const newProgress = goal.currentValue + additionalProgress;
      const wasCompleted = goal.isCompleted;

      // Update goal progress
      await goalDBService.updateGoalProgress(goal.id, newProgress);

      // Check if goal was just completed
      if (!wasCompleted && newProgress >= goal.targetValue) {
        await this.handleGoalCompletion(goal, sessionId);
      }

      logger.debug("Goal progress updated", {
        goalId: goal.id,
        previousValue: goal.currentValue,
        newValue: newProgress,
        targetValue: goal.targetValue,
        isCompleted: newProgress >= goal.targetValue,
      });
    } catch (error) {
      logger.error("Failed to update goal progress", {
        error: error as Error,
        goalId: goal.id,
      });
      throw error;
    }
  }

  /**
   * Handle goal completion
   */
  private static async handleGoalCompletion(
    goal: DBGoal,
    sessionId: string,
  ): Promise<void> {
    try {
      logger.info("Goal completed!", {
        goalId: goal.id,
        title: goal.title,
        userId: goal.userId,
      });

      // Log goal completion event
      await eventDBService.logEvent(
        goal.userId,
        "achievement",
        {
          action: "goal_completed",
          title: `Goal Completed: ${goal.title}`,
          description:
            goal.description || `Completed ${goal.title} successfully!`,
          metadata: {
            goalId: goal.id,
            goalType: goal.type,
            targetValue: goal.targetValue,
            unit: goal.unit,
            sessionId,
          },
        },
        { sessionId },
      );

      // TODO: Award points if configured (when points system is implemented)
      // TODO: Unlock achievement if configured (when achievement system is implemented)
      // TODO: Send notification to user (when notification system is implemented)
    } catch (error) {
      logger.error("Failed to handle goal completion", {
        error: error as Error,
        goalId: goal.id,
      });
      // Don't throw - we don't want to break the goal update flow
    }
  }

  /**
   * Calculate effective session duration (excluding pauses)
   */
  private static calculateSessionDuration(session: DBSession): number {
    if (!session.endTime) {
      logger.warn("Session has no end time", { sessionId: session.id });
      return 0;
    }

    const totalTime = session.endTime.getTime() - session.startTime.getTime();
    const effectiveTime =
      totalTime - (session.accumulatedPauseTime || 0) * 1000;

    return Math.max(0, Math.floor(effectiveTime / 1000)); // Return in seconds
  }

  /**
   * Get goal statistics for a user
   */
  static async getGoalStatistics(userId: string): Promise<{
    total: number;
    active: number;
    completed: number;
    completionRate: number;
    averageProgress: number;
  }> {
    try {
      const goals = await goalDBService.getGoals(userId);
      const activeGoals = goals.filter((g) => !g.isCompleted);
      const completedGoals = goals.filter((g) => g.isCompleted);

      const totalProgress = activeGoals.reduce((sum, goal) => {
        const progress =
          goal.targetValue > 0
            ? (goal.currentValue / goal.targetValue) * 100
            : 0;
        return sum + progress;
      }, 0);

      const averageProgress =
        activeGoals.length > 0 ? totalProgress / activeGoals.length : 0;

      const completionRate =
        goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0;

      return {
        total: goals.length,
        active: activeGoals.length,
        completed: completedGoals.length,
        completionRate: Math.round(completionRate * 10) / 10,
        averageProgress: Math.round(averageProgress * 10) / 10,
      };
    } catch (error) {
      logger.error("Failed to get goal statistics", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Calculate progress percentage for a goal
   */
  static calculateProgress(goal: DBGoal): number {
    if (goal.targetValue <= 0) return 0;
    const percentage = (goal.currentValue / goal.targetValue) * 100;
    return Math.min(100, Math.max(0, percentage));
  }

  /**
   * Check if a goal is completed
   */
  static isGoalCompleted(goal: DBGoal): boolean {
    return goal.currentValue >= goal.targetValue || goal.isCompleted;
  }
}
