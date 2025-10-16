/**
 * Achievement Page States Component Tests
 * Tests for loading and sign-in prompt states
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  AchievementLoadingState,
  AchievementSignInPrompt,
} from "./AchievementPageStates";

describe("AchievementPageStates", () => {
  describe("AchievementLoadingState", () => {
    it("should render loading state", () => {
      render(<AchievementLoadingState />);
      expect(screen.getByText("Loading achievements...")).toBeInTheDocument();
    });

    it("should display spinner animation", () => {
      const { container } = render(<AchievementLoadingState />);
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should have proper styling classes", () => {
      const { container } = render(<AchievementLoadingState />);
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toHaveClass("border-2");
      expect(spinner).toHaveClass("border-nightly-aquamarine");
      expect(spinner).toHaveClass("rounded-full");
    });
  });

  describe("AchievementSignInPrompt", () => {
    it("should render sign-in prompt message", () => {
      render(<AchievementSignInPrompt />);
      expect(
        screen.getByText("Please sign in to view achievements"),
      ).toBeInTheDocument();
    });

    it("should display trophy icon", () => {
      const { container } = render(<AchievementSignInPrompt />);
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should center content", () => {
      const { container } = render(<AchievementSignInPrompt />);
      const centerContainer = container.querySelector(".text-center");
      expect(centerContainer).toBeInTheDocument();
    });

    it("should use proper color classes", () => {
      const { container } = render(<AchievementSignInPrompt />);
      const icon = container.querySelector(".text-nightly-celadon\\/50");
      expect(icon).toBeInTheDocument();
    });
  });
});
