/**
 * Health Check Storage Service
 * Handles all health check-related localStorage operations
 */

import { logger } from "@/utils/logging";

// Storage keys used by health check system
export const HEALTH_CHECK_STORAGE_KEYS = {
  HEALTH_CHECK_DATA: "chastity-health-check-data",
} as const;

/**
 * Health Check Storage Service
 * Centralizes all health check-related localStorage operations
 */
export class HealthCheckStorageService {
  /**
   * Get health check data
   */
  static getHealthCheckData<T>(): T | null {
    try {
      const stored = localStorage.getItem(
        HEALTH_CHECK_STORAGE_KEYS.HEALTH_CHECK_DATA,
      );
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      logger.error("Failed to get health check data", { error });
      return null;
    }
  }

  /**
   * Save health check data
   */
  static setHealthCheckData<T>(data: T): boolean {
    try {
      localStorage.setItem(
        HEALTH_CHECK_STORAGE_KEYS.HEALTH_CHECK_DATA,
        JSON.stringify(data),
      );
      logger.info("Health check data saved");
      return true;
    } catch (error) {
      logger.error("Failed to save health check data", { error });
      return false;
    }
  }

  /**
   * Test localStorage availability (for health checks)
   */
  static testLocalStorage(): boolean {
    try {
      const testKey = "health-check-test";
      const testValue = "test";
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      return retrieved === testValue;
    } catch (error) {
      logger.error("localStorage health check failed", { error });
      return false;
    }
  }

  /**
   * Clear health check storage
   */
  static clearAll(): boolean {
    try {
      localStorage.removeItem(HEALTH_CHECK_STORAGE_KEYS.HEALTH_CHECK_DATA);
      logger.info("Health check storage cleared");
      return true;
    } catch (error) {
      logger.error("Failed to clear health check storage", { error });
      return false;
    }
  }
}
