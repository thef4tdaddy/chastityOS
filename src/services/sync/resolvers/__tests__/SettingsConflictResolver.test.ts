/**
 * Settings Conflict Resolver Tests
 * Unit tests for type-safe DBSettings conflict resolution
 */
import { describe, it, expect, beforeEach } from "vitest";
import { SettingsConflictResolver } from "../SettingsConflictResolver";
import type { DBSettings } from "@/types/database";

describe("SettingsConflictResolver", () => {
  let resolver: SettingsConflictResolver;

  beforeEach(() => {
    resolver = new SettingsConflictResolver();
  });

  const createBaseSettings = (overrides?: Partial<DBSettings>): DBSettings => ({
    id: "settings-1",
    userId: "user-123",
    syncStatus: "synced",
    lastModified: new Date("2024-01-01T10:00:00Z"),
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
      defaultSessionGoal: 3600,
      hardcoreModeEnabled: false,
    },
    display: {
      language: "en",
      timezone: "UTC",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      startOfWeek: "sunday",
    },
    achievements: {
      enableTracking: true,
      showProgress: true,
      enableNotifications: true,
    },
    ...overrides,
  });

  describe("resolve", () => {
    it("should use latest timestamp for simple field conflicts", () => {
      const local = createBaseSettings({
        theme: "light",
        lastModified: new Date("2024-01-01T12:00:00Z"),
      });

      const remote = createBaseSettings({
        theme: "dark",
        lastModified: new Date("2024-01-01T10:00:00Z"),
      });

      const result = resolver.resolve(local, remote);

      expect(result.theme).toBe("light");
      expect(result.syncStatus).toBe("synced");
    });

    it("should use remote when remote is newer", () => {
      const local = createBaseSettings({
        theme: "light",
        lastModified: new Date("2024-01-01T10:00:00Z"),
      });

      const remote = createBaseSettings({
        theme: "dark",
        lastModified: new Date("2024-01-01T12:00:00Z"),
      });

      const result = resolver.resolve(local, remote);

      expect(result.theme).toBe("dark");
    });

    it("should merge nested notification settings", () => {
      const local = createBaseSettings({
        notifications: {
          enabled: true,
          sessionReminders: true,
          taskDeadlines: false,
          keyholderMessages: true,
          goalProgress: false,
          achievements: true,
        },
        lastModified: new Date("2024-01-01T12:00:00Z"),
      });

      const remote = createBaseSettings({
        notifications: {
          enabled: false,
          sessionReminders: false,
          taskDeadlines: true,
          keyholderMessages: false,
          goalProgress: true,
          achievements: false,
        },
        lastModified: new Date("2024-01-01T10:00:00Z"),
      });

      const result = resolver.resolve(local, remote);

      // Local is newer, so local notification settings should win
      expect(result.notifications).toMatchObject({
        enabled: true,
        sessionReminders: true,
        taskDeadlines: false,
      });
    });

    it("should handle privacy settings correctly", () => {
      const local = createBaseSettings({
        privacy: {
          publicProfile: true,
          shareStatistics: true,
          allowDataExport: false,
          shareAchievements: true,
        },
        lastModified: new Date("2024-01-01T12:00:00Z"),
      });

      const remote = createBaseSettings({
        privacy: {
          publicProfile: false,
          shareStatistics: false,
          allowDataExport: true,
          shareAchievements: false,
        },
        lastModified: new Date("2024-01-01T10:00:00Z"),
      });

      const result = resolver.resolve(local, remote);

      expect(result.privacy.publicProfile).toBe(true);
      expect(result.privacy.shareStatistics).toBe(true);
    });

    it("should preserve system fields from newer version", () => {
      const local = createBaseSettings({
        userId: "user-123",
        syncStatus: "pending",
        lastModified: new Date("2024-01-01T12:00:00Z"),
      });

      const remote = createBaseSettings({
        userId: "user-456",
        syncStatus: "synced",
        lastModified: new Date("2024-01-01T10:00:00Z"),
      });

      const result = resolver.resolve(local, remote);

      expect(result.userId).toBe("user-123"); // Local is newer
      expect(result.syncStatus).toBe("synced"); // Updated to synced
    });

    it("should handle no conflicts gracefully", () => {
      const local = createBaseSettings();
      const remote = createBaseSettings();

      const result = resolver.resolve(local, remote);

      expect(result.theme).toBe("dark");
      expect(result.syncStatus).toBe("synced");
    });

    it("should update lastModified to current time", () => {
      const local = createBaseSettings({
        lastModified: new Date("2024-01-01T10:00:00Z"),
      });
      const remote = createBaseSettings({
        lastModified: new Date("2024-01-01T10:00:00Z"),
      });

      const beforeResolve = new Date();
      const result = resolver.resolve(local, remote);
      const afterResolve = new Date();

      expect(result.lastModified.getTime()).toBeGreaterThanOrEqual(
        beforeResolve.getTime(),
      );
      expect(result.lastModified.getTime()).toBeLessThanOrEqual(
        afterResolve.getTime(),
      );
    });

    it("should handle boolean notifications for backward compatibility", () => {
      const local = createBaseSettings({
        notifications: true as any,
        lastModified: new Date("2024-01-01T12:00:00Z"),
      });

      const remote = createBaseSettings({
        notifications: false as any,
        lastModified: new Date("2024-01-01T10:00:00Z"),
      });

      const result = resolver.resolve(local, remote);

      // Should preserve the value from newer version
      expect(result.notifications).toBe(true);
    });

    it("should merge chastity settings correctly", () => {
      const local = createBaseSettings({
        chastity: {
          allowEmergencyUnlock: false,
          emergencyUnlockCooldown: 48,
          requireKeyholderApproval: true,
          defaultSessionGoal: 7200,
          hardcoreModeEnabled: true,
        },
        lastModified: new Date("2024-01-01T12:00:00Z"),
      });

      const remote = createBaseSettings({
        chastity: {
          allowEmergencyUnlock: true,
          emergencyUnlockCooldown: 24,
          requireKeyholderApproval: false,
          defaultSessionGoal: 3600,
          hardcoreModeEnabled: false,
        },
        lastModified: new Date("2024-01-01T10:00:00Z"),
      });

      const result = resolver.resolve(local, remote);

      expect(result.chastity.allowEmergencyUnlock).toBe(false);
      expect(result.chastity.emergencyUnlockCooldown).toBe(48);
      expect(result.chastity.hardcoreModeEnabled).toBe(true);
    });
  });
});
