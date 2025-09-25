/**
 * Pause Service
 * Handles session pause/resume operations with cooldown enforcement
 */
import { sessionDBService } from "../database/SessionDBService";
import { eventDBService } from "../database/EventDBService";
import { PauseCooldownService } from "./PauseCooldownService";
import { EffectiveTimeService } from "./EffectiveTimeService";
import { serviceLogger } from "@/utils/logging";
import { generateUUID } from "@/utils";
import type { PauseReason } from "@/types/events";

const logger = serviceLogger("PauseService");

export interface PauseSessionOptions {
  reason: PauseReason;
  customReason?: string;
  notes?: string;
}

export class PauseService {
  /**
   * Pause a session with cooldown enforcement
   */
  static async pauseSession(
    sessionId: string, 
    options: PauseSessionOptions
  ): Promise<void> {
    try {
      const session = await sessionDBService.findById(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      if (session.endTime) {
        throw new Error("Cannot pause ended session");
      }

      if (session.isPaused) {
        throw new Error("Session is already paused");
      }

      // Check cooldown
      const pauseState = await PauseCooldownService.canUserPause(session.userId);
      if (!pauseState.canPause) {
        const cooldownInfo = await PauseCooldownService.getCooldownInfo(session.userId);
        throw new Error(
          cooldownInfo.message || 
          `Pause cooldown active. Next pause available at ${pauseState.nextPauseAvailable?.toLocaleString()}`
        );
      }

      const pauseTime = new Date();

      // Update session
      await sessionDBService.update(sessionId, {
        isPaused: true,
        pauseStartTime: pauseTime,
      });

      // Log pause event
      await eventDBService.logEvent(
        session.userId,
        "session_pause",
        {
          duration: 0, // Will be calculated on resume
          notes: options.notes,
          pauseReason: options.reason,
          customReason: options.customReason,
        },
        {
          sessionId,
          timestamp: pauseTime,
        }
      );

      logger.info("Session paused successfully", {
        sessionId,
        userId: session.userId,
        reason: options.reason,
        customReason: options.customReason,
        pauseTime
      });
    } catch (error) {
      logger.error("Failed to pause session", {
        error: error as Error,
        sessionId,
        options,
      });
      throw error;
    }
  }

  /**
   * Resume a paused session
   */
  static async resumeSession(sessionId: string, notes?: string): Promise<void> {
    try {
      const session = await sessionDBService.findById(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      if (session.endTime) {
        throw new Error("Cannot resume ended session");
      }

      if (!session.isPaused || !session.pauseStartTime) {
        throw new Error("Session is not paused");
      }

      const resumeTime = new Date();
      const pauseDuration = Math.floor(
        (resumeTime.getTime() - session.pauseStartTime.getTime()) / 1000
      );

      // Update session
      await sessionDBService.update(sessionId, {
        isPaused: false,
        pauseStartTime: undefined,
        accumulatedPauseTime: session.accumulatedPauseTime + pauseDuration,
      });

      // Log resume event
      await eventDBService.logEvent(
        session.userId,
        "session_resume",
        {
          duration: pauseDuration,
          notes,
        },
        {
          sessionId,
          timestamp: resumeTime,
        }
      );

      logger.info("Session resumed successfully", {
        sessionId,
        userId: session.userId,
        resumeTime,
        pauseDuration,
        newAccumulatedPauseTime: session.accumulatedPauseTime + pauseDuration
      });
    } catch (error) {
      logger.error("Failed to resume session", {
        error: error as Error,
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Get comprehensive pause status for a session
   */
  static async getSessionPauseStatus(sessionId: string): Promise<{
    isPaused: boolean;
    canPause: boolean;
    currentPauseDuration: number;
    totalPauseTime: number;
    cooldownInfo?: {
      timeRemaining: string;
      nextAvailable: Date;
      message: string;
    };
    pauseStartTime?: Date;
  }> {
    try {
      const session = await sessionDBService.findById(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      const pauseState = await PauseCooldownService.canUserPause(session.userId);
      const currentTime = new Date();
      
      const currentPauseDuration = session.isPaused && session.pauseStartTime
        ? EffectiveTimeService.calculateCurrentPauseDuration(session, currentTime)
        : 0;
      
      const totalPauseTime = EffectiveTimeService.calculateTotalPauseTime(session, currentTime);

      let cooldownInfo;
      if (!pauseState.canPause && pauseState.cooldownRemaining && pauseState.nextPauseAvailable) {
        cooldownInfo = {
          timeRemaining: PauseCooldownService.formatCooldownTime(pauseState.cooldownRemaining),
          nextAvailable: pauseState.nextPauseAvailable,
          message: `Next pause available in ${PauseCooldownService.formatCooldownTime(pauseState.cooldownRemaining)}`
        };
      }

      return {
        isPaused: session.isPaused,
        canPause: pauseState.canPause,
        currentPauseDuration,
        totalPauseTime,
        cooldownInfo,
        pauseStartTime: session.pauseStartTime,
      };
    } catch (error) {
      logger.error("Failed to get session pause status", {
        error: error as Error,
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Get pause history for a session
   */
  static async getSessionPauseHistory(sessionId: string): Promise<Array<{
    id: string;
    pauseTime: Date;
    resumeTime?: Date;
    duration?: number;
    reason?: PauseReason;
    customReason?: string;
    notes?: string;
  }>> {
    try {
      const pauseEvents = await eventDBService.findByFilter({
        sessionId,
        type: "session_pause",
      });

      const resumeEvents = await eventDBService.findByFilter({
        sessionId,
        type: "session_resume",
      });

      // Match pause events with their corresponding resume events
      const pauseHistory = pauseEvents.map(pauseEvent => {
        const correspondingResume = resumeEvents.find(resumeEvent => 
          resumeEvent.timestamp > pauseEvent.timestamp
        );

        return {
          id: pauseEvent.id || generateUUID(),
          pauseTime: pauseEvent.timestamp,
          resumeTime: correspondingResume?.timestamp,
          duration: correspondingResume?.details?.duration as number,
          reason: pauseEvent.details?.pauseReason as PauseReason,
          customReason: pauseEvent.details?.customReason as string,
          notes: pauseEvent.notes,
        };
      });

      // Sort by pause time descending (most recent first)
      pauseHistory.sort((a, b) => b.pauseTime.getTime() - a.pauseTime.getTime());

      return pauseHistory;
    } catch (error) {
      logger.error("Failed to get session pause history", {
        error: error as Error,
        sessionId,
      });
      return [];
    }
  }
}