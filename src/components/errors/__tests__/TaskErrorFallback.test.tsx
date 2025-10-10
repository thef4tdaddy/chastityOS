/**
 * TaskErrorFallback Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskErrorFallback } from "../fallbacks/TaskErrorFallback";

describe("TaskErrorFallback", () => {
  it("should render network error message", () => {
    const error = new Error("Network request failed");
    render(<TaskErrorFallback error={error} />);

    expect(screen.getByText("Connection Issue")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Unable to connect to the server. Please check your internet connection.",
      ),
    ).toBeInTheDocument();
  });

  it("should render permission error message", () => {
    const error = new Error("Permission denied");
    render(<TaskErrorFallback error={error} />);

    expect(screen.getByText("Permission Denied")).toBeInTheDocument();
    expect(
      screen.getByText("You don't have permission to perform this action."),
    ).toBeInTheDocument();
  });

  it("should render not found error message", () => {
    const error = new Error("Task not found");
    render(<TaskErrorFallback error={error} />);

    expect(screen.getByText("Task Not Found")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The task you're looking for doesn't exist or has been deleted.",
      ),
    ).toBeInTheDocument();
  });

  it("should render rate limit error message", () => {
    const error = new Error("Rate limit exceeded");
    render(<TaskErrorFallback error={error} />);

    expect(screen.getByText("Too Many Requests")).toBeInTheDocument();
    expect(
      screen.getByText("You're making requests too quickly."),
    ).toBeInTheDocument();
  });

  it("should render upload error based on context", () => {
    const error = new Error("Failed to upload");
    render(<TaskErrorFallback error={error} context="upload" />);

    expect(screen.getByText("Upload Failed")).toBeInTheDocument();
    expect(
      screen.getByText("Failed to upload evidence file."),
    ).toBeInTheDocument();
  });

  it("should render submission error based on context", () => {
    const error = new Error("Submission failed");
    render(<TaskErrorFallback error={error} context="submission" />);

    expect(screen.getByText("Submission Failed")).toBeInTheDocument();
    expect(
      screen.getByText("Unable to submit your task for review."),
    ).toBeInTheDocument();
  });

  it("should render loading error based on context", () => {
    const error = new Error("Failed to load");
    render(<TaskErrorFallback error={error} context="loading" />);

    expect(screen.getByText("Loading Error")).toBeInTheDocument();
    expect(screen.getByText("Unable to load tasks.")).toBeInTheDocument();
  });

  it("should render generic error for unknown errors", () => {
    const error = new Error("Unknown error");
    render(<TaskErrorFallback error={error} />);

    expect(screen.getByText("Task Operation Failed")).toBeInTheDocument();
  });

  it("should render retry button when resetError is provided", () => {
    const mockReset = vi.fn();
    render(
      <TaskErrorFallback error={new Error("Test")} resetError={mockReset} />,
    );

    const retryButton = screen.getByRole("button", { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
  });

  it("should call resetError when retry button is clicked", () => {
    const mockReset = vi.fn();
    render(
      <TaskErrorFallback error={new Error("Test")} resetError={mockReset} />,
    );

    const retryButton = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(retryButton);

    expect(mockReset).toHaveBeenCalledOnce();
  });

  it("should not render retry button when resetError is not provided", () => {
    render(<TaskErrorFallback error={new Error("Test")} />);

    expect(
      screen.queryByRole("button", { name: /try again/i }),
    ).not.toBeInTheDocument();
  });

  it("should display actionable guidance", () => {
    const error = new Error("Network error");
    render(<TaskErrorFallback error={error} />);

    expect(
      screen.getByText("Make sure you're online and try again."),
    ).toBeInTheDocument();
  });

  it("should handle null error gracefully", () => {
    render(<TaskErrorFallback error={null} />);

    expect(screen.getByText("Task Operation Failed")).toBeInTheDocument();
  });
});
