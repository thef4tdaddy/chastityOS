/**
 * Points Service
 * Handles awarding, revoking, and calculating points for task completion
 */
import { userStatsService } from "../database/UserStatsService";
import { eventDBService } from "../database/EventDBService";
import { serviceLogger } from "@/utils/logging";
import type { Achievement } from "@/types/achievements";
import type { DBTask } from "@/types/database";

const logger = serviceLogger("PointsService");

export interface AwardTaskPointsParams {
  userId: string;
  taskId: string;
  points: number;
  taskTitle: string;
}

export interface AwardTaskPointsResult {
  newTotal: number;
  achievementsUnlocked: Achievement[];
}

export class PointsService {
  /**
   * Award points to user for task completion
   */
  static async awardTaskPoints(
    params: AwardTaskPointsParams,
  ): Promise<AwardTaskPointsResult> {
    try {
      logger.info("Awarding task points", params);

      // 1. Get current user stats
      const stats = await userStatsService.getStats(params.userId);

      // 2. Update points and task completion count
      const newTotal = stats.totalPoints + params.points;
      const newTasksCompleted = stats.tasksCompleted + 1;

      await userStatsService.updateStats(params.userId, {
        totalPoints: newTotal,
        tasksCompleted: newTasksCompleted,
        tasksApproved: stats.tasksApproved + 1,
      });

      // 3. Update streak
      await userStatsService.updateStreak(params.userId);

      // 4. Log point award event
      await eventDBService.logEvent(
        params.userId,
        "points_awarded",
        {
          action: "points_awarded",
          title: "Points Awarded",
          description: `Earned ${params.points} points for completing "${params.taskTitle}"`,
          metadata: {
            taskId: params.taskId,
            taskTitle: params.taskTitle,
            points: params.points,
            newTotal,
            tasksCompleted: newTasksCompleted,
          },
        },
        {},
      );

      // 5. Check for achievements
      // Note: This would integrate with the achievement system
      // For now, we return an empty array
      const achievements: Achievement[] = [];

      // TODO: Integrate with achievement service
      // const achievements = await achievementService.checkTaskAchievements(
      //   params.userId,
      //   newTasksCompleted,
      //   newTotal
      // );

      logger.info("Points awarded successfully", {
        userId: params.userId,
        points: params.points,
        newTotal,
      });

      return { newTotal, achievementsUnlocked: achievements };
    } catch (error) {
      logger.error("Failed to award task points", {
        error: error as Error,
        params,
      });
      throw error;
    }
  }

  /**
   * Revoke points (if task approval is undone)
   */
  static async revokeTaskPoints(params: {
    userId: string;
    taskId: string;
    points: number;
  }): Promise<void> {
    try {
      logger.info("Revoking task points", params);

      const stats = await userStatsService.getStats(params.userId);
      const newTotal = Math.max(0, stats.totalPoints - params.points);
      const newTasksCompleted = Math.max(0, stats.tasksCompleted - 1);

      await userStatsService.updateStats(params.userId, {
        totalPoints: newTotal,
        tasksCompleted: newTasksCompleted,
        tasksApproved: Math.max(0, stats.tasksApproved - 1),
      });

      // Log point revocation event
      await eventDBService.logEvent(
        params.userId,
        "points_revoked",
        {
          action: "points_revoked",
          title: "Points Revoked",
          description: `${params.points} points revoked for task approval undo`,
          metadata: {
            taskId: params.taskId,
            points: params.points,
            newTotal,
          },
        },
        {},
      );

      logger.info("Points revoked successfully", {
        userId: params.userId,
        points: params.points,
        newTotal,
      });
    } catch (error) {
      logger.error("Failed to revoke task points", {
        error: error as Error,
        params,
      });
      throw error;
    }
  }

  /**
   * Calculate default points for task based on priority/complexity
   */
  static calculateTaskPoints(task: {
    priority: DBTask["priority"];
    hasEvidence: boolean;
    dueDate?: Date;
  }): number {
    let basePoints = 10;

    // Priority multiplier
    switch (task.priority) {
      case "critical":
        basePoints *= 3;
        break;
      case "high":
        basePoints *= 2;
        break;
      case "medium":
        basePoints *= 1;
        break;
      case "low":
        basePoints *= 0.5;
        break;
    }

    // Evidence bonus
    if (task.hasEvidence) {
      basePoints += 5;
    }

    // Deadline bonus (completed before deadline)
    if (task.dueDate && new Date() < task.dueDate) {
      basePoints += 5;
    }

    return Math.round(basePoints);
  }
}
