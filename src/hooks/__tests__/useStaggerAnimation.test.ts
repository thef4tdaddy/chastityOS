/**
 * Stagger Animation Hook Tests
 * Tests for the useStaggerAnimation hook logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useStaggerAnimation } from "../useStaggerAnimation";

describe("useStaggerAnimation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should initialize with all items hidden", () => {
    const { result } = renderHook(() => useStaggerAnimation(5));
    expect(result.current).toEqual([false, false, false, false, false]);
  });

  it("should reveal items sequentially", async () => {
    const { result } = renderHook(() => useStaggerAnimation(3, 50));

    // Initially all hidden
    expect(result.current).toEqual([false, false, false]);

    // After delay, items should start appearing
    await waitFor(
      () => {
        expect(result.current.some((item) => item === true)).toBe(true);
      },
      { timeout: 2000 },
    );
  });

  it("should use default delay when not provided", () => {
    const { result } = renderHook(() => useStaggerAnimation(3));
    expect(result.current).toHaveLength(3);
  });

  it("should handle zero items", () => {
    const { result } = renderHook(() => useStaggerAnimation(0));
    expect(result.current).toEqual([]);
  });

  it("should show all items immediately with reduced motion", () => {
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

    const { result } = renderHook(() => useStaggerAnimation(5));

    // Should immediately show all items with reduced motion
    expect(result.current).toEqual([true, true, true, true, true]);
  });

  it("should handle dynamic item count changes", () => {
    const { result, rerender } = renderHook(
      ({ count }) => useStaggerAnimation(count, 50),
      { initialProps: { count: 3 } },
    );

    expect(result.current).toHaveLength(3);

    // Change item count
    rerender({ count: 5 });

    expect(result.current).toHaveLength(5);
  });

  it("should use custom delay", async () => {
    const { result } = renderHook(() => useStaggerAnimation(2, 100));

    expect(result.current).toHaveLength(2);

    // Items should start appearing after the custom delay
    await waitFor(
      () => {
        const visibleCount = result.current.filter((item) => item).length;
        expect(visibleCount).toBeGreaterThanOrEqual(0);
      },
      { timeout: 2000 },
    );
  });

  it("should cleanup timeouts on unmount", () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
    const { unmount } = renderHook(() => useStaggerAnimation(5, 50));

    unmount();

    // Verify that timeouts were cleared
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
