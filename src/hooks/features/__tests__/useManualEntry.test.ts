import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useManualEntry } from "../useManualEntry";

describe("useManualEntry", () => {
  it("should initialize with default state", () => {
    const { result } = renderHook(() => useManualEntry());
    expect(result.current.entryData.type).toBe("reward");
    expect(result.current.isSubmitting).toBe(false);
  });

  it("should update entry data", () => {
    const { result } = renderHook(() => useManualEntry());
    act(() => {
      result.current.setEntryData({ category: "time" });
    });
    expect(result.current.entryData.category).toBe("time");
  });
});
