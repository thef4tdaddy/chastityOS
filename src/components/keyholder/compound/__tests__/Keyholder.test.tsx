/**
 * Tests for Keyholder Compound Component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Keyholder, useKeyholderContext } from "../index";
import type { KeyholderContextValue } from "../KeyholderContext";

// Mock child component that uses context
const TestChildComponent = () => {
  const context = useKeyholderContext();
  return (
    <div data-testid="test-child">
      <span data-testid="keyholder-id">
        {context.keyholderUserId || "No ID"}
      </span>
      <span data-testid="is-unlocked">
        {context.isKeyholderModeUnlocked ? "Unlocked" : "Locked"}
      </span>
    </div>
  );
};

// Create mock context value
const createMockContextValue = (
  overrides?: Partial<KeyholderContextValue>,
): KeyholderContextValue => ({
  keyholderUserId: "test-keyholder-id",
  relationships: [],
  keyholderRelationships: [],
  selectedRelationship: null,
  selectedWearerId: null,
  setSelectedWearer: vi.fn(),
  submissiveSession: null,
  sessionLoading: false,
  isKeyholderModeUnlocked: false,
  lockKeyholderControls: vi.fn(),
  ...overrides,
});

describe("Keyholder Compound Component", () => {
  it("should render children", () => {
    const mockValue = createMockContextValue();

    render(
      <Keyholder value={mockValue}>
        <div data-testid="child">Test Child</div>
      </Keyholder>,
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });

  it("should provide context to child components", () => {
    const mockValue = createMockContextValue({
      keyholderUserId: "keyholder-123",
      isKeyholderModeUnlocked: true,
    });

    render(
      <Keyholder value={mockValue}>
        <TestChildComponent />
      </Keyholder>,
    );

    expect(screen.getByTestId("keyholder-id")).toHaveTextContent(
      "keyholder-123",
    );
    expect(screen.getByTestId("is-unlocked")).toHaveTextContent("Unlocked");
  });

  it("should update context when value prop changes", () => {
    const mockValue = createMockContextValue({
      isKeyholderModeUnlocked: false,
    });

    const { rerender } = render(
      <Keyholder value={mockValue}>
        <TestChildComponent />
      </Keyholder>,
    );

    expect(screen.getByTestId("is-unlocked")).toHaveTextContent("Locked");

    // Update the value prop
    const updatedValue = createMockContextValue({
      isKeyholderModeUnlocked: true,
    });

    rerender(
      <Keyholder value={updatedValue}>
        <TestChildComponent />
      </Keyholder>,
    );

    expect(screen.getByTestId("is-unlocked")).toHaveTextContent("Unlocked");
  });

  it("should have sub-components attached", () => {
    expect(Keyholder.Header).toBeDefined();
    expect(Keyholder.RelationshipsList).toBeDefined();
    expect(Keyholder.SessionControls).toBeDefined();
    expect(Keyholder.TaskManagement).toBeDefined();
    expect(Keyholder.Settings).toBeDefined();
  });
});

describe("useKeyholderContext", () => {
  it("should throw error when used outside Keyholder component", () => {
    // Suppress console.error for this test since we expect an error
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const TestComponent = () => {
      useKeyholderContext();
      return <div>Test</div>;
    };

    expect(() => render(<TestComponent />)).toThrow(
      "useKeyholderContext must be used within a Keyholder component",
    );

    consoleSpy.mockRestore();
  });

  it("should provide context when used inside Keyholder component", () => {
    const mockValue = createMockContextValue({
      keyholderUserId: "test-id",
    });

    render(
      <Keyholder value={mockValue}>
        <TestChildComponent />
      </Keyholder>,
    );

    // If no error is thrown and we can read the context, the test passes
    expect(screen.getByTestId("keyholder-id")).toHaveTextContent("test-id");
  });
});
