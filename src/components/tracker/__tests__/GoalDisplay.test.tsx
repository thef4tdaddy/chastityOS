/**
 * GoalDisplay Component Tests
 * Tests for timer display functionality
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GoalDisplay } from "../GoalDisplay";

describe("GoalDisplay", () => {
  describe("Rendering", () => {
    it("should render with time remaining", () => {
      render(<GoalDisplay remainingGoalTime={3600} />);

      expect(screen.getByText("Time Remaining on Goal:")).toBeInTheDocument();
      expect(screen.getByText("3600")).toBeInTheDocument();
    });

    it("should display zero time correctly", () => {
      render(<GoalDisplay remainingGoalTime={0} />);

      expect(screen.getByText("Time Remaining on Goal:")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("should display large time values", () => {
      render(<GoalDisplay remainingGoalTime={86400} />);

      expect(screen.getByText("86400")).toBeInTheDocument();
    });

    it("should display negative time values", () => {
      render(<GoalDisplay remainingGoalTime={-100} />);

      expect(screen.getByText("-100")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should have proper container structure with glass morphism", () => {
      const { container } = render(<GoalDisplay remainingGoalTime={3600} />);

      const goalDiv = container.querySelector(".backdrop-blur-xs");
      expect(goalDiv).toBeInTheDocument();
      expect(goalDiv).toHaveClass("bg-white/10");
      expect(goalDiv).toHaveClass("border-white/20");
    });

    it("should apply proper text colors", () => {
      render(<GoalDisplay remainingGoalTime={3600} />);

      const label = screen.getByText("Time Remaining on Goal:");
      expect(label).toHaveClass("text-blue-200");

      const value = screen.getByText("3600");
      expect(value).toHaveClass("text-blue-100");
    });

    it("should apply proper font sizes", () => {
      render(<GoalDisplay remainingGoalTime={3600} />);

      const label = screen.getByText("Time Remaining on Goal:");
      expect(label).toHaveClass("text-lg");
      expect(label).toHaveClass("font-semibold");

      const value = screen.getByText("3600");
      expect(value).toHaveClass("text-3xl");
      expect(value).toHaveClass("font-bold");
    });
  });

  describe("Layout", () => {
    it("should be centered", () => {
      const { container } = render(<GoalDisplay remainingGoalTime={3600} />);

      const goalDiv = container.firstChild as HTMLElement;
      expect(goalDiv).toHaveClass("text-center");
    });

    it("should have proper spacing", () => {
      const { container } = render(<GoalDisplay remainingGoalTime={3600} />);

      const goalDiv = container.firstChild as HTMLElement;
      expect(goalDiv).toHaveClass("mb-4");
      expect(goalDiv).toHaveClass("p-3");
    });

    it("should have rounded corners and shadow", () => {
      const { container } = render(<GoalDisplay remainingGoalTime={3600} />);

      const goalDiv = container.firstChild as HTMLElement;
      expect(goalDiv).toHaveClass("rounded-lg");
      expect(goalDiv).toHaveClass("shadow-sm");
    });
  });

  describe("Accessibility", () => {
    it("should have semantic structure", () => {
      render(<GoalDisplay remainingGoalTime={3600} />);

      const label = screen.getByText("Time Remaining on Goal:");
      const value = screen.getByText("3600");

      expect(label.tagName).toBe("P");
      expect(value.tagName).toBe("P");
    });
  });
});
