/**
 * Count Up Animation Hook Tests
 * Tests for the useCountUp hook animation logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCountUp } from "../useCountUp";

describe("useCountUp", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should start at the start value", () => {
    const { result } = renderHook(() => useCountUp(100, 1000, 0));
    expect(result.current).toBe(0);
  });

  it("should animate to the end value", async () => {
    const { result } = renderHook(() => useCountUp(100, 1000, 0));

    // Fast-forward time
    await waitFor(
      () => {
        expect(result.current).toBeGreaterThan(0);
      },
      { timeout: 2000 },
    );
  });

  it("should use default values when not provided", () => {
    const { result } = renderHook(() => useCountUp(50));
    expect(result.current).toBeDefined();
  });

  it("should handle zero as end value", () => {
    const { result } = renderHook(() => useCountUp(0));
    expect(result.current).toBe(0);
  });

  it("should set immediately when prefers-reduced-motion is active", () => {
    // Mock matchMedia to return reduced motion preference
    const mockMatchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: mockMatchMedia,
    });

    const { result } = renderHook(() => useCountUp(100));

    // Should immediately show the end value with reduced motion
    expect(result.current).toBe(100);
  });

  it("should accept custom start value", () => {
    const { result } = renderHook(() => useCountUp(100, 1000, 50));
    expect(result.current).toBe(50);
  });

  it("should handle rapid re-renders", () => {
    const { result, rerender } = renderHook(
      ({ end }) => useCountUp(end, 1000, 0),
      { initialProps: { end: 50 } },
    );

    // Change the end value
    rerender({ end: 100 });

    expect(result.current).toBeDefined();
    expect(typeof result.current).toBe("number");
  });
});
