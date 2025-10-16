/**
 * useAchievements Hook Unit Tests
 * Tests for the main achievements hook
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useAchievements,
  useAchievementNotifications,
} from "../useAchievements";
import {
  DBAchievement,
  DBUserAchievement,
  DBAchievementProgress,
  AchievementCategory,
  AchievementDifficulty,
} from "../../types";
import React from "react";

// Mock services
vi.mock("../../services", () => ({
  achievementDBService: {
    getAllAchievements: vi.fn(),
    getUserAchievements: vi.fn(),
    getUserVisibleAchievements: vi.fn(),
    getUserAchievementProgress: vi.fn(),
    getUserUnreadNotifications: vi.fn(),
    getUserAchievementStats: vi.fn(),
    toggleAchievementVisibility: vi.fn(),
    markNotificationRead: vi.fn(),
  },
  achievementEngine: {
    initialize: vi.fn(),
    performFullCheck: vi.fn(),
  },
}));

// Mock mutations hook
vi.mock("../useAchievementMutations", () => ({
  useAchievementMutations: () => ({
    toggleVisibilityMutation: {
      mutate: vi.fn(),
      isPending: false,
    },
    markNotificationReadMutation: {
      mutate: vi.fn(),
      isPending: false,
    },
    performFullCheckMutation: {
      mutate: vi.fn(),
      isPending: false,
    },
  }),
}));

import { achievementDBService, achievementEngine } from "../../services";

// Test data factory functions
const createMockAchievement = (id: string): DBAchievement => ({
  id,
  name: `Achievement ${id}`,
  description: `Description for ${id}`,
  category: AchievementCategory.SESSION_MILESTONES,
  icon: "🏆",
  difficulty: AchievementDifficulty.COMMON,
  points: 100,
  requirements: [{ type: "session_count", value: 10, unit: "count" }],
  isHidden: false,
  isActive: true,
  syncStatus: "synced",
  lastModified: new Date(),
});

const createMockUserAchievement = (
  id: string,
  achievementId: string,
): DBUserAchievement => ({
  id,
  userId: "user-123",
  achievementId,
  earnedAt: new Date("2025-01-15"),
  progress: 100,
  isVisible: true,
  syncStatus: "synced",
  lastModified: new Date(),
});

const createMockProgress = (
  id: string,
  achievementId: string,
  currentValue: number,
): DBAchievementProgress => ({
  id,
  userId: "user-123",
  achievementId,
  currentValue,
  targetValue: 10,
  isCompleted: currentValue >= 10,
  syncStatus: "synced",
  lastModified: new Date(),
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useAchievements", () => {
  const userId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    (achievementEngine.initialize as any).mockResolvedValue(undefined);
  });

  describe("Data Loading", () => {
    it("should load all achievements", async () => {
      const mockAchievements = [
        createMockAchievement("ach-1"),
        createMockAchievement("ach-2"),
      ];
      (achievementDBService.getAllAchievements as any).mockResolvedValue(
        mockAchievements,
      );
      (achievementDBService.getUserAchievements as any).mockResolvedValue([]);
      (
        achievementDBService.getUserAchievementProgress as any
      ).mockResolvedValue([]);
      (
        achievementDBService.getUserUnreadNotifications as any
      ).mockResolvedValue([]);

      const { result } = renderHook(() => useAchievements(userId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.allAchievements).toHaveLength(2);
      });

      expect(result.current.allAchievements[0]?.id).toBe("ach-1");
      expect(result.current.allAchievements[1]?.id).toBe("ach-2");
    });

    it("should load user achievements", async () => {
      const mockUserAchievements = [
        createMockUserAchievement("ua-1", "ach-1"),
        createMockUserAchievement("ua-2", "ach-2"),
      ];
      (achievementDBService.getAllAchievements as any).mockResolvedValue([]);
      (achievementDBService.getUserAchievements as any).mockResolvedValue(
        mockUserAchievements,
      );
      (
        achievementDBService.getUserAchievementProgress as any
      ).mockResolvedValue([]);
      (
        achievementDBService.getUserUnreadNotifications as any
      ).mockResolvedValue([]);

      const { result } = renderHook(() => useAchievements(userId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.userAchievements).toHaveLength(2);
      });

      expect(result.current.userAchievements[0]?.achievementId).toBe("ach-1");
    });

    it("should load achievement progress", async () => {
      const mockProgress = [
        createMockProgress("p-1", "ach-1", 5),
        createMockProgress("p-2", "ach-2", 8),
      ];
      (achievementDBService.getAllAchievements as any).mockResolvedValue([]);
      (achievementDBService.getUserAchievements as any).mockResolvedValue([]);
      (
        achievementDBService.getUserAchievementProgress as any
      ).mockResolvedValue(mockProgress);
      (
        achievementDBService.getUserUnreadNotifications as any
      ).mockResolvedValue([]);

      const { result } = renderHook(() => useAchievements(userId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.achievementProgress).toHaveLength(2);
      });

      expect(result.current.achievementProgress[0]?.currentValue).toBe(5);
    });

    it("should not load data when userId is undefined", async () => {
      const { result } = renderHook(() => useAchievements(undefined), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(achievementDBService.getUserAchievements).not.toHaveBeenCalled();
    });
  });

  describe("Helper Functions", () => {
    beforeEach(() => {
      const mockAchievements = [
        createMockAchievement("ach-1"),
        createMockAchievement("ach-2"),
      ];
      const mockUserAchievements = [createMockUserAchievement("ua-1", "ach-1")];
      const mockProgress = [createMockProgress("p-1", "ach-1", 5)];

      (achievementDBService.getAllAchievements as any).mockResolvedValue(
        mockAchievements,
      );
      (achievementDBService.getUserAchievements as any).mockResolvedValue(
        mockUserAchievements,
      );
      (
        achievementDBService.getUserAchievementProgress as any
      ).mockResolvedValue(mockProgress);
      (
        achievementDBService.getUserUnreadNotifications as any
      ).mockResolvedValue([]);
    });

    it("should find achievement by id", async () => {
      const { result } = renderHook(() => useAchievements(userId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.allAchievements).toHaveLength(2);
      });

      const achievement = result.current.getAchievementById("ach-1");
      expect(achievement).toBeDefined();
      expect(achievement?.name).toBe("Achievement ach-1");
    });

    it("should check if user has achievement", async () => {
      const { result } = renderHook(() => useAchievements(userId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.userAchievements).toHaveLength(1);
      });

      expect(result.current.hasAchievement("ach-1")).toBe(true);
      expect(result.current.hasAchievement("ach-2")).toBe(false);
    });

    it("should get progress for achievement", async () => {
      const { result } = renderHook(() => useAchievements(userId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.achievementProgress).toHaveLength(1);
      });

      const progress = result.current.getProgressForAchievement("ach-1");
      expect(progress).toBeDefined();
      expect(progress?.currentValue).toBe(5);
    });

    it("should filter achievements by category", async () => {
      const mockAchievements = [
        createMockAchievement("ach-1"),
        {
          ...createMockAchievement("ach-2"),
          category: AchievementCategory.TASK_COMPLETION,
        },
      ];
      (achievementDBService.getAllAchievements as any).mockResolvedValue(
        mockAchievements,
      );

      const { result } = renderHook(() => useAchievements(userId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.allAchievements).toHaveLength(2);
      });

      const sessionAchievements = result.current.getAchievementsByCategory(
        AchievementCategory.SESSION_MILESTONES,
      );
      expect(sessionAchievements).toHaveLength(1);
      expect(sessionAchievements[0]?.id).toBe("ach-1");
    });
  });

  describe("Initialization", () => {
    it("should initialize achievement engine on mount", async () => {
      (achievementDBService.getAllAchievements as any).mockResolvedValue([]);
      (achievementDBService.getUserAchievements as any).mockResolvedValue([]);
      (
        achievementDBService.getUserAchievementProgress as any
      ).mockResolvedValue([]);
      (
        achievementDBService.getUserUnreadNotifications as any
      ).mockResolvedValue([]);

      renderHook(() => useAchievements(userId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(achievementEngine.initialize).toHaveBeenCalled();
      });
    });
  });
});

describe("useAchievementNotifications", () => {
  const userId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    (achievementEngine.initialize as any).mockResolvedValue(undefined);
    (achievementDBService.getAllAchievements as any).mockResolvedValue([]);
    (achievementDBService.getUserAchievements as any).mockResolvedValue([]);
    (achievementDBService.getUserAchievementProgress as any).mockResolvedValue(
      [],
    );
  });

  it("should return notifications", async () => {
    const mockNotifications = [
      {
        id: "n-1",
        userId,
        achievementId: "ach-1",
        type: "earned" as const,
        title: "Achievement Unlocked!",
        message: "You earned an achievement",
        isRead: false,
        createdAt: new Date(),
        syncStatus: "synced" as const,
        lastModified: new Date(),
      },
    ];
    (achievementDBService.getUserUnreadNotifications as any).mockResolvedValue(
      mockNotifications,
    );

    const { result } = renderHook(() => useAchievementNotifications(userId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
    });

    expect(result.current.hasUnread).toBe(true);
    expect(result.current.unreadCount).toBe(1);
  });

  it("should indicate no unread notifications", async () => {
    (achievementDBService.getUserUnreadNotifications as any).mockResolvedValue(
      [],
    );

    const { result } = renderHook(() => useAchievementNotifications(userId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(0);
    });

    expect(result.current.hasUnread).toBe(false);
    expect(result.current.unreadCount).toBe(0);
  });
});
