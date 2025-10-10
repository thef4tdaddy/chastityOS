/**
 * TaskErrorBoundary Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TaskErrorBoundary } from "../TaskErrorBoundary";
import React from "react";

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

describe("TaskErrorBoundary", () => {
  beforeEach(() => {
    // Suppress console.error for cleaner test output
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should render children when no error occurs", () => {
    render(
      <TaskErrorBoundary>
        <div>Test content</div>
      </TaskErrorBoundary>,
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("should render error fallback when error occurs", () => {
    render(
      <TaskErrorBoundary>
        <ThrowError shouldThrow={true} />
      </TaskErrorBoundary>,
    );

    // Should show default TaskErrorFallback
    expect(screen.getByText(/Task Operation Failed/i)).toBeInTheDocument();
  });

  it("should render custom fallback when provided", () => {
    const CustomFallback = () => <div>Custom error message</div>;

    render(
      <TaskErrorBoundary fallback={<CustomFallback />}>
        <ThrowError shouldThrow={true} />
      </TaskErrorBoundary>,
    );

    expect(screen.getByText("Custom error message")).toBeInTheDocument();
  });

  it("should pass error to custom fallback", () => {
    const CustomFallback: React.FC<{ error?: Error | null }> = ({ error }) => (
      <div>{error?.message || "No error"}</div>
    );

    render(
      <TaskErrorBoundary fallback={<CustomFallback />}>
        <ThrowError shouldThrow={true} />
      </TaskErrorBoundary>,
    );

    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("should use context for error messages", () => {
    render(
      <TaskErrorBoundary context="upload">
        <ThrowError shouldThrow={true} />
      </TaskErrorBoundary>,
    );

    // TaskErrorFallback should use upload context
    expect(screen.getByText(/Upload Failed/i)).toBeInTheDocument();
  });

  it("should render loading context errors", () => {
    render(
      <TaskErrorBoundary context="loading">
        <ThrowError shouldThrow={true} />
      </TaskErrorBoundary>,
    );

    expect(screen.getByText(/Loading Error/i)).toBeInTheDocument();
  });

  it("should render submission context errors", () => {
    render(
      <TaskErrorBoundary context="submission">
        <ThrowError shouldThrow={true} />
      </TaskErrorBoundary>,
    );

    expect(screen.getByText(/Submission Failed/i)).toBeInTheDocument();
  });
});
