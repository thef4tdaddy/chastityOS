/**
 * Effective Time Service
 * Calculates effective session time excluding pause durations
 */
import { serviceLogger } from "@/utils/logging";
import type { DBSession } from "@/types/database";

const logger = serviceLogger("EffectiveTimeService");

export class EffectiveTimeService {
  /**
   * Calculate effective time for a session (total time minus pause time)
   */
  static calculateEffectiveTime(session: DBSession, currentTime: Date = new Date()): number {
    try {
      // Calculate total elapsed time from session start
      const totalElapsed = Math.floor((currentTime.getTime() - session.startTime.getTime()) / 1000);
      
      // If session has ended, use end time instead of current time
      const endTime = session.endTime || currentTime;
      const actualElapsed = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);
      
      // Calculate current pause duration if session is currently paused
      let currentPauseTime = 0;
      if (session.isPaused && session.pauseStartTime && !session.endTime) {
        currentPauseTime = Math.floor((currentTime.getTime() - session.pauseStartTime.getTime()) / 1000);
      }
      
      // Total pause time = accumulated + current pause (if any)
      const totalPauseTime = session.accumulatedPauseTime + currentPauseTime;
      
      // Effective time = total elapsed - total pause time
      const effectiveTime = Math.max(0, actualElapsed - totalPauseTime);
      
      logger.debug("Calculated effective time", {
        sessionId: session.id,
        totalElapsed: actualElapsed,
        accumulatedPauseTime: session.accumulatedPauseTime,
        currentPauseTime,
        totalPauseTime,
        effectiveTime,
        isPaused: session.isPaused,
        hasEnded: !!session.endTime
      });
      
      return effectiveTime;
    } catch (error) {
      logger.error("Failed to calculate effective time", {
        error: error as Error,
        sessionId: session.id,
      });
      return 0;
    }
  }

  /**
   * Calculate total session duration (including pauses)
   */
  static calculateTotalDuration(session: DBSession, currentTime: Date = new Date()): number {
    try {
      const endTime = session.endTime || currentTime;
      const totalDuration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);
      return Math.max(0, totalDuration);
    } catch (error) {
      logger.error("Failed to calculate total duration", {
        error: error as Error,
        sessionId: session.id,
      });
      return 0;
    }
  }

  /**
   * Calculate current pause duration if session is paused
   */
  static calculateCurrentPauseDuration(session: DBSession, currentTime: Date = new Date()): number {
    if (!session.isPaused || !session.pauseStartTime || session.endTime) {
      return 0;
    }

    try {
      const pauseDuration = Math.floor((currentTime.getTime() - session.pauseStartTime.getTime()) / 1000);
      return Math.max(0, pauseDuration);
    } catch (error) {
      logger.error("Failed to calculate current pause duration", {
        error: error as Error,
        sessionId: session.id,
      });
      return 0;
    }
  }

  /**
   * Calculate total pause time (accumulated + current)
   */
  static calculateTotalPauseTime(session: DBSession, currentTime: Date = new Date()): number {
    const currentPause = this.calculateCurrentPauseDuration(session, currentTime);
    return session.accumulatedPauseTime + currentPause;
  }

  /**
   * Format time duration in seconds to human-readable string
   */
  static formatDuration(seconds: number): string {
    if (seconds < 0) return "0s";
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts: string[] = [];
    
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);

    return parts.join(' ');
  }

  /**
   * Format time remaining for cooldown (more compact format)
   */
  static formatTimeRemaining(cooldownSeconds: number): string {
    if (cooldownSeconds <= 0) return "0s";
    
    const hours = Math.floor(cooldownSeconds / 3600);
    const minutes = Math.floor((cooldownSeconds % 3600) / 60);
    const seconds = cooldownSeconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  /**
   * Calculate session progress towards a goal
   */
  static calculateGoalProgress(session: DBSession, goalDurationSeconds: number, currentTime: Date = new Date()): {
    effectiveTime: number;
    goalTime: number;
    progress: number; // percentage (0-100)
    isCompleted: boolean;
    timeRemaining: number;
  } {
    const effectiveTime = this.calculateEffectiveTime(session, currentTime);
    const progress = goalDurationSeconds > 0 ? Math.min(100, (effectiveTime / goalDurationSeconds) * 100) : 0;
    const isCompleted = effectiveTime >= goalDurationSeconds;
    const timeRemaining = Math.max(0, goalDurationSeconds - effectiveTime);

    return {
      effectiveTime,
      goalTime: goalDurationSeconds,
      progress,
      isCompleted,
      timeRemaining
    };
  }

  /**
   * Get session time statistics
   */
  static getSessionTimeStats(session: DBSession, currentTime: Date = new Date()): {
    totalDuration: number;
    effectiveTime: number;
    accumulatedPauseTime: number;
    currentPauseDuration: number;
    totalPauseTime: number;
    pausePercentage: number;
    isActive: boolean;
    isPaused: boolean;
  } {
    const totalDuration = this.calculateTotalDuration(session, currentTime);
    const effectiveTime = this.calculateEffectiveTime(session, currentTime);
    const currentPauseDuration = this.calculateCurrentPauseDuration(session, currentTime);
    const totalPauseTime = this.calculateTotalPauseTime(session, currentTime);
    const pausePercentage = totalDuration > 0 ? (totalPauseTime / totalDuration) * 100 : 0;

    return {
      totalDuration,
      effectiveTime,
      accumulatedPauseTime: session.accumulatedPauseTime,
      currentPauseDuration,
      totalPauseTime,
      pausePercentage,
      isActive: !session.endTime,
      isPaused: session.isPaused
    };
  }
}