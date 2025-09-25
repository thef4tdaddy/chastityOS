/**
 * Settings Database Service
 * Handles all local database operations for user settings
 */
import { BaseDBService } from "./BaseDBService";
import { db } from "../storage/ChastityDB";
import type { DBSettings } from "@/types/database";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("SettingsDBService");

class SettingsDBService extends BaseDBService<DBSettings> {
  constructor() {
    super(db.settings);
  }

  /**
   * Get settings for a user
   */
  async getSettings(userId: string): Promise<DBSettings | undefined> {
    try {
      const settings = await this.table.where("userId").equals(userId).first();
      logger.debug("Get settings", { userId, found: !!settings });
      return settings;
    } catch (error) {
      logger.error("Failed to get settings", { error: error as Error, userId });
      throw error;
    }
  }

  /**
   * Update settings for a user
   */
  async updateSettings(
    userId: string,
    updates: Partial<DBSettings>,
  ): Promise<void> {
    try {
      const settings = await this.getSettings(userId);
      if (settings) {
        await this.update(settings.id, updates);
      } else {
        const newSettings: Omit<DBSettings, "lastModified" | "syncStatus"> = {
          id: userId, // Use userId as the id for settings
          userId,
          theme: "dark",
          notifications: {
            enabled: true,
            sessionReminders: true,
            taskDeadlines: true,
            keyholderMessages: true,
            goalProgress: true,
          },
          privacy: {
            publicProfile: false,
            shareStatistics: false,
            allowDataExport: true,
          },
          chastity: {
            allowEmergencyUnlock: true,
            emergencyUnlockCooldown: 24, // hours
            requireKeyholderApproval: false,
            defaultSessionGoal: 0, // seconds
            hardcoreModeEnabled: false,
          },
          display: {
            language: "en",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            dateFormat: "MM/dd/yyyy",
            timeFormat: "12h",
            startOfWeek: "sunday",
          },
          ...updates,
        };
        await this.create(newSettings);
      }
      logger.info("Updated settings", {
        userId,
        updates: Object.keys(updates),
      });
    } catch (error) {
      logger.error("Failed to update settings", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }
}

export const settingsDBService = new SettingsDBService();
