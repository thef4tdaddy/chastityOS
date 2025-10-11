/**
 * TaskErrorBoundary Component Tests
 * Tests for error boundary functionality in task components
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskErrorBoundary } from "../TaskErrorBoundary";

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

describe("TaskErrorBoundary", () => {
  beforeEach(() => {
    // Suppress console errors in tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders children when no error occurs", () => {
    render(
      <TaskErrorBoundary>
        <div>Test Content</div>
      </TaskErrorBoundary>,
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("catches and displays error when child component throws", () => {
    render(
      <TaskErrorBoundary>
        <ThrowError shouldThrow={true} />
      </TaskErrorBoundary>,
    );

    expect(screen.getByText("Task Error")).toBeInTheDocument();
    expect(screen.getByText(/Test error/i)).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    const CustomFallback = () => <div>Custom Error UI</div>;

    render(
      <TaskErrorBoundary fallback={<CustomFallback />}>
        <ThrowError shouldThrow={true} />
      </TaskErrorBoundary>,
    );

    expect(screen.getByText("Custom Error UI")).toBeInTheDocument();
  });

  it("resets error state when retry button is clicked", () => {
    const { rerender } = render(
      <TaskErrorBoundary>
        <ThrowError shouldThrow={true} />
      </TaskErrorBoundary>,
    );

    expect(screen.getByText("Task Error")).toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(retryButton);

    // After reset, should render children again
    rerender(
      <TaskErrorBoundary>
        <ThrowError shouldThrow={false} />
      </TaskErrorBoundary>,
    );

    expect(screen.getByText("No error")).toBeInTheDocument();
  });

  it("calls custom onReset when provided", () => {
    const mockOnReset = vi.fn();

    render(
      <TaskErrorBoundary onReset={mockOnReset}>
        <ThrowError shouldThrow={true} />
      </TaskErrorBoundary>,
    );

    const retryButton = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(retryButton);

    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });
});
