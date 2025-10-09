import { renderHook } from "@testing-library/react";
import { useDebouncedValue } from "../useDebouncedValue";
import { describe, it, expect } from "vitest";

describe("useDebouncedValue", () => {
  it("should return initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("initial", 300));
    expect(result.current).toBe("initial");
  });

  it("should debounce value changes", async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 100),
      { initialProps: { value: "initial" } },
    );

    expect(result.current).toBe("initial");

    // Change value
    rerender({ value: "changed" });
    expect(result.current).toBe("initial"); // Still old value immediately

    // Wait for debounce to complete
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(result.current).toBe("changed"); // Now updated
  });

  it("should work with multiple rapid changes", async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 100),
      { initialProps: { value: "initial" } },
    );

    // Rapid changes
    rerender({ value: "change1" });
    rerender({ value: "change2" });
    rerender({ value: "change3" });

    // Still showing initial immediately after changes
    expect(result.current).toBe("initial");

    // Wait for debounce to complete
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(result.current).toBe("change3"); // Final value
  });

  it("should cleanup timeout on unmount", () => {
    const { unmount, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: "initial" } },
    );

    rerender({ value: "changed" });
    unmount(); // Should cleanup timeout without errors
  });
});
