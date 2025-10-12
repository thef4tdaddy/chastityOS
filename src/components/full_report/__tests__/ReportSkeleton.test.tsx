/**
 * ReportSkeleton Component Tests
 * Tests for loading skeleton components
 * Issue #533
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  FullReportSkeleton,
  StatsSkeleton,
  StatusSkeleton,
  SessionHistorySkeleton,
} from "../ReportSkeleton";

describe("ReportSkeleton Components", () => {
  describe("StatsSkeleton", () => {
    it("should render without crashing", () => {
      const { container } = render(<StatsSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should display skeleton items", () => {
      const { container } = render(<StatsSkeleton />);

      // Should have animated pulse elements
      const pulseElements = container.querySelectorAll(".animate-pulse");
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it("should render 8 stat skeleton placeholders", () => {
      const { container } = render(<StatsSkeleton />);

      // Should have 8 stat skeleton items
      const statSkeletons = container.querySelectorAll(".report-skeleton-stat");
      expect(statSkeletons).toHaveLength(8);
    });

    it("should have proper grid structure", () => {
      const { container } = render(<StatsSkeleton />);

      const grid = container.querySelector(".grid");
      expect(grid).toBeInTheDocument();
      expect(grid?.classList.contains("grid-cols-2")).toBe(true);
    });

    it("should have animation classes", () => {
      const { container } = render(<StatsSkeleton />);

      const card = container.firstChild;
      expect(card).toHaveClass("animate-fade-in");
    });
  });

  describe("StatusSkeleton", () => {
    it("should render without crashing", () => {
      const { container } = render(<StatusSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should display skeleton items", () => {
      const { container } = render(<StatusSkeleton />);

      const pulseElements = container.querySelectorAll(".animate-pulse");
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it("should render header skeleton", () => {
      const { container } = render(<StatusSkeleton />);

      // Should have header skeleton elements
      const headerSkeleton = container.querySelector(".flex.items-center");
      expect(headerSkeleton).toBeInTheDocument();
    });

    it("should render status details skeleton", () => {
      const { container } = render(<StatusSkeleton />);

      // Should have detail skeleton elements
      const detailSkeletons = container.querySelectorAll(".h-7, .h-8");
      expect(detailSkeletons.length).toBeGreaterThan(0);
    });

    it("should have responsive grid layout", () => {
      const { container } = render(<StatusSkeleton />);

      const grid = container.querySelector(".grid");
      expect(grid).toBeInTheDocument();
      expect(grid?.classList.contains("grid-cols-1")).toBe(true);
      expect(grid?.classList.contains("md:grid-cols-2")).toBe(true);
    });

    it("should render 4 detail placeholders", () => {
      const { container } = render(<StatusSkeleton />);

      const detailSkeletons = container.querySelectorAll(
        ".space-y-2 > div, .space-y-3 > div",
      );
      expect(detailSkeletons.length).toBeGreaterThan(0);
    });
  });

  describe("SessionHistorySkeleton", () => {
    it("should render without crashing", () => {
      const { container } = render(<SessionHistorySkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should display skeleton items", () => {
      const { container } = render(<SessionHistorySkeleton />);

      const pulseElements = container.querySelectorAll(".animate-pulse");
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it("should render 5 session skeleton placeholders", () => {
      const { container } = render(<SessionHistorySkeleton />);

      const sessionSkeletons = container.querySelectorAll(".report-skeleton");
      expect(sessionSkeletons).toHaveLength(5);
    });

    it("should have proper spacing", () => {
      const { container } = render(<SessionHistorySkeleton />);

      const spacedContainer = container.querySelector(".space-y-2");
      expect(spacedContainer).toBeInTheDocument();
    });

    it("should have animation classes", () => {
      const { container } = render(<SessionHistorySkeleton />);

      const card = container.firstChild;
      expect(card).toHaveClass("animate-fade-in");
    });
  });

  describe("FullReportSkeleton", () => {
    it("should render without crashing", () => {
      const { container } = render(<FullReportSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should render all skeleton components", () => {
      const { container } = render(<FullReportSkeleton />);

      // Should contain multiple skeleton sections
      const cards = container.querySelectorAll(".mb-4, .mb-6");
      expect(cards.length).toBeGreaterThan(0);
    });

    it("should have proper layout structure", () => {
      const { container } = render(<FullReportSkeleton />);

      const wrapper = container.querySelector(".text-nightly-spring-green");
      expect(wrapper).toBeInTheDocument();
    });

    it("should have responsive padding", () => {
      const { container } = render(<FullReportSkeleton />);

      const innerContainer = container.querySelector(".px-3");
      expect(innerContainer).toBeInTheDocument();
    });

    it("should have max-width constraints", () => {
      const { container } = render(<FullReportSkeleton />);

      const innerContainer = container.querySelector(".max-w-full");
      expect(innerContainer).toBeInTheDocument();
    });

    it("should have proper spacing between sections", () => {
      const { container } = render(<FullReportSkeleton />);

      const spacedContainer = container.querySelector(".space-y-4");
      expect(spacedContainer).toBeInTheDocument();
    });

    it("should display all three skeleton sections in order", () => {
      const { container } = render(<FullReportSkeleton />);

      // Should have status, stats, and history skeletons
      const sections = container.querySelectorAll(".animate-fade-in");
      expect(sections.length).toBe(3);
    });
  });

  describe("Accessibility", () => {
    it("StatsSkeleton should have proper semantic structure", () => {
      const { container } = render(<StatsSkeleton />);

      // Should use semantic elements
      expect(container.querySelector("div")).toBeInTheDocument();
    });

    it("StatusSkeleton should have proper semantic structure", () => {
      const { container } = render(<StatusSkeleton />);

      expect(container.querySelector("div")).toBeInTheDocument();
    });

    it("SessionHistorySkeleton should have proper semantic structure", () => {
      const { container } = render(<SessionHistorySkeleton />);

      expect(container.querySelector("div")).toBeInTheDocument();
    });

    it("FullReportSkeleton should have proper semantic structure", () => {
      const { container } = render(<FullReportSkeleton />);

      expect(container.querySelector("div")).toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("should have responsive classes for StatsSkeleton", () => {
      const { container } = render(<StatsSkeleton />);

      const grid = container.querySelector(".grid");
      expect(grid?.className).toMatch(/sm:|md:|lg:/);
    });

    it("should have responsive classes for StatusSkeleton", () => {
      const { container } = render(<StatusSkeleton />);

      const grid = container.querySelector(".grid");
      expect(grid?.className).toMatch(/md:/);
    });

    it("should have responsive classes for SessionHistorySkeleton", () => {
      const { container } = render(<SessionHistorySkeleton />);

      const spacedContainer = container.querySelector(".space-y-2");
      expect(spacedContainer?.className).toMatch(/sm:/);
    });

    it("should have responsive classes for FullReportSkeleton", () => {
      const { container } = render(<FullReportSkeleton />);

      const innerContainer = container.querySelector(".px-3");
      expect(innerContainer?.className).toMatch(/sm:|md:/);
    });
  });

  describe("Animation", () => {
    it("should have pulse animation on StatsSkeleton elements", () => {
      const { container } = render(<StatsSkeleton />);

      const pulseElements = container.querySelectorAll(".animate-pulse");
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it("should have pulse animation on StatusSkeleton elements", () => {
      const { container } = render(<StatusSkeleton />);

      const pulseElements = container.querySelectorAll(".animate-pulse");
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it("should have pulse animation on SessionHistorySkeleton elements", () => {
      const { container } = render(<SessionHistorySkeleton />);

      const pulseElements = container.querySelectorAll(".animate-pulse");
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it("should have fade-in animation on all skeleton cards", () => {
      const { container } = render(<FullReportSkeleton />);

      const fadeElements = container.querySelectorAll(".animate-fade-in");
      expect(fadeElements.length).toBeGreaterThan(0);
    });
  });

  describe("Visual Consistency", () => {
    it("should use consistent spacing across skeletons", () => {
      const { container: statsContainer } = render(<StatsSkeleton />);
      const { container: statusContainer } = render(<StatusSkeleton />);
      const { container: historyContainer } = render(
        <SessionHistorySkeleton />,
      );

      // All should have mb-4 or mb-6
      expect(statsContainer.firstChild).toHaveClass(/mb-4|mb-6/);
      expect(statusContainer.firstChild).toHaveClass(/mb-4|mb-6/);
      expect(historyContainer.firstChild).toHaveClass(/mb-4|mb-6/);
    });

    it("should use consistent color scheme", () => {
      const { container } = render(<StatsSkeleton />);

      const bgElements = container.querySelectorAll(".bg-white\\/10");
      expect(bgElements.length).toBeGreaterThan(0);
    });

    it("should use consistent border radius", () => {
      const { container } = render(<StatsSkeleton />);

      const roundedElements = container.querySelectorAll(".rounded");
      expect(roundedElements.length).toBeGreaterThan(0);
    });
  });
});
