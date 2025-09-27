/**
 * Session Database Service
 * Handles all local database operations for chastity sessions
 */
import { BaseDBService } from "./BaseDBService";
import { db } from "../storage/ChastityDB";
import type { DBSession } from "@/types/database";
import { serviceLogger } from "@/utils/logging";
import { generateUUID } from "@/utils";

const logger = serviceLogger("SessionDBService");

class SessionDBService extends BaseDBService<DBSession> {
  constructor() {
    super(db.sessions);
  }

  /**
   * Get the current active session for a user
   */
  async getCurrentSession(userId: string): Promise<DBSession | undefined> {
    try {
      const session = await this.table
        .where("userId")
        .equals(userId)
        .and((session) => !session.endTime)
        .first();

      logger.debug("Get current session", { userId, found: !!session });
      return session;
    } catch (error) {
      logger.error("Failed to get current session", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get session history for a user, sorted by most recent
   */
  async getSessionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<DBSession[]> {
    try {
      const sessions = await this.table
        .where("userId")
        .equals(userId)
        .reverse()
        .sortBy("startTime")
        .then((results) => results.slice(offset, offset + limit));

      logger.debug("Get session history", {
        userId,
        limit,
        offset,
        returned: sessions.length,
      });
      return sessions;
    } catch (error) {
      logger.error("Failed to get session history", {
        error: error as Error,
        userId,
        limit,
        offset,
      });
      throw error;
    }
  }

  /**
   * Get all active sessions (for admin/debugging)
   */
  async getActiveSessions(): Promise<DBSession[]> {
    try {
      const sessions = await this.table
        .where("endTime")
        .equals(undefined)
        .toArray();

      logger.debug("Get active sessions", { count: sessions.length });
      return sessions;
    } catch (error) {
      logger.error("Failed to get active sessions", { error: error as Error });
      throw error;
    }
  }

  /**
   * Start a new chastity session
   */
  async startSession(
    userId: string,
    options: {
      goalDuration?: number;
      isHardcoreMode?: boolean;
      keyholderApprovalRequired?: boolean;
      notes?: string;
    } = {},
  ): Promise<string> {
    try {
      // Check if user already has an active session
      const existingSession = await this.getCurrentSession(userId);
      if (existingSession) {
        throw new Error("User already has an active session");
      }

      const sessionId = generateUUID();
      const session: Omit<DBSession, "lastModified" | "syncStatus"> = {
        id: sessionId,
        userId,
        startTime: new Date(),
        isPaused: false,
        accumulatedPauseTime: 0,
        goalDuration: options.goalDuration,
        isHardcoreMode: options.isHardcoreMode || false,
        keyholderApprovalRequired: options.keyholderApprovalRequired || false,
        notes: options.notes,
      };

      await this.create(session);

      logger.info("Started new session", {
        sessionId,
        userId,
        options,
      });
      return sessionId;
    } catch (error) {
      logger.error("Failed to start session", {
        error: error as Error,
        userId,
        options,
      });
      throw error;
    }
  }

  /**
   * End a session
   */
  async endSession(
    sessionId: string,
    endTime: Date = new Date(),
    endReason?: string,
  ): Promise<void> {
    try {
      const session = await this.findById(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      if (session.endTime) {
        throw new Error("Session already ended");
      }

      await this.update(sessionId, {
        endTime,
        endReason,
        isPaused: false,
        pauseStartTime: undefined,
      });

      logger.info("Ended session", { sessionId, endTime, endReason });
    } catch (error) {
      logger.error("Failed to end session", {
        error: error as Error,
        sessionId,
        endReason,
      });
      throw error;
    }
  }

  /**
   * Pause a session
   */
  async pauseSession(
    sessionId: string,
    pauseTime: Date = new Date(),
  ): Promise<void> {
    try {
      const session = await this.findById(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      if (session.endTime) {
        throw new Error("Cannot pause ended session");
      }

      if (session.isPaused) {
        throw new Error("Session is already paused");
      }

      await this.update(sessionId, {
        isPaused: true,
        pauseStartTime: pauseTime,
      });

      logger.info("Paused session", { sessionId, pauseTime });
    } catch (error) {
      logger.error("Failed to pause session", {
        error: error as Error,
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Resume a paused session
   */
  async resumeSession(
    sessionId: string,
    resumeTime: Date = new Date(),
  ): Promise<void> {
    try {
      const session = await this.findById(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      if (session.endTime) {
        throw new Error("Cannot resume ended session");
      }

      if (!session.isPaused || !session.pauseStartTime) {
        throw new Error("Session is not paused");
      }

      // Calculate pause duration
      const pauseDuration =
        resumeTime.getTime() - session.pauseStartTime.getTime();
      const pauseSeconds = Math.floor(pauseDuration / 1000);

      await this.update(sessionId, {
        isPaused: false,
        pauseStartTime: undefined,
        accumulatedPauseTime: session.accumulatedPauseTime + pauseSeconds,
      });

      logger.info("Resumed session", {
        sessionId,
        resumeTime,
        pauseSeconds,
        totalPauseTime: session.accumulatedPauseTime + pauseSeconds,
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
   * Get sessions within a date range
   */
  async getSessionsInDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DBSession[]> {
    try {
      const sessions = await this.table
        .where("userId")
        .equals(userId)
        .and(
          (session) =>
            session.startTime >= startDate && session.startTime <= endDate,
        )
        .reverse()
        .sortBy("startTime");

      logger.debug("Get sessions in date range", {
        userId,
        startDate,
        endDate,
        count: sessions.length,
      });

      return sessions;
    } catch (error) {
      logger.error("Failed to get sessions in date range", {
        error: error as Error,
        userId,
        startDate,
        endDate,
      });
      throw error;
    }
  }

  /**
   * Calculate session duration (excluding pause time)
   */
  calculateEffectiveDuration(session: DBSession): number {
    if (!session.endTime) {
      // For active sessions, calculate from start to now
      const now =
        session.isPaused && session.pauseStartTime
          ? session.pauseStartTime
          : new Date();

      const totalMs = now.getTime() - session.startTime.getTime();
      const totalSeconds = Math.floor(totalMs / 1000);

      return Math.max(0, totalSeconds - session.accumulatedPauseTime);
    }

    // For ended sessions
    const totalMs = session.endTime.getTime() - session.startTime.getTime();
    const totalSeconds = Math.floor(totalMs / 1000);

    return Math.max(0, totalSeconds - session.accumulatedPauseTime);
  }

  /**
   * Get session statistics for a user
   */
  async getSessionStats(userId: string): Promise<{
    totalSessions: number;
    activeSessions: number;
    totalDuration: number;
    averageDuration: number;
    longestSession: number;
    shortestSession: number;
  }> {
    try {
      const sessions = await this.findByUserId(userId);

      const activeSessions = sessions.filter((s) => !s.endTime).length;
      const completedSessions = sessions.filter((s) => s.endTime);

      const durations = completedSessions.map((s) =>
        this.calculateEffectiveDuration(s),
      );
      const totalDuration = durations.reduce((sum, d) => sum + d, 0);

      const stats = {
        totalSessions: sessions.length,
        activeSessions,
        totalDuration,
        averageDuration:
          completedSessions.length > 0
            ? Math.round(totalDuration / completedSessions.length)
            : 0,
        longestSession: durations.length > 0 ? Math.max(...durations) : 0,
        shortestSession: durations.length > 0 ? Math.min(...durations) : 0,
      };

      logger.debug("Session statistics", { userId, stats });
      return stats;
    } catch (error) {
      logger.error("Failed to get session stats", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get all sessions for a user (alias for getSessionHistory)
   */
  async getUserSessions(userId: string): Promise<DBSession[]> {
    try {
      const sessions = await this.table
        .where("userId")
        .equals(userId)
        .sortBy("startTime");
      
      logger.debug("Get user sessions", { userId, count: sessions.length });
      return sessions;
    } catch (error) {
      logger.error("Failed to get user sessions", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }
}

export const sessionDBService = new SessionDBService();
