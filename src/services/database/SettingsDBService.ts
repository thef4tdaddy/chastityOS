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
        const newSettings = {
          id: userId, // Use userId as the id for settings
          userId,
          theme: "dark" as const,
          notifications: {
            enabled: true,
            sessionReminders: true,
            taskDeadlines: true,
            keyholderMessages: true,
            goalProgress: true,
            achievements: true,
          },
          privacy: {
            publicProfile: false,
            shareStatistics: false,
            allowDataExport: true,
            shareAchievements: false,
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
            timeFormat: "12h" as const,
            startOfWeek: "sunday" as const,
          },
          ...updates,
        } as Omit<DBSettings, "lastModified" | "syncStatus">;
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

  /**
   * Create default settings for a user
   */
  async createDefaultSettings(userId: string): Promise<string> {
    try {
      const defaultSettings: Omit<DBSettings, "lastModified" | "syncStatus"> = {
        id: userId, // Use userId as the id for settings
        userId,
        theme: "dark",
        notifications: {
          enabled: true,
          sessionReminders: true,
          taskDeadlines: true,
          keyholderMessages: true,
          goalProgress: true,
          achievements: true,
        },
        privacy: {
          publicProfile: false,
          shareStatistics: false,
          allowDataExport: true,
          shareAchievements: false,
        },
        chastity: {
          allowEmergencyUnlock: true,
          emergencyUnlockCooldown: 24,
          requireKeyholderApproval: false,
          defaultSessionGoal: 0,
          hardcoreModeEnabled: false,
        },
        display: {
          language: "en",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          dateFormat: "MM/dd/yyyy",
          timeFormat: "12h",
          startOfWeek: "sunday",
        },
        achievements: {
          enableTracking: true,
          showProgress: true,
          enableNotifications: true,
        },
        // Flat defaults
        accountDiscoverable: true,
        showActivityStatus: false,
        dataCollection: false,
      };

      await this.create(defaultSettings);
      logger.info("Created default settings", { userId });
      return userId;
    } catch (error) {
      logger.error("Failed to create default settings", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Update account settings (submissive name, etc.)
   */
  async updateAccountSettings(
    userId: string,
    data: {
      submissiveName?: string;
      displayName?: string;
    },
  ): Promise<void> {
    try {
      await this.updateSettings(userId, {
        ...data,
        updatedAt: new Date(),
      });
      logger.info("Updated account settings", {
        userId,
        fields: Object.keys(data),
      });
    } catch (error) {
      logger.error("Failed to update account settings", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Update display settings (timezone, notifications)
   */
  async updateDisplaySettings(
    userId: string,
    data: {
      timezone?: string;
      notifications?: boolean;
      language?: string;
    },
  ): Promise<void> {
    try {
      const updates: Partial<DBSettings> = {
        updatedAt: new Date(),
      };

      if (data.timezone !== undefined) {
        updates.timezone = data.timezone;
        // Also update the display.timezone for consistency
        const settings = await this.getSettings(userId);
        if (settings?.display) {
          updates.display = {
            ...settings.display,
            timezone: data.timezone,
          };
        }
      }

      if (data.notifications !== undefined) {
        updates.notifications = data.notifications;
      }

      if (data.language !== undefined) {
        updates.language = data.language;
        const settings = await this.getSettings(userId);
        if (settings?.display) {
          updates.display = {
            ...(updates.display || settings.display),
            language: data.language,
          };
        }
      }

      await this.updateSettings(userId, updates);
      logger.info("Updated display settings", {
        userId,
        fields: Object.keys(data),
      });
    } catch (error) {
      logger.error("Failed to update display settings", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Update profile settings (public profile, bio, etc.)
   */
  async updateProfileSettings(
    userId: string,
    data: {
      publicProfile?: boolean;
      shareStatistics?: boolean;
      bio?: string;
      profileImageUrl?: string;
    },
  ): Promise<void> {
    try {
      const updates: Partial<DBSettings> = {
        ...data,
        updatedAt: new Date(),
      };

      // Also update privacy object for consistency
      const settings = await this.getSettings(userId);
      if (
        settings?.privacy &&
        (data.publicProfile !== undefined || data.shareStatistics !== undefined)
      ) {
        updates.privacy = {
          ...settings.privacy,
          ...(data.publicProfile !== undefined && {
            publicProfile: data.publicProfile,
          }),
          ...(data.shareStatistics !== undefined && {
            shareStatistics: data.shareStatistics,
          }),
        };
      }

      await this.updateSettings(userId, updates);
      logger.info("Updated profile settings", {
        userId,
        fields: Object.keys(data),
      });
    } catch (error) {
      logger.error("Failed to update profile settings", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Update privacy settings (data collection, discoverability, etc.)
   */
  async updatePrivacySettings(
    userId: string,
    data: {
      dataCollection?: boolean;
      accountDiscoverable?: boolean;
      showActivityStatus?: boolean;
    },
  ): Promise<void> {
    try {
      await this.updateSettings(userId, {
        ...data,
        updatedAt: new Date(),
      });
      logger.info("Updated privacy settings", {
        userId,
        fields: Object.keys(data),
      });
    } catch (error) {
      logger.error("Failed to update privacy settings", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get user settings or create default if none exist
   */
  async getUserSettings(userId: string): Promise<DBSettings> {
    try {
      const settings = await this.getSettings(userId);
      if (!settings) {
        await this.createDefaultSettings(userId);
        const newSettings = await this.getSettings(userId);
        if (!newSettings) {
          throw new Error("Failed to create default settings");
        }
        return newSettings;
      }
      return settings;
    } catch (error) {
      logger.error("Failed to get user settings", {
        error: error as Error,
        userId,
      });
      throw error;
    }
  }
}

export const settingsDBService = new SettingsDBService();
