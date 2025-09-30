import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSessionControls } from "../useSessionControls";

describe("useSessionControls", () => {
  it("should initialize with permissions", () => {
    const { result } = renderHook(() => useSessionControls());
    expect(result.current.canExtend).toBe(true);
    expect(result.current.canLock).toBe(true);
  });

  it("should extend session", async () => {
    const { result } = renderHook(() => useSessionControls());
    await act(async () => {
      await result.current.extendSession(30);
    });
    expect(result.current.error).toBeNull();
  });
});
