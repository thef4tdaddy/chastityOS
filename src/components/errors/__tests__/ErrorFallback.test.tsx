/**
 * ErrorFallback Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorFallback } from "../fallbacks/ErrorFallback";

describe("ErrorFallback", () => {
  it("should render error message", () => {
    const error = new Error("Test error message");
    render(<ErrorFallback error={error} />);

    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("should render default message when no error message provided", () => {
    render(<ErrorFallback error={null} />);

    expect(
      screen.getByText("An unexpected error occurred"),
    ).toBeInTheDocument();
  });

  it("should render retry button when resetError is provided", () => {
    const mockReset = vi.fn();
    render(<ErrorFallback error={new Error("Test")} resetError={mockReset} />);

    const retryButton = screen.getByRole("button", { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
  });

  it("should call resetError when retry button is clicked", () => {
    const mockReset = vi.fn();
    render(<ErrorFallback error={new Error("Test")} resetError={mockReset} />);

    const retryButton = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(retryButton);

    expect(mockReset).toHaveBeenCalledOnce();
  });

  it("should not render retry button when resetError is not provided", () => {
    render(<ErrorFallback error={new Error("Test")} />);

    expect(
      screen.queryByRole("button", { name: /try again/i }),
    ).not.toBeInTheDocument();
  });

  it("should display heading", () => {
    render(<ErrorFallback error={new Error("Test")} />);

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
});
