/**
 * Achievement Engine
 * Handles achievement detection, progress tracking, and awarding
 */

import {
  achievementDBService,
  sessionDBService,
  taskDBService,
  goalDBService,
} from "./database";
import { DBSession, DBGoal, DBTask, AchievementCategory } from "../types";
import { ACHIEVEMENTS_WITH_IDS } from "../constants/achievements/index";
import { logger } from "../utils/logging";

export class AchievementEngine {
  private initialized = false;

  /**
   * Initialize the achievement engine with predefined achievements
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      logger.info("Initializing Achievement Engine", "AchievementEngine");

      // Check if achievements are already initialized
      const existingAchievements =
        await achievementDBService.getAllAchievements();

      if (existingAchievements.length === 0) {
        // Add all predefined achievements
        for (const achievement of ACHIEVEMENTS_WITH_IDS) {
          await achievementDBService.createAchievement(achievement);
        }
        logger.info(
          `Initialized ${ACHIEVEMENTS_WITH_IDS.length} achievements`,
          "AchievementEngine",
        );
      } else {
        logger.info(
          `Found ${existingAchievements.length} existing achievements`,
          "AchievementEngine",
        );
      }

      this.initialized = true;
    } catch (error) {
      logger.error(
        "Failed to initialize Achievement Engine",
        error,
        "AchievementEngine",
      );
      throw error;
    }
  }

  /**
   * Process session events to check for achievement eligibility
   */
  async processSessionEvent(
    userId: string,
    eventType: "session_start" | "session_end",
    sessionData?: DBSession,
  ): Promise<void> {
    try {
      if (!this.initialized) await this.initialize();

      switch (eventType) {
        case "session_start":
          await this.checkSpecialStartConditions(userId, sessionData);
          break;
        case "session_end":
          await this.checkSessionMilestones(userId);
          await this.checkConsistencyBadges(userId);
          await this.checkStreakAchievements(userId);
          break;
      }
    } catch (error) {
      logger.error(
        "Failed to process session event",
        error,
        "AchievementEngine",
      );
    }
  }

  /**
   * Process task events to check for achievement eligibility
   */
  async processTaskEvent(
    userId: string,
    eventType: "task_completed" | "task_approved" | "task_rejected",
  ): Promise<void> {
    try {
      if (!this.initialized) await this.initialize();

      if (eventType === "task_completed" || eventType === "task_approved") {
        await this.checkTaskAchievements(userId);
      }
    } catch (error) {
      logger.error("Failed to process task event", error, "AchievementEngine");
    }
  }

  /**
   * Process goal events to check for achievement eligibility
   */
  async processGoalEvent(
    userId: string,
    eventType: "goal_completed",
    goalData?: DBGoal,
  ): Promise<void> {
    try {
      if (!this.initialized) await this.initialize();

      if (eventType === "goal_completed") {
        await this.checkGoalAchievements(userId, goalData);
      }
    } catch (error) {
      logger.error("Failed to process goal event", error, "AchievementEngine");
    }
  }

  /**
   * Check session milestone achievements
   */
  private async checkSessionMilestones(userId: string): Promise<void> {
    const sessions = await sessionDBService.getUserSessions(userId);
    const completedSessions = sessions.filter((s: DBSession) => s.endTime);

    if (completedSessions.length === 0) return;

    // Get session milestone achievements
    const milestoneAchievements =
      await achievementDBService.getAchievementsByCategory(
        AchievementCategory.SESSION_MILESTONES,
      );

    for (const achievement of milestoneAchievements) {
      const requirement = achievement.requirements[0];
      if (!requirement) continue; // Skip if no requirements

      if (requirement.type === "session_count") {
        if (completedSessions.length >= requirement.value) {
          await this.awardAchievementIfNotOwned(userId, achievement.id);
        }
      } else if (requirement.type === "session_duration") {
        // Check if any session meets the duration requirement
        const hasLongSession = completedSessions.some((session: DBSession) => {
          if (!session.startTime || !session.endTime) return false;
          const duration =
            (session.endTime.getTime() - session.startTime.getTime()) / 1000;
          return duration >= requirement.value;
        });

        if (hasLongSession) {
          await this.awardAchievementIfNotOwned(userId, achievement.id);
        }
      }
    }
  }

  /**
   * Check consistency badge achievements
   */
  private async checkConsistencyBadges(userId: string): Promise<void> {
    const sessions = await sessionDBService.getUserSessions(userId);
    const completedSessions = sessions.filter((s: DBSession) => s.endTime);

    const consistencyAchievements =
      await achievementDBService.getAchievementsByCategory(
        AchievementCategory.CONSISTENCY_BADGES,
      );

    for (const achievement of consistencyAchievements) {
      const requirement = achievement.requirements[0];
      if (!requirement) continue; // Skip if no requirements

      if (
        requirement.type === "session_count" &&
        completedSessions.length >= requirement.value
      ) {
        await this.awardAchievementIfNotOwned(userId, achievement.id);
      }
    }
  }

  /**
   * Check streak achievements
   */
  private async checkStreakAchievements(userId: string): Promise<void> {
    const sessions = await sessionDBService.getUserSessions(userId);
    const completedSessions = sessions
      .filter((s: DBSession) => s.endTime)
      .sort(
        (a: DBSession, b: DBSession) =>
          a.startTime.getTime() - b.startTime.getTime(),
      );

    if (completedSessions.length === 0) return;

    // Calculate current streak
    const currentStreak = this.calculateCurrentStreak(completedSessions);

    const streakAchievements =
      await achievementDBService.getAchievementsByCategory(
        AchievementCategory.STREAK_ACHIEVEMENTS,
      );

    for (const achievement of streakAchievements) {
      const requirement = achievement.requirements[0];
      if (!requirement) continue; // Skip if no requirements

      if (
        requirement.type === "streak_days" &&
        currentStreak >= requirement.value
      ) {
        await this.awardAchievementIfNotOwned(userId, achievement.id);
      }
    }
  }

  /**
   * Check goal-based achievements
   */
  private async checkGoalAchievements(
    userId: string,
    goalData?: DBGoal,
  ): Promise<void> {
    const goals = await goalDBService.getGoals(userId);
    const completedGoals = goals.filter((g: DBGoal) => g.isCompleted);

    const goalAchievements =
      await achievementDBService.getAchievementsByCategory(
        AchievementCategory.GOAL_BASED,
      );

    for (const achievement of goalAchievements) {
      const requirement = achievement.requirements[0];
      if (!requirement) continue; // Skip if no requirements

      if (requirement.type === "goal_completion") {
        if (completedGoals.length >= requirement.value) {
          await this.awardAchievementIfNotOwned(userId, achievement.id);
        }
      } else if (requirement.type === "special_condition" && goalData) {
        // Check special goal conditions
        if (requirement.condition === "exceed_goal_by_50_percent") {
          const exceeded = goalData.currentValue >= goalData.targetValue * 1.5;
          if (exceeded) {
            await this.awardAchievementIfNotOwned(userId, achievement.id);
          }
        } else if (requirement.condition === "exact_goal_achievement") {
          const difference = Math.abs(
            goalData.currentValue - goalData.targetValue,
          );
          const tolerance = 3600; // 1 hour in seconds
          if (difference <= tolerance) {
            await this.awardAchievementIfNotOwned(userId, achievement.id);
          }
        }
      }
    }
  }

  /**
   * Check task-based achievements
   */
  private async checkTaskAchievements(userId: string): Promise<void> {
    const tasks = await taskDBService.getTasks(userId);
    const completedTasks = tasks.filter(
      (t: DBTask) => t.status === "completed" || t.status === "approved",
    );
    const approvedTasks = tasks.filter((t: DBTask) => t.status === "approved");

    const taskAchievements =
      await achievementDBService.getAchievementsByCategory(
        AchievementCategory.TASK_COMPLETION,
      );

    for (const achievement of taskAchievements) {
      const requirement = achievement.requirements[0];
      if (!requirement) continue; // Skip if no requirements

      if (requirement.type === "task_completion") {
        if (completedTasks.length >= requirement.value) {
          await this.awardAchievementIfNotOwned(userId, achievement.id);
        }
      } else if (requirement.type === "special_condition") {
        if (requirement.condition === "task_approval_rate") {
          const submittedTasks = tasks.filter(
            (t: DBTask) => t.status !== "pending",
          );
          if (submittedTasks.length > 0) {
            const approvalRate =
              (approvedTasks.length / submittedTasks.length) * 100;
            if (approvalRate >= requirement.value) {
              await this.awardAchievementIfNotOwned(userId, achievement.id);
            }
          }
        } else if (requirement.condition === "tasks_completed_early") {
          const earlyTasks = tasks.filter(
            (t: DBTask) =>
              t.completedAt && t.dueDate && t.completedAt < t.dueDate,
          );
          if (earlyTasks.length >= requirement.value) {
            await this.awardAchievementIfNotOwned(userId, achievement.id);
          }
        }
      }
    }
  }

  /**
   * Check if special condition is met
   */
  private checkSpecialCondition(
    condition: string,
    startTime: Date,
    hour: number,
    isWeekend: boolean,
  ): boolean {
    switch (condition) {
      case "sessions_before_8am":
        return hour < 8;
      case "sessions_after_10pm":
        return hour >= 22;
      case "weekend_sessions":
        return isWeekend;
      case "new_year_session":
        return startTime.getMonth() === 0 && startTime.getDate() === 1;
      case "holiday_session":
        return this.isHoliday(startTime);
      default:
        return false;
    }
  }

  /**
   * Check special start time conditions
   */
  private async checkSpecialStartConditions(
    userId: string,
    sessionData?: DBSession,
  ): Promise<void> {
    if (!sessionData) return;

    const startTime = sessionData.startTime;
    const hour = startTime.getHours();
    const day = startTime.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = day === 0 || day === 6;

    const specialAchievements =
      await achievementDBService.getAchievementsByCategory(
        AchievementCategory.SPECIAL_ACHIEVEMENTS,
      );

    // Track special conditions
    for (const achievement of specialAchievements) {
      const requirement = achievement.requirements[0];
      if (!requirement) continue; // Skip if no requirements

      if (requirement.type === "special_condition") {
        const shouldIncrement = this.checkSpecialCondition(
          requirement.condition,
          startTime,
          hour,
          isWeekend,
        );

        if (shouldIncrement) {
          const progress = await achievementDBService.getAchievementProgress(
            userId,
            achievement.id,
          );
          const currentValue = (progress?.currentValue || 0) + 1;

          await achievementDBService.updateAchievementProgress(
            userId,
            achievement.id,
            currentValue,
            requirement.value,
          );

          if (currentValue >= requirement.value) {
            await this.awardAchievementIfNotOwned(userId, achievement.id);
          }
        }
      }
    }
  }

  /**
   * Award achievement if user doesn't already have it
   */
  private async awardAchievementIfNotOwned(
    userId: string,
    achievementId: string,
  ): Promise<void> {
    const userAchievements =
      await achievementDBService.getUserAchievements(userId);
    const alreadyHas = userAchievements.some(
      (ua) => ua.achievementId === achievementId,
    );

    if (!alreadyHas) {
      await achievementDBService.awardAchievement(userId, achievementId, 100);

      // Create notification
      const achievement =
        await achievementDBService.getAchievementById(achievementId);
      if (achievement) {
        await achievementDBService.createNotification(
          userId,
          achievementId,
          "earned",
          "Achievement Unlocked!",
          `You've earned the "${achievement.name}" achievement!`,
        );

        logger.info(
          `Achievement awarded: ${achievement.name} to user ${userId}`,
          "AchievementEngine",
        );
      }
    }
  }

  /**
   * Calculate current streak from sessions
   */
  private calculateCurrentStreak(sessions: DBSession[]): number {
    if (sessions.length === 0) return 0;

    let streak = 0;
    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Start from most recent session and work backwards
    const sortedSessions = [...sessions].sort(
      (a, b) => b.startTime.getTime() - a.startTime.getTime(),
    );

    let expectedDate = new Date(now);
    expectedDate.setHours(0, 0, 0, 0);

    for (const session of sortedSessions) {
      const sessionDate = new Date(session.startTime);
      sessionDate.setHours(0, 0, 0, 0);

      const timeDiff = expectedDate.getTime() - sessionDate.getTime();
      const daysDiff = Math.round(timeDiff / oneDayMs);

      if (daysDiff === 0 || daysDiff === 1) {
        streak++;
        expectedDate = new Date(sessionDate.getTime() - oneDayMs);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Check if a date is a major holiday
   */
  private isHoliday(date: Date): boolean {
    const month = date.getMonth();
    const day = date.getDate();

    // Major holidays (simplified)
    const holidays = [
      { month: 0, day: 1 }, // New Year's Day
      { month: 1, day: 14 }, // Valentine's Day
      { month: 6, day: 4 }, // Independence Day (US)
      { month: 9, day: 31 }, // Halloween
      { month: 10, day: 25 }, // Thanksgiving (approximation)
      { month: 11, day: 25 }, // Christmas
      { month: 11, day: 31 }, // New Year's Eve
    ];

    return holidays.some((h) => h.month === month && h.day === day);
  }

  /**
   * Perform a full achievement check for a user (useful for backfill)
   */
  async performFullCheck(userId: string): Promise<void> {
    try {
      logger.info(
        `Performing full achievement check for user ${userId}`,
        "AchievementEngine",
      );

      await this.checkSessionMilestones(userId);
      await this.checkConsistencyBadges(userId);
      await this.checkStreakAchievements(userId);
      await this.checkTaskAchievements(userId);
      await this.checkGoalAchievements(userId);

      logger.info(
        `Full achievement check completed for user ${userId}`,
        "AchievementEngine",
      );
    } catch (error) {
      logger.error(
        "Failed to perform full achievement check",
        error,
        "AchievementEngine",
      );
      throw error;
    }
  }
}

// Export singleton instance
export const achievementEngine = new AchievementEngine();
