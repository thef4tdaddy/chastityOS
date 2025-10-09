import { renderHook } from "@testing-library/react";
import { useInterval } from "../useInterval";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("useInterval", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should call callback at specified interval", () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, 1000));

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("should not call callback when delay is null", () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, null));

    vi.advanceTimersByTime(5000);
    expect(callback).not.toHaveBeenCalled();
  });

  it("should cleanup interval on unmount", () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useInterval(callback, 1000));

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    unmount();
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1); // Should not increase
  });

  it("should update callback without restarting interval", () => {
    let count = 0;
    const callback1 = vi.fn(() => count++);
    const callback2 = vi.fn(() => (count += 10));

    const { rerender } = renderHook(({ cb }) => useInterval(cb, 1000), {
      initialProps: { cb: callback1 },
    });

    vi.advanceTimersByTime(1000);
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(count).toBe(1);

    // Change callback
    rerender({ cb: callback2 });

    vi.advanceTimersByTime(1000);
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(count).toBe(11); // 1 + 10
  });
});
