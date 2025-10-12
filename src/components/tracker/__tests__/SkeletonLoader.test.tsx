/**
 * SkeletonLoader Component Tests
 * Tests for loading state indicators
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  SkeletonLoader,
  TrackerStatsLoading,
  ActionButtonsLoading,
} from "../SkeletonLoader";

// Mock the UI components
vi.mock("@/components/ui", () => ({
  Card: vi.fn(({ children, variant, padding, className, ...props }) => (
    <div
      data-testid="card"
      data-variant={variant}
      data-padding={padding}
      className={className}
      {...props}
    >
      {children}
    </div>
  )),
}));

describe("SkeletonLoader", () => {
  describe("Stat Variant (Default)", () => {
    it("should render stat skeleton by default", () => {
      render(<SkeletonLoader />);

      const card = screen.getByTestId("card");
      expect(card).toBeInTheDocument();
    });

    it("should have loading statistics label", () => {
      render(<SkeletonLoader />);

      expect(screen.getByLabelText("Loading statistics")).toBeInTheDocument();
    });

    it("should apply glass variant to card", () => {
      render(<SkeletonLoader />);

      const card = screen.getByTestId("card");
      expect(card).toHaveAttribute("data-variant", "glass");
    });

    it("should apply skeleton shimmer animation", () => {
      render(<SkeletonLoader />);

      const card = screen.getByTestId("card");
      expect(card.className).toContain("skeleton-shimmer");
    });

    it("should have three skeleton bars", () => {
      const { container } = render(<SkeletonLoader />);

      const bars = container.querySelectorAll(".bg-white\\/10");
      expect(bars.length).toBe(3);
    });
  });

  describe("Header Variant", () => {
    it("should render header skeleton", () => {
      render(<SkeletonLoader variant="header" />);

      expect(screen.getByLabelText("Loading header")).toBeInTheDocument();
    });

    it("should have loading header label", () => {
      const { container } = render(<SkeletonLoader variant="header" />);

      expect(screen.getByLabelText("Loading header")).toBeInTheDocument();
    });

    it("should apply skeleton shimmer animation", () => {
      const { container } = render(<SkeletonLoader variant="header" />);

      const skeleton = screen.getByLabelText("Loading header");
      expect(skeleton.className).toContain("skeleton-shimmer");
    });

    it("should have two skeleton bars for header", () => {
      const { container } = render(<SkeletonLoader variant="header" />);

      const bars = container.querySelectorAll(".bg-white\\/10");
      expect(bars.length).toBe(2);
    });

    it("should have proper spacing", () => {
      const { container } = render(<SkeletonLoader variant="header" />);

      const skeleton = screen.getByLabelText("Loading header");
      expect(skeleton.className).toContain("mb-4");
      expect(skeleton.className).toContain("p-4");
    });
  });

  describe("Button Variant", () => {
    it("should render button skeleton", () => {
      render(<SkeletonLoader variant="button" />);

      expect(screen.getByLabelText("Loading button")).toBeInTheDocument();
    });

    it("should apply skeleton shimmer animation", () => {
      render(<SkeletonLoader variant="button" />);

      const skeleton = screen.getByLabelText("Loading button");
      expect(skeleton.className).toContain("skeleton-shimmer");
    });

    it("should have one skeleton bar for button", () => {
      const { container } = render(<SkeletonLoader variant="button" />);

      const bars = container.querySelectorAll(".bg-white\\/10");
      expect(bars.length).toBe(1);
    });

    it("should have proper padding", () => {
      render(<SkeletonLoader variant="button" />);

      const skeleton = screen.getByLabelText("Loading button");
      expect(skeleton.className).toContain("py-4");
      expect(skeleton.className).toContain("px-8");
    });
  });

  describe("Custom Styling", () => {
    it("should apply custom className", () => {
      render(<SkeletonLoader className="custom-class" />);

      const card = screen.getByTestId("card");
      expect(card.className).toContain("custom-class");
    });

    it("should combine custom className with existing classes", () => {
      render(<SkeletonLoader className="custom-class" />);

      const card = screen.getByTestId("card");
      expect(card.className).toContain("skeleton-shimmer");
      expect(card.className).toContain("custom-class");
    });

    it("should apply className to header variant", () => {
      render(<SkeletonLoader variant="header" className="custom-header" />);

      const skeleton = screen.getByLabelText("Loading header");
      expect(skeleton.className).toContain("custom-header");
    });

    it("should apply className to button variant", () => {
      render(<SkeletonLoader variant="button" className="custom-button" />);

      const skeleton = screen.getByLabelText("Loading button");
      expect(skeleton.className).toContain("custom-button");
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria-label for stat variant", () => {
      render(<SkeletonLoader />);

      expect(screen.getByLabelText("Loading statistics")).toBeInTheDocument();
    });

    it("should have proper aria-label for header variant", () => {
      render(<SkeletonLoader variant="header" />);

      expect(screen.getByLabelText("Loading header")).toBeInTheDocument();
    });

    it("should have proper aria-label for button variant", () => {
      render(<SkeletonLoader variant="button" />);

      expect(screen.getByLabelText("Loading button")).toBeInTheDocument();
    });
  });
});

describe("TrackerStatsLoading", () => {
  it("should render complete tracker stats skeleton", () => {
    const { container } = render(<TrackerStatsLoading />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it("should render header skeleton", () => {
    render(<TrackerStatsLoading />);

    expect(screen.getByLabelText("Loading header")).toBeInTheDocument();
  });

  it("should render multiple stat skeletons", () => {
    render(<TrackerStatsLoading />);

    const stats = screen.getAllByLabelText("Loading statistics");
    expect(stats.length).toBe(4); // 2 current + 2 total stats
  });

  it("should have proper grid layout", () => {
    const { container } = render(<TrackerStatsLoading />);

    const grids = container.querySelectorAll(".grid");
    expect(grids.length).toBe(2); // Current session and total stats grids
  });

  it("should have responsive grid classes", () => {
    const { container } = render(<TrackerStatsLoading />);

    const grid = container.querySelector(".grid");
    expect(grid?.className).toContain("grid-cols-1");
    expect(grid?.className).toContain("sm:grid-cols-2");
  });
});

describe("ActionButtonsLoading", () => {
  it("should render action button skeleton", () => {
    render(<ActionButtonsLoading />);

    expect(screen.getByLabelText("Loading button")).toBeInTheDocument();
  });

  it("should have flexbox layout", () => {
    const { container } = render(<ActionButtonsLoading />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("flex");
    expect(wrapper.className).toContain("justify-center");
  });

  it("should have responsive spacing", () => {
    const { container } = render(<ActionButtonsLoading />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("space-y-4");
    expect(wrapper.className).toContain("sm:space-y-0");
  });

  it("should have proper margin", () => {
    const { container } = render(<ActionButtonsLoading />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("mb-6");
  });
});
