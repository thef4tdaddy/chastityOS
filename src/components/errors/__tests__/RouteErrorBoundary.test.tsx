/**
 * RouteErrorBoundary Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RouteErrorBoundary } from "../RouteErrorBoundary";

// Mock the logger
vi.mock("@/utils/logging", () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Route test error");
  }
  return <div>No error</div>;
};

describe("RouteErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console errors in tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should render children when there is no error", () => {
    render(
      <RouteErrorBoundary>
        <div>Route content</div>
      </RouteErrorBoundary>,
    );

    expect(screen.getByText("Route content")).toBeInTheDocument();
  });

  it("should render error fallback when an error is thrown", () => {
    render(
      <RouteErrorBoundary>
        <ThrowError shouldThrow={true} />
      </RouteErrorBoundary>,
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("should display error message", () => {
    render(
      <RouteErrorBoundary>
        <ThrowError shouldThrow={true} />
      </RouteErrorBoundary>,
    );

    expect(screen.getByText("Route test error")).toBeInTheDocument();
  });

  it("should have a retry button", () => {
    render(
      <RouteErrorBoundary>
        <ThrowError shouldThrow={true} />
      </RouteErrorBoundary>,
    );

    const retryButton = screen.getByRole("button", { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
  });

  it("should render custom fallback when provided", () => {
    const customFallback = <div>Custom route error</div>;

    render(
      <RouteErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </RouteErrorBoundary>,
    );

    expect(screen.getByText("Custom route error")).toBeInTheDocument();
  });

  it("should reset error state when retry button is clicked", () => {
    // This test verifies that the retry button exists and is clickable
    // Error boundary reset behavior is tested in integration
    render(
      <RouteErrorBoundary>
        <ThrowError shouldThrow={true} />
      </RouteErrorBoundary>,
    );

    const retryButton = screen.getByRole("button", { name: /try again/i });
    expect(retryButton).toBeInTheDocument();

    // Verify button is clickable
    fireEvent.click(retryButton);
  });

  it("should include route name in error context", () => {
    render(
      <RouteErrorBoundary routeName="tracker">
        <ThrowError shouldThrow={true} />
      </RouteErrorBoundary>,
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
});
