/**
 * PauseService - Handles session pause and resume operations
 * Manages pause events, logging, and state updates
 */

import { DBEvent } from "../types/database";
import { PauseCooldownService } from "./PauseCooldownService";
import { db } from "./storage/dexie";
import { serviceLogger } from "../utils/logging";

const logger = serviceLogger("PauseService");

// Enhanced pause reasons matching requirements
export const ENHANCED_PAUSE_REASONS = [
  "Bathroom Break",
  "Emergency",
  "Medical",
  "Work/Social",
  "Other",
] as const;

export type EnhancedPauseReason = (typeof ENHANCED_PAUSE_REASONS)[number];

export class PauseService {
  /**
   * Pause a session with reason validation and cooldown checking
   */
  static async pauseSession(
    sessionId: string,
    reason: EnhancedPauseReason,
    customReason?: string,
  ): Promise<void> {
    try {
      const session = await db.sessions.get(sessionId);
      if (!session || session.isPaused) {
        throw new Error("Session not found or already paused");
      }

      // Check cooldown
      const pauseState = await PauseCooldownService.canUserPause(
        session.userId,
      );
      if (!pauseState.canPause) {
        const nextAvailable =
          pauseState.nextPauseAvailable?.toLocaleString() || "unknown";
        throw new Error(
          `Pause cooldown active. Next pause available at ${nextAvailable}`,
        );
      }

      const pauseTime = new Date();
      const finalReason =
        reason === "Other" && customReason ? customReason : reason;

      // Update session state
      await db.sessions.update(sessionId, {
        isPaused: true,
        pauseStartTime: pauseTime,
      });

      // Log pause event
      await this.logPauseEvent(
        session.userId,
        sessionId,
        pauseTime,
        finalReason,
      );

      logger.info("Session paused successfully", {
        sessionId,
        userId: session.userId,
        reason: finalReason,
      });
    } catch (error) {
      logger.error("Failed to pause session", { error, sessionId, reason });
      throw error;
    }
  }

  /**
   * Resume a paused session
   */
  static async resumeSession(sessionId: string): Promise<void> {
    try {
      const session = await db.sessions.get(sessionId);
      if (!session || !session.isPaused || !session.pauseStartTime) {
        throw new Error(
          "Session not found, not paused, or missing pause start time",
        );
      }

      const resumeTime = new Date();
      const pauseDuration = Math.floor(
        (resumeTime.getTime() - session.pauseStartTime.getTime()) / 1000,
      );

      // Update session state
      await db.sessions.update(sessionId, {
        isPaused: false,
        pauseStartTime: undefined,
        accumulatedPauseTime: session.accumulatedPauseTime + pauseDuration,
      });

      // Log resume event
      await this.logResumeEvent(
        session.userId,
        sessionId,
        resumeTime,
        pauseDuration,
      );

      logger.info("Session resumed successfully", {
        sessionId,
        userId: session.userId,
        pauseDuration,
      });
    } catch (error) {
      logger.error("Failed to resume session", { error, sessionId });
      throw error;
    }
  }

  /**
   * Get current pause status for a session
   */
  static async getPauseStatus(sessionId: string) {
    try {
      const session = await db.sessions.get(sessionId);
      if (!session) return null;

      return {
        isPaused: session.isPaused,
        pauseStartTime: session.pauseStartTime,
        accumulatedPauseTime: session.accumulatedPauseTime,
        currentPauseDuration:
          session.isPaused && session.pauseStartTime
            ? Math.floor((Date.now() - session.pauseStartTime.getTime()) / 1000)
            : 0,
      };
    } catch (error) {
      logger.error("Error getting pause status", { error, sessionId });
      return null;
    }
  }

  /**
   * Get pause history for a session
   */
  static async getPauseHistory(sessionId: string): Promise<DBEvent[]> {
    try {
      const pauseEvents = await db.events
        .where("sessionId")
        .equals(sessionId)
        .and(
          (event) =>
            event.type === "session_pause" || event.type === "session_resume",
        )
        .toArray();

      return pauseEvents.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      );
    } catch (error) {
      logger.error("Error fetching pause history", { error, sessionId });
      return [];
    }
  }

  /**
   * Validate pause reason
   */
  static isValidPauseReason(reason: string): reason is EnhancedPauseReason {
    return ENHANCED_PAUSE_REASONS.includes(reason as EnhancedPauseReason);
  }

  /**
   * Get available pause reasons
   */
  static getPauseReasons(): readonly EnhancedPauseReason[] {
    return ENHANCED_PAUSE_REASONS;
  }

  /**
   * Log pause event to database
   */
  private static async logPauseEvent(
    userId: string,
    sessionId: string,
    timestamp: Date,
    reason: string,
  ): Promise<void> {
    const event: Omit<DBEvent, "id"> = {
      userId,
      sessionId,
      type: "session_pause",
      timestamp,
      details: {
        notes: reason,
        pauseReason: reason,
      },
      isPrivate: false,
      syncStatus: "pending",
      lastModified: new Date(),
    };

    await db.events.add(event as DBEvent);
  }

  /**
   * Log resume event to database
   */
  private static async logResumeEvent(
    userId: string,
    sessionId: string,
    timestamp: Date,
    pauseDuration: number,
  ): Promise<void> {
    const event: Omit<DBEvent, "id"> = {
      userId,
      sessionId,
      type: "session_resume",
      timestamp,
      details: {
        pauseDuration,
        notes: `Session resumed after ${Math.floor(pauseDuration / 60)} minutes`,
      },
      isPrivate: false,
      syncStatus: "pending",
      lastModified: new Date(),
    };

    await db.events.add(event as DBEvent);
  }
}
