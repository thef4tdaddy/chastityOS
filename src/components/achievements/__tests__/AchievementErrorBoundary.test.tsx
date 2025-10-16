/**
 * AchievementErrorBoundary Component Tests
 * Tests for error boundary functionality in achievement components
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AchievementErrorBoundary } from "../AchievementErrorBoundary";

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test achievement error");
  }
  return <div>No error</div>;
};

describe("AchievementErrorBoundary", () => {
  beforeEach(() => {
    // Suppress console errors in tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders children when no error occurs", () => {
    render(
      <AchievementErrorBoundary>
        <div>Achievement Content</div>
      </AchievementErrorBoundary>,
    );

    expect(screen.getByText("Achievement Content")).toBeInTheDocument();
  });

  it("catches and displays error when child component throws", () => {
    render(
      <AchievementErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AchievementErrorBoundary>,
    );

    expect(screen.getByText("Achievement Error")).toBeInTheDocument();
    expect(
      screen.getByText(
        /An unexpected error occurred while loading achievements/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    const CustomFallback = () => <div>Custom Achievement Error UI</div>;

    render(
      <AchievementErrorBoundary fallback={<CustomFallback />}>
        <ThrowError shouldThrow={true} />
      </AchievementErrorBoundary>,
    );

    expect(screen.getByText("Custom Achievement Error UI")).toBeInTheDocument();
  });

  it("resets error state when retry button is clicked", () => {
    let shouldThrow = true;
    const TestComponent = () => {
      if (shouldThrow) {
        throw new Error("Test achievement error");
      }
      return <div>No error</div>;
    };

    const { rerender } = render(
      <AchievementErrorBoundary>
        <TestComponent />
      </AchievementErrorBoundary>,
    );

    expect(screen.getByText("Achievement Error")).toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: /try again/i });

    // Change the flag before clicking retry
    shouldThrow = false;
    fireEvent.click(retryButton);

    // After reset, need to rerender with the component that won't throw
    rerender(
      <AchievementErrorBoundary>
        <div>No error</div>
      </AchievementErrorBoundary>,
    );

    expect(screen.getByText("No error")).toBeInTheDocument();
  });

  it("calls custom onReset when provided", () => {
    const mockOnReset = vi.fn();

    render(
      <AchievementErrorBoundary onReset={mockOnReset}>
        <ThrowError shouldThrow={true} />
      </AchievementErrorBoundary>,
    );

    const retryButton = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(retryButton);

    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  it("handles network errors specifically", () => {
    const NetworkError = () => {
      throw new Error("Failed to fetch achievements");
    };

    render(
      <AchievementErrorBoundary>
        <NetworkError />
      </AchievementErrorBoundary>,
    );

    expect(screen.getByText(/internet connection/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /refresh page/i }),
    ).toBeInTheDocument();
  });

  it("handles calculation errors", () => {
    const CalculationError = () => {
      throw new Error("Achievement calculation failed: NaN value");
    };

    render(
      <AchievementErrorBoundary>
        <CalculationError />
      </AchievementErrorBoundary>,
    );

    expect(screen.getByText(/calculate/i)).toBeInTheDocument();
  });

  it("handles unlock errors", () => {
    const UnlockError = () => {
      throw new Error("Failed to unlock achievement");
    };

    render(
      <AchievementErrorBoundary>
        <UnlockError />
      </AchievementErrorBoundary>,
    );

    expect(screen.getByText(/unlock/i)).toBeInTheDocument();
  });

  it("passes error and resetError props to custom fallback", () => {
    const CustomFallback = ({
      error,
      resetError,
    }: {
      error?: Error | null;
      resetError?: () => void;
    }) => (
      <div>
        <div>Custom Error: {error?.message}</div>
        <button onClick={resetError}>Custom Retry</button>
      </div>
    );

    render(
      <AchievementErrorBoundary fallback={<CustomFallback />}>
        <ThrowError shouldThrow={true} />
      </AchievementErrorBoundary>,
    );

    expect(
      screen.getByText(/Custom Error: Test achievement error/i),
    ).toBeInTheDocument();

    const customRetryButton = screen.getByRole("button", {
      name: /custom retry/i,
    });
    expect(customRetryButton).toBeInTheDocument();
  });
});
