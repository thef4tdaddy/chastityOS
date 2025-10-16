/**
 * Achievement View Toggle Component Tests
 * Tests for view mode switching controls
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AchievementViewToggle } from "./AchievementViewToggle";

describe("AchievementViewToggle", () => {
  describe("Rendering", () => {
    it("should render all view mode buttons", () => {
      const mockOnChange = vi.fn();
      render(
        <AchievementViewToggle
          viewMode="dashboard"
          onViewModeChange={mockOnChange}
        />,
      );

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Gallery")).toBeInTheDocument();
      expect(screen.getByText("Leaderboards")).toBeInTheDocument();
      expect(screen.getByText("Privacy")).toBeInTheDocument();
    });

    it("should render with dashboard view mode active", () => {
      const mockOnChange = vi.fn();
      const { container } = render(
        <AchievementViewToggle
          viewMode="dashboard"
          onViewModeChange={mockOnChange}
        />,
      );

      const dashboardButton = screen
        .getByText("Dashboard")
        .closest("button") as HTMLElement;
      expect(dashboardButton).toHaveClass("bg-nightly-aquamarine");
      expect(dashboardButton).toHaveClass("text-black");
      expect(dashboardButton).toHaveClass("font-semibold");
    });

    it("should render with gallery view mode active", () => {
      const mockOnChange = vi.fn();
      render(
        <AchievementViewToggle
          viewMode="gallery"
          onViewModeChange={mockOnChange}
        />,
      );

      const galleryButton = screen
        .getByText("Gallery")
        .closest("button") as HTMLElement;
      expect(galleryButton).toHaveClass("bg-nightly-aquamarine");
      expect(galleryButton).toHaveClass("text-black");
    });

    it("should render with leaderboards view mode active", () => {
      const mockOnChange = vi.fn();
      render(
        <AchievementViewToggle
          viewMode="leaderboards"
          onViewModeChange={mockOnChange}
        />,
      );

      const leaderboardsButton = screen
        .getByText("Leaderboards")
        .closest("button") as HTMLElement;
      expect(leaderboardsButton).toHaveClass("bg-nightly-aquamarine");
    });

    it("should render with privacy view mode active", () => {
      const mockOnChange = vi.fn();
      render(
        <AchievementViewToggle
          viewMode="privacy"
          onViewModeChange={mockOnChange}
        />,
      );

      const privacyButton = screen
        .getByText("Privacy")
        .closest("button") as HTMLElement;
      expect(privacyButton).toHaveClass("bg-nightly-aquamarine");
    });
  });

  describe("User Interactions", () => {
    it("should call onViewModeChange with dashboard when dashboard is clicked", () => {
      const mockOnChange = vi.fn();
      render(
        <AchievementViewToggle
          viewMode="gallery"
          onViewModeChange={mockOnChange}
        />,
      );

      const dashboardButton = screen.getByText("Dashboard");
      fireEvent.click(dashboardButton);

      expect(mockOnChange).toHaveBeenCalledWith("dashboard");
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it("should call onViewModeChange with gallery when gallery is clicked", () => {
      const mockOnChange = vi.fn();
      render(
        <AchievementViewToggle
          viewMode="dashboard"
          onViewModeChange={mockOnChange}
        />,
      );

      const galleryButton = screen.getByText("Gallery");
      fireEvent.click(galleryButton);

      expect(mockOnChange).toHaveBeenCalledWith("gallery");
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it("should call onViewModeChange with leaderboards when leaderboards is clicked", () => {
      const mockOnChange = vi.fn();
      render(
        <AchievementViewToggle
          viewMode="dashboard"
          onViewModeChange={mockOnChange}
        />,
      );

      const leaderboardsButton = screen.getByText("Leaderboards");
      fireEvent.click(leaderboardsButton);

      expect(mockOnChange).toHaveBeenCalledWith("leaderboards");
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it("should call onViewModeChange with privacy when privacy is clicked", () => {
      const mockOnChange = vi.fn();
      render(
        <AchievementViewToggle
          viewMode="dashboard"
          onViewModeChange={mockOnChange}
        />,
      );

      const privacyButton = screen.getByText("Privacy");
      fireEvent.click(privacyButton);

      expect(mockOnChange).toHaveBeenCalledWith("privacy");
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it("should allow switching between multiple views", () => {
      const mockOnChange = vi.fn();
      const { rerender } = render(
        <AchievementViewToggle
          viewMode="dashboard"
          onViewModeChange={mockOnChange}
        />,
      );

      fireEvent.click(screen.getByText("Gallery"));
      expect(mockOnChange).toHaveBeenCalledWith("gallery");

      rerender(
        <AchievementViewToggle
          viewMode="gallery"
          onViewModeChange={mockOnChange}
        />,
      );

      fireEvent.click(screen.getByText("Leaderboards"));
      expect(mockOnChange).toHaveBeenCalledWith("leaderboards");
    });
  });

  describe("Icons", () => {
    it("should render icons for each button", () => {
      const mockOnChange = vi.fn();
      const { container } = render(
        <AchievementViewToggle
          viewMode="dashboard"
          onViewModeChange={mockOnChange}
        />,
      );

      const icons = container.querySelectorAll("svg");
      expect(icons.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Inactive State Styling", () => {
    it("should apply hover styles to inactive buttons", () => {
      const mockOnChange = vi.fn();
      render(
        <AchievementViewToggle
          viewMode="dashboard"
          onViewModeChange={mockOnChange}
        />,
      );

      const galleryButton = screen
        .getByText("Gallery")
        .closest("button") as HTMLElement;
      expect(galleryButton).toHaveClass("text-nightly-celadon");
      expect(galleryButton).toHaveClass("hover:text-nightly-honeydew");
    });
  });
});
