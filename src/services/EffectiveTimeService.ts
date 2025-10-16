/**
 * EffectiveTimeService - Calculates session time excluding pause durations
 * Provides accurate time calculations for session progress and goals
 */

import { DBSession } from "../types/database";
import { serviceLogger } from "../utils/logging";

const logger = serviceLogger("EffectiveTimeService");

export class EffectiveTimeService {
  /**
   * Calculate effective time in session (total time minus pause time)
   */
  static calculateEffectiveTime(
    session: DBSession,
    currentTime: Date = new Date(),
  ): number {
    try {
      const totalElapsed = Math.floor(
        (currentTime.getTime() - session.startTime.getTime()) / 1000,
      );

      // If currently paused, add current pause duration
      let currentPauseTime = 0;
      if (session.isPaused && session.pauseStartTime) {
        currentPauseTime = Math.floor(
          (currentTime.getTime() - session.pauseStartTime.getTime()) / 1000,
        );
      }

      const totalPauseTime = session.accumulatedPauseTime + currentPauseTime;
      const effectiveTime = Math.max(0, totalElapsed - totalPauseTime);

      logger.debug("Calculated effective time", {
        sessionId: session.id,
        totalElapsed,
        accumulatedPauseTime: session.accumulatedPauseTime,
        currentPauseTime,
        totalPauseTime,
        effectiveTime,
      });

      return effectiveTime;
    } catch (error) {
      logger.error("Error calculating effective time", {
        error,
        sessionId: session.id,
      });
      return 0;
    }
  }

  /**
   * Calculate remaining time for a goal (considering pause time)
   */
  static calculateRemainingGoalTime(
    session: DBSession,
    goalDurationSeconds: number,
    currentTime: Date = new Date(),
  ): number {
    const effectiveTime = this.calculateEffectiveTime(session, currentTime);
    return Math.max(0, goalDurationSeconds - effectiveTime);
  }

  /**
   * Calculate progress percentage towards a goal
   */
  static calculateGoalProgress(
    session: DBSession,
    goalDurationSeconds: number,
    currentTime: Date = new Date(),
  ): number {
    if (goalDurationSeconds <= 0) return 0;
    const effectiveTime = this.calculateEffectiveTime(session, currentTime);
    return Math.min(100, (effectiveTime / goalDurationSeconds) * 100);
  }

  /**
   * Format time remaining as human-readable string
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
   * Format elapsed time as human-readable string with days
   */
  static formatElapsedTime(totalSeconds: number): string {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let result = "";
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (seconds > 0 || result === "") result += `${seconds}s`;

    return result.trim();
  }

  /**
   * Check if a session goal has been met
   */
  static isGoalMet(
    session: DBSession,
    goalDurationSeconds: number,
    currentTime: Date = new Date(),
  ): boolean {
    const effectiveTime = this.calculateEffectiveTime(session, currentTime);
    return effectiveTime >= goalDurationSeconds;
  }

  /**
   * Get session statistics including pause data
   */
  static getSessionStats(session: DBSession, currentTime: Date = new Date()) {
    const totalElapsed = Math.floor(
      (currentTime.getTime() - session.startTime.getTime()) / 1000,
    );
    const effectiveTime = this.calculateEffectiveTime(session, currentTime);
    const totalPauseTime =
      session.accumulatedPauseTime +
      (session.isPaused && session.pauseStartTime
        ? Math.floor(
            (currentTime.getTime() - session.pauseStartTime.getTime()) / 1000,
          )
        : 0);

    return {
      totalElapsed,
      effectiveTime,
      totalPauseTime,
      pausePercentage:
        totalElapsed > 0 ? (totalPauseTime / totalElapsed) * 100 : 0,
      isPaused: session.isPaused,
      currentPauseDuration:
        session.isPaused && session.pauseStartTime
          ? Math.floor(
              (currentTime.getTime() - session.pauseStartTime.getTime()) / 1000,
            )
          : 0,
    };
  }
}
