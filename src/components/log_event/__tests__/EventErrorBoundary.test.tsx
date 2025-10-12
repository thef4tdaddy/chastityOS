import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventErrorBoundary } from "../EventErrorBoundary";
import React from "react";

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({
  shouldThrow = true,
}) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

describe("EventErrorBoundary", () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it("should render children when there is no error", () => {
    render(
      <EventErrorBoundary>
        <ThrowError shouldThrow={false} />
      </EventErrorBoundary>,
    );

    expect(screen.getByText("No error")).toBeInTheDocument();
  });

  it("should render error UI when an error is thrown", () => {
    render(
      <EventErrorBoundary>
        <ThrowError />
      </EventErrorBoundary>,
    );

    expect(screen.getByText("Event Feature Error")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("should display retry button", () => {
    render(
      <EventErrorBoundary>
        <ThrowError />
      </EventErrorBoundary>,
    );

    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("should display reload page button", () => {
    render(
      <EventErrorBoundary>
        <ThrowError />
      </EventErrorBoundary>,
    );

    expect(screen.getByText("Reload Page")).toBeInTheDocument();
  });

  it("should use custom fallback when provided", () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <EventErrorBoundary fallback={customFallback}>
        <ThrowError />
      </EventErrorBoundary>,
    );

    expect(screen.getByText("Custom error message")).toBeInTheDocument();
  });
});
