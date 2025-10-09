/**
 * Tests for Tracker Compound Component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Tracker, useTrackerContext } from "../index";
import type { TrackerContextValue } from "../TrackerContext";

// Mock child component that uses context
const TestChildComponent = () => {
  const context = useTrackerContext();
  return (
    <div data-testid="test-child">
      <span data-testid="is-active">
        {context.isActive ? "Active" : "Inactive"}
      </span>
      <span data-testid="is-paused">
        {context.isPaused ? "Paused" : "Not Paused"}
      </span>
    </div>
  );
};

// Create mock context value
const createMockContextValue = (
  overrides?: Partial<TrackerContextValue>,
): TrackerContextValue => ({
  session: null,
  isActive: false,
  isPaused: false,
  totalChastityTime: 0,
  totalCageOffTime: 0,
  controls: {
    start: vi.fn(),
    end: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
  },
  canPause: true,
  isStarting: false,
  isEnding: false,
  handleEmergencyUnlock: vi.fn(),
  ...overrides,
});

describe("Tracker Compound Component", () => {
  it("should render children", () => {
    const mockValue = createMockContextValue();

    render(
      <Tracker value={mockValue}>
        <div data-testid="child">Test Child</div>
      </Tracker>,
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });

  it("should provide context to child components", () => {
    const mockValue = createMockContextValue({
      isActive: true,
      isPaused: false,
    });

    render(
      <Tracker value={mockValue}>
        <TestChildComponent />
      </Tracker>,
    );

    expect(screen.getByTestId("is-active")).toHaveTextContent("Active");
    expect(screen.getByTestId("is-paused")).toHaveTextContent("Not Paused");
  });

  it("should update context when value prop changes", () => {
    const mockValue = createMockContextValue({
      isActive: false,
      isPaused: false,
    });

    const { rerender } = render(
      <Tracker value={mockValue}>
        <TestChildComponent />
      </Tracker>,
    );

    expect(screen.getByTestId("is-active")).toHaveTextContent("Inactive");

    // Update the value prop
    const updatedValue = createMockContextValue({
      isActive: true,
      isPaused: true,
    });

    rerender(
      <Tracker value={updatedValue}>
        <TestChildComponent />
      </Tracker>,
    );

    expect(screen.getByTestId("is-active")).toHaveTextContent("Active");
    expect(screen.getByTestId("is-paused")).toHaveTextContent("Paused");
  });

  it("should have sub-components attached", () => {
    expect(Tracker.Header).toBeDefined();
    expect(Tracker.StatusDisplay).toBeDefined();
    expect(Tracker.Controls).toBeDefined();
    expect(Tracker.Stats).toBeDefined();
    expect(Tracker.Modals).toBeDefined();
  });
});

describe("useTrackerContext", () => {
  it("should throw error when used outside Tracker component", () => {
    // Suppress console.error for this test since we expect an error
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const TestComponent = () => {
      useTrackerContext();
      return <div>Test</div>;
    };

    expect(() => render(<TestComponent />)).toThrow(
      "useTrackerContext must be used within a Tracker component",
    );

    consoleSpy.mockRestore();
  });

  it("should provide context when used inside Tracker component", () => {
    const mockValue = createMockContextValue({
      isActive: true,
    });

    render(
      <Tracker value={mockValue}>
        <TestChildComponent />
      </Tracker>,
    );

    // If no error is thrown and we can read the context, the test passes
    expect(screen.getByTestId("is-active")).toHaveTextContent("Active");
  });
});
