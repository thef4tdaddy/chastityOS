/**
 * Gamification Storage Service
 * Handles all gamification-related localStorage operations
 */

import { logger } from "@/utils/logging";

// Storage keys used by gamification system
export const GAMIFICATION_STORAGE_KEYS = {
  PLAYER_PROFILE: "chastity-gamification-profile",
  CHALLENGES: "chastity-gamification-challenges",
  LEADERBOARDS: "chastity-gamification-leaderboards",
  SOCIAL_FEATURES: "chastity-gamification-social",
  EXPERIENCE_HISTORY: "chastity-gamification-experience",
} as const;

/**
 * Gamification Storage Service
 * Centralizes all gamification-related localStorage operations
 */
export class GamificationStorageService {
  /**
   * Get player profile
   */
  static getPlayerProfile<T>(): T | null {
    try {
      const stored = localStorage.getItem(
        GAMIFICATION_STORAGE_KEYS.PLAYER_PROFILE,
      );
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      logger.error("Failed to get player profile", { error });
      return null;
    }
  }

  /**
   * Save player profile
   */
  static setPlayerProfile<T>(profile: T): boolean {
    try {
      localStorage.setItem(
        GAMIFICATION_STORAGE_KEYS.PLAYER_PROFILE,
        JSON.stringify(profile),
      );
      logger.info("Player profile saved");
      return true;
    } catch (error) {
      logger.error("Failed to save player profile", { error });
      return false;
    }
  }

  /**
   * Get challenges
   */
  static getChallenges<T>(): T[] {
    try {
      const stored = localStorage.getItem(GAMIFICATION_STORAGE_KEYS.CHALLENGES);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error("Failed to get challenges", { error });
      return [];
    }
  }

  /**
   * Save challenges
   */
  static setChallenges<T>(challenges: T[]): boolean {
    try {
      localStorage.setItem(
        GAMIFICATION_STORAGE_KEYS.CHALLENGES,
        JSON.stringify(challenges),
      );
      logger.info("Challenges saved", { count: challenges.length });
      return true;
    } catch (error) {
      logger.error("Failed to save challenges", { error });
      return false;
    }
  }

  /**
   * Get social features
   */
  static getSocialFeatures<T>(): T | null {
    try {
      const stored = localStorage.getItem(
        GAMIFICATION_STORAGE_KEYS.SOCIAL_FEATURES,
      );
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      logger.error("Failed to get social features", { error });
      return null;
    }
  }

  /**
   * Save social features
   */
  static setSocialFeatures<T>(features: T): boolean {
    try {
      localStorage.setItem(
        GAMIFICATION_STORAGE_KEYS.SOCIAL_FEATURES,
        JSON.stringify(features),
      );
      logger.info("Social features saved");
      return true;
    } catch (error) {
      logger.error("Failed to save social features", { error });
      return false;
    }
  }

  /**
   * Get experience history
   */
  static getExperienceHistory<T>(): T[] {
    try {
      const stored = localStorage.getItem(
        GAMIFICATION_STORAGE_KEYS.EXPERIENCE_HISTORY,
      );
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error("Failed to get experience history", { error });
      return [];
    }
  }

  /**
   * Save experience history
   */
  static setExperienceHistory<T>(history: T[]): boolean {
    try {
      localStorage.setItem(
        GAMIFICATION_STORAGE_KEYS.EXPERIENCE_HISTORY,
        JSON.stringify(history),
      );
      logger.info("Experience history saved", { count: history.length });
      return true;
    } catch (error) {
      logger.error("Failed to save experience history", { error });
      return false;
    }
  }

  /**
   * Clear all gamification storage
   */
  static clearAll(): boolean {
    try {
      localStorage.removeItem(GAMIFICATION_STORAGE_KEYS.PLAYER_PROFILE);
      localStorage.removeItem(GAMIFICATION_STORAGE_KEYS.CHALLENGES);
      localStorage.removeItem(GAMIFICATION_STORAGE_KEYS.LEADERBOARDS);
      localStorage.removeItem(GAMIFICATION_STORAGE_KEYS.SOCIAL_FEATURES);
      localStorage.removeItem(GAMIFICATION_STORAGE_KEYS.EXPERIENCE_HISTORY);
      logger.info("All gamification storage cleared");
      return true;
    } catch (error) {
      logger.error("Failed to clear gamification storage", { error });
      return false;
    }
  }
}
