/**
 * Achievement Integration Service
 * Integrates achievement engine with existing app events
 */

import { achievementEngine } from "./AchievementEngine";
import { achievementDBService } from "./database";
import { sessionDBService, taskDBService, goalDBService } from "./database";
import { logger } from "../utils/logging";
import type { DBSession, DBGoal, DBAchievement } from "../types/database";

// Type for session event data used in achievements
export interface SessionEventData {
  sessionId?: string;
  duration?: number;
  startTime?: Date;
  endTime?: Date;
  isHardcoreMode?: boolean;
  goalDuration?: number;
  actualDuration?: number;
}

// Type for goal event data used in achievements
export interface GoalEventData {
  goalId?: string;
  type?: string;
  targetValue?: number;
  currentValue?: number;
  completedAt?: Date;
}

export class AchievementIntegrationService {
  private initialized = false;

  /**
   * Initialize the integration service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize the achievement engine first
      await achievementEngine.initialize();

      // Set up event listeners
      this.setupEventListeners();

      this.initialized = true;
      logger.info(
        "Achievement integration service initialized",
        "AchievementIntegration",
      );
    } catch (error) {
      logger.error(
        "Failed to initialize achievement integration",
        error,
        "AchievementIntegration",
      );
      throw error;
    }
  }

  /**
   * Set up event listeners for various app events
   */
  private setupEventListeners(): void {
    // These would ideally be event emitters, but for now we'll provide methods
    // that components can call when events occur
    logger.info("Achievement event listeners ready", "AchievementIntegration");
  }

  /**
   * Handle session start event
   */
  async onSessionStart(
    userId: string,
    sessionData: SessionEventData,
  ): Promise<void> {
    try {
      // Get the full session data if sessionId is provided
      let fullSessionData: DBSession | undefined = undefined;
      if (sessionData.sessionId) {
        fullSessionData = await sessionDBService.findById(sessionData.sessionId);
      }

      await achievementEngine.processSessionEvent(
        userId,
        "session_start",
        fullSessionData,
      );
      logger.debug(
        `Processed session start for user ${userId}`,
        "AchievementIntegration",
      );
    } catch (error) {
      logger.error(
        "Failed to process session start",
        error,
        "AchievementIntegration",
      );
    }
  }

  /**
   * Handle session end event
   */
  async onSessionEnd(
    userId: string,
    sessionData?: SessionEventData,
  ): Promise<void> {
    try {
      // Get the full session data if sessionId is provided
      let fullSessionData: DBSession | undefined = undefined;
      if (sessionData?.sessionId) {
        fullSessionData = await sessionDBService.findById(sessionData.sessionId);
      }

      await achievementEngine.processSessionEvent(
        userId,
        "session_end",
        fullSessionData,
      );
      logger.debug(
        `Processed session end for user ${userId}`,
        "AchievementIntegration",
      );
    } catch (error) {
      logger.error(
        "Failed to process session end",
        error,
        "AchievementIntegration",
      );
    }
  }

  /**
   * Handle task completion event
   */
  async onTaskCompleted(userId: string): Promise<void> {
    try {
      await achievementEngine.processTaskEvent(userId, "task_completed");
      logger.debug(
        `Processed task completion for user ${userId}`,
        "AchievementIntegration",
      );
    } catch (error) {
      logger.error(
        "Failed to process task completion",
        error,
        "AchievementIntegration",
      );
    }
  }

  /**
   * Handle task approval event
   */
  async onTaskApproved(userId: string): Promise<void> {
    try {
      await achievementEngine.processTaskEvent(userId, "task_approved");
      logger.debug(
        `Processed task approval for user ${userId}`,
        "AchievementIntegration",
      );
    } catch (error) {
      logger.error(
        "Failed to process task approval",
        error,
        "AchievementIntegration",
      );
    }
  }

  /**
   * Handle task rejection event
   */
  async onTaskRejected(userId: string): Promise<void> {
    try {
      await achievementEngine.processTaskEvent(userId, "task_rejected");
      logger.debug(
        `Processed task rejection for user ${userId}`,
        "AchievementIntegration",
      );
    } catch (error) {
      logger.error(
        "Failed to process task rejection",
        error,
        "AchievementIntegration",
      );
    }
  }

  /**
   * Handle goal completion event
   */
  async onGoalCompleted(
    userId: string,
    goalData?: GoalEventData,
  ): Promise<void> {
    try {
      // Get the full goal data if goalId is provided
      let fullGoalData: DBGoal | undefined = undefined;
      if (goalData?.goalId) {
        fullGoalData = await goalDBService.findById(goalData.goalId);
      }

      await achievementEngine.processGoalEvent(
        userId,
        "goal_completed",
        fullGoalData,
      );
      logger.debug(
        `Processed goal completion for user ${userId}`,
        "AchievementIntegration",
      );
    } catch (error) {
      logger.error(
        "Failed to process goal completion",
        error,
        "AchievementIntegration",
      );
    }
  }

  /**
   * Perform a full achievement check for a user (useful for new users or backfill)
   */
  async performFullCheck(userId: string): Promise<void> {
    try {
      await achievementEngine.performFullCheck(userId);
      logger.info(
        `Performed full achievement check for user ${userId}`,
        "AchievementIntegration",
      );
    } catch (error) {
      logger.error(
        "Failed to perform full achievement check",
        error,
        "AchievementIntegration",
      );
    }
  }

  /**
   * Award beta tester achievement to users
   */
  async awardBetaTesterAchievement(userId: string): Promise<void> {
    try {
      // This would be called for beta users
      const achievements = await achievementDBService.getAllAchievements();
      const betaAchievement = achievements.find(
        (a: DBAchievement) => a.name === "Beta Tester",
      );

      if (betaAchievement) {
        await achievementDBService.awardAchievement(userId, betaAchievement.id);
        logger.info(
          `Awarded beta tester achievement to user ${userId}`,
          "AchievementIntegration",
        );
      }
    } catch (error) {
      logger.error(
        "Failed to award beta tester achievement",
        error,
        "AchievementIntegration",
      );
    }
  }
}

// Export singleton instance
export const achievementIntegration = new AchievementIntegrationService();
