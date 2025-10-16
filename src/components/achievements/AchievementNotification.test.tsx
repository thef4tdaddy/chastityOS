/**
 * Achievement Notification Component Tests
 * Tests for achievement unlock notifications and toasts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AchievementToast,
  AchievementNotification,
} from "./AchievementNotification";
import { DBAchievement, DBAchievementNotification } from "@/types";
import {
  AchievementCategory,
  AchievementDifficulty,
} from "@/types/achievements";

// Mock the toast context
const mockShowSuccess = vi.fn();
vi.mock("@/contexts", () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
  }),
}));

describe("AchievementNotification", () => {
  const createMockAchievement = (id: string): DBAchievement => ({
    id,
    name: `Achievement ${id}`,
    description: `Description for achievement ${id}`,
    category: AchievementCategory.SESSION_MILESTONES,
    icon: "🏆",
    difficulty: AchievementDifficulty.COMMON,
    points: 100,
    requirements: [
      {
        type: "session_count",
        value: 10,
        unit: "count",
      },
    ],
    isHidden: false,
    isActive: true,
    syncStatus: "synced",
    lastModified: new Date(),
  });

  const createMockNotification = (
    id: string,
    achievementId: string,
    isRead = false,
  ): DBAchievementNotification => ({
    id,
    userId: "test-user",
    achievementId,
    type: "earned",
    title: "Achievement Earned",
    message: "You have earned a new achievement!",
    isRead,
    createdAt: new Date(),
    syncStatus: "synced",
    lastModified: new Date(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AchievementToast", () => {
    it("should render achievement information", () => {
      const achievement = createMockAchievement("1");
      const mockOnClose = vi.fn();

      render(
        <AchievementToast achievement={achievement} onClose={mockOnClose} />,
      );

      expect(screen.getByText("Achievement Unlocked!")).toBeInTheDocument();
      expect(screen.getByText("Achievement 1")).toBeInTheDocument();
      expect(
        screen.getByText("Description for achievement 1"),
      ).toBeInTheDocument();
    });

    it("should display achievement points", () => {
      const achievement = createMockAchievement("1");
      const mockOnClose = vi.fn();

      render(
        <AchievementToast achievement={achievement} onClose={mockOnClose} />,
      );

      expect(screen.getByText("+100 points")).toBeInTheDocument();
    });

    it("should display achievement difficulty", () => {
      const achievement = createMockAchievement("1");
      const mockOnClose = vi.fn();

      render(
        <AchievementToast achievement={achievement} onClose={mockOnClose} />,
      );

      expect(screen.getByText("common")).toBeInTheDocument();
    });

    it("should display achievement icon", () => {
      const achievement = createMockAchievement("1");
      const mockOnClose = vi.fn();

      render(
        <AchievementToast achievement={achievement} onClose={mockOnClose} />,
      );

      expect(screen.getByText("🏆")).toBeInTheDocument();
    });

    it("should call onClose when close button is clicked", async () => {
      const achievement = createMockAchievement("1");
      const mockOnClose = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <AchievementToast achievement={achievement} onClose={mockOnClose} />,
      );

      // Find the close button by looking for FaTimes icon in button
      const closeButtons = container.querySelectorAll("button");
      const closeButton = Array.from(closeButtons).find(
        (btn) => btn.querySelector("svg") && btn.textContent === "",
      );

      expect(closeButton).toBeInTheDocument();
      await user.click(closeButton!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should display trophy icon", () => {
      const achievement = createMockAchievement("1");
      const mockOnClose = vi.fn();

      const { container } = render(
        <AchievementToast achievement={achievement} onClose={mockOnClose} />,
      );

      // Check for yellow-colored trophy icon
      const trophyIcon = container.querySelector(".text-yellow-500");
      expect(trophyIcon).toBeInTheDocument();
    });
  });

  describe("AchievementNotification", () => {
    it("should show toast for unread earned notifications", async () => {
      const achievement = createMockAchievement("1");
      const notification = createMockNotification("n1", "1", false);
      const mockOnMarkRead = vi.fn();

      render(
        <AchievementNotification
          notifications={[notification]}
          achievements={[achievement]}
          onMarkRead={mockOnMarkRead}
          autoShow={true}
        />,
      );

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it("should not show toast for read notifications", async () => {
      const achievement = createMockAchievement("1");
      const notification = createMockNotification("n1", "1", true);
      const mockOnMarkRead = vi.fn();

      render(
        <AchievementNotification
          notifications={[notification]}
          achievements={[achievement]}
          onMarkRead={mockOnMarkRead}
          autoShow={true}
        />,
      );

      await waitFor(() => {
        expect(mockShowSuccess).not.toHaveBeenCalled();
      });
    });

    it("should not show toast when autoShow is false", async () => {
      const achievement = createMockAchievement("1");
      const notification = createMockNotification("n1", "1", false);
      const mockOnMarkRead = vi.fn();

      render(
        <AchievementNotification
          notifications={[notification]}
          achievements={[achievement]}
          onMarkRead={mockOnMarkRead}
          autoShow={false}
        />,
      );

      await waitFor(() => {
        expect(mockShowSuccess).not.toHaveBeenCalled();
      });
    });

    it("should show multiple toasts for multiple unread notifications", async () => {
      const achievements = [
        createMockAchievement("1"),
        createMockAchievement("2"),
      ];
      const notifications = [
        createMockNotification("n1", "1", false),
        createMockNotification("n2", "2", false),
      ];
      const mockOnMarkRead = vi.fn();

      render(
        <AchievementNotification
          notifications={notifications}
          achievements={achievements}
          onMarkRead={mockOnMarkRead}
          autoShow={true}
        />,
      );

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledTimes(2);
      });
    });

    it("should not crash when achievement is not found", async () => {
      const notification = createMockNotification("n1", "nonexistent", false);
      const mockOnMarkRead = vi.fn();

      render(
        <AchievementNotification
          notifications={[notification]}
          achievements={[]}
          onMarkRead={mockOnMarkRead}
          autoShow={true}
        />,
      );

      await waitFor(() => {
        expect(mockShowSuccess).not.toHaveBeenCalled();
      });
    });

    it("should render nothing (null component)", () => {
      const { container } = render(
        <AchievementNotification
          notifications={[]}
          achievements={[]}
          onMarkRead={vi.fn()}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("should include achievement details in toast", async () => {
      const achievement = createMockAchievement("1");
      const notification = createMockNotification("n1", "1", false);
      const mockOnMarkRead = vi.fn();

      render(
        <AchievementNotification
          notifications={[notification]}
          achievements={[achievement]}
          onMarkRead={mockOnMarkRead}
          autoShow={true}
        />,
      );

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith(
          expect.stringContaining("Achievement 1"),
          expect.objectContaining({
            title: "Achievement Unlocked!",
            duration: 8000,
          }),
        );
      });
    });

    it("should provide mark read action in toast", async () => {
      const achievement = createMockAchievement("1");
      const notification = createMockNotification("n1", "1", false);
      const mockOnMarkRead = vi.fn();

      render(
        <AchievementNotification
          notifications={[notification]}
          achievements={[achievement]}
          onMarkRead={mockOnMarkRead}
          autoShow={true}
        />,
      );

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledTimes(1);
        const call = mockShowSuccess.mock.calls[0]!;
        expect(call[1]).toHaveProperty("action");
        expect(call[1].action).toHaveProperty("label", "Mark Read");
        expect(call[1].action).toHaveProperty("onClick");
      });
    });
  });
});
