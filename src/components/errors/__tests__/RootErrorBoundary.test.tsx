/**
 * RootErrorBoundary Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RootErrorBoundary } from "../RootErrorBoundary";

// Mock the logger
vi.mock("@/utils/logging", () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

describe("RootErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console errors in tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should render children when there is no error", () => {
    render(
      <RootErrorBoundary>
        <div>Test content</div>
      </RootErrorBoundary>,
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("should render error fallback when an error is thrown", () => {
    render(
      <RootErrorBoundary>
        <ThrowError shouldThrow={true} />
      </RootErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("should display error message in fallback", () => {
    render(
      <RootErrorBoundary>
        <ThrowError shouldThrow={true} />
      </RootErrorBoundary>,
    );

    expect(
      screen.getByText(/something unexpected happened/i),
    ).toBeInTheDocument();
  });

  it("should have a reload button", () => {
    render(
      <RootErrorBoundary>
        <ThrowError shouldThrow={true} />
      </RootErrorBoundary>,
    );

    const reloadButton = screen.getByRole("button", { name: /reload page/i });
    expect(reloadButton).toBeInTheDocument();
  });

  it("should not render error fallback when error is not thrown", () => {
    render(
      <RootErrorBoundary>
        <ThrowError shouldThrow={false} />
      </RootErrorBoundary>,
    );

    expect(screen.getByText("No error")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });
});
