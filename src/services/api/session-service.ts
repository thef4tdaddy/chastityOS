import { db } from "../storage/dexie";
import { DBSession } from "@/types/database";
import { serviceLogger } from "@/utils/logging";
import { PauseCooldownService } from "../PauseCooldownService";
import { EffectiveTimeService } from "../EffectiveTimeService";
import { PauseService } from "../PauseService";
// import { FirebaseAPI } from './firebase'; // This will be used later

const logger = serviceLogger("SessionService");

export class SessionService {
  static async getCurrentSession(
    userId: string,
  ): Promise<DBSession | undefined> {
    // 1. Try local storage first (fast)
    const localSession = await db.sessions
      .where("userId")
      .equals(userId)
      .and((session) => !session.endTime) // Active sessions don't have endTime
      .first();

    // 2. Return local data if it exists (freshness check can be added later)
    if (localSession) {
      logger.debug("Serving session from local Dexie cache", { userId });
      return localSession;
    }

    // 3. Fetch from Firebase if stale or missing (placeholder)
    logger.info(
      "No local session found. Fetching from Firebase would happen here",
      { userId },
    );
    // const firebaseSession = await FirebaseAPI.sessions.getCurrent(userId);

    // 4. Update local storage (placeholder)
    // if (firebaseSession) {
    //   await db.sessions.put(firebaseSession);
    // }

    // return firebaseSession;
    return undefined;
  }

  /**
   * Get pause state for current session
   */
  static async getPauseState(userId: string) {
    return PauseCooldownService.canUserPause(userId);
  }

  /**
   * Calculate effective time for a session
   */
  static getEffectiveTime(session: DBSession, currentTime?: Date) {
    return EffectiveTimeService.calculateEffectiveTime(session, currentTime);
  }

  /**
   * Get session statistics
   */
  static getSessionStats(session: DBSession, currentTime?: Date) {
    return EffectiveTimeService.getSessionStats(session, currentTime);
  }

  /**
   * Pause a session
   */
  static async pauseSession(
    sessionId: string,
    reason: string,
    customReason?: string,
  ) {
    return PauseService.pauseSession(sessionId, reason as any, customReason);
  }

  /**
   * Resume a session
   */
  static async resumeSession(sessionId: string) {
    return PauseService.resumeSession(sessionId);
  }

  /**
   * Get pause status for a session
   */
  static async getPauseStatus(sessionId: string) {
    return PauseService.getPauseStatus(sessionId);
  }

  /**
   * Get pause history for a session
   */
  static async getPauseHistory(sessionId: string) {
    return PauseService.getPauseHistory(sessionId);
  }
}
