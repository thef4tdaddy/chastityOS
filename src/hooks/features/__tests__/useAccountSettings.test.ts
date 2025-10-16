import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAccountSettings } from "../useAccountSettings";

describe("useAccountSettings", () => {
  it("should initialize", async () => {
    const { result } = renderHook(() => useAccountSettings());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.account).toBeDefined();
  });

  it("should update email", async () => {
    const { result } = renderHook(() => useAccountSettings());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.updateEmail("test@example.com");
    });
    expect(result.current.account.email).toBe("test@example.com");
  });
});
