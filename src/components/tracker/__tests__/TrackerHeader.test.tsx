/**
 * TrackerHeader Component Tests
 * Tests for session status indicators, cooldowns, and goals display
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrackerHeader } from "../TrackerHeader";

describe("TrackerHeader", () => {
  const defaultProps = {
    remainingGoalTime: 0,
    keyholderName: "",
    savedSubmissivesName: "",
    requiredKeyholderDurationSeconds: 0,
    isCageOn: false,
    denialCooldownActive: false,
    pauseCooldownMessage: null,
  };

  describe("Pause Cooldown Message", () => {
    it("should display pause cooldown message when present", () => {
      render(
        <TrackerHeader
          {...defaultProps}
          pauseCooldownMessage="Next pause available in 5 minutes"
        />,
      );

      expect(
        screen.getByText("Next pause available in 5 minutes"),
      ).toBeInTheDocument();
    });

    it("should not display pause cooldown message when null", () => {
      render(<TrackerHeader {...defaultProps} pauseCooldownMessage={null} />);

      expect(
        screen.queryByText(/Next pause available/),
      ).not.toBeInTheDocument();
    });

    it("should apply yellow warning styling to cooldown message", () => {
      const { container } = render(
        <TrackerHeader
          {...defaultProps}
          pauseCooldownMessage="Cooldown active"
        />,
      );

      const message = screen.getByText("Cooldown active");
      expect(message).toHaveClass("text-yellow-200");
      // The message itself has the classes, not the parent
      expect(message.className).toContain("yellow");
      expect(message.className).toContain("border-yellow-500");
    });
  });

  describe("Goal Time Display", () => {
    it("should display goal time when cage is on and goal active", () => {
      render(
        <TrackerHeader
          {...defaultProps}
          isCageOn={true}
          remainingGoalTime={7200}
        />,
      );

      expect(screen.getByText("Time Remaining on Goal:")).toBeInTheDocument();
    });

    it("should format goal time in hours and minutes", () => {
      // 7200 seconds = 2 hours, 0 minutes
      render(
        <TrackerHeader
          {...defaultProps}
          isCageOn={true}
          remainingGoalTime={7200}
        />,
      );

      // Look for "2h 0m" pattern
      expect(screen.getByText(/2h 0m/)).toBeInTheDocument();
    });

    it("should format goal time with minutes correctly", () => {
      // 5430 seconds = 1 hour, 30 minutes
      render(
        <TrackerHeader
          {...defaultProps}
          isCageOn={true}
          remainingGoalTime={5430}
        />,
      );

      expect(screen.getByText(/1h 30m/)).toBeInTheDocument();
    });

    it("should not display goal time when cage is off", () => {
      render(
        <TrackerHeader
          {...defaultProps}
          isCageOn={false}
          remainingGoalTime={7200}
        />,
      );

      expect(
        screen.queryByText("Time Remaining on Goal:"),
      ).not.toBeInTheDocument();
    });

    it("should not display goal time when no time remaining", () => {
      render(
        <TrackerHeader
          {...defaultProps}
          isCageOn={true}
          remainingGoalTime={0}
        />,
      );

      expect(
        screen.queryByText("Time Remaining on Goal:"),
      ).not.toBeInTheDocument();
    });

    it("should apply proper styling to goal display", () => {
      render(
        <TrackerHeader
          {...defaultProps}
          isCageOn={true}
          remainingGoalTime={7200}
        />,
      );

      const label = screen.getByText("Time Remaining on Goal:");
      expect(label).toHaveClass("text-blue-200");

      const timeValue = screen.getByText(/2h 0m/);
      expect(timeValue).toHaveClass("text-blue-100");
      expect(timeValue).toHaveClass("number-update");
    });
  });

  describe("Keyholder Requirement Display", () => {
    it("should display keyholder requirement when all conditions met", () => {
      render(
        <TrackerHeader
          {...defaultProps}
          keyholderName="Master"
          savedSubmissivesName="Pet"
          requiredKeyholderDurationSeconds={3600}
        />,
      );

      expect(
        screen.getByText(/Master requires Pet to be in chastity for 3600/),
      ).toBeInTheDocument();
    });

    it("should use fallback name when submissive name not set", () => {
      render(
        <TrackerHeader
          {...defaultProps}
          keyholderName="Master"
          savedSubmissivesName=""
          requiredKeyholderDurationSeconds={3600}
        />,
      );

      expect(
        screen.getByText(/Master requires the submissive to be in chastity/),
      ).toBeInTheDocument();
    });

    it("should not display when keyholder name is empty", () => {
      render(
        <TrackerHeader
          {...defaultProps}
          keyholderName=""
          requiredKeyholderDurationSeconds={3600}
        />,
      );

      expect(screen.queryByText(/requires/)).not.toBeInTheDocument();
    });

    it("should not display when required duration is 0", () => {
      render(
        <TrackerHeader
          {...defaultProps}
          keyholderName="Master"
          requiredKeyholderDurationSeconds={0}
        />,
      );

      expect(screen.queryByText(/requires/)).not.toBeInTheDocument();
    });

    it("should apply purple styling to keyholder requirement", () => {
      render(
        <TrackerHeader
          {...defaultProps}
          keyholderName="Master"
          savedSubmissivesName="Pet"
          requiredKeyholderDurationSeconds={3600}
        />,
      );

      const message = screen.getByText(
        /Master requires Pet to be in chastity for 3600/,
      );
      expect(message).toHaveClass("text-purple-200");
    });
  });

  describe("Denial Cooldown Display", () => {
    it("should display denial cooldown when active", () => {
      render(<TrackerHeader {...defaultProps} denialCooldownActive={true} />);

      expect(screen.getByText("Denial cooldown active")).toBeInTheDocument();
    });

    it("should not display denial cooldown when inactive", () => {
      render(<TrackerHeader {...defaultProps} denialCooldownActive={false} />);

      expect(
        screen.queryByText("Denial cooldown active"),
      ).not.toBeInTheDocument();
    });

    it("should apply red warning styling to denial cooldown", () => {
      const { container } = render(
        <TrackerHeader {...defaultProps} denialCooldownActive={true} />,
      );

      const message = screen.getByText("Denial cooldown active");
      expect(message).toHaveClass("text-red-200");
      // The message itself has the classes, not the parent
      expect(message.className).toContain("red");
      expect(message.className).toContain("border-red-500");
    });
  });

  describe("Multiple States", () => {
    it("should display multiple status indicators simultaneously", () => {
      render(
        <TrackerHeader
          {...defaultProps}
          isCageOn={true}
          remainingGoalTime={7200}
          keyholderName="Master"
          savedSubmissivesName="Pet"
          requiredKeyholderDurationSeconds={3600}
          denialCooldownActive={true}
          pauseCooldownMessage="Next pause in 5 minutes"
        />,
      );

      expect(screen.getByText("Next pause in 5 minutes")).toBeInTheDocument();
      expect(screen.getByText("Time Remaining on Goal:")).toBeInTheDocument();
      expect(
        screen.getByText(/Master requires Pet to be in chastity/),
      ).toBeInTheDocument();
      expect(screen.getByText("Denial cooldown active")).toBeInTheDocument();
    });

    it("should maintain proper spacing between indicators", () => {
      const { container } = render(
        <TrackerHeader
          {...defaultProps}
          isCageOn={true}
          remainingGoalTime={7200}
          pauseCooldownMessage="Cooldown active"
        />,
      );

      const indicators = container.querySelectorAll(".mb-3, .mb-4");
      expect(indicators.length).toBeGreaterThan(0);
    });
  });

  describe("Responsive Design", () => {
    it("should have responsive text sizes", () => {
      render(
        <TrackerHeader
          {...defaultProps}
          isCageOn={true}
          remainingGoalTime={7200}
        />,
      );

      const label = screen.getByText("Time Remaining on Goal:");
      expect(label.className).toMatch(/text-(base|lg|xl)/);
    });

    it("should have responsive padding", () => {
      const { container } = render(
        <TrackerHeader
          {...defaultProps}
          pauseCooldownMessage="Cooldown active"
        />,
      );

      const message = container.querySelector(".p-2\\.5, .md\\:p-3");
      expect(message).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should use semantic HTML elements", () => {
      render(
        <TrackerHeader
          {...defaultProps}
          isCageOn={true}
          remainingGoalTime={7200}
        />,
      );

      const label = screen.getByText("Time Remaining on Goal:");
      expect(label.tagName).toBe("P");
    });

    it("should have proper color contrast for warnings", () => {
      render(
        <TrackerHeader
          {...defaultProps}
          pauseCooldownMessage="Cooldown active"
        />,
      );

      const message = screen.getByText("Cooldown active");
      // Yellow text on yellow background should be readable
      expect(message).toHaveClass("text-yellow-200");
    });
  });

  describe("Animation Classes", () => {
    it("should apply tracker state transition class", () => {
      const { container } = render(
        <TrackerHeader
          {...defaultProps}
          pauseCooldownMessage="Cooldown active"
        />,
      );

      const message = container.querySelector(".tracker-state-transition");
      expect(message).toBeInTheDocument();
    });

    it("should apply tracker card hover effect to cards", () => {
      const { container } = render(
        <TrackerHeader
          {...defaultProps}
          isCageOn={true}
          remainingGoalTime={7200}
        />,
      );

      const card = container.querySelector(".tracker-card-hover");
      expect(card).toBeInTheDocument();
    });
  });
});
