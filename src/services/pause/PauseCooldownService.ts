/**
 * Pause Cooldown Service
 * Handles 4-hour cooldown logic for session pausing to prevent abuse
 */
import { eventDBService } from "../database/EventDBService";
import { sessionDBService } from "../database/SessionDBService";
import { serviceLogger } from "@/utils/logging";
import type { DBEvent } from "@/types/database";

const logger = serviceLogger("PauseCooldownService");

export interface PauseState {
  canPause: boolean;
  lastPauseTime?: Date;
  nextPauseAvailable?: Date;
  cooldownRemaining?: number; // seconds
}

export class PauseCooldownService {
  private static readonly COOLDOWN_HOURS = 4;
  private static readonly COOLDOWN_MS = PauseCooldownService.COOLDOWN_HOURS * 60 * 60 * 1000;

  /**
   * Check if user can pause their current session
   */
  static async canUserPause(userId: string): Promise<PauseState> {
    try {
      const session = await sessionDBService.getCurrentSession(userId);
      if (!session) {
        logger.debug("No active session found", { userId });
        return { canPause: false };
      }

      const lastPauseEvent = await this.getLastPauseEvent(session.id);
      if (!lastPauseEvent) {
        logger.debug("No previous pause events found", { userId, sessionId: session.id });
        return { canPause: true };
      }

      const timeSinceLastPause = Date.now() - lastPauseEvent.timestamp.getTime();
      
      if (timeSinceLastPause >= this.COOLDOWN_MS) {
        logger.debug("Cooldown period has passed", { 
          userId, 
          sessionId: session.id,
          timeSinceLastPause: Math.floor(timeSinceLastPause / 1000)
        });
        return { canPause: true };
      }

      const nextAvailable = new Date(lastPauseEvent.timestamp.getTime() + this.COOLDOWN_MS);
      const cooldownRemaining = Math.ceil((this.COOLDOWN_MS - timeSinceLastPause) / 1000);

      logger.debug("User is in cooldown period", {
        userId,
        sessionId: session.id,
        cooldownRemaining,
        nextAvailable
      });

      return {
        canPause: false,
        lastPauseTime: lastPauseEvent.timestamp,
        nextPauseAvailable: nextAvailable,
        cooldownRemaining,
      };
    } catch (error) {
      logger.error("Failed to check pause availability", {
        error: error as Error,
        userId,
      });
      // In case of error, default to preventing pause for safety
      return { canPause: false };
    }
  }

  /**
   * Get the most recent pause event for a session
   */
  private static async getLastPauseEvent(sessionId: string): Promise<DBEvent | undefined> {
    try {
      const events = await eventDBService.findByFilter({
        sessionId,
        type: "session_pause",
      });

      // Sort by timestamp descending and get the most recent
      const sortedEvents = events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return sortedEvents[0];
    } catch (error) {
      logger.error("Failed to get last pause event", {
        error: error as Error,
        sessionId,
      });
      return undefined;
    }
  }

  /**
   * Check cooldown for a specific session
   */
  static async getSessionCooldownState(sessionId: string): Promise<PauseState> {
    try {
      const session = await sessionDBService.findById(sessionId);
      if (!session) {
        return { canPause: false };
      }

      return this.canUserPause(session.userId);
    } catch (error) {
      logger.error("Failed to get session cooldown state", {
        error: error as Error,
        sessionId,
      });
      return { canPause: false };
    }
  }

  /**
   * Format remaining cooldown time as human-readable string
   */
  static formatCooldownTime(cooldownSeconds: number): string {
    const hours = Math.floor(cooldownSeconds / 3600);
    const minutes = Math.floor((cooldownSeconds % 3600) / 60);
    const seconds = cooldownSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Get cooldown information with formatted strings
   */
  static async getCooldownInfo(userId: string): Promise<{
    state: PauseState;
    message?: string;
    formattedTimeRemaining?: string;
  }> {
    const state = await this.canUserPause(userId);
    
    if (state.canPause) {
      return { state };
    }

    const formattedTimeRemaining = state.cooldownRemaining 
      ? this.formatCooldownTime(state.cooldownRemaining)
      : undefined;

    const message = state.nextPauseAvailable
      ? `You can pause again in ${formattedTimeRemaining}. Next pause available at ${state.nextPauseAvailable.toLocaleTimeString()}.`
      : "Pause is currently unavailable.";

    return {
      state,
      message,
      formattedTimeRemaining,
    };
  }
}