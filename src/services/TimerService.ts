/**
 * Timer Service
 * Provides utilities for session timer calculations and formatting
 */
import type { DBSession } from "../types/database";

export class TimerService {
  /**
   * Calculate effective time (total elapsed minus accumulated pause time)
   */
  static calculateEffectiveTime(session: DBSession, currentTime: Date): number {
    if (!session.startTime) return 0;

    const totalElapsed = Math.floor(
      (currentTime.getTime() - session.startTime.getTime()) / 1000,
    );

    // Calculate current pause duration if session is paused
    let currentPauseDuration = 0;
    if (session.isPaused && session.pauseStartTime) {
      currentPauseDuration = Math.floor(
        (currentTime.getTime() - session.pauseStartTime.getTime()) / 1000,
      );
    }

    return Math.max(
      0,
      totalElapsed - session.accumulatedPauseTime - currentPauseDuration,
    );
  }

  /**
   * Calculate total elapsed time (including pauses)
   */
  static calculateTotalElapsedTime(
    session: DBSession,
    currentTime: Date,
  ): number {
    if (!session.startTime) return 0;

    return Math.floor(
      (currentTime.getTime() - session.startTime.getTime()) / 1000,
    );
  }

  /**
   * Calculate current pause duration (if session is paused)
   */
  static calculateCurrentPauseDuration(
    session: DBSession,
    currentTime: Date,
  ): number {
    if (!session.isPaused || !session.pauseStartTime) return 0;

    return Math.floor(
      (currentTime.getTime() - session.pauseStartTime.getTime()) / 1000,
    );
  }

  /**
   * Format duration in seconds to human-readable string
   */
  static formatDuration(seconds: number): string {
    if (seconds < 0) return "0s";

    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = seconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${secs}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else {
      return `${minutes}m ${secs}s`;
    }
  }

  /**
   * Format duration with short format (for compact displays)
   */
  static formatDurationShort(seconds: number): string {
    if (seconds < 0) return "0s";

    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Calculate goal progress percentage
   */
  static calculateGoalProgress(session: DBSession, currentTime: Date): number {
    if (!session.goalDuration || session.goalDuration <= 0) return 0;

    const effectiveTime = this.calculateEffectiveTime(session, currentTime);
    return Math.min(100, (effectiveTime / session.goalDuration) * 100);
  }

  /**
   * Calculate remaining time to goal completion
   */
  static calculateRemainingGoalTime(
    session: DBSession,
    currentTime: Date,
  ): number {
    if (!session.goalDuration || session.goalDuration <= 0) return 0;

    const effectiveTime = this.calculateEffectiveTime(session, currentTime);
    return Math.max(0, session.goalDuration - effectiveTime);
  }

  /**
   * Check if goal is completed
   */
  static isGoalCompleted(session: DBSession, currentTime: Date): boolean {
    if (!session.goalDuration || session.goalDuration <= 0) return false;

    const effectiveTime = this.calculateEffectiveTime(session, currentTime);
    return effectiveTime >= session.goalDuration;
  }
}
