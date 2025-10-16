/**
 * AchievementProgressService Unit Tests
 * Tests for achievement progress tracking service
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AchievementProgressService } from "../AchievementProgressService";
import { DBAchievementProgress } from "../../../../types";

// Create mock functions for the table methods
const mockWhere = vi.fn();
const mockAdd = vi.fn();
const mockPut = vi.fn();
const mockToArray = vi.fn();
const mockFirst = vi.fn();

// Mock database structure
vi.mock("../../../storage/ChastityDB", () => ({
  db: {
    achievementProgress: {
      where: mockWhere,
      add: mockAdd,
      put: mockPut,
      toArray: mockToArray,
      first: mockFirst,
    },
  },
}));

// Import the mocked db after mocking
import { db } from "../../../storage/ChastityDB";
const mockProgressTable = {
  where: mockWhere,
  add: mockAdd,
  put: mockPut,
  toArray: mockToArray,
  first: mockFirst,
};

// Mock badge service for achievement awarding
const mockBadgeService = {
  awardAchievement: vi.fn(),
};

describe("AchievementProgressService", () => {
  let service: AchievementProgressService;
  const userId = "user-123";
  const achievementId = "ach-milestone-10";

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AchievementProgressService(mockBadgeService);

    // Setup default mock chain
    mockProgressTable.where.mockReturnValue({
      equals: vi.fn().mockReturnValue({
        and: vi.fn().mockReturnValue({
          first: mockProgressTable.first,
        }),
        toArray: mockProgressTable.toArray,
      }),
    });
  });

  describe("updateAchievementProgress", () => {
    it("should create new progress record when none exists", async () => {
      mockProgressTable.first.mockResolvedValue(undefined);
      mockProgressTable.add.mockResolvedValue("progress-id");

      await service.updateAchievementProgress(userId, achievementId, 5, 10);

      expect(mockProgressTable.add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          achievementId,
          currentValue: 5,
          targetValue: 10,
          isCompleted: false,
          syncStatus: "pending",
        }),
      );
    });

    it("should update existing progress record", async () => {
      const existing: DBAchievementProgress = {
        id: "existing-progress",
        userId,
        achievementId,
        currentValue: 3,
        targetValue: 10,
        isCompleted: false,
        syncStatus: "synced",
        lastModified: new Date("2025-01-01"),
      };
      mockProgressTable.first.mockResolvedValue(existing);
      mockProgressTable.put.mockResolvedValue("existing-progress");

      await service.updateAchievementProgress(userId, achievementId, 7, 10);

      expect(mockProgressTable.put).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "existing-progress",
          userId,
          achievementId,
          currentValue: 7,
          targetValue: 10,
          isCompleted: false,
          syncStatus: "pending",
        }),
      );
    });

    it("should mark progress as completed when target reached", async () => {
      mockProgressTable.first.mockResolvedValue(undefined);
      mockProgressTable.add.mockResolvedValue("progress-id");

      await service.updateAchievementProgress(userId, achievementId, 10, 10);

      expect(mockProgressTable.add).toHaveBeenCalledWith(
        expect.objectContaining({
          isCompleted: true,
        }),
      );
    });

    it("should mark progress as completed when target exceeded", async () => {
      mockProgressTable.first.mockResolvedValue(undefined);
      mockProgressTable.add.mockResolvedValue("progress-id");

      await service.updateAchievementProgress(userId, achievementId, 15, 10);

      expect(mockProgressTable.add).toHaveBeenCalledWith(
        expect.objectContaining({
          currentValue: 15,
          targetValue: 10,
          isCompleted: true,
        }),
      );
    });

    it("should award achievement when progress is completed for first time", async () => {
      const existing: DBAchievementProgress = {
        id: "existing-progress",
        userId,
        achievementId,
        currentValue: 8,
        targetValue: 10,
        isCompleted: false,
        syncStatus: "synced",
        lastModified: new Date("2025-01-01"),
      };
      mockProgressTable.first.mockResolvedValue(existing);
      mockProgressTable.put.mockResolvedValue("existing-progress");
      mockBadgeService.awardAchievement.mockResolvedValue("award-id");

      await service.updateAchievementProgress(userId, achievementId, 10, 10);

      expect(mockBadgeService.awardAchievement).toHaveBeenCalledWith(
        userId,
        achievementId,
        100,
      );
    });

    it("should not award achievement again if already completed", async () => {
      const existing: DBAchievementProgress = {
        id: "existing-progress",
        userId,
        achievementId,
        currentValue: 10,
        targetValue: 10,
        isCompleted: true,
        syncStatus: "synced",
        lastModified: new Date("2025-01-01"),
      };
      mockProgressTable.first.mockResolvedValue(existing);
      mockProgressTable.put.mockResolvedValue("existing-progress");

      await service.updateAchievementProgress(userId, achievementId, 12, 10);

      expect(mockBadgeService.awardAchievement).not.toHaveBeenCalled();
    });

    it("should handle service without badge service gracefully", async () => {
      const serviceWithoutBadge = new AchievementProgressService();
      mockProgressTable.first.mockResolvedValue(undefined);
      mockProgressTable.add.mockResolvedValue("progress-id");

      await expect(
        serviceWithoutBadge.updateAchievementProgress(
          userId,
          achievementId,
          10,
          10,
        ),
      ).resolves.not.toThrow();

      expect(mockProgressTable.add).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      mockProgressTable.first.mockRejectedValue(new Error("Database error"));

      await expect(
        service.updateAchievementProgress(userId, achievementId, 5, 10),
      ).rejects.toThrow("Database error");
    });

    it("should handle edge case: zero progress", async () => {
      mockProgressTable.first.mockResolvedValue(undefined);
      mockProgressTable.add.mockResolvedValue("progress-id");

      await service.updateAchievementProgress(userId, achievementId, 0, 10);

      expect(mockProgressTable.add).toHaveBeenCalledWith(
        expect.objectContaining({
          currentValue: 0,
          targetValue: 10,
          isCompleted: false,
        }),
      );
    });
  });

  describe("getUserAchievementProgress", () => {
    it("should return all progress records for user", async () => {
      const mockProgress: DBAchievementProgress[] = [
        {
          id: "progress-1",
          userId,
          achievementId: "ach-1",
          currentValue: 5,
          targetValue: 10,
          isCompleted: false,
          syncStatus: "synced",
          lastModified: new Date("2025-01-01"),
        },
        {
          id: "progress-2",
          userId,
          achievementId: "ach-2",
          currentValue: 10,
          targetValue: 10,
          isCompleted: true,
          syncStatus: "synced",
          lastModified: new Date("2025-01-01"),
        },
      ];
      mockProgressTable.toArray.mockResolvedValue(mockProgress);

      const result = await service.getUserAchievementProgress(userId);

      expect(result).toEqual(mockProgress);
      expect(result).toHaveLength(2);
    });

    it("should return empty array when user has no progress", async () => {
      mockProgressTable.toArray.mockResolvedValue([]);

      const result = await service.getUserAchievementProgress(userId);

      expect(result).toEqual([]);
    });

    it("should return empty array on error", async () => {
      mockProgressTable.toArray.mockRejectedValue(new Error("Database error"));

      const result = await service.getUserAchievementProgress(userId);

      expect(result).toEqual([]);
    });
  });

  describe("getAchievementProgress", () => {
    it("should return progress for specific achievement", async () => {
      const mockProgress: DBAchievementProgress = {
        id: "progress-1",
        userId,
        achievementId,
        currentValue: 7,
        targetValue: 10,
        isCompleted: false,
        syncStatus: "synced",
        lastModified: new Date("2025-01-01"),
      };
      mockProgressTable.first.mockResolvedValue(mockProgress);

      const result = await service.getAchievementProgress(
        userId,
        achievementId,
      );

      expect(result).toEqual(mockProgress);
    });

    it("should return null when no progress exists", async () => {
      mockProgressTable.first.mockResolvedValue(undefined);

      const result = await service.getAchievementProgress(
        userId,
        achievementId,
      );

      expect(result).toBeNull();
    });

    it("should return null on error", async () => {
      mockProgressTable.first.mockRejectedValue(new Error("Database error"));

      const result = await service.getAchievementProgress(
        userId,
        achievementId,
      );

      expect(result).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("should handle negative values", async () => {
      mockProgressTable.first.mockResolvedValue(undefined);
      mockProgressTable.add.mockResolvedValue("progress-id");

      await service.updateAchievementProgress(userId, achievementId, -5, 10);

      expect(mockProgressTable.add).toHaveBeenCalledWith(
        expect.objectContaining({
          currentValue: -5,
          isCompleted: false,
        }),
      );
    });

    it("should handle very large numbers", async () => {
      mockProgressTable.first.mockResolvedValue(undefined);
      mockProgressTable.add.mockResolvedValue("progress-id");

      const largeValue = 999999999;
      await service.updateAchievementProgress(
        userId,
        achievementId,
        largeValue,
        1000000000,
      );

      expect(mockProgressTable.add).toHaveBeenCalledWith(
        expect.objectContaining({
          currentValue: largeValue,
          targetValue: 1000000000,
          isCompleted: false,
        }),
      );
    });

    it("should handle decimal progress values", async () => {
      mockProgressTable.first.mockResolvedValue(undefined);
      mockProgressTable.add.mockResolvedValue("progress-id");

      await service.updateAchievementProgress(userId, achievementId, 7.5, 10);

      expect(mockProgressTable.add).toHaveBeenCalledWith(
        expect.objectContaining({
          currentValue: 7.5,
          targetValue: 10,
          isCompleted: false,
        }),
      );
    });

    it("should handle exact boundary condition (currentValue === targetValue)", async () => {
      mockProgressTable.first.mockResolvedValue(undefined);
      mockProgressTable.add.mockResolvedValue("progress-id");

      await service.updateAchievementProgress(userId, achievementId, 100, 100);

      expect(mockProgressTable.add).toHaveBeenCalledWith(
        expect.objectContaining({
          currentValue: 100,
          targetValue: 100,
          isCompleted: true,
        }),
      );
    });
  });
});
