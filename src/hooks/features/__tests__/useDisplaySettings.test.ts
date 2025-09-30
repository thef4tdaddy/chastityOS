import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useDisplaySettings } from "../useDisplaySettings";

describe("useDisplaySettings", () => {
  it("should initialize with defaults", async () => {
    const { result } = renderHook(() => useDisplaySettings());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.displaySettings.theme).toBe("auto");
  });

  it("should update theme", async () => {
    const { result } = renderHook(() => useDisplaySettings());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.updateTheme("dark");
    });
    expect(result.current.displaySettings.theme).toBe("dark");
  });
});
