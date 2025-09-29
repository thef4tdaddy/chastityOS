/**
 * PauseCooldownService - Manages 4-hour cooldown logic for session pauses
 * Prevents abuse by enforcing waiting periods between pause actions
 */

import { DBEvent } from "../types/database";
import { db } from "./storage/dexie";
import { serviceLogger } from "../utils/logging";

const logger = serviceLogger("PauseCooldownService");

export interface PauseState {
  canPause: boolean;
  lastPauseTime?: Date;
  nextPauseAvailable?: Date;
  cooldownRemaining?: number; // seconds
}

export class PauseCooldownService {
  private static readonly COOLDOWN_HOURS = 4;
  private static readonly COOLDOWN_MS =
    PauseCooldownService.COOLDOWN_HOURS * 60 * 60 * 1000;

  /**
   * Check if user can pause based on 4-hour cooldown
   */
  static async canUserPause(userId: string): Promise<PauseState> {
    try {
      // Get current active session
      const session = await db.sessions
        .where("userId")
        .equals(userId)
        .and((session) => !session.endTime) // Active sessions don't have endTime
        .first();

      if (!session) {
        logger.debug("No active session found for user", { userId });
        return { canPause: false };
      }

      // Get last pause event
      const lastPauseEvent = await this.getLastPauseEvent(session.id);

      if (!lastPauseEvent) {
        logger.debug("No previous pause events found", {
          userId,
          sessionId: session.id,
        });
        return { canPause: true };
      }

      const timeSinceLastPause =
        Date.now() - lastPauseEvent.timestamp.getTime();

      if (timeSinceLastPause >= PauseCooldownService.COOLDOWN_MS) {
        logger.debug("Cooldown period elapsed, pause allowed", {
          userId,
          timeSinceLastPause,
          cooldownMs: PauseCooldownService.COOLDOWN_MS,
        });
        return { canPause: true };
      }

      const nextAvailable = new Date(
        lastPauseEvent.timestamp.getTime() + PauseCooldownService.COOLDOWN_MS,
      );
      const cooldownRemaining = Math.ceil(
        (PauseCooldownService.COOLDOWN_MS - timeSinceLastPause) / 1000,
      );

      logger.debug("Cooldown active", {
        userId,
        nextAvailable,
        cooldownRemaining,
      });

      return {
        canPause: false,
        lastPauseTime: lastPauseEvent.timestamp,
        nextPauseAvailable: nextAvailable,
        cooldownRemaining,
      };
    } catch (error) {
      logger.error("Error checking pause cooldown", { error, userId });
      return { canPause: false };
    }
  }

  /**
   * Get the most recent pause event for a session
   */
  private static async getLastPauseEvent(
    sessionId: string,
  ): Promise<DBEvent | undefined> {
    try {
      // Look for session pause events in the events table
      const pauseEvent = await db.events
        .where("sessionId")
        .equals(sessionId)
        .and((event) => event.type === "session_pause")
        .reverse()
        .first();

      return pauseEvent;
    } catch (error) {
      logger.error("Error fetching last pause event", { error, sessionId });
      return undefined;
    }
  }

  /**
   * Format cooldown time remaining for display
   */
  static formatTimeRemaining(cooldownSeconds: number): string {
    const hours = Math.floor(cooldownSeconds / 3600);
    const minutes = Math.floor((cooldownSeconds % 3600) / 60);
    const seconds = cooldownSeconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  /**
   * Get cooldown duration in hours (for configuration)
   */
  static getCooldownHours(): number {
    return PauseCooldownService.COOLDOWN_HOURS;
  }
}
