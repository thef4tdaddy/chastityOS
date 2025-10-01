/**
 * Report Storage Service
 * Handles all reporting-related localStorage operations
 */

import { logger } from "@/utils/logging";

// Storage keys used by reporting system
export const REPORT_STORAGE_KEYS = {
  CUSTOM_REPORTS: "chastity-reports-custom",
  RECENT_REPORTS: "chastity-reports-recent",
  PREFERENCES: "chastity-reports-preferences",
} as const;

/**
 * Report Storage Service
 * Centralizes all reporting-related localStorage operations
 */
export class ReportStorageService {
  /**
   * Get custom reports
   */
  static getCustomReports<T>(): T[] {
    try {
      const stored = localStorage.getItem(REPORT_STORAGE_KEYS.CUSTOM_REPORTS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error("Failed to get custom reports", { error });
      return [];
    }
  }

  /**
   * Save custom reports
   */
  static setCustomReports<T>(reports: T[]): boolean {
    try {
      localStorage.setItem(
        REPORT_STORAGE_KEYS.CUSTOM_REPORTS,
        JSON.stringify(reports),
      );
      logger.info("Custom reports saved", { count: reports.length });
      return true;
    } catch (error) {
      logger.error("Failed to save custom reports", { error });
      return false;
    }
  }

  /**
   * Get recent reports
   */
  static getRecentReports<T>(): T[] {
    try {
      const stored = localStorage.getItem(REPORT_STORAGE_KEYS.RECENT_REPORTS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error("Failed to get recent reports", { error });
      return [];
    }
  }

  /**
   * Save recent reports
   */
  static setRecentReports<T>(reports: T[]): boolean {
    try {
      localStorage.setItem(
        REPORT_STORAGE_KEYS.RECENT_REPORTS,
        JSON.stringify(reports),
      );
      logger.info("Recent reports saved", { count: reports.length });
      return true;
    } catch (error) {
      logger.error("Failed to save recent reports", { error });
      return false;
    }
  }

  /**
   * Get reporting preferences
   */
  static getPreferences<T>(): T | null {
    try {
      const stored = localStorage.getItem(REPORT_STORAGE_KEYS.PREFERENCES);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      logger.error("Failed to get reporting preferences", { error });
      return null;
    }
  }

  /**
   * Save reporting preferences
   */
  static setPreferences<T>(preferences: T): boolean {
    try {
      localStorage.setItem(
        REPORT_STORAGE_KEYS.PREFERENCES,
        JSON.stringify(preferences),
      );
      logger.info("Reporting preferences saved");
      return true;
    } catch (error) {
      logger.error("Failed to save reporting preferences", { error });
      return false;
    }
  }

  /**
   * Clear all reporting storage
   */
  static clearAll(): boolean {
    try {
      localStorage.removeItem(REPORT_STORAGE_KEYS.CUSTOM_REPORTS);
      localStorage.removeItem(REPORT_STORAGE_KEYS.RECENT_REPORTS);
      localStorage.removeItem(REPORT_STORAGE_KEYS.PREFERENCES);
      logger.info("All reporting storage cleared");
      return true;
    } catch (error) {
      logger.error("Failed to clear reporting storage", { error });
      return false;
    }
  }
}
