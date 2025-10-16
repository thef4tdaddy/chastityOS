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
    it("should render loading skeleton", () => {
      const { container } = render(<AchievementLoadingState />);
      // Should have multiple skeleton elements
      const skeletons = container.querySelectorAll(".bg-white\\/20");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should display skeleton cards", () => {
      const { container } = render(<AchievementLoadingState />);
      // Should have grid layout with skeleton cards
      const grid = container.querySelector(".grid");
      expect(grid).toBeInTheDocument();
    });

    it("should have proper container classes", () => {
      const { container } = render(<AchievementLoadingState />);
      const mainContainer = container.querySelector(
        ".text-nightly-spring-green",
      );
      expect(mainContainer).toBeInTheDocument();
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
