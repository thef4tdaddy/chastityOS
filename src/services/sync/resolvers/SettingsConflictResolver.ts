/**
 * Settings Conflict Resolver
 * Type-safe conflict resolution specifically for DBSettings objects
 */
import { serviceLogger } from "@/utils/logging";
import type { DBSettings } from "@/types/database";

const logger = serviceLogger("SettingsConflictResolver");

export class SettingsConflictResolver {
  /**
   * Resolve conflict for a settings document
   * Strategy: Merge non-conflicting fields intelligently with type safety
   */
  resolve(local: DBSettings, remote: DBSettings): DBSettings {
    logger.debug(`Resolving settings conflict for ${local.userId}`);

    // Start with the remote settings as base
    const merged: DBSettings = { ...remote };

    // System fields that should use latest timestamp
    const systemFields: (keyof DBSettings)[] = [
      "lastModified",
      "syncStatus",
      "userId",
    ];

    // Check each field for conflicts
    const localKeys = Object.keys(local) as (keyof DBSettings)[];

    localKeys.forEach((key) => {
      if (local[key] !== remote[key]) {
        if (systemFields.includes(key)) {
          // System fields: latest timestamp wins
          if (local.lastModified > remote.lastModified) {
            merged[key] = local[key] as never;
          }
        } else {
          // For complex objects, do deep comparison
          const localVal = local[key];
          const remoteVal = remote[key];

          if (
            typeof localVal === "object" &&
            localVal !== null &&
            typeof remoteVal === "object" &&
            remoteVal !== null
          ) {
            // Merge objects recursively where possible
            if (
              key === "notifications" ||
              key === "privacy" ||
              key === "chastity" ||
              key === "display" ||
              key === "achievements" ||
              key === "keyholderPermissions"
            ) {
              merged[key] = this.mergeSettingsObject(
                localVal as Record<string, unknown>,
                remoteVal as Record<string, unknown>,
                local.lastModified,
                remote.lastModified,
              ) as never;
            } else {
              // For other objects, use timestamp rule
              merged[key] = (
                local.lastModified > remote.lastModified ? localVal : remoteVal
              ) as never;
            }
          } else {
            // Simple values: use timestamp rule for automatic resolution
            merged[key] = (
              local.lastModified > remote.lastModified ? localVal : remoteVal
            ) as never;
          }
        }
      }
    });

    // Update metadata
    merged.lastModified = new Date();
    merged.syncStatus = "synced";

    logger.info(`Settings conflict resolved for ${local.userId}`, {
      resolvedAutomatically: true,
    });

    return merged;
  }

  /**
   * Merge settings sub-objects intelligently
   */
  private mergeSettingsObject(
    local: Record<string, unknown>,
    remote: Record<string, unknown>,
    localTimestamp: Date,
    remoteTimestamp: Date,
  ): Record<string, unknown> {
    const merged = { ...remote };

    Object.keys(local).forEach((key) => {
      if (local[key] !== remote[key]) {
        // Use latest timestamp for individual settings
        merged[key] =
          localTimestamp > remoteTimestamp ? local[key] : remote[key];
      }
    });

    return merged;
  }

  /**
   * Merge notification settings specifically
   */
  private mergeNotificationSettings(
    local: DBSettings["notifications"],
    remote: DBSettings["notifications"],
  ): DBSettings["notifications"] {
    // Handle both boolean and object types
    if (typeof local === "boolean" && typeof remote === "boolean") {
      return local || remote; // If either is enabled, enable notifications
    }

    if (typeof local === "object" && typeof remote === "object") {
      return {
        enabled: local.enabled || remote.enabled,
        sessionReminders: local.sessionReminders || remote.sessionReminders,
        taskDeadlines: local.taskDeadlines || remote.taskDeadlines,
        keyholderMessages: local.keyholderMessages || remote.keyholderMessages,
        goalProgress: local.goalProgress || remote.goalProgress,
        achievements: local.achievements || remote.achievements,
        tasks: local.tasks || remote.tasks,
        pushEnabled: local.pushEnabled || remote.pushEnabled,
      };
    }

    // Fallback: prefer object over boolean
    return typeof local === "object" ? local : remote;
  }

  /**
   * Merge privacy settings specifically
   */
  private mergePrivacySettings(
    local: DBSettings["privacy"],
    remote: DBSettings["privacy"],
  ): DBSettings["privacy"] {
    return {
      publicProfile: local.publicProfile && remote.publicProfile,
      shareStatistics: local.shareStatistics && remote.shareStatistics,
      allowDataExport: local.allowDataExport || remote.allowDataExport,
      shareAchievements: local.shareAchievements && remote.shareAchievements,
    };
  }
}

export const settingsConflictResolver = new SettingsConflictResolver();
