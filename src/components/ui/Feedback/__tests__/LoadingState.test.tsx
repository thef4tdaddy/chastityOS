/**
 * LoadingState Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingState } from "../LoadingState";

describe("LoadingState", () => {
  it("should render with default message", () => {
    render(<LoadingState />);
    // Use getAllByText since Spinner also has "Loading..." in sr-only
    const loadingTexts = screen.getAllByText("Loading...");
    expect(loadingTexts.length).toBeGreaterThan(0);
  });

  it("should render with custom message", () => {
    render(<LoadingState message="Loading data..." />);
    expect(screen.getByText("Loading data...")).toBeInTheDocument();
  });

  it("should render spinner with correct size", () => {
    const { container } = render(<LoadingState size="lg" />);
    const status = container.querySelector('[role="status"]');
    expect(status).toBeInTheDocument();
  });

  it("should have aria-busy attribute", () => {
    const { container } = render(<LoadingState />);
    const status = container.querySelector('[role="status"]');
    expect(status).toHaveAttribute("aria-busy", "true");
  });

  it("should have aria-live attribute", () => {
    const { container } = render(<LoadingState />);
    const status = container.querySelector('[role="status"]');
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("should render in fullScreen mode", () => {
    const { container } = render(<LoadingState fullScreen />);
    const fullScreenDiv = container.querySelector(".fixed.inset-0");
    expect(fullScreenDiv).toBeInTheDocument();
    expect(fullScreenDiv).toHaveClass("z-50");
  });

  it("should render in overlay mode", () => {
    const { container } = render(<LoadingState overlay />);
    const overlayDiv = container.querySelector(".absolute.inset-0");
    expect(overlayDiv).toBeInTheDocument();
    expect(overlayDiv).toHaveClass("bg-opacity-50");
  });

  it("should render inline by default", () => {
    const { container } = render(<LoadingState />);
    const inlineDiv = container.querySelector(".py-8");
    expect(inlineDiv).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(<LoadingState className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("should render without message when message is empty string", () => {
    const { container } = render(<LoadingState message="" />);
    // Only the Spinner's sr-only text should be present, not the visible message
    const visibleText = container.querySelector("p.text-gray-300");
    expect(visibleText).not.toBeInTheDocument();
  });

  it("should render with small size", () => {
    const { container } = render(<LoadingState size="sm" message="Test" />);
    const text = screen.getByText("Test");
    expect(text).toHaveClass("text-sm");
  });

  it("should render with medium size", () => {
    const { container } = render(<LoadingState size="md" message="Test" />);
    const text = screen.getByText("Test");
    expect(text).toHaveClass("text-base");
  });

  it("should render with large size", () => {
    const { container } = render(<LoadingState size="lg" message="Test" />);
    const text = screen.getByText("Test");
    expect(text).toHaveClass("text-lg");
  });
});
