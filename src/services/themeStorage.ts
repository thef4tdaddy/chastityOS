/**
 * Theme Storage Service
 * Handles all theme-related localStorage operations
 */

import { logger } from "@/utils/logging";

// Storage keys used by theme system
export const THEME_STORAGE_KEYS = {
  CURRENT_THEME: "chastity-theme-current",
  CUSTOM_THEMES: "chastity-theme-custom",
  PREFERENCES: "chastity-theme-preferences",
  ACCESSIBILITY: "chastity-theme-accessibility",
} as const;

/**
 * Theme Storage Service
 * Centralizes all theme-related localStorage operations
 */
export class ThemeStorageService {
  /**
   * Get stored theme ID
   */
  static getCurrentTheme(): string | null {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEYS.CURRENT_THEME);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      logger.error("Failed to get current theme", { error });
      return null;
    }
  }

  /**
   * Set current theme ID
   */
  static setCurrentTheme(themeId: string): boolean {
    try {
      localStorage.setItem(
        THEME_STORAGE_KEYS.CURRENT_THEME,
        JSON.stringify(themeId),
      );
      logger.info("Theme saved", { themeId });
      return true;
    } catch (error) {
      logger.error("Failed to save theme", { error });
      return false;
    }
  }

  /**
   * Get custom themes
   */
  static getCustomThemes<T>(): T[] {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEYS.CUSTOM_THEMES);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error("Failed to get custom themes", { error });
      return [];
    }
  }

  /**
   * Save custom themes
   */
  static setCustomThemes<T>(themes: T[]): boolean {
    try {
      localStorage.setItem(
        THEME_STORAGE_KEYS.CUSTOM_THEMES,
        JSON.stringify(themes),
      );
      logger.info("Custom themes saved", { count: themes.length });
      return true;
    } catch (error) {
      logger.error("Failed to save custom themes", { error });
      return false;
    }
  }

  /**
   * Get theme preferences
   */
  static getPreferences<T>(): T | null {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEYS.PREFERENCES);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      logger.error("Failed to get theme preferences", { error });
      return null;
    }
  }

  /**
   * Save theme preferences
   */
  static setPreferences<T>(preferences: T): boolean {
    try {
      localStorage.setItem(
        THEME_STORAGE_KEYS.PREFERENCES,
        JSON.stringify(preferences),
      );
      logger.info("Theme preferences saved");
      return true;
    } catch (error) {
      logger.error("Failed to save theme preferences", { error });
      return false;
    }
  }

  /**
   * Get accessibility settings
   */
  static getAccessibilitySettings<T>(): T | null {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEYS.ACCESSIBILITY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      logger.error("Failed to get accessibility settings", { error });
      return null;
    }
  }

  /**
   * Save accessibility settings
   */
  static setAccessibilitySettings<T>(settings: T): boolean {
    try {
      localStorage.setItem(
        THEME_STORAGE_KEYS.ACCESSIBILITY,
        JSON.stringify(settings),
      );
      logger.info("Accessibility settings saved");
      return true;
    } catch (error) {
      logger.error("Failed to save accessibility settings", { error });
      return false;
    }
  }

  /**
   * Clear all theme storage
   */
  static clearAll(): boolean {
    try {
      localStorage.removeItem(THEME_STORAGE_KEYS.CURRENT_THEME);
      localStorage.removeItem(THEME_STORAGE_KEYS.CUSTOM_THEMES);
      localStorage.removeItem(THEME_STORAGE_KEYS.PREFERENCES);
      localStorage.removeItem(THEME_STORAGE_KEYS.ACCESSIBILITY);
      logger.info("All theme storage cleared");
      return true;
    } catch (error) {
      logger.error("Failed to clear theme storage", { error });
      return false;
    }
  }
}
