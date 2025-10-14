/**
 * AccountLinkingHeader Component Tests
 * Tests for account linking header display
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AccountLinkingHeader } from "../AccountLinkingHeader";

describe("AccountLinkingHeader", () => {
  describe("Basic Rendering", () => {
    it("should render heading", () => {
      render(<AccountLinkingHeader />);

      expect(screen.getByText(/Account Linking/i)).toBeInTheDocument();
    });

    it("should render descriptive text", () => {
      render(<AccountLinkingHeader />);

      expect(
        screen.getByText(/Connect with keyholders or submissives/i),
      ).toBeInTheDocument();
    });

    it("should render link icon", () => {
      const { container } = render(<AccountLinkingHeader />);

      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("Content", () => {
    it("should mention keyholders", () => {
      render(<AccountLinkingHeader />);

      expect(screen.getByText(/keyholders/i)).toBeInTheDocument();
    });

    it("should mention submissives", () => {
      render(<AccountLinkingHeader />);

      expect(screen.getByText(/submissives/i)).toBeInTheDocument();
    });

    it("should mention control and oversight", () => {
      render(<AccountLinkingHeader />);

      expect(screen.getByText(/control and oversight/i)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading level", () => {
      render(<AccountLinkingHeader />);

      const heading = screen.getByText(/Account Linking/i);
      expect(heading.tagName).toBe("H2");
    });

    it("should have descriptive paragraph", () => {
      const { container } = render(<AccountLinkingHeader />);

      expect(container.querySelector("p")).toBeInTheDocument();
    });

    it("should have semantic HTML structure", () => {
      const { container } = render(<AccountLinkingHeader />);

      expect(container.querySelector("div")).toBeInTheDocument();
      expect(container.querySelector("h2")).toBeInTheDocument();
      expect(container.querySelector("p")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should center content", () => {
      const { container } = render(<AccountLinkingHeader />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.className).toContain("text-center");
    });

    it("should have proper heading styling", () => {
      render(<AccountLinkingHeader />);

      const heading = screen.getByText(/Account Linking/i);
      expect(heading.className).toContain("text-2xl");
      expect(heading.className).toContain("font-bold");
    });

    it("should use purple color scheme", () => {
      render(<AccountLinkingHeader />);

      const heading = screen.getByText(/Account Linking/i);
      expect(heading.className).toContain("purple");
    });
  });

  describe("Icon Placement", () => {
    it("should place icon inline with heading", () => {
      const { container } = render(<AccountLinkingHeader />);

      const heading = screen.getByText(/Account Linking/i);
      const icon = container.querySelector("svg");

      expect(heading).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
    });

    it("should have icon with proper styling", () => {
      const { container } = render(<AccountLinkingHeader />);

      const icon = container.querySelector("svg");
      expect(icon?.className).toContain("inline");
      expect(icon?.className).toContain("mr-2");
    });
  });

  describe("Component Consistency", () => {
    it("should render consistently", () => {
      const { container: container1 } = render(<AccountLinkingHeader />);
      const { container: container2 } = render(<AccountLinkingHeader />);

      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    it("should maintain structure across renders", () => {
      const { container, rerender } = render(<AccountLinkingHeader />);

      const initialHTML = container.innerHTML;

      rerender(<AccountLinkingHeader />);

      expect(container.innerHTML).toBe(initialHTML);
    });
  });

  describe("Text Content", () => {
    it("should have complete heading text", () => {
      render(<AccountLinkingHeader />);

      expect(screen.getByText("Account Linking")).toBeInTheDocument();
    });

    it("should have complete descriptive text", () => {
      render(<AccountLinkingHeader />);

      expect(
        screen.getByText(
          "Connect with keyholders or submissives for enhanced control and oversight",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Visual Hierarchy", () => {
    it("should have proper spacing", () => {
      render(<AccountLinkingHeader />);

      const heading = screen.getByText(/Account Linking/i);
      expect(heading.className).toContain("mb-2");
    });

    it("should have appropriate text sizes", () => {
      render(<AccountLinkingHeader />);

      const heading = screen.getByText(/Account Linking/i);
      const description = screen.getByText(/Connect with keyholders/i);

      expect(heading.className).toContain("text-2xl");
      expect(description.className).toContain("text-sm");
    });
  });

  describe("Edge Cases", () => {
    it("should handle repeated renders", () => {
      const { rerender } = render(<AccountLinkingHeader />);

      rerender(<AccountLinkingHeader />);
      rerender(<AccountLinkingHeader />);

      expect(screen.getByText(/Account Linking/i)).toBeInTheDocument();
    });

    it("should maintain icon across renders", () => {
      const { container, rerender } = render(<AccountLinkingHeader />);

      const initialIcon = container.querySelector("svg");

      rerender(<AccountLinkingHeader />);

      const afterRerenderIcon = container.querySelector("svg");
      expect(afterRerenderIcon).toBeInTheDocument();
    });
  });
});
