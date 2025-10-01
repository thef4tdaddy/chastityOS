/**
 * Goal Storage Service
 * Handles all goal-related localStorage operations
 */

import { logger } from "@/utils/logging";

// Storage keys used by goals system
export const GOAL_STORAGE_KEYS = {
  PERSONAL_GOALS: "chastity-goals-personal",
  COLLABORATIVE_GOALS: "chastity-goals-collaborative",
  GOAL_TEMPLATES: "chastity-goals-templates",
} as const;

/**
 * Goal Storage Service
 * Centralizes all goal-related localStorage operations
 */
export class GoalStorageService {
  /**
   * Get personal goals
   */
  static getPersonalGoals<T>(): T[] {
    try {
      const stored = localStorage.getItem(GOAL_STORAGE_KEYS.PERSONAL_GOALS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error("Failed to get personal goals", { error });
      return [];
    }
  }

  /**
   * Save personal goals
   */
  static setPersonalGoals<T>(goals: T[]): boolean {
    try {
      localStorage.setItem(
        GOAL_STORAGE_KEYS.PERSONAL_GOALS,
        JSON.stringify(goals),
      );
      logger.info("Personal goals saved", { count: goals.length });
      return true;
    } catch (error) {
      logger.error("Failed to save personal goals", { error });
      return false;
    }
  }

  /**
   * Get collaborative goals
   */
  static getCollaborativeGoals<T>(): T[] {
    try {
      const stored = localStorage.getItem(
        GOAL_STORAGE_KEYS.COLLABORATIVE_GOALS,
      );
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error("Failed to get collaborative goals", { error });
      return [];
    }
  }

  /**
   * Save collaborative goals
   */
  static setCollaborativeGoals<T>(goals: T[]): boolean {
    try {
      localStorage.setItem(
        GOAL_STORAGE_KEYS.COLLABORATIVE_GOALS,
        JSON.stringify(goals),
      );
      logger.info("Collaborative goals saved", { count: goals.length });
      return true;
    } catch (error) {
      logger.error("Failed to save collaborative goals", { error });
      return false;
    }
  }

  /**
   * Get goal templates
   */
  static getGoalTemplates<T>(): T[] {
    try {
      const stored = localStorage.getItem(GOAL_STORAGE_KEYS.GOAL_TEMPLATES);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error("Failed to get goal templates", { error });
      return [];
    }
  }

  /**
   * Save goal templates
   */
  static setGoalTemplates<T>(templates: T[]): boolean {
    try {
      localStorage.setItem(
        GOAL_STORAGE_KEYS.GOAL_TEMPLATES,
        JSON.stringify(templates),
      );
      logger.info("Goal templates saved", { count: templates.length });
      return true;
    } catch (error) {
      logger.error("Failed to save goal templates", { error });
      return false;
    }
  }

  /**
   * Clear all goal storage
   */
  static clearAll(): boolean {
    try {
      localStorage.removeItem(GOAL_STORAGE_KEYS.PERSONAL_GOALS);
      localStorage.removeItem(GOAL_STORAGE_KEYS.COLLABORATIVE_GOALS);
      localStorage.removeItem(GOAL_STORAGE_KEYS.GOAL_TEMPLATES);
      logger.info("All goal storage cleared");
      return true;
    } catch (error) {
      logger.error("Failed to clear goal storage", { error });
      return false;
    }
  }
}
