/**
 * AccountLinkingLoading Component Tests
 * Tests for loading state display
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AccountLinkingLoading } from "../AccountLinkingLoading";

describe("AccountLinkingLoading", () => {
  describe("Basic Rendering", () => {
    it("should render loading skeleton", () => {
      const { container } = render(<AccountLinkingLoading />);

      expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });

    it("should render loading bars", () => {
      const { container } = render(<AccountLinkingLoading />);

      const loadingBars = container.querySelectorAll(".bg-gray-600");
      expect(loadingBars.length).toBeGreaterThan(0);
    });

    it("should have proper structure", () => {
      const { container } = render(<AccountLinkingLoading />);

      expect(container.querySelector(".bg-gray-700")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should have pulse animation", () => {
      const { container } = render(<AccountLinkingLoading />);

      const pulseDiv = container.querySelector(".animate-pulse");
      expect(pulseDiv).toBeInTheDocument();
    });

    it("should have rounded corners", () => {
      const { container } = render(<AccountLinkingLoading />);

      const roundedDiv = container.querySelector(".rounded-lg");
      expect(roundedDiv).toBeInTheDocument();
    });

    it("should have padding", () => {
      const { container } = render(<AccountLinkingLoading />);

      const paddedDiv = container.querySelector(".p-4");
      expect(paddedDiv).toBeInTheDocument();
    });
  });

  describe("Custom ClassName", () => {
    it("should accept custom className", () => {
      const { container } = render(
        <AccountLinkingLoading className="custom-class" />,
      );

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.className).toContain("custom-class");
    });

    it("should combine custom className with default classes", () => {
      const { container } = render(
        <AccountLinkingLoading className="my-custom-class" />,
      );

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.className).toContain("my-custom-class");
      expect(mainDiv.className).toContain("animate-pulse");
    });

    it("should work without custom className", () => {
      const { container } = render(<AccountLinkingLoading />);

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("Loading Skeleton Structure", () => {
    it("should render multiple skeleton bars", () => {
      const { container } = render(<AccountLinkingLoading />);

      const skeletonBars = container.querySelectorAll(".h-4, .h-6");
      expect(skeletonBars.length).toBeGreaterThanOrEqual(3);
    });

    it("should have varying widths for skeleton bars", () => {
      const { container } = render(<AccountLinkingLoading />);

      const narrowBar = container.querySelector(".w-2\\/3");
      expect(narrowBar).toBeInTheDocument();
    });

    it("should have proper spacing between bars", () => {
      const { container } = render(<AccountLinkingLoading />);

      const bars = container.querySelectorAll(".mb-2, .mb-4");
      expect(bars.length).toBeGreaterThan(0);
    });
  });

  describe("Accessibility", () => {
    it("should be perceivable to screen readers", () => {
      const { container } = render(<AccountLinkingLoading />);

      // Loading skeleton should be visible
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should have semantic HTML structure", () => {
      const { container } = render(<AccountLinkingLoading />);

      expect(container.querySelector("div")).toBeInTheDocument();
    });
  });

  describe("Visual Consistency", () => {
    it("should maintain consistent color scheme", () => {
      const { container } = render(<AccountLinkingLoading />);

      const grayElements = container.querySelectorAll('[class*="bg-gray"]');
      expect(grayElements.length).toBeGreaterThan(0);
    });

    it("should have consistent border radius", () => {
      const { container } = render(<AccountLinkingLoading />);

      const roundedElements = container.querySelectorAll('[class*="rounded"]');
      expect(roundedElements.length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty className gracefully", () => {
      const { container } = render(<AccountLinkingLoading className="" />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it("should handle multiple class names", () => {
      const { container } = render(
        <AccountLinkingLoading className="class1 class2 class3" />,
      );

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.className).toContain("class1");
      expect(mainDiv.className).toContain("class2");
      expect(mainDiv.className).toContain("class3");
    });

    it("should render consistently multiple times", () => {
      const { container: container1 } = render(<AccountLinkingLoading />);
      const { container: container2 } = render(<AccountLinkingLoading />);

      expect(container1.innerHTML).toBe(container2.innerHTML);
    });
  });

  describe("Component Structure", () => {
    it("should have nested div structure", () => {
      const { container } = render(<AccountLinkingLoading />);

      const divs = container.querySelectorAll("div");
      expect(divs.length).toBeGreaterThan(1);
    });

    it("should have container with pulse animation", () => {
      const { container } = render(<AccountLinkingLoading />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.className).toContain("animate-pulse");
    });

    it("should have inner container with background", () => {
      const { container } = render(<AccountLinkingLoading />);

      const innerDiv = container.querySelector(".bg-gray-700");
      expect(innerDiv).toBeInTheDocument();
    });
  });
});
