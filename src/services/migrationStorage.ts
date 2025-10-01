/**
 * Migration Storage Service
 * Handles all migration-related localStorage operations
 */

import { logger } from "@/utils/logging";

// Storage keys used by migration system
export const MIGRATION_STORAGE_KEYS = {
  MIGRATION_STATE: "chastity-migration-state",
  MIGRATION_BACKUPS: "chastity-migration-backups",
} as const;

/**
 * Migration Storage Service
 * Centralizes all migration-related localStorage operations
 */
export class MigrationStorageService {
  /**
   * Get migration state
   */
  static getMigrationState<T>(): T | null {
    try {
      const stored = localStorage.getItem(
        MIGRATION_STORAGE_KEYS.MIGRATION_STATE,
      );
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      logger.error("Failed to get migration state", { error });
      return null;
    }
  }

  /**
   * Save migration state
   */
  static setMigrationState<T>(state: T): boolean {
    try {
      localStorage.setItem(
        MIGRATION_STORAGE_KEYS.MIGRATION_STATE,
        JSON.stringify(state),
      );
      logger.info("Migration state saved");
      return true;
    } catch (error) {
      logger.error("Failed to save migration state", { error });
      return false;
    }
  }

  /**
   * Get migration backups
   */
  static getMigrationBackups<T>(): T[] {
    try {
      const stored = localStorage.getItem(
        MIGRATION_STORAGE_KEYS.MIGRATION_BACKUPS,
      );
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error("Failed to get migration backups", { error });
      return [];
    }
  }

  /**
   * Save migration backups
   */
  static setMigrationBackups<T>(backups: T[]): boolean {
    try {
      localStorage.setItem(
        MIGRATION_STORAGE_KEYS.MIGRATION_BACKUPS,
        JSON.stringify(backups),
      );
      logger.info("Migration backups saved", { count: backups.length });
      return true;
    } catch (error) {
      logger.error("Failed to save migration backups", { error });
      return false;
    }
  }

  /**
   * Get legacy item (for migration purposes)
   */
  static getLegacyItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      logger.error("Failed to get legacy item", { error, key });
      return null;
    }
  }

  /**
   * Set legacy item (for migration purposes)
   */
  static setLegacyItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      logger.info("Legacy item saved", { key });
      return true;
    } catch (error) {
      logger.error("Failed to save legacy item", { error, key });
      return false;
    }
  }

  /**
   * Clear all migration storage
   */
  static clearAll(): boolean {
    try {
      localStorage.removeItem(MIGRATION_STORAGE_KEYS.MIGRATION_STATE);
      localStorage.removeItem(MIGRATION_STORAGE_KEYS.MIGRATION_BACKUPS);
      logger.info("All migration storage cleared");
      return true;
    } catch (error) {
      logger.error("Failed to clear migration storage", { error });
      return false;
    }
  }
}
