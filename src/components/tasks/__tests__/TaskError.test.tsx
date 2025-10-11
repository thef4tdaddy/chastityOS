/**
 * TaskError Component Tests
 * Tests for task error display component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskError } from "../TaskError";

describe("TaskError", () => {
  it("renders generic error message", () => {
    render(<TaskError />);

    expect(screen.getByText("Task Error")).toBeInTheDocument();
    expect(
      screen.getByText(/An unexpected error occurred/i),
    ).toBeInTheDocument();
  });

  it("renders error message from Error object", () => {
    const error = new Error("Custom error message");
    render(<TaskError error={error} />);

    expect(screen.getByText(/Custom error message/i)).toBeInTheDocument();
  });

  it("renders custom title and message", () => {
    render(
      <TaskError
        title="Custom Title"
        message="Custom error description"
      />,
    );

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
    expect(screen.getByText("Custom error description")).toBeInTheDocument();
  });

  it("detects network error type", () => {
    const error = new Error("Network request failed");
    render(<TaskError error={error} />);

    expect(
      screen.getByText(/check your internet connection/i),
    ).toBeInTheDocument();
  });

  it("detects permission error type", () => {
    const error = new Error("Permission denied");
    render(<TaskError error={error} />);

    expect(
      screen.getByText(/don't have permission/i),
    ).toBeInTheDocument();
  });

  it("detects upload error type", () => {
    const error = new Error("File upload failed");
    render(<TaskError error={error} />);

    expect(
      screen.getByText(/Failed to upload file/i),
    ).toBeInTheDocument();
  });

  it("detects rate limit error type", () => {
    const error = new Error("Rate limit exceeded");
    render(<TaskError error={error} />);

    expect(screen.getByText(/Too many requests/i)).toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", () => {
    const mockOnRetry = vi.fn();
    render(<TaskError onRetry={mockOnRetry} />);

    const retryButton = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it("shows technical details when showDetails is true", () => {
    const error = new Error("Test error");
    error.stack = "Error stack trace";

    render(<TaskError error={error} showDetails={true} />);

    const detailsToggle = screen.getByText("Technical Details");
    fireEvent.click(detailsToggle);

    expect(screen.getByText(/Error stack trace/i)).toBeInTheDocument();
  });

  it("shows refresh button for network errors", () => {
    const error = new Error("Network error occurred");
    render(<TaskError error={error} />);

    expect(
      screen.getByRole("button", { name: /refresh page/i }),
    ).toBeInTheDocument();
  });

  it("displays offline message when navigator is offline", () => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });

    render(<TaskError />);

    expect(screen.getByText(/appear to be offline/i)).toBeInTheDocument();

    // Reset
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });
  });
});
