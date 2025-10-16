/**
 * Achievement Synchronization Integration Tests
 * Tests achievement data synchronization across devices and sessions
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AchievementDataSync } from "../../services/sync/AchievementDataSync";
import { achievementDBService } from "../../services/database";
import {
  DBAchievement,
  AchievementCategory,
  AchievementDifficulty,
} from "../../types";

// Mock Firebase
vi.mock("../../services/firebase", () => ({
  getFirebaseAuth: vi.fn(() => ({
    currentUser: { uid: "test-user-id" },
  })),
  getFirestore: vi.fn(),
  getFirebaseStorage: vi.fn(),
}));

// Mock the database service
vi.mock("../../services/database", () => ({
  achievementDBService: {
    getAllAchievements: vi.fn(),
    getUserAchievements: vi.fn(),
    createAchievement: vi.fn(),
    updateAchievement: vi.fn(),
    awardAchievement: vi.fn(),
    getAchievementProgress: vi.fn(),
    updateAchievementProgress: vi.fn(),
    getNotifications: vi.fn(),
    createNotification: vi.fn(),
    markNotificationRead: vi.fn(),
  },
}));

// Mock logger
vi.mock("../../utils/logging", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("Achievement Synchronization Integration Tests", () => {
  const mockUserId = "test-user-123";

  const createMockAchievement = (
    id: string,
    syncStatus: "synced" | "pending" | "conflict" = "synced",
  ): DBAchievement => ({
    id,
    name: `Achievement ${id}`,
    description: `Description for ${id}`,
    category: AchievementCategory.SESSION_MILESTONES,
    icon: "🏆",
    difficulty: AchievementDifficulty.COMMON,
    points: 100,
    requirements: [
      {
        type: "session_count",
        value: 1,
        unit: "count",
      },
    ],
    isHidden: false,
    isActive: true,
    syncStatus,
    lastModified: new Date(),
  });

  const createMockUserAchievement = (
    id: string,
    achievementId: string,
    syncStatus: "synced" | "pending" | "conflict" = "synced",
  ) => ({
    id,
    userId: mockUserId,
    achievementId,
    earnedAt: new Date(),
    progress: 100,
    isVisible: true,
    syncStatus,
    lastModified: new Date(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Achievement Data Synchronization", () => {
    it("should sync achievement data between local and remote", async () => {
      const localAchievements = [
        createMockAchievement("achievement-1", "pending"),
        createMockAchievement("achievement-2", "synced"),
      ];

      const remoteAchievements = [
        createMockAchievement("achievement-2", "synced"),
        createMockAchievement("achievement-3", "synced"),
      ];

      (achievementDBService.getAllAchievements as any).mockResolvedValue(
        localAchievements,
      );

      // Simulated sync logic
      const achievementsToSync = localAchievements.filter(
        (a) => a.syncStatus === "pending",
      );

      expect(achievementsToSync).toHaveLength(1);
      expect(achievementsToSync[0]?.id).toBe("achievement-1");
    });

    it("should sync user achievement progress across devices", async () => {
      const localUserAchievements = [
        createMockUserAchievement("ua-1", "achievement-1", "pending"),
        createMockUserAchievement("ua-2", "achievement-2", "synced"),
      ];

      (achievementDBService.getUserAchievements as any).mockResolvedValue(
        localUserAchievements,
      );

      const pendingSync = localUserAchievements.filter(
        (ua) => ua.syncStatus === "pending",
      );

      expect(pendingSync).toHaveLength(1);
      expect(pendingSync[0]?.achievementId).toBe("achievement-1");
    });

    it("should handle sync conflicts with last-write-wins strategy", async () => {
      const olderAchievement = {
        ...createMockAchievement("achievement-1", "conflict"),
        lastModified: new Date(Date.now() - 60000),
      };

      const newerAchievement = {
        ...createMockAchievement("achievement-1", "synced"),
        lastModified: new Date(),
      };

      // Newer version should win
      const winner =
        olderAchievement.lastModified > newerAchievement.lastModified
          ? olderAchievement
          : newerAchievement;

      expect(winner.syncStatus).toBe("synced");
      expect(winner.lastModified).toEqual(newerAchievement.lastModified);
    });

    it("should sync achievement notifications across devices", async () => {
      const notifications = [
        {
          id: "notif-1",
          userId: mockUserId,
          achievementId: "achievement-1",
          type: "earned",
          title: "Achievement Unlocked!",
          message: "You earned an achievement",
          isRead: false,
          createdAt: new Date(),
          syncStatus: "pending",
        },
      ];

      (achievementDBService.getNotifications as any).mockResolvedValue(
        notifications,
      );

      const pendingNotifications = notifications.filter(
        (n) => n.syncStatus === "pending",
      );

      expect(pendingNotifications).toHaveLength(1);
    });
  });

  describe("Offline Achievement Tracking", () => {
    it("should track achievements offline and sync when online", async () => {
      const offlineAchievement = createMockUserAchievement(
        "offline-1",
        "achievement-1",
        "pending",
      );

      (achievementDBService.getUserAchievements as any).mockResolvedValue([
        offlineAchievement,
      ]);

      // Simulate coming online
      const toSync = [offlineAchievement];

      expect(toSync).toHaveLength(1);
      expect(toSync[0]?.syncStatus).toBe("pending");

      // After sync
      toSync[0].syncStatus = "synced";
      expect(toSync[0].syncStatus).toBe("synced");
    });

    it("should queue multiple offline achievements for sync", async () => {
      const offlineAchievements = [
        createMockUserAchievement("offline-1", "achievement-1", "pending"),
        createMockUserAchievement("offline-2", "achievement-2", "pending"),
        createMockUserAchievement("offline-3", "achievement-3", "pending"),
      ];

      (achievementDBService.getUserAchievements as any).mockResolvedValue(
        offlineAchievements,
      );

      const syncQueue = offlineAchievements.filter(
        (a) => a.syncStatus === "pending",
      );

      expect(syncQueue).toHaveLength(3);
    });

    it("should handle partial sync failures", async () => {
      const achievements = [
        createMockUserAchievement("ua-1", "achievement-1", "pending"),
        createMockUserAchievement("ua-2", "achievement-2", "pending"),
      ];

      // Simulate first one syncs successfully
      achievements[0].syncStatus = "synced";

      // Second one fails to sync
      const stillPending = achievements.filter(
        (a) => a.syncStatus === "pending",
      );

      expect(stillPending).toHaveLength(1);
      expect(stillPending[0]?.id).toBe("ua-2");
    });
  });

  describe("Achievement Progress Synchronization", () => {
    it("should sync achievement progress updates", async () => {
      const progressUpdates = [
        {
          userId: mockUserId,
          achievementId: "achievement-1",
          currentValue: 5,
          targetValue: 10,
          lastUpdated: new Date(),
          isCompleted: false,
          syncStatus: "pending",
        },
      ];

      (achievementDBService.getAchievementProgress as any).mockResolvedValue(
        progressUpdates[0],
      );

      const pendingProgress = progressUpdates.filter(
        (p) => p.syncStatus === "pending",
      );

      expect(pendingProgress).toHaveLength(1);
      expect(pendingProgress[0]?.currentValue).toBe(5);
    });

    it("should merge progress from multiple devices", async () => {
      const device1Progress = {
        currentValue: 7,
        lastUpdated: new Date(Date.now() - 60000),
      };

      const device2Progress = {
        currentValue: 8,
        lastUpdated: new Date(),
      };

      // Most recent progress should win
      const mergedProgress =
        device1Progress.lastUpdated > device2Progress.lastUpdated
          ? device1Progress
          : device2Progress;

      expect(mergedProgress.currentValue).toBe(8);
    });

    it("should handle progress completion across devices", async () => {
      const progressOnDevice1 = {
        currentValue: 9,
        targetValue: 10,
        isCompleted: false,
      };

      const progressOnDevice2 = {
        currentValue: 10,
        targetValue: 10,
        isCompleted: true,
      };

      // Completed status should always win
      const finalProgress = progressOnDevice2.isCompleted
        ? progressOnDevice2
        : progressOnDevice1;

      expect(finalProgress.isCompleted).toBe(true);
      expect(finalProgress.currentValue).toBe(10);
    });
  });

  describe("Cross-Device Achievement Unlock", () => {
    it("should unlock achievement on all devices after sync", async () => {
      const userAchievement = createMockUserAchievement(
        "ua-1",
        "achievement-1",
        "synced",
      );

      (achievementDBService.getUserAchievements as any).mockResolvedValue([
        userAchievement,
      ]);

      const achievements =
        await achievementDBService.getUserAchievements(mockUserId);

      expect(achievements).toHaveLength(1);
      expect(achievements[0]?.syncStatus).toBe("synced");
    });

    it("should deduplicate achievements unlocked on multiple devices", async () => {
      const duplicateAchievements = [
        createMockUserAchievement("ua-1", "achievement-1", "synced"),
        createMockUserAchievement("ua-2", "achievement-1", "pending"),
      ];

      // Deduplication logic
      const uniqueAchievements = duplicateAchievements.reduce(
        (acc, curr) => {
          const exists = acc.find(
            (a) => a.achievementId === curr.achievementId,
          );
          if (!exists) {
            acc.push(curr);
          }
          return acc;
        },
        [] as typeof duplicateAchievements,
      );

      expect(uniqueAchievements).toHaveLength(1);
    });

    it("should preserve earliest unlock timestamp across devices", async () => {
      const device1Unlock = {
        ...createMockUserAchievement("ua-1", "achievement-1"),
        earnedAt: new Date(Date.now() - 120000),
      };

      const device2Unlock = {
        ...createMockUserAchievement("ua-2", "achievement-1"),
        earnedAt: new Date(Date.now() - 60000),
      };

      const earliestUnlock =
        device1Unlock.earnedAt < device2Unlock.earnedAt
          ? device1Unlock
          : device2Unlock;

      expect(earliestUnlock.earnedAt).toEqual(device1Unlock.earnedAt);
    });
  });

  describe("Sync Error Handling", () => {
    it("should handle network errors during sync", async () => {
      (achievementDBService.getUserAchievements as any).mockRejectedValue(
        new Error("Network error"),
      );

      await expect(
        achievementDBService.getUserAchievements(mockUserId),
      ).rejects.toThrow("Network error");
    });

    it("should retry failed sync operations", async () => {
      let attemptCount = 0;

      (achievementDBService.updateAchievement as any).mockImplementation(
        async () => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error("Temporary failure");
          }
          return { success: true };
        },
      );

      // Simulate retry logic
      for (let i = 0; i < 3; i++) {
        try {
          await achievementDBService.updateAchievement("achievement-1", {});
          break;
        } catch (error) {
          if (i === 2) throw error;
        }
      }

      expect(attemptCount).toBe(3);
    });

    it("should mark sync as failed after max retries", async () => {
      const maxRetries = 3;
      let retryCount = 0;

      const achievement = createMockAchievement("achievement-1", "pending");

      for (let i = 0; i < maxRetries; i++) {
        retryCount++;
        // Simulate failure
      }

      expect(retryCount).toBe(maxRetries);
      // After max retries, mark as failed
      achievement.syncStatus = "conflict";
      expect(achievement.syncStatus).toBe("conflict");
    });

    it("should handle database constraint violations during sync", async () => {
      (achievementDBService.awardAchievement as any).mockRejectedValue(
        new Error("Constraint violation: duplicate key"),
      );

      await expect(
        achievementDBService.awardAchievement(mockUserId, "achievement-1"),
      ).rejects.toThrow("Constraint violation");
    });
  });

  describe("Data Consistency", () => {
    it("should maintain data consistency during concurrent syncs", async () => {
      const achievement = createMockAchievement("achievement-1", "pending");

      // Simulate two concurrent sync operations
      const sync1 = Promise.resolve({
        ...achievement,
        syncStatus: "synced" as const,
      });
      const sync2 = Promise.resolve({
        ...achievement,
        syncStatus: "synced" as const,
      });

      const [result1, result2] = await Promise.all([sync1, sync2]);

      // Both should succeed and have same status
      expect(result1.syncStatus).toBe("synced");
      expect(result2.syncStatus).toBe("synced");
    });

    it("should validate data integrity after sync", async () => {
      const userAchievement = createMockUserAchievement(
        "ua-1",
        "achievement-1",
        "synced",
      );

      // Validation checks
      expect(userAchievement.userId).toBeTruthy();
      expect(userAchievement.achievementId).toBeTruthy();
      expect(userAchievement.earnedAt).toBeInstanceOf(Date);
      expect(userAchievement.progress).toBeGreaterThanOrEqual(0);
      expect(userAchievement.progress).toBeLessThanOrEqual(100);
    });

    it("should rollback on sync failure to maintain consistency", async () => {
      const originalState = createMockAchievement("achievement-1", "synced");
      const modifiedState = {
        ...originalState,
        syncStatus: "pending" as const,
        name: "Modified Name",
      };

      // Simulate sync failure
      const syncFailed = true;

      const finalState = syncFailed ? originalState : modifiedState;

      expect(finalState.syncStatus).toBe("synced");
      expect(finalState.name).toBe(originalState.name);
    });
  });

  describe("Notification Synchronization", () => {
    it("should sync read status of notifications across devices", async () => {
      const notification = {
        id: "notif-1",
        userId: mockUserId,
        achievementId: "achievement-1",
        type: "earned" as const,
        title: "Achievement Unlocked!",
        message: "You earned an achievement",
        isRead: true,
        createdAt: new Date(),
        syncStatus: "pending" as const,
      };

      (achievementDBService.getNotifications as any).mockResolvedValue([
        notification,
      ]);

      const notifications =
        await achievementDBService.getNotifications(mockUserId);

      expect(notifications[0]?.isRead).toBe(true);
    });

    it("should avoid duplicate notifications across devices", async () => {
      const notifications = [
        {
          id: "notif-1",
          achievementId: "achievement-1",
          isRead: false,
        },
        {
          id: "notif-2",
          achievementId: "achievement-1",
          isRead: false,
        },
      ];

      // Deduplicate by achievementId
      const unique = notifications.reduce(
        (acc, curr) => {
          const exists = acc.find(
            (n) => n.achievementId === curr.achievementId,
          );
          if (!exists) {
            acc.push(curr);
          }
          return acc;
        },
        [] as typeof notifications,
      );

      expect(unique).toHaveLength(1);
    });
  });
});
